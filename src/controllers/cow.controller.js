const db = require("../models");
const Cow = db.cow;
const MilkDetail = db.milkDetail;

const { put,del } = require('@vercel/blob');
const { cowService,notiService } = require("../services");

const dotenv = require('dotenv');
dotenv.config();
exports.getAll = async (req, res) => {
    const filter = req.query
    filter.farm = req.farmId
    const cows = await Cow.find(filter).select('_id image code name birthDate status corral quality').sort({corral:1}).exec();
    res.json({cows});
};

exports.getAllDDL = async (req, res) => {
    const ObjectID = require('mongodb').ObjectId;
    const filter = req.query
    const farmId = req.farmId
    const cows = await Cow.aggregate([
        {
          $project: {
            "code": 1,
            "name": 1,
            "_id": 1,
            "farm" : 1
          }
        },
        {
          $match: { 'farm' : ObjectID(farmId) }
        }
    ])
    res.json({cows});
};

exports.get = async (req, res) => {
    const id = req.params.id
    const cow = await Cow.findById(id).exec();
    const quality = await cowService.quality(id);
    res.status(200).send({cow,quality});
};

exports.getDetails = async (req, res) => {
  const id = req.params.id
  const quality = await cowService.quality(id);

  const rawmilks = await MilkDetail.find({cow:id}).exec();
  const sumRawmilk = rawmilks.reduce((sum,item) => sum + item.qty,0);
  const avgRawMilk = sumRawmilk/rawmilks.length
  const sum = {
    rawmilk : avgRawMilk | 0
  }

  res.status(200).send({
    quality,
    sum
  });
  
};

exports.create = async (req, res) => {
    const data = req.body;
    data.farm = req.farmId;
    delete data.image
    const newCow = new Cow(data);
    await newCow.save();
    res.status(200).send({newCow});
};

exports.update = async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    delete data.image
    const updatedCow = await Cow.updateOne({_id:id},data).exec();
    res.status(200).send({updatedCow});
};

exports.upload = async (req,res) => {
  const id = req.params.id;

  if (!req.files) {
    return res.status(500).send({ msg: "file is not found" })
  }

  const myFile = req.files.file;
  const blob = await put(myFile.name, myFile.data, {
    contentType : myFile.mimetype,
    access: 'public',
    token : process.env.BLOB_READ_WRITE_TOKEN
  });

  const cow = await Cow.findById(id).exec();

  if(cow.image && cow.image.indexOf('https') >= 0){
    await del(cow.image);
  }

  await Cow.updateOne({_id:id},{image:blob.url}).exec();

  res.status(200).send({blob});
}

exports.delete = async (req, res) => {
    const id = req.params.id;
    const deletedCow = await Cow.deleteOne({_id:id});
    res.status(200).send({deletedCow});
};

exports.calGrade = async () => {
  let cowError;
  console.log('=======> Start schedule calculate cow grade <=======')
  console.log('-------> ' + new Date() + ' <-------')
  try{

    const cows = await Cow.find({flag:'Y'}).exec();
    console.log('Cows Flag Y Size : ',cows.length)

    for(let cow of cows){
      cowError = cow
      const result = await cowService.quality(cow._id);
      await Cow.updateOne({_id:cow._id},{grade:result.grade}).exec();
    }

    console.log('-------x ' + new Date() + ' x-------')
    console.log('=======x End schedule calculate cow grade x=======')
  } catch (error) {
      console.error('Job Cal Grade Error : ',error)
      await notiService.saveLog('Job Cal Grade Error', 'B', 'F', error+"", null, [cowError._id]);
      return;
  }
}
