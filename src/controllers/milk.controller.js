const db = require("../models");
const Promise = require('bluebird');
const moment = require("moment");
const Milk = db.milk;
const MilkDetail = db.milkDetail;
const Cow = db.cow;

const projection = { code: 1, name: 1, _id: 1 };

const getCowsByIds = async (cowIds) => {
  const cows = await Cow.find({ _id: { $in: cowIds }, flag: 'Y' }, projection);
  const cowMap = new Map();
  cows.forEach((cow) => {
    cowMap.set(cow._id.toString(), cow);
  });
  return cowMap;
};

exports.getAll = async (req, res) => {
  try {
    const filter = req.query;
    filter.farm = req.farmId;

    const year = filter?.year;
    const month = filter?.month;
    // const days = new Date(year, month, 0).getDate();
    // console.log('month : ',month)
    // console.log('days : ',days)
    // let start = new Date(year, month - 1, 0);
    // const startOffset = start.getTimezoneOffset();
    // let startDate = new Date(start.getTime() - startOffset * 60 * 1000);

    // let end = new Date(year, month - 1, days);
    // const endOffset = end.getTimezoneOffset();
    // let endDate = new Date(end.getTime() - endOffset * 60 * 1000);

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // console.log('milk date filter : ',startDate, endDate);

    const milks = await Milk.find({
      date: { $gte: startDate, $lte: endDate },
      farm: filter.farm,
    })
      .populate('milkDetails')
      .sort({ time: -1 })
      .lean();

    const cowIds = milks.map((milk) => milk.milkDetails.map((milkDetail) => milkDetail.cow)).flat();

    const cowMap = await getCowsByIds(cowIds);

    milks.forEach((milk) => {
      milk.milkDetails.forEach((milkDetail) => {
        const cow = cowMap.get(milkDetail.cow.toString());
        if (cow) {
          milkDetail.relate = { cow: { code: cow.code, name: cow.name, _id: cow._id } };
        }
      });
    });

    res.status(200).send({ milks });
  } catch (error) {
    res.status(500).send({ error });
  }
};


exports.get = async (req, res) => {
    const filter = req.query
    const farmId = req.farmId;
    const milks = await Milk.find({farm:farmId}).populate({path:'milkDetails',match : { cow : filter.cow }}).sort({ date: -1 }).exec();
    res.status(200).send({milks});
};

exports.create = async (req, res) => {
  try {
    const data = req.body;
    const farmId = req.farmId;

    const milkSave = { time: data.time, date: data.date , farm: farmId };
    const newMilk = new Milk(milkSave);

    const milkSaved = await newMilk.save();
    // console.log('milk saved.');

    const milkDetails = data.milkDetails.map(detail => ({ ...detail, milk: milkSaved._id }));
    const milkDetailIds = await MilkDetail.insertMany(milkDetails);
    const detailIds = milkDetailIds.map(detail => detail._id);
    // console.log('detailIds : ', detailIds);

    await Milk.updateOne({ _id: milkSaved._id }, { milkDetails: detailIds }).exec();
    // console.log('milk updated.');

    res.status(200).send({ milkSaved });
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};

exports.update = async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    try{
        await MilkDetail.deleteMany({milk:id});

        let detailIds = [];
        for(let detail of data.milkDetails){
            detail.milk = id
            detail.cow = detail.cow._id

            const newMilkDetail = new MilkDetail(detail);
            await newMilkDetail.save();
            detailIds.push(newMilkDetail._id)
        }

        const milk = await Milk.findById(id).exec();
        milk.milkDetails = detailIds;
        await milk.save();

        res.status(200).send({message:'Milk updated success.'});
    }catch(error){
        console.error('Milk update error : ',error);
        res.json(error);
    }
};

exports.delete = async (req, res) => {
    const id = req.params.id;
    
    const deletedMilkDetail = await MilkDetail.deleteMany({milk:id});
    // console.log("MilkDetail deleted : ",deletedMilkDetail)

    const deletedMilk = await Milk.deleteOne({_id:id});
    // console.log("Milk deleted : ",deletedMilk)

    res.status(200).send({deletedMilk});
};

// Function to get a random number between min and max (inclusive)
const getRandomQty = (min, max) => {
  const random = (Math.random() * (max - min) + min).toFixed(2);
  return parseFloat(random);
};
// Generate and save milking data
exports.mock = async (req,res) => {
  const farmId = req.farmId;

  // Fetch cows with status 1 or 3
  const cows = await Cow.find({ status: { $in: ['1', '3'] },farm : farmId });

  for (let month = 5; month < 6; month++) {
    const daysInMonth = new Date(2024, month+1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Date.UTC(2024, month, day,0,0,0,0));
      console.log('date : ',date);
        let morningMilk = await Milk.findOne({
          time: 'M',
          date,
          farm: farmId,
        });
        
        if(!morningMilk){
          morningMilk = new Milk({
            time: 'M',
            date,
            farm: farmId,
          });
          await morningMilk.save();

        }
        
  
        let afternoonMilk = await Milk.findOne({
          time: 'A',
          date,
          farm: farmId,
        });
        
        if(!afternoonMilk){
          afternoonMilk = new Milk({
            time: 'A',
            date,
            farm: farmId,
          });
          await afternoonMilk.save();
        }

        const morningDetailIds = [],afternoonDetailIds = [];

        for (const cow of cows) {
          const morningDetail = await MilkDetail.find({cow:cow._id,milk :morningMilk._id,farm:farmId})
          const afternoonDetail = await MilkDetail.find({cow:cow._id,milk :afternoonMilk._id,farm:farmId})

          console.log('morningDetail : ',morningDetail.length,'afternoonDetail : ',afternoonDetail.length)
          // Generate morning quantity
          const morningQty = getRandomQty(8, 15);
          const morningAmount = morningQty * 20.5;
          if(morningDetail.length <= 0){
            
            const morningMilkDetail = new MilkDetail({
              qty: morningQty,
              amount: morningAmount,
              cow: cow._id,
              milk :morningMilk._id
            });
    
            await morningMilkDetail.save();
            morningDetailIds.push(morningMilkDetail._id);
          }

          if(afternoonDetail.length <= 0){
            // Generate afternoon quantity (less than morning quantity)
            const afternoonQty = getRandomQty(6, morningQty - 1);
            const afternoonAmount = afternoonQty * 20.5;
    
            const afternoonMilkDetail = new MilkDetail({
              qty: afternoonQty,
              amount: afternoonAmount,
              cow: cow._id,
              milk : afternoonMilk._id
            });
    
            await afternoonMilkDetail.save();
            afternoonDetailIds.push(afternoonMilkDetail._id);
          }
        
      }

      if(morningDetailIds.length > 0){
        await Milk.updateOne({ _id: morningMilk._id }, { milkDetails: morningDetailIds }).exec();
        console.log('morning done. cow size = ' + morningDetailIds.length)
      }
      if(afternoonDetailIds.length > 0){
        await Milk.updateOne({ _id: afternoonMilk._id }, { milkDetails: afternoonDetailIds }).exec();
        console.log('afternoon done. cow size = ' + afternoonDetailIds.length)
      }

    }
    console.log('month '+ month + ' done.')
  }

  res.status(200).send('Mock data success.');
};

exports.fix = async (req, res) => {
  const milks = await Milk.find();
  for(let milk of milks){

    // const milkDetails = await MilkDetail.find({milk:milk._id});
    await Milk.updateOne({ _id: milk._id }, { date: milk.date.toISOString().split('T')[0] }).exec();

  }

  res.status(200).send('Fix data success.');
};
