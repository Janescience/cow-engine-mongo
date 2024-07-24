const db = require("../models");
const Cow = db.cow;
const Farm = db.farm;
const Birth = db.birth;
const Reproduct = db.reproduction;
const MilkDetail = db.milkDetail;

const { put,del } = require('@vercel/blob');
const { cowService,notiService,lineApi } = require("../services");

const { calAge } = require("../utils/age-calculate");

const dotenv = require('dotenv');
dotenv.config();

exports.getAll = async (req, res) => {
    const filter = req.query
    filter.farm = req.farmId
    const cows = await Cow.find(filter).select('_id image code name birthDate status corral quality grade sex').sort({corral:1}).exec();
    res.json({cows});
};

exports.getAllDDL = async (req, res) => {
    const filter = req.query
    filter.farm = req.farmId
    if(filter.status)
      filter.status = {$in:filter.status.split(',')}
    const cows = await Cow.find(filter).select('_id code name').exec();
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

exports.calGrade = async (req,res) => {
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
    res.status(200).send("Cal Grade Success")
  } catch (error) {
      console.error('Job Cal Grade Error : ',error)
      await notiService.saveLog('Job Cal Grade Error', 'B', 'F', error+"", null, [cowError._id]);
      return;
  }
}

exports.updateStatus = async (req,res) => {
  // 1:โคท้อง (9.15 เดือน)
  // 2:โคปลดระวาง (7-10 ปี)
  // 3:โครีดนม (ให้นม 10-12 เดือนหลังคลอด)
  // 4:โคเด็ก(อายุ 0-6 เดือน)
  // 5:โคดราย(พักให้นม 2-3 เดือนก่อนคลอด)
  // 6:โคสาว(อายุ 6 เดือน - 2 ปี วัยผสม)

  // 7:โคพ่อพันธุ์(โคตัวผู้ วัยผสม)
  // 8:โคจำหน่าย(โคตัวผู้ จำหน่ายออก)
  // 9:โคเลี้ยง(โคตัวผู้เลี้ยงเฉยๆ)
  // 10:โคขุน(โคเนื้อ ตัวผู้และตัวเมีย)
  try{
    const farms = await Farm.find()
    for(let farm of farms){
      let titleRetired = "***** รายการโคควรปลดระวาง *****";
      let titleUpdateStatus = "***** รายการโคปรับสถานะ *****"
      let titleReproduct = "***** รายการโครีดนมควรเข้าระบบสืบพันธุ์ *****"
      let titleNoBirth = "***** รายการโครีดนมแต่ไม่มีประวัติการคลอดลูก *****"
      let titleMatingReady = "***** รายการโคสาวพร้อมผสมพันธุ์ *****"
      let titleDry = "***** รายการโคควรพักให้นม *****"
      let titleNearBirth = "***** รายการโคถึงเวลาคลอด *****"

      let txtRetired = ""
      let txtUpdateStatus = ""
      let txtReproduct = ""
      let txtNoBirth = ""
      let txtMatingReady = ""
      let txtDry = ""
      let txtNearBirth = ""


      const id = farm._id;
      const token = farm.lineToken;

      if(token){
        const cows = await Cow.find({flag:'Y',farm:id});

        for(let cow of cows){
          const status = cow.status;
          const age = calAge(cow.birthDate).number;
          const ageStr = calAge(cow.birthDate).ageString;

          const sex = cow.sex

          if(age >= 8){
            //โคปลดระวาง (อายุ 8 ปีขึ้นไป)
            txtRetired += '\n' + cow.name + ' อายุ ' + ageStr;
          }
        
          switch (status) {
            case 4: 
              //โคเด็ก -> โคสาว (6 เดือน)
              if(age >= 0.06 && sex === 'F'){
                await Cow.updateOne({_id:cow._id},{status:6})
                txtUpdateStatus += '\n'+cow.name + ' ตัวเมีย (โคเด็ก -> โคสาว)';
              }

              //โคเด็ก -> โคพ่อพันธุ์ วัยผสม (3 ปีขึ้นไป)
              if(age >= 3 && sex === 'M'){
                await Cow.updateOne({_id:cow._id},{status:7})
                txtUpdateStatus += '\n'+cow.name + ' ตัวผู้ (โคเด็ก -> โคพ่อพันธุ์)';

              }
              break;
            case 3:
              //โครีดนม (มาตรฐานควรรีดนมแค่ 10-12 เดือน)
              //คิดระยะเวลาการรีดนมจาก วันที่คลอด ล่าสุด
              const births = await Birth.find({cow:cow._id,status:'B'}).sort({seq:-1})//desc
              if(births.length > 0){
                const birthDate = births[0].birthDate
                const birthAge = calAge(birthDate).number;
                const birthAgeStr = calAge(birthDate).ageString;
                
                if(birthAge >= 0.10){
                  txtReproduct += '\n'+cow.name + ' รีดนมเป็นเวลา ' + birthAgeStr;
                }
              }else{
                txtNoBirth += '\n'+cow.name;
              }
              break;
            case 6:
              //โคสาว
              //อายุ 1.03 - 2 ปี แนะนำให้ผสมพันธุ์ ถ้าโคยังไม่ได้เข้าระบบสืบพันหรือสืบพันล้มเหลว
              const reproducts = await Reproduct.find({cow:cow._id,status:1,farm:id})
              if((age >= 1.03 && age <= 2) && sex === 'F' && reproducts.length == 0){
                txtMatingReady += '\n'+cow.name + ' อายุ ' + ageStr;
              }
              break;
            case 1:
              //โคท้อง
              const birth = await Birth.findOne({cow:cow._id,status:'P',farm:id})
              if(birth && birth.pregnantDate){
                const pregnantAge = calAge(birth.pregnantDate).number
                const pregnantAgeStr = calAge(birth.pregnantDate).ageString
  
                if(pregnantAge >= 0.06 && pregnantAge <= 0.07){
                  //โคท้อง 6-7 เดือน แนะนำให้พักนมก่อนคลอด 2-3 เดือน
                  txtDry += '\nโค'+cow.name + ' อายุครรภ์ ' + pregnantAgeStr ;
                }
  
                if(pregnantAge >= 0.09){
                  txtNearBirth += '\nโค'+cow.name + ' อายุครรภ์ ' + pregnantAgeStr ;
                }
              }
              
              break;
            default:
              break;
          }
        }
        if(txtRetired != ""){
          // await lineApi.notify(titleRetired + txtRetired,'B',id,token,null,'Empty');
          console.log(titleRetired + txtRetired)
          console.log("Notify list cow retired success.")
        }
        if(txtUpdateStatus != ""){
          // await lineApi.notify(titleUpdateStatus + txtUpdateStatus,'B',id,token,null,'Empty');
          console.log(titleUpdateStatus + txtUpdateStatus)
          console.log("Notify list cow updated status success.")
        }
        if(txtReproduct != ""){
          // await lineApi.notify(titleReproduct + txtReproduct,'B',id,token,null,'Empty');
          console.log(titleReproduct + txtReproduct)
          console.log("Notify list cow recommend reproduct success.")
        }
        if(txtNoBirth != ""){
          // await lineApi.notify(titleNoBirth + txtNoBirth,'B',id,token,null,'Empty');
          console.log(titleNoBirth + txtNoBirth)
          console.log("Notify list cow milking but no birth success.")
        }
        if(txtMatingReady != ""){
          // await lineApi.notify(titleMatingReady + txtMatingReady,'B',id,token,null,'Empty');
          console.log(titleMatingReady + txtMatingReady)
          console.log("Notify list cow mating ready success.")
        }
        if(txtDry != ""){
          // await lineApi.notify(titleDry + txtDry,'B',id,token,null,'Empty');
          console.log(titleDry + txtDry)
          console.log("Notify list cow dry success.")
        }
        if(txtNearBirth != ""){
          // await lineApi.notify(titleNearBirth + txtNearBirth,'B',id,token,null,'Empty');
          console.log(titleNearBirth + txtNearBirth)
          console.log("Notify list cow birth timing success.")
        }
      }else{
        console.log('Farm '+farm.name+' no line token.')
      }
    }
    res.status(200).send("Cow Status Process Success")

  } catch (error) {
      console.error('Error : ',error)
      // await notiService.saveLog('Job Cow Update Status', 'B', 'F', error+"", null, null);
      return;
  }
}
