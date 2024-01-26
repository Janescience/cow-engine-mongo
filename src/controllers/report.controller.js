const db = require("../models");
const Excel = require('exceljs');
const Promise = require('bluebird');

const Cow = db.cow;
const Milk = db.milk;

const Heal = db.heal;
const Food = db.food;
const Protection = db.protection;
const Salary = db.salary;

const _ = require('lodash');
const moment = require('moment');
const { format } = require('date-fns');

const { reportService } = require('../services');

exports.cowExport = async (req, res) => {
  const cows = await reportService.mapCow(req);

    const workbook = new Excel.Workbook();
    const sheet = workbook.addWorksheet('ข้อมูลโค');

    sheet.columns = [
      { header: 'ลำดับที่', key: 'no', width: 10 },
      { header: 'รหัส', key: 'code', width: 10 },
      { header: 'ชื่อ', key: 'name', width: 10 },
      { header: 'วันเกิด', key: 'birthDate', width: 15  ,style: { numFmt: 'dd/mm/yyyy' } },
      { header: 'วันที่นำมาเลี้ยง', key: 'adopDate', width: 15  ,style: { numFmt: 'dd/mm/yyyy' } },
      { header: 'น้ำหนัก', key: 'weight', width: 10 },
      { header: 'อายุ', key: 'age', width: 10 },
      { header: 'คอก', key: 'corral', width: 10 },
      { header: 'สถานะ', key: 'status', width: 10 },
      { header: 'พ่อพันธู์', key: 'dad', width: 20 },
      { header: 'แม่พันธุ์', key: 'mom', width: 20 },
      { header: 'น้ำนมเฉลี่ย/วัน', key: 'milkAvg', width: 20 },
      { header: 'น้ำนมทั้งหมด', key: 'milkSum', width: 20 },
      { header: 'คุณภาพนม', key: 'quality', width: 10 },
      { header: 'ความคุ้มค่า', key: 'level', width: 10 },
      { header: 'FLAG', key: 'flag', width: 10 },
      { header: 'หมายเหตุ', key: 'remark', width: 20 },
    ];

    const cowsOrderCorral = _.orderBy(cows,['corral','code'])

    let no = 1;
    for(let cow of cowsOrderCorral){
      cow['no'] = no++;
    }

    sheet.addRows(cowsOrderCorral);
  
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader("Content-Disposition", "attachment; filename=cows.xlsx");

    return workbook.xlsx.write(res).then(function () {
      res.status(200).end();
    });
};

exports.cowView = async (req, res) => {
  const cows = await reportService.mapCow(req);
  const cowsOrdered = _.orderBy(cows,['corral','code'])
  res.status(200).send({cows:cowsOrdered});
}

exports.reproductExport = async (req, res) => {
  const repos = await reportService.mapReproduct(req);
  
  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet('ข้อมูลการสืบพันธู์');

  sheet.columns = [
    { header: 'วันที่เข้าระบบสืบพันธุ์', key: 'loginDate', width: 12  ,style: { numFmt: 'dd/mm/yyyy' } },
    { header: 'ครั้งที่', key: 'seq', width: 10 },
    { header: 'รหัสโค', key: 'code', width: 10 },
    { header: 'ชื่อโค', key: 'name', width: 10 },
    { header: 'พ่อพันธุ์', key: 'dad', width: 10 },
    { header: 'ผล', key: 'result', width: 10 },
    { header: 'สถานะ', key: 'status', width: 20 },
    { header: 'การรักษา', key: 'howTo', width: 20 },
    { header: 'วันที่เป็นสัด', key: 'estrusDate', width: 12  ,style: { numFmt: 'dd/mm/yyyy' } },
    { header: 'วันที่ผสมพันธุ์', key: 'matingDate', width: 12  ,style: { numFmt: 'dd/mm/yyyy' } },
    { header: 'วันที่ตรวจท้อง', key: 'checkDate', width: 12  ,style: { numFmt: 'dd/mm/yyyy' } },
    { header: 'วันที่ตั้งครรภ์', key: 'pregnantDate', width: 12  ,style: { numFmt: 'dd/mm/yyyy' } },
    { header: 'เพศ', key: 'sex', width: 12  },
    { header: 'วันที่คลอด', key: 'birthDate', width: 12 ,style: { numFmt: 'dd/mm/yyyy' }  },
    { header: 'รกค้าง', key: 'overgrown', width: 12  },
    { header: 'วันที่ใช้ยาขับ', key: 'drugDate', width: 12  ,style: { numFmt: 'dd/mm/yyyy' }  },
    { header: 'วันที่ล้างมดลูก', key: 'washDate', width: 12  ,style: { numFmt: 'dd/mm/yyyy' }  },
    { header: 'อายุครรภ์', key: 'gestAge', width: 12  },
    { header: 'รหัสลูกวัว', key: 'calfCode', width: 10  },
    { header: 'ชื่อลูกวัว', key: 'calfName', width: 10  },
  ];
  
  const repoOrdered = _.orderBy(repos,['code','seq','loginDate'])

  sheet.addRows(repoOrdered);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader("Content-Disposition", "attachment; filename=reproductions.xlsx");

  return workbook.xlsx.write(res).then(function () {
    res.status(200).end();
  });
};

exports.reproductView = async (req, res) => {
  const reproducts = await reportService.mapReproduct(req);
  const repoOrdered = _.orderBy(reproducts,['code','seq'])
  res.status(200).send({reproducts:repoOrdered});
}

exports.healExport = async (req, res) => {
  const heals = await reportService.mapHeal(req);
  
  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet('ข้อมูลการรักษา');

  sheet.columns = [
    { header: 'รหัสโค', key: 'code', width: 10 },
    { header: 'ชื่อโค', key: 'name', width: 10 },
    { header: 'ครั้งที่', key: 'seq', width: 10 },
    { header: 'วันที่รักษา', key: 'date', width: 12  ,style: { numFmt: 'dd/mm/yyyy' } },
    { header: 'อาการ/โรค', key: 'disease', width: 10 },
    { header: 'การรักษา', key: 'method', width: 10 },
    { header: 'ค่ารักษา', key: 'amount', width: 10 },
    { header: 'ผู้รักษา', key: 'healer', width: 20 },
  ];
  
  const healOrdered = _.orderBy(heals,['code','seq'])

  sheet.addRows(healOrdered);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader("Content-Disposition", "attachment; filename=heals.xlsx");

  return workbook.xlsx.write(res).then(function () {
    res.status(200).end();
  });
};

exports.healView = async (req, res) => {
  const heals = await reportService.mapHeal(req);
  const healOrdered = _.orderBy(heals,['code','seq'])
  res.status(200).send({heals:healOrdered});
}

exports.getRawMilk = async (req, res) => {
  const filter = req.query;
  filter.farm = req.farmId;

  const year = filter.year;
  const monthFrom = filter.monthFrom;
  const monthTo = filter.monthTo;
  // console.log('monthFrom : ', monthFrom);
  // console.log('monthTo : ', monthTo);

  let workbook = new Excel.Workbook();

  const rangeMonths = monthTo - monthFrom;
  // console.log('rangeMonths : ', rangeMonths);

  const promises = [];
  for (let i = 0; i <= rangeMonths; i++) {
    const data = fetchData(year, monthFrom, i, filter);
    if(data){
      promises.push(data);
    }
  }

  const results = await Promise.all(promises);

  if(results[0].milkFilters.length === 0){
    res.json(null)
  }

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const month = i + Number(monthFrom);
    // console.log('month : ', month);

    const monthStr = moment().month(month - 1).format("MMMM");

    if (Object.keys(result.milkGroupDates).length > 0) {
      const sheet = workbook.addWorksheet(monthStr);
      sheet.state = 'visible';
      const daysInMonth = moment().month(month - 1).daysInMonth();
      const dayColumns = daysInMonth * 3;

      //Header
      mergeCell(sheet, 1, 1, 1, dayColumns + 11, 'แบบบันทึกผลผลิต(น้ำนมดิบ) ประจำวัน เดือน' + monthStr + ' ' + year);
      valueCell(sheet, 2, 1, 'ลำดับที่');
      valueCell(sheet, 2, 2, 'โค');
      mergeCell(sheet, 2, 3, 2, dayColumns + 2, 'วันที่');
      mergeCell(sheet, 2, dayColumns + 3, 3, dayColumns + 4, 'สรุป (กก.)');
      mergeCell(sheet, 2, dayColumns + 5, 3, dayColumns + 6, 'รายได้');
      mergeCell(sheet, 2, dayColumns + 7, 3, dayColumns + 8, 'ค่าอาหาร');
      mergeCell(sheet, 2, dayColumns + 9, 3, dayColumns + 10, 'ค่าจ้างคนงาน');
      mergeCell(sheet, 2, dayColumns + 11, 3, dayColumns + 11, 'ค่ารักษา');
      mergeCell(sheet, 2, dayColumns + 12, 3, dayColumns + 12, 'ค่าป้องกัน/บำรุง');
      mergeCell(sheet, 2, dayColumns + 13, 3, dayColumns + 15, 'สถานภาพของโค');

      //Sub Header
      const dateKeys = Object.keys(result.milkGroupDates);
      for (let i = 1; i <= daysInMonth; i++) {
        mergeCell(sheet, 3, i * 3, 3, (i * 3) + 2, i);
        valueCell(sheet, 4, i * 3, 'เช้า');
        valueCell(sheet, 4, i * 3 + 1, 'บ่าย');
        valueCell(sheet, 4, i * 3 + 2, 'รวม');
      }

      valueCell(sheet, 4, dayColumns + 3, 'รวม');
      valueCell(sheet, 4, dayColumns + 4, 'เฉลี่ย');
      valueCell(sheet, 4, dayColumns + 5, 'ราคา/กก.');
      valueCell(sheet, 4, dayColumns + 6, 'เป็นเงิน');
      valueCell(sheet, 4, dayColumns + 7, 'ต่อวัน');
      valueCell(sheet, 4, dayColumns + 8, 'เป็นเงิน');
      valueCell(sheet, 4, dayColumns + 9, 'ต่อวัน');
      valueCell(sheet, 4, dayColumns + 10, 'เป็นเงิน');
      valueCell(sheet, 4, dayColumns + 11, 'รวม');
      valueCell(sheet, 4, dayColumns + 12, 'รวม');
      valueCell(sheet, 4, dayColumns + 13, 'กำไร');
      valueCell(sheet, 4, dayColumns + 14, 'กำไคิดเป็น %');
      valueCell(sheet, 4, dayColumns + 15, 'คุณภาพ');

      //Data
      let rowNumDataStart = 5;
      let foodSum = 0;
      let healSum = 0;
      let protectionSum = 0;
      let protectionTotal = 0;
      let workerDayTotal = 0;
      let workerMonthTotal = 0;
      let healTotal = 0;
      let foodTotal = 0;
      let profitTotal = 0;
      // console.log('data milkFilters : ', result.milkFilters);
      for (const milkFilter of result.milkFilters) {
        const data = milkFilter;
        const numMilking = data.milks.length;
        
        let expenseSum = 0;

        //ค่าจ้างคนงาน
        const workerPerDay = ((result.sumMonthSalary / result.milkFilters.length) / daysInMonth) 
        const workerAllDay = result.sumMonthSalary / result.milkFilters.length

        //ค่าอาหาร
        const foods = await Food.find({ farm: req.farmId, corral: data.cowCorral }).exec();
        foodSum = foods.reduce((sum, item) => sum + (item.amountAvg?item.amountAvg:0), 0);

        //ค่ารักษา
        const heals = await Heal.find({
          date: { $gte: result.startDate.toISOString().split('T')[0], $lte: result.endDate.toISOString().split('T')[0] },
          farm: filter.farm,
          cow: data.cowId
        }).exec();
        healSum = heals.reduce((sum, item) => sum + item.amount, 0);

        //ค่าป้องกัน/บำรุง
        const protections = await Protection.find({
          date: { $gte: result.startDate.toISOString().split('T')[0], $lte: result.endDate.toISOString().split('T')[0] },
          farm: filter.farm,
          cows: { $in: [data.cowId] }
        }).exec();
        protectionSum = protections.reduce((sum, item) => sum + item.amount, 0);

        expenseSum += (foodSum*numMilking) + healSum + protectionSum + workerAllDay;

        //ชื่อโค
        valueCell(sheet, rowNumDataStart, 2, data.cow);

        let totalQty = 0;
        let incomeSum = 0;

        for (let j = 0; j < data.milks.length; j++) {

          const milk = data.milks[j];
          // console.log('data milk : ', milk);
          const day = moment(milk.date).format('D');
          // console.log('data day : ', day);

          const morningQty = milk.morningQty;
          const afternoonQty = milk.afternoonQty;
          const sumQty = morningQty + afternoonQty;
          totalQty += sumQty;

          const morningAmount = milk.morningAmount;
          const afternoonAmount = milk.afternoonAmount;
          const sumAmount = morningAmount + afternoonAmount;
          incomeSum += sumAmount;

          valueCell(sheet, rowNumDataStart, day * 3, morningQty);
          valueCell(sheet, rowNumDataStart, day * 3 + 1, afternoonQty);
          valueCell(sheet, rowNumDataStart, day * 3 + 2, sumQty);

        }

        // console.log('expense sum : ',expenseSum)

        const profitAmount = incomeSum - expenseSum
        const profitPercent = incomeSum <= 0 ? 0 : ((profitAmount/incomeSum) * 100)

        let grade = null;
        if(profitPercent <= 0){
          grade = '(D) แย่มาก'
        }else if(profitPercent > 0 && profitPercent <= 30){
          grade = '(C) แย่'
        }else if(profitPercent > 30 && profitPercent <= 50){
          grade = '(B) ปกติ'
        }else if(profitPercent > 50 && profitPercent <= 80){
          grade = '(A) ดี'
        }else if(profitPercent > 80){
          grade = '(A+) ดีมาก'
        }

        valueCell(sheet, rowNumDataStart, dayColumns + 3, totalQty);
        valueCell(sheet, rowNumDataStart, dayColumns + 4, totalQty / numMilking);
        valueCell(sheet, rowNumDataStart, dayColumns + 5, incomeSum / totalQty);
        valueCell(sheet, rowNumDataStart, dayColumns + 6, incomeSum);
        valueCell(sheet, rowNumDataStart, dayColumns + 7, foodSum);
        valueCell(sheet, rowNumDataStart, dayColumns + 8, foodSum * numMilking);
        valueCell(sheet, rowNumDataStart, dayColumns + 9, workerPerDay);
        valueCell(sheet, rowNumDataStart, dayColumns + 10, workerAllDay );
        valueCell(sheet, rowNumDataStart, dayColumns + 11, healSum);
        valueCell(sheet, rowNumDataStart, dayColumns + 12, protectionSum);
        valueCell(sheet, rowNumDataStart, dayColumns + 13, profitAmount);
        valueCell(sheet, rowNumDataStart, dayColumns + 14, profitPercent);
        valueCell(sheet, rowNumDataStart, dayColumns + 15, grade);

        foodTotal += (foodSum * numMilking);
        healTotal += healSum;
        protectionTotal += protectionSum;
        workerDayTotal += workerPerDay
        workerMonthTotal += workerAllDay
        profitTotal += profitAmount;
        rowNumDataStart++;
        // console.log('rowNum : ', rowNumDataStart);
      }

      rowNumDataStart++;
      //Summary day
      valueCell(sheet, rowNumDataStart, 2, 'รวม');
      valueCell(sheet, rowNumDataStart + 1, 2, 'ค่าเฉลี่ย');
      let sumTotalQty = 0;
      let sumTotalAmount = 0;
      for (let sumDay of Object.keys(result.sumDays)) {
        const sum = result.sumDays[sumDay];
        valueCell(sheet, rowNumDataStart, Number(sumDay) * 3, sum.sumMorningQty);
        valueCell(sheet, rowNumDataStart, Number(sumDay) * 3 + 1, sum.sumAfternoonQty);
        valueCell(sheet, rowNumDataStart, Number(sumDay) * 3 + 2, sum.sumMorningQty + sum.sumAfternoonQty);
        valueCell(sheet, rowNumDataStart + 1, Number(sumDay) * 3 + 2, (sum.sumMorningQty + sum.sumAfternoonQty) / sum.count);
        sumTotalQty += sum.sumMorningQty + sum.sumAfternoonQty;
        sumTotalAmount += sum.sumMorningAmount + sum.sumAfternoonAmount;
      }
      valueCell(sheet, rowNumDataStart, dayColumns + 3, sumTotalQty);
      valueCell(sheet, rowNumDataStart, dayColumns + 4, sumTotalQty / Object.keys(result.sumDays).length);
      valueCell(sheet, rowNumDataStart, dayColumns + 5, sumTotalAmount / sumTotalQty);
      valueCell(sheet, rowNumDataStart, dayColumns + 6, sumTotalAmount);
      valueCell(sheet, rowNumDataStart, dayColumns + 8, foodTotal);
      valueCell(sheet, rowNumDataStart, dayColumns + 9, workerDayTotal);
      valueCell(sheet, rowNumDataStart, dayColumns + 10, workerMonthTotal);
      valueCell(sheet, rowNumDataStart, dayColumns + 11, healTotal);
      valueCell(sheet, rowNumDataStart, dayColumns + 12, protectionTotal);
      valueCell(sheet, rowNumDataStart, dayColumns + 13, profitTotal);
    }

  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader("Content-Disposition", "attachment; filename=raw-milks.xlsx");

  return workbook.xlsx.write(res).then(function () {
    res.status(200).end();
  });
};


const fetchData = async (year, monthFrom, i, filter) => {
  const month = i + Number(monthFrom);
  // console.log('month : ', month);

  let start = new Date(year, (month - 1), 1);

  const startOffset = start.getTimezoneOffset();
  let startDate = new Date(start.getTime() - (startOffset * 60 * 1000));
  // console.log('startDate : ', startDate);

  const daysInMonth = new Date(year, month, 0).getDate();
  let end = new Date(year, (month - 1), daysInMonth);
  const endOffset = end.getTimezoneOffset();
  let endDate = new Date(end.getTime() - (endOffset * 60 * 1000));
  // console.log('endDate : ', endDate);

  const salariesPromise = Salary.find({ farm: filter.farm, month: month, year: year }).exec();
  const milksPromise = Milk.find({
    date: { $gte: format(startDate, 'yyyy-MM-dd'), $lte: format(endDate, 'yyyy-MM-dd') },
    farm: filter.farm
  }).populate('milkDetails').sort({ date: 1 }).exec();

  const [salaries, milks] = await Promise.all([salariesPromise, milksPromise]);

  const sumMonthSalary = salaries.reduce((sum, item) => sum + item.amount, 0);

  const milkGroupDates = _.groupBy(milks, 'date');
  // console.log('milkGroupDates : ', Object.keys(milkGroupDates).length);

  let milkFilters = [];

  // Fetch all necessary Cow data at once and store it in a map for quick access
  const cowMap = new Map();
  const cowIds = Array.from(new Set(milks.map(milk => milk.milkDetails.map(detail => detail.cow)).flat()));
  const cows = await Cow.find({ _id: { $in: cowIds } }).exec();
  cows.forEach(cow => cowMap.set(cow._id.toString(), cow));

  await Promise.all(Object.keys(milkGroupDates).map(async (date) => {
    const milkAllTimeInDay = milkGroupDates[date];// Get all time M,A in day

    const milkMorning = milkAllTimeInDay.filter(m => m.time === 'M'); // Get all cows in morning time
    if (milkMorning.length > 0) {
      for (let morningDetail of milkMorning[0].milkDetails) {
        const cow = cowMap.get(morningDetail.cow.toString());
        let milk = {
          date: milkMorning[0].date,
          morningQty: morningDetail.qty,
          morningAmount: morningDetail.amount,
          afternoonQty: 0,
          afternoonAmount: 0,
        }

        let dataFilter = milkFilters.filter(mf => mf.cow == cow.name)
        let dataDay = {};
        if (dataFilter.length == 0) {
          dataDay = {
            cow: cow.name,
            cowId: cow._id,
            cowCorral: cow.corral,
            milks: [milk]
          }
          milkFilters.push(dataDay)
        } else {
          dataFilter[0].milks.push(milk)
        }
      }
    }


    const milkAfternoon = milkAllTimeInDay.filter(m => m.time === 'A'); // Get all cows in morning time
    if (milkAfternoon.length > 0) {
      for (let afternoonDetail of milkAfternoon[0].milkDetails) {
        const cow = cowMap.get(afternoonDetail.cow.toString());
        let cowFilter = milkFilters.filter(mf => mf.cow == cow.name);
        if (cowFilter.length > 0) {
          let dateFilter = cowFilter[0].milks.filter(m => format(m.date, 'yyyy-MM-dd') === format(milkAfternoon[0].date, 'yyyy-MM-dd'));

          if (dateFilter.length > 0) {
            dateFilter[0].afternoonQty = afternoonDetail.qty;
            dateFilter[0].afternoonAmount = afternoonDetail.amount;
          }
        } else {
          const dataDay = {
            cow: cow.name,
            cowId: cow._id,
            cowCorral: cow.corral,
            milks: [{
              date: milkAfternoon[0].date,
              morningQty: 0,
              morningAmount: 0,
              afternoonQty: afternoonDetail.qty,
              afternoonAmount: afternoonDetail.amount,
            }]
          }
          milkFilters.push(dataDay)
        }

      }
    }
  }));

  //Day Summary
  const sumDays = {};
  for (const milkFilter of milkFilters) {
    for (const milk of milkFilter.milks) {
      const day = format(milk.date, 'd');
      if (!sumDays[day]) {
        sumDays[day] = {
          sumMorningQty: milk.morningQty,
          sumMorningAmount: milk.morningAmount,
          sumAfternoonQty: milk.afternoonQty,
          sumAfternoonAmount: milk.afternoonAmount,
          count: 1
        };
      } else {
        sumDays[day].sumMorningQty += milk.morningQty
        sumDays[day].sumAfternoonQty += milk.afternoonQty
        sumDays[day].sumMorningAmount += milk.morningAmount
        sumDays[day].sumAfternoonAmount += milk.afternoonAmount
        sumDays[day].count++;
      }
    }
  }
  // console.log('sumDays : ', sumDays);

  return {
    milkGroupDates,
    milkFilters,
    startDate,
    endDate,
    sumMonthSalary,
    sumDays
  };
};

const mergeCell = (sheet,startRow,startColumn,endRow,endColumn,value) => {
    sheet.mergeCells(startRow,startColumn,endRow,endColumn);
    sheet.getCell(startRow,startColumn).value = value
    sheet.getCell(startRow,startColumn).alignment = { horizontal: 'center' };
}

const valueCell = (sheet,startRow,startColumn,value) => {
  sheet.getCell(startRow,startColumn).value = value
}
