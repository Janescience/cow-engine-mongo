const db = require("../models");

const Cow = db.cow;
const Protection = db.protection;
const Heal = db.heal;
const Food = db.food;
const RawMilkDetail = db.milkDetail;
const Salary = db.salary;
const Equipment = db.equipment;
const Maintenance = db.maintenance;
const Building = db.building;
const Bill = db.bill;

const quality = async (id) => {
  let expenseSum = 0;
  let incomeSum = 0;
  let farmSum = 0;
  let protectionSum = 0;
  let healSum = 0;
  let equipmentSum = 0;
  let maintenanceSum = 0;
  let buildingSum = 0;
  let billSum = 0;
  let salarySumAvg = 0;
  let rawmilkSum = 0;
  let sumFoodAmountAvg = 0;

  const cowPromise = Cow.findById(id).exec();
  const [cow] = await Promise.all([cowPromise]);

  if (cow) {
    const promises = [
      RawMilkDetail.find({ cow: cow._id }).exec(),
      Food.find({ farm: cow.farm, corral: cow.corral }).populate('foodDetails').exec(),
      Heal.find({ cow: cow._id }).exec(),
      Protection.find({ cows: { $in: [cow._id] } }).exec(),
      Cow.count({ farm: cow.farm }).exec(),
      Salary.find({ farm: cow.farm }).exec(),
      Bill.find({ farm: cow.farm }).exec()
    ];

    const [rawMilkDetails, foods, heals, protections, cowsCount, salaries, bills] = await Promise.all(promises);

    rawmilkSum = rawMilkDetails.reduce((sum, item) => sum + item.amount, 0);

    sumFoodAmountAvg = foods.reduce((sum, food) => {
      const sumAmount = food.foodDetails.reduce((sum, detail) => sum + detail.amount, 0) * new Date(food.year, food.month, 0).getDate();
      return sum + sumAmount / food.numCow;
    }, 0);

    healSum = heals.reduce((sum, item) => sum + item.amount, 0);
    protectionSum = protections.reduce((sum, item) => sum + item.amount, 0);

    const salarySum = salaries.reduce((sum, item) => sum + item.amount, 0);
    salarySumAvg = salarySum / cowsCount;

    billSum = bills.reduce((sum, item) => sum + item.amount, 0) / cowsCount;

    expenseSum += sumFoodAmountAvg + healSum + protectionSum + salarySumAvg + billSum;
    incomeSum += rawmilkSum;
  }

  const profitAmount = incomeSum - expenseSum;
  const profitPercent = profitAmount > 0 ? (profitAmount / incomeSum) * 100 : (profitAmount / expenseSum) * 100;

  const result = {
    profit: {
      percent: profitPercent,
      amount: profitAmount
    },
    income: {
      rawmilk: rawmilkSum,
      sum: incomeSum
    },
    expense: {
      heal: healSum,
      protection: protectionSum,
      food: sumFoodAmountAvg,
      salary: salarySumAvg,
      bill: billSum,
      sum: expenseSum
    }
  };

  if (profitPercent <= 0) {
    result.grade = 'D';
    result.description = 'แย่มาก';
  } else if (profitPercent > 0 && profitPercent <= 30) {
    result.grade = 'C';
    result.description = 'แย่';
  } else if (profitPercent > 30 && profitPercent <= 50) {
    result.grade = 'B';
    result.description = 'ปกติ';
  } else if (profitPercent > 50 && profitPercent <= 80) {
    result.grade = 'A';
    result.description = 'ดี';
  } else if (profitPercent > 80) {
    result.grade = 'A+';
    result.description = 'ดีมาก';
  }

  return result;
};

const cow = {
  quality
};

module.exports = cow;
