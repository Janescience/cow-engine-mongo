const db = require("../models");
const Promise = require('bluebird');

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
    const days = new Date(year, month - 1, 0).getDate();

    let start = new Date(year, month - 1, 1);
    const startOffset = start.getTimezoneOffset();
    let startDate = new Date(start.getTime() - startOffset * 60 * 1000);

    let end = new Date(year, month - 1, days);
    const endOffset = end.getTimezoneOffset();
    let endDate = new Date(end.getTime() - endOffset * 60 * 1000);

    const startDateISO = startDate.toISOString().split('T')[0];
    const endDateISO = endDate.toISOString().split('T')[0];

    const milks = await Milk.find({
      date: { $gte: startDateISO, $lte: endDateISO },
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

    const milkSave = { time: data.time, date: data.date, farm: farmId };
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
