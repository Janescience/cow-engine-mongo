const db = require("../models");
const moment = require("moment");
const _ = require("lodash");
const Promise = require('bluebird');

const Cow = db.cow;
const Milk = db.milk;
const Heal = db.heal;
const Noti = db.notification;
const Bill = db.bill;
const Equipment = db.equipment;
const Building = db.building;
const Maintenance = db.maintenance;
const Salary = db.salary;
const Food = db.food;
const Reproduction = db.reproduction;
const Birth = db.birth;
const Protection = db.protection;
const Worker = db.worker;
const Vaccine = db.vaccine;

const { notiService,cowService } = require("../services");
const Recipe = require("../models/recipe.model");
const Farm = require("../models/farm.model");

exports.cow = async (req,res) => {
    const filter = req.query
    filter.farm = req.farmId

    const cows = await Cow.find(filter).exec();

    const cow = {
        all : cows.length,
        milk : cows.filter(c => c.status === 3).length,
        pregnant : cows.filter(c => c.status === 1).length,
        baby : cows.filter(c => c.status === 4).length,
        dry : cows.filter(c => c.status === 2).length,
        rawmilkQuality : {
            good : cows.filter(c => c.quality === 1).length,
            normal : cows.filter(c => c.quality === 2).length,
            bad : cows.filter(c => c.quality === 3).length,
            unchecked : cows.filter(c => c.quality === 4).length,
        }   
    }

    res.json(cow);
}

exports.quality = async (req,res) => {
    const filter = req.query
    filter.farm = req.farmId
    const cows = await Cow.find(filter).exec();
    const quality = {aplus:0,a:0,b:0,c:0,d:0}
    for(let cow of cows){
        const cowQuality = await cowService.quality(cow._id);
        if(cowQuality.grade === 'A+'){
            quality.aplus++
        }else if(cowQuality.grade === 'A'){
            quality.a++
        }else if(cowQuality.grade === 'B'){
            quality.b++
        }else if(cowQuality.grade === 'C'){
            quality.c++
        }else if(cowQuality.grade === 'D'){
            quality.d++
        }
    }
    res.json(quality);
}

exports.milks = async (req,res) => {
    const filter = req.query
    filter.farm = req.farmId

    let year = new Date().getFullYear();

    let start = new Date(year,0,1)
    const startOffset = start.getTimezoneOffset();
    let startDate = new Date(start.getTime() - (startOffset*60*1000))

    let end = new Date(year, 11, 31);
    const endOffset = end.getTimezoneOffset();
    let endDate = new Date(end.getTime() - (endOffset*60*1000))

    const milks = await Milk.find(
        {   
            date : { $gte : startDate.toISOString().split('T')[0] , $lte : endDate.toISOString().split('T')[0] },
            farm : filter.farm
        }
    ).populate('milkDetails');

    res.json(milks);
}


exports.events = async (req,res) => {
    const filter = req.query
    filter.farm = req.farmId

    const today = moment(new Date()).startOf('day');

    // Events    
    const notifications = await Noti.find({farm: filter.farm}).populate('notificationParam').sort({createdAt:-1}).exec();
    let events = []
    await Promise.map(notifications, async (noti) => {
        const notiParam = noti.notificationParam;
        if(notiParam){
            const data = await notiService.filterData(notiParam,noti);

            if(data != null){
                const dueDate = notiService.filterDueDate(notiParam,data);
                if(dueDate != null){
                    if(today.isSameOrBefore(dueDate)){
                        const event = {
                            title : notiParam.name ,
                            date : dueDate,
                            cow : data.cow?.name
                        }
                        if(events.length < 20){
                            events.push(event);
                        }
                    }
                }
            }
        }
    });

    res.json(events);
}

const calculateSum = (items) => {
  return items.reduce((sum, item) => sum + item.amount, 0);
};

const calculateFoodDetailSum = (items) => {
    let sum = 0;
    for(let item of items){
        sum += item.foodDetails.reduce((sum, obj) => sum + obj.amount, 0) * new Date(item.year,item.month,0).getDate();
    }
    return sum
  };


exports.expense = async (req, res) => {
  const filter = req.query;
  filter.farm = req.farmId;

  const [bills, equipments, buildings, maintenances, salaries, foods, heals, protections] = await Promise.all([
    Bill.find(filter).exec(),
    Equipment.find(filter).exec(),
    Building.find(filter).exec(),
    Maintenance.find(filter).exec(),
    Salary.find(filter).exec(),
    Food.find(filter).populate('foodDetails').exec(),
    Heal.find(filter).exec(),
    Protection.find(filter).exec()
  ]);

  const sumBills = calculateSum(bills);
  const sumEquipments = calculateSum(equipments);
  const sumBuildings = calculateSum(buildings);
  const sumMaintenances = calculateSum(maintenances);
  const sumSalaries = calculateSum(salaries);
  const sumFoods = calculateFoodDetailSum(foods);
  const sumHeals = calculateSum(heals);
  const sumProtections = calculateSum(protections);

  const expense = {
    cost: {
      bill: sumBills,
      equipment: sumEquipments,
      building: sumBuildings,
      maintenance: sumMaintenances
    },
    care: {
      heal: sumHeals,
      protection: sumProtections,
      food: sumFoods,
      worker: sumSalaries
    }
  };

  res.json(expense);
};

exports.income = async (req,res) => {
    const filter = req.query
    filter.farm = req.farmId

    const rawMilks = await Milk.find(filter).populate('milkDetails').exec();
    let sumRawMilks = 0;
    for(let rawMilk of rawMilks){
        for(let detail of rawMilk.milkDetails){
            sumRawMilks += detail.amount
        }
    }

    //Income
    const income = {
        rawMilk : sumRawMilks
    }

    res.json(income);
}


exports.rawMilkDescSort = async (req,res) => {
    const filter = req.query
    filter.farm = req.farmId

    const rawMilks = await Milk.find(filter).populate('milkDetails').exec();

    let rawMilkDetails = []
    for(let rawMilk of rawMilks){
        for(let detail of rawMilk.milkDetails){
            rawMilkDetails.push(detail)
        }
    }

    const cowRawMilkGroups = rawMilkDetails.reduce((groups, detail) => {
        if (!groups[detail.cow]) {
            groups[detail.cow] = [];
        }
        groups[detail.cow].push(detail);
        return groups;
    }, {});

    const cowIds = Object.keys(cowRawMilkGroups);
    const cows = await Promise.all(cowIds.map(cowId => Cow.findOne({_id: cowId}).exec()));

    let cowMilkSum = cowIds.map((key, index) => {
        const cow = cows[index];
        const milks = cowRawMilkGroups[key];
        const sumMilk = milks.reduce((sum, milk) => sum + milk.qty, 0);
        return {cow: {image: cow.image, code: cow.code, name: cow.name}, sumMilk: sumMilk};
    });

    const desc = cowMilkSum.sort((a, b) => b.sumMilk - a.sumMilk);//desc
    const desc10 = desc.slice(0, 5);
    res.json({desc:desc10});
}

exports.rawMilkAscSort = async (req,res) => {
    const filter = req.query
    filter.farm = req.farmId

    const rawMilks = await Milk.find(filter).populate('milkDetails').exec();

    let rawMilkDetails = []
    for(let rawMilk of rawMilks){
        for(let detail of rawMilk.milkDetails){
            rawMilkDetails.push(detail)
        }
    }

    const cowRawMilkGroups = rawMilkDetails.reduce((groups, detail) => {
        if (!groups[detail.cow]) {
            groups[detail.cow] = [];
        }
        groups[detail.cow].push(detail);
        return groups;
    }, {});

    const cowIds = Object.keys(cowRawMilkGroups);
    const cows = await Promise.all(cowIds.map(cowId => Cow.findOne({_id: cowId}).exec()));

    let cowMilkSum = cowIds.map((key, index) => {
        const cow = cows[index];
        const milks = cowRawMilkGroups[key];
        const sumMilk = milks.reduce((sum, milk) => sum + milk.qty, 0);
        return {cow: {image: cow.image, code: cow.code, name: cow.name}, sumMilk: sumMilk};
    });

    const asc = cowMilkSum.sort((a, b) => a.sumMilk - b.sumMilk);//asc
    const asc10 = asc.slice(0, 5);
    res.json({asc:asc10});
}


exports.corrals = async (req,res) => {
    const filter = req.query
    filter.farm = req.farmId
    let corrals = [];
    const cows = await Cow.find(filter).exec();
    const groupCorrals = _.groupBy(cows,'corral')
    for(let key of Object.keys(groupCorrals)){
        corrals.push({corral:key,numCows:groupCorrals[key].length})
    }
    res.json(corrals);
}

exports.statistics = async (req,res) => {
    const filter = req.query
    filter.farm = req.farmId
    //Heal
    let heal = {};
    let healCount = [];
    const heals = await Heal.find(filter).exec();
    heal.count = heals.length
    const groupHealCows = _.groupBy(heals,'cow')

    for(let key of Object.keys(groupHealCows)){
        const sumAmount = groupHealCows[key].reduce((sum, heal) => sum + heal.amount, 0);
        healCount.push({cow:key,count:groupHealCows[key].length,amount:sumAmount})
    }

    if(healCount.length > 0){
        const maxHeal = _.maxBy(healCount,'count')
        const cow = await Cow.findById(maxHeal.cow).exec();
        maxHeal.cow = {_id:cow._id,code:cow.code,name:cow.name,image:cow.image}
        heal.max = maxHeal
    }

    //Reproduction
    const reproduction = {}
    const reproductions = await Reproduction.find(filter).exec();
    reproduction.count = reproductions.length
    reproduction.success = reproductions.filter(r => r.result === 2).length
    reproduction.fail = reproductions.filter(r => r.result === 1).length
    

    //Born
    let bornCount = [];
    let born = {male:0,female:0}
    filter.sex = { $nin: [null,''] }

    const borns = await Birth.find(filter).exec();
    born.count = borns.length
    const groupBornCows = _.groupBy(borns,'cow')
    const groupBornSex = _.groupBy(borns,'sex')
    for(let key of Object.keys(groupBornCows)){
        bornCount.push({cow:key,count:groupBornCows[key].length,sex:groupBornCows[key].sex})
    }
    for(let key of Object.keys(groupBornSex)){
        if(key === 'M'){
            born.male++  
        }
        if(key === 'F'){
            born.female++  
        }
    }

    if(bornCount.length > 0){
        const maxBorn = _.maxBy(bornCount,'count');
        const cow = await Cow.findById(maxBorn.cow).exec();
        maxBorn.cow = {_id:cow._id,code:cow.code,name:cow.name,image:cow.image}
        born.max = maxBorn
    }

    //Birth
    let pregnant = {nearBirth:0}
    filter.sex = null
    const pregnants = await Birth.find(filter).exec();
    pregnant.count = pregnants.length
    for(let pregnant of pregnants){
        
        const diffMonths = new Date().getMonth() - new Date(pregnant.pregnantDate).getMonth() + 
        (12 * (new Date().getFullYear() - new Date(pregnant.pregnantDate).getFullYear()))

        if(diffMonths == 9){
            pregnant.nearBirth++
        }
    }
    res.json({heal,born,pregnant,reproduction});
}

exports.todolist = async (req,res) => {
    const filter = req.query
    filter.farm = req.farmId

    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    const cows = await Cow.find(filter).exec();
    const corrals = Object.keys(_.groupBy(cows,'corral'));
    // // console.log('corrals : ',corrals)
    //Food - Everymonth
    let mFood = []
    const foods = await Food.find({farm:filter.farm,year:year,month:month}).exec();
    if(foods.length > 0){
        // console.log('foods : ',foods.length)

        if(foods.length < corrals.length){
            for(let food of foods){
                let index = corrals.indexOf(food.corral);
                if(index >= 0){
                    corrals.splice(index,1)
                }
            }
            if(corrals.length > 0){
                mFood.push(
                    {
                        text : 'บันทึกการให้อาหาร',
                        href : '/manage/food'
                    },
                    {
                        text:'คอก '+corrals.join()
                    }
                )
            }
        }
    }else{
        mFood.push(
            {
                text : 'บันทึกการให้อาหาร',
                href : '/manage/food'
            },
            {
                text:'ทุกคอก'
            }
        )
    }

    //Milk - Everyday
    let dairy = {}
    const milkTodayM = await Milk.count({farm:filter.farm,time : 'M',date:moment().format('YYYY-MM-DD')}).exec();
    if(milkTodayM == 0){
        let dMilkM = []
        dMilkM.push(
            {
                text : 'บันทึกการรีดนม',
                href : '/manage/milk'
            },
            {
                text:'ตอนเช้า'
            }
        )
        dairy.dMilkM = dMilkM
    }
    const milkTodayA = await Milk.count({farm:filter.farm,time : 'A',date:moment().format('YYYY-MM-DD')}).exec();
    if(milkTodayA == 0){
        let dMilkA = []
        dMilkA.push(
            {
                text : ' บันทึกการรีดนม',
                href : '/manage/milk'
            },
            {
                text:'ตอนบ่าย'
            }
        )
        dairy.dMilkA = dMilkA
    }

    
    let important = {}
    if(cows.length === 0){
        let iCow = []
        iCow.push(
            {
                text : 'บันทึกข้อมูลโค',
                href : '/manage/cow'
            }
        );
        important.iCow = iCow
    }


    const equipments = await Equipment.find({farm:filter.farm}).exec();
    if(equipments.length == 0){
        let iEquipment = [];
        iEquipment.push(
            {
                text : 'บันทึกอุปกรณ์',
                href : '/manage/equipment'
            },
            {
                text : '  *มีผลกับระดับความคุ้มค่าของโค',
                remark : true
            }
        );
        important.iEquipment = iEquipment
    }

    const buildings = await Building.find({farm:filter.farm}).exec();
    if(buildings.length == 0){
        let iBuilding = [];
        iBuilding.push(
            {
                text : 'บันทึกสิ่งปลูกสร้าง',
                href : '/manage/building'
            },
            {
                text : '  *มีผลกับระดับความคุ้มค่าของโค',
                remark : true
            }
        );
        important.iBuilding = iBuilding
    }

    const workers = await Worker.find({farm:filter.farm}).exec();
    if(workers.length == 0){
        let iWorker = [];
        iWorker.push(
            {
                text : 'บันทึกข้อมูลคนงาน',
                href : '/manage/worker'
            },
            {
                text : ' และบันทึกการจ่ายเงินเดือน'
            },
            {
                text : '  *มีผลกับระดับความคุ้มค่าของโค',
                remark : true
            }
        );
        important.iWorker = iWorker
    }

    const recipes = await Recipe.find({farm:filter.farm}).exec();
    if(recipes.length == 0){
        let iRecipe = [];
        iRecipe.push(
            {
                text : 'บันทึกสูตรอาหาร',
                href : '/manage/recipe'
            },
            {
                text : 'อย่างน้อย 1 รายการ ถึงจะสามารถ'
            },
            {
                text : 'บันทึกการให้อาหาร',
                href : '/manage/food'
            },
        );
        important.iRecipe = iRecipe
    }

    const bills = await Bill.find({farm:filter.farm}).exec();
    if(bills.length == 0){
        let iRecipe = [];
        iRecipe.push(
            {
                text : 'บันทึกค่าใช้จ่ายเพิ่มเติม (ค่าน้ำ,ค่าไฟ)',
                href : '/manage/bill'
            },
            {
                text : '  *มีผลกับระดับความคุ้มค่าของโค',
                remark : true
            }
        );
        important.iRecipe = iRecipe
    }

    let start = new Date(year,month-1,1)
    const startOffset = start.getTimezoneOffset();
    let startDate = new Date(start.getTime() - (startOffset*60*1000))

    const daysInPrevMonth = moment().month(month - 1).daysInMonth();
    let end = new Date(year, month-1, daysInPrevMonth);
    const endOffset = end.getTimezoneOffset();
    let endDate = new Date(end.getTime() - (endOffset*60*1000))

    const billWaterPrevMonth = await Bill.find(
        {   
            date : { $gte : startDate.toISOString().split('T')[0] , $lte : endDate.toISOString().split('T')[0] },
            farm : filter.farm,
            code: 'WATER'
        }
    );

    const billElectricPrevMonth = await Bill.find(
        {   
            date : { $gte : startDate.toISOString().split('T')[0] , $lte : endDate.toISOString().split('T')[0] },
            farm : filter.farm,
            code: 'ELECTRIC'
        }
    );
    const prevDate = moment().month(moment().month()-1)

    let monthly = {}
    if(billWaterPrevMonth.length === 0){
        let mWaterBill = [];
        mWaterBill.push(
            {
                text : 'บันทึกค่าน้ำ',
                href : '/manage/bill'
            },
            {
                text:' ('+prevDate.format('MMMM')+') '
            }
        )
        monthly.mWaterBill = mWaterBill
    }

    if(billElectricPrevMonth.length === 0){
        let mElectricBill = [];

        mElectricBill.push(
            {
                text : 'บันทึกค่าไฟ',
                href : '/manage/bill'
            },
            {
                text:' ('+prevDate.format('MMMM')+') '
            }
        )
        monthly.mElectricBill = mElectricBill
    }
    //Salary - Everymonth
    let mSalary = [];
    const workerActives = await Worker.find({farm:filter.farm,status:{$in:['W','S']}}).exec();
    const wokerIds = workerActives.map((w) => { return w._id});
    const salaries = await Salary.find({farm:filter.farm,year:new Date(prevDate).getFullYear(),month:new Date(prevDate).getMonth() + 1}).populate('worker').exec();

    if(salaries.length > 0){
        if(salaries.length < wokerIds.length){
            let noSalary = []
            for(let salary of salaries){
                if(wokerIds.indexOf(salary.worker) < 0){
                    noSalary.push(salary.worker.name)
                }
            }
            if(noSalary.length > 0){
                mSalary.push(
                    {
                        text : 'บันทึกการจ่ายเงืนเดือน',
                        href : '/manage/worker'
                    },
                    {
                        text:' ('+prevDate.format('MMMM')+') '+'ของ '+noSalary.join()
                    }
                )
                monthly.mSalary = mSalary
            }
        }
    }else{
        mSalary.push(
            {
                text : 'บันทึกการจ่ายเงินเดือน',
                href : '/manage/worker'
            },
            {
                text:' ('+prevDate.format('MMMM')+') '+'ของทุกคน'
            }
        )
        monthly.mSalary = mSalary

    }

    let setting = {}
    const farmDetail = await Farm.findById(filter.farm).exec();
    if(!farmDetail.lineToken){
        let sLine = []
        sLine.push(
            {
                text : 'เชื่อมต่อ LINE',
                href : '/setting/notification/calendar'
            },
            {
                text:' เพื่อรับการแจ้งเตือน'
            }
        )
        setting.sLine = sLine
    }

    const vaccines = await Vaccine.find({farm:filter.farm}).exec();
    const checkPrice = vaccines.filter(v => v.price === 0).length
    if(checkPrice > 0){
        let sVaccine = []
        sVaccine.push(
            {
                text : 'อัพเดตข้อมูลวัคซีน',
                href : '/manage/vaccine'
            },
            {
                text:' (ราคา, ปริมาณ, จำนวนโค)'
            }
        )
        setting.sVaccine = sVaccine
    }
    
    let notification = {}

    res.json({
        setting,
        important,
        dairy,
        monthly,
        notification
    });

}
