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
const { calAge } = require('../utils/age-calculate');


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
        // const cowQuality = await cowService.quality(cow._id);
        if(cow.grade === 'A+'){
            quality.aplus++
        }else if(cow.grade === 'A'){
            quality.a++
        }else if(cow.grade === 'B'){
            quality.b++
        }else if(cow.grade === 'C'){
            quality.c++
        }else if(cow.grade === 'D'){
            quality.d++
        }
    }
    res.json(quality);
}

exports.milks = async (req,res) => {
    const filter = req.query
    filter.farm = req.farmId

    //Last Year
    let year = filter.year ? filter.year : moment().year();

    let start = moment().year(year).startOf('year');
    let startDate = start.toDate();

    let end = moment().year(year).endOf('year');
    let endDate = end.toDate();

    const milkLast = await Milk.find(
        {   
            date : { $gte : startDate , $lte : endDate },
            farm : filter.farm
        }
    ).populate('milkDetails');

    //All Years
    const milkAll = await Milk.find(
        {   
            farm : filter.farm
        }
    ).populate('milkDetails');

    res.json({last:milkLast,all:milkAll});
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

const calculateSumByCondition = (items, conditionFn) => 
  items.filter(conditionFn).reduce((sum, item) => sum + item.amount, 0);

const calculateBillSum = (items) => {
    const billCodes = ['WATER', 'ELECTRIC', 'ACCOM', 'RENT', 'INTERNET', 'WASTE', 'OTH'];
    return billCodes.reduce((acc, code) => ({
        ...acc,
        [code.toLowerCase()]: calculateSumByCondition(items, item => item.code === code),
    }), {});
  };

const calculateFoodDetailSum = (items) => {
    let sum = 0;
    for(let item of items){
        sum += item.foodDetails.reduce((sum, obj) => sum + obj.amount, 0) * new Date(item.year,item.month,0).getDate();
    }
    return sum
  };

const expenseGroupYear = (items,field = 'year',isFood = false) => {
    const processedItems = field !== 'year' ? items.map(item => ({...item.toObject(), year: moment(item[field]).year()})) : items;
    
    const result = {}
    const groupYears = _.groupBy(processedItems,'year');
    Object.keys(groupYears).forEach(year => {
        const expenses = groupYears[year]

        if(isFood){
            result[year] = 
            expenses.reduce((totalSum, expense) => {
                const monthlyTotal = expense.foodDetails.reduce((sum, { amount }) => sum + amount, 0);
                const daysInMonth = new Date(expense.year, expense.month, 0).getDate();
                return totalSum + (monthlyTotal * daysInMonth);
            }, 0);
        } else {
            result[year] = expenses.reduce((sum, {amount}) => sum + amount, 0);
        }
    })
    return result
}

function aggregateExpenses(items) {
    return items.reduce((acc, item) => {
        const sum = expenseGroupYear(item.data,item.field,item.isFood);
        for (let key of Object.keys(sum)) {
            acc[key] = (acc[key] || 0) + sum[key];
            console.log('acc : ',acc)
        }
        return acc;
    }, {});
}

exports.expenseAll = async (req, res) => {
    const filter = { ...req.query, farm: req.farmId };
    const models = [Cow, Bill, Equipment, Building, Maintenance, Salary, Food, Heal, Protection];
    
    const data = await Promise.all(models.map(model => {
        const queryFilter = model === Cow ? { ...filter, 'amount': { $ne: null } } : filter;
        let query = model.find(queryFilter);
        if (model === Food) query = query.populate('foodDetails');
        return query.exec();
    }));
    const [cows, bills, equipments, buildings, maintenances, salaries, foods, heals, protections] = data;

    const expenseSum = {
        bill: expenseGroupYear(bills),
        care: aggregateExpenses([{data:salaries}, {data:foods,isFood:true}, {data:heals,field:'date'},{data:protections,field:'date'}]),
        cost: aggregateExpenses([{data:maintenances,field:'date'},{data:buildings,field:'date'},{data:equipments,field:'startDate'},{data:cows,field:'adopDate'}])
    };

    const expenseDetail = {
        bill: calculateBillSum(bills),
        cost: {
            maintenance: calculateSum(maintenances),
            cow: calculateSum(cows),
            equipment: calculateSum(equipments),
            building: calculateSum(buildings),
        },
        care: {
            heal: calculateSum(heals),
            protection: calculateSum(protections),
            food: calculateFoodDetailSum(foods),
            worker: calculateSum(salaries)
        }
    };

    res.json({expenseSum,expenseDetail});
} 



exports.expenseYear = async (req, res) => {
    const filter = req.query;
    const filterDate = filter;
    const filterYear = filter;

    filter.farm = req.farmId;
    filterYear.farm = req.farmId;
    filterDate.farm = req.farmId;

    const year = filter.year ? filter.year : new Date().getFullYear();
    filterYear.year = year

    let start = new Date(year,0,1)
    const startOffset = start.getTimezoneOffset();
    let startDate = new Date(start.getTime() - (startOffset*60*1000))

    let end = new Date(year, 11, 31);
    const endOffset = end.getTimezoneOffset();
    let endDate = new Date(end.getTime() - (endOffset*60*1000))

    const date = { $gte : startDate.toISOString().split('T')[0] , $lte : endDate.toISOString().split('T')[0] }
    filterDate.date = date

    const [cows, bills, equipments, buildings, maintenances, salaries, foods, heals, protections] = await Promise.all([
        Cow.find({farm:req.farmId,adopDate:date}).exec(),
        Bill.find(filterYear).exec(),
        Equipment.find({farm:filter.farm,startDate:date}).exec(),
        Building.find({farm:filter.farm,date:date}).exec(),
        Maintenance.find(filterDate).exec(),
        Salary.find(filterYear).exec(),
        Food.find(filterYear).populate('foodDetails').exec(),
        Heal.find(filterDate).exec(),
        Protection.find(filterDate).exec()
    ]);

    const sumCows = calculateSum(cows);
    const sumBills = calculateBillSum(bills);
    const sumEquipments = calculateSum(equipments);
    const sumBuildings = calculateSum(buildings);
    const sumMaintenances = calculateSum(maintenances);
    const sumSalaries = calculateSum(salaries);
    const sumFoods = calculateFoodDetailSum(foods);
    const sumHeals = calculateSum(heals);
    const sumProtections = calculateSum(protections);

    const expense = {
        bill : sumBills,
        cost : {
            maintenance: sumMaintenances,
            cow: sumCows,
            equipment: sumEquipments,
            building: sumBuildings,
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

exports.incomeAll = async (req,res) => {
    const filter = req.query
    filter.farm = req.farmId

    const rawMilks = await Milk.find(filter).populate('milkDetails').exec();

    let sumRawMilks = 0;
    for(let rawMilk of rawMilks){
        for(let detail of rawMilk.milkDetails){
            sumRawMilks += detail.amount
        }
    }

    const sumRawMilk = {}
    const newRawMilks = []
    for(let rawMilk of rawMilks){
        let itemObj = {...rawMilk.toObject()}
        itemObj.year = moment(rawMilk.date).year()
        newRawMilks.push(itemObj)
    }
    const groupYears = _.groupBy(newRawMilks,'year');
    for(let key of Object.keys(groupYears)){
        const milks = groupYears[key]
        sumRawMilk[key] = 0
        for(let milk of milks){
            sumRawMilk[key] += milk.milkDetails.reduce((sum,item) => sum + item.amount , 0);
        }
    }

    //Income
    const incomeSum = {
        rawMilk : sumRawMilk,
    }

    const incomeDetail = {
        rawMilk : sumRawMilks,
        pasteuri : 0,
        dung : 0,
        cowExport : 0,
        meat : 0
    }

    res.json({incomeSum,incomeDetail});
}

exports.income = async (req,res) => {
    const filter = req.query
    filter.farm = req.farmId

    const year = filter.year ? filter.year : new Date().getFullYear();

    let start = new Date(year,0,1)
    const startOffset = start.getTimezoneOffset();
    let startDate = new Date(start.getTime() - (startOffset*60*1000))

    let end = new Date(year, 11, 31);
    const endOffset = end.getTimezoneOffset();
    let endDate = new Date(end.getTime() - (endOffset*60*1000))

    const date = { $gte : startDate.toISOString().split('T')[0] , $lte : endDate.toISOString().split('T')[0] }

    const rawMilks = await Milk.find({farm:filter.farm,date:date}).populate('milkDetails').exec();
    
    let sumRawMilks = 0;
    for(let rawMilk of rawMilks){
        for(let detail of rawMilk.milkDetails){
            sumRawMilks += detail.amount
        }
    }

    //Income
    const income = {
        rawMilk : sumRawMilks,
        pasteuri : 0,
        dung : 0,
        cowExport : 0,
        meat : 0
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
        return {cow: {id: cow._id ,image: cow.image, code: cow.code, name: cow.name}, sumMilk: sumMilk};
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
        return {cow: {id: cow._id ,image: cow.image, code: cow.code, name: cow.name}, sumMilk: sumMilk};
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
    reproduction.success = reproductions.filter(r => r.status === 2 || r.status === 3).length
    reproduction.fail = reproductions.filter(r => r.status === 4).length
    reproduction.wait = reproductions.filter(r => r.status === 1).length
    

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
    pregnant.abort = pregnants.filter(p => p.status === 'A').length
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
                text : 'บันทึกค่าใช้จ่ายเพิ่มเติม (ค่าน้ำ, ค่าไฟ, ค่าที่พักคนงาน, ค่าเช่า, ค่าอินเทอร์เน็ต, ค่าของเสีย ฯ)',
                href : '/manage/bill'
            },
            {
                text : '  *มีผลกับระดับความคุ้มค่าของโค',
                remark : true
            }
        );
        important.iRecipe = iRecipe
    }

    let monthly = {}
    const billWaters = await Bill.find(
        {   
            month : { $lte : month-1 },
            year : year,
            farm : filter.farm,
            code: 'WATER'
        }
    );

    const billElectrics = await Bill.find(
        {   
            month : { $lte : month-1 },
            year : year,
            farm : filter.farm,
            code: 'ELECTRIC'
        }
    );
    
    const prevDate = moment().month(moment().month()-1);

    let prevMonthWaterNums = []
    let prevMonthElecNums = []
    let prevMonthStrs = []
    let prevMonthNums = []
    for(let i = 1;i <= (month-1) ;i++ ){
        let prevMonth = moment().month(moment().month()-i);
        let monthStr = prevMonth.format('MMMM');
        prevMonthNums.push(i)
        prevMonthStrs.push(monthStr)
        prevMonthWaterNums.push(monthStr)
        prevMonthElecNums.push(monthStr)
    }

    if(billWaters.length === 0){
        let mWaterBill = [];
        mWaterBill.push(
            {
                text : 'บันทึกค่าน้ำ',
                href : '/manage/bill'
            },
            {
                text:' ('+prevMonthStrs.join(',')+') ปี ' + (year+543)
            }
        )
        monthly.mWaterBill = mWaterBill
    }else{

        for(let billWater of billWaters){
            let index = prevMonthWaterNums.indexOf(billWater.month);
            if(index >= 0){
                prevMonthWaterNums.splice(index,1)
            }
        }

        let monthStrs = [];
        for(let prevMonthNum of prevMonthWaterNums){
            let monthStr = moment().month(prevMonthNum-1).format('MMMM');
            monthStrs.push(monthStr)
        }
        if(monthStrs.length > 0){
            let mWaterBill = [];
            mWaterBill.push(
                {
                    text : 'บันทึกค่าน้ำ',
                    href : '/manage/bill'
                },
                {
                    text:' ('+monthStrs.join(',')+') ปี ' + (year+543)
                }
            )
            monthly.mWaterBill = mWaterBill
        }
        
    }

    if(billElectrics.length === 0){
        let mElectricBill = [];

        mElectricBill.push(
            {
                text : 'บันทึกค่าไฟ',
                href : '/manage/bill'
            },
            {
                text:' ('+prevMonthStrs.join(',')+')  ปี ' + (year+543)
            }
        )
        monthly.mElectricBill = mElectricBill
    }else{

        for(let billElectric of billElectrics){
            let index = prevMonthElecNums.indexOf(billElectric.month);
            if(index >= 0){
                prevMonthElecNums.splice(index,1)
            }
        }

        let monthStrs = [];
        for(let prevMonthNum of prevMonthElecNums){
            let monthStr = moment().month(prevMonthNum-1).format('MMMM');
            monthStrs.push(monthStr)
        }
        if(monthStrs.length > 0){
            let mElectricBill = [];
            mElectricBill.push(
                {
                    text : 'บันทึกค่าไฟ',
                    href : '/manage/bill'
                },
                {
                    text:' ('+monthStrs.join(',')+') ปี ' + (year+543)
                }
            )
            monthly.mElectricBill = mElectricBill
        }
        
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

exports.food = async (req,res) => {
    const filter = req.query
    filter.farm = req.farmId
    const foods = await Food.find(filter).populate('foodDetails').exec();
    const resultMonths = new Array(12).fill(0);
    for(let food of foods){
        let days = new Date(food.year,food.month,0).getDate();
        let result = {sumAmount:0,sumQty:0}
        result.sumAmount += food.foodDetails.reduce((sum,item) => sum + item.amount,0) * days;
        result.sumQty += food.foodDetails.reduce((sum,item) => sum + item.qty,0) * days;
        resultMonths[food.month-1] = result
    }
    const groupCorral = _.groupBy(foods,'corral')
    const resultCorrals = []
    for(let key of Object.keys(groupCorral)){
        const months = groupCorral[key];
        let food = {sumAmount:0,sumQty:0,avgAmount:0,avgQty:0}
        food.corral = key
        food.numCow = months[0].numCow
        for(let month of months){
            let days = new Date(month.year,month.month,0).getDate();
            food.sumAmount += month.foodDetails.reduce((sum,item) => sum + item.amount,0) * days;
            food.sumQty += month.foodDetails.reduce((sum,item) => sum + item.qty,0) * days;
        }
        food.avgAmount = food.sumAmount / months.length ;
        food.avgQty = food.sumQty / months.length ;
        food.count = months.length

        resultCorrals.push(food)
    }
    res.json({corral:resultCorrals,month:resultMonths});   
}

exports.reproduction = async (req,res) => {
    const filter = { ...req.query, farm: req.farmId };
    let year = filter.year;
    let breeders = [],artificials = [];
    

    if(year > 0){
        let start = moment().year(year).startOf('year');
        let startDate = start.toDate();

        let end = moment().year(year).endOf('year');
        let endDate = end.toDate();

        const dateRange = { $gte : startDate , $lte : endDate };

        breeders = await Reproduction.find(
            {   
                matingDate : dateRange,
                type : 'F',
                farm : filter.farm
            }
        );

        artificials = await Reproduction.find(
            {   
                matingDate : dateRange,
                type : 'A',
                farm : filter.farm
            }
        );
    }else{
        breeders = await Reproduction.find({farm : filter.farm,type:'F'});
        artificials = await Reproduction.find({farm : filter.farm,type:'A'});
    }

    res.json({breeder:breeders,artificial:artificials});   

}
    


