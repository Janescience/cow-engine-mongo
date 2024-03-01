const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Farm = db.farm;
const RefreshToken = db.refreshToken;
const NotiParam = db.notificationParam;
const Param = db.param;

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Vaccine = require("../models/vaccine.model");

exports.signup = async (req, res) => {

    const countF = await Farm.collection.countDocuments();

    const farm = new Farm({
      code : "F" + String(countF + 1).padStart(4,'0'),
      name : req.body.farmName,
      lineToken : null
    })

    const user = new User({
      username: req.body.username,
      password: bcrypt.hashSync(req.body.password, 8),
      farm : farm,
    });

    await farm.save();

    await user.save();

    const notiParams = [
      { code : 'REPRO_ESTRUST' ,name : 'การเป็นสัด', before: 7 , after: 7 , farm : farm },
      { code : 'REPRO_MATING' ,name : 'การผสม', farm : farm },
      { code : 'REPRO_CHECK' ,name : 'การตรวจท้อง', before: 5 , after: 5 ,farm : farm },
      { code : 'BIRTH' ,name : 'การคลอด', before: 7 , after: 7 ,farm : farm },
      { code : 'VACCINE_FMD' ,name : 'วัคซีนปากเท้าเปื่อย (FMD)',before: 15 , farm : farm },
      { code : 'VACCINE_LS' ,name : 'วัคซีนลัมพีสกิน (LUMPY SKIN)',before: 15 , farm : farm },
      { code : 'VACCINE_CDT' ,name : 'วัคซีนราดหลัง (CYDECTIN)',before: 7, farm : farm },
      { code : 'VACCINE_BIO' ,name : 'ยาบำรุง (BIO)',before: 3, farm : farm },
      { code : 'VACCINE_IVOMEC' ,name : 'ยาฆ่าพยาธิโคท้อง (IVOMEC)', farm : farm },
    ]

    await NotiParam.insertMany(notiParams);

    const vaccines = [
      { code : 'VACCINE_FMD',frequency: 6,name:'ปากเท้าเปื่อย (FMD)',remark:'แจ้งเตือน 15 วัน ก่อนถึงวันที่กำหนด',farm: farm},
      { code : 'VACCINE_LS',frequency: 6,name:'ลัมพีสกิน (LUMPY SKIN)',remark:'แจ้งเตือน 15 วัน ก่อนถึงวันที่กำหนด',farm: farm},
      { code : 'VACCINE_CDT',frequency: 2,name:'ราดหลัง (CYDECTIN)',remark:'แจ้งเตือน 7 วัน ก่อนถึงวันที่กำหนด',farm: farm},
      { code : 'VACCINE_BIO',frequency: 1,name:'ยาบำรุง (BIO)',remark:'แจ้งเตือน 3 วัน ก่อนถึงวันที่กำหนด',farm: farm},
      { code : 'VACCINE_IVOMEC',frequency: 0,name:'ยาฆ่าพยาธิโคท้อง (IVOMEC)',remark:'แจ้งเตือนเมื่ออายุครรภ์ครบ 5,6 และ 7 เดือน',farm: farm},
    ]

    await Vaccine.insertMany(vaccines);

    const param = {
      code : 'RAW_MILK',
      group : 'PRICE',
      name : 'ราคาน้ำนมดิบ/กก.',
      valueNumber : 20.5,
      farm : farm
    }

    const newParam = new Param(param);
    await newParam.save()

    res.status(200).send({message:"Registered Successfully."});

};

exports.signin = (req, res) => {

    User.findOne({
        username: req.body.username
    }).select('+password').exec(async (error,user) => {
        if (!user) {
          return res.status(401).send({ message: "ชื่อผู้ใช้ไม่ถูกต้อง หรือ ไม่มีผู้ใช้ในระบบ กรุณาลองอีกครั้ง" });
        }
  
        let passwordIsValid = bcrypt.compareSync(
          req.body.password,
          user.password
        );
  
        if (!passwordIsValid) {
          return res.status(401).send({
            accessToken: null,
            message: "รหัสผ่านไม่ถูกต้อง กรุณาลองอีกครั้ง"
          });
        }
  
        let accessToken = jwt.sign({ id: user.farm }, config.secret, {
          expiresIn: config.jwtExpiration
        });

        const farm = await Farm.findById(user.farm).exec();

        await RefreshToken.deleteMany({user:user._id}).exec();

        let refreshToken = await RefreshToken.createToken(user,config.jwtRefreshExpiration);

        res
          .status(200)
          .send({
            id: user._id,
            username: user.username,
            farm : farm,
            accessToken: accessToken,
            lineToken : farm.lineToken,
            refreshToken: refreshToken,
          });

    });
};

exports.user = async (req,res) => {
    const user = await User.findOne({farm:req.farmId});
    user.farm = await Farm.findOne({_id:req.farmId});
    return res.status(200).json({user:user})
}

exports.refreshToken = async (req, res) => {
  const { refreshToken: requestToken } = req.body;

  if (requestToken == null) {
    return res.status(403).json({ message: "Refresh Token is required!" });
  }

  let refreshToken = await RefreshToken.findOne({ token: requestToken }).exec();

  if (!refreshToken) {
    res.status(403).json({ message: "Refresh token is not in database!" });
    return;
  }

  if (RefreshToken.verifyExpiration(refreshToken)) {
    RefreshToken.findByIdAndRemove(refreshToken._id, { useFindAndModify: false }).exec();

    res.status(403).json({
      message: "Refresh token was expired. Please make a new signin request",
    });
    return;
  }

  const user = await User.findOne({_id:refreshToken.user}).exec();

  let newAccessToken = jwt.sign({ id: user.farm }, config.secret, {
    expiresIn: config.jwtExpiration,
  });

  return res.status(200).json({
    accessToken: newAccessToken,
    refreshToken: refreshToken.token,
  });
};
