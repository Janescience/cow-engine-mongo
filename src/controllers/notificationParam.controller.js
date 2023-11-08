const db = require("../models");
const NotiParam = db.notificationParam;

exports.getAll = async (req, res) => {
    const filter = req.query
    filter.farm = req.farmId
    const notiParams = await NotiParam.find(filter).sort({'seq':-1}).exec();
    res.json({notiParams});
};

exports.get = async (req, res) => {
    const id = req.params.id
    const notiParam = await NotiParam.findById(id).exec();;
    res.status(200).send({notiParam});
};

exports.create = async (req, res) => {
    const data = req.body;
    const farm = req.farmId

    const notiParams = [
        { code : 'REPRO_ESTRUST' ,name : 'การเป็นสัด', farm : farm },
        { code : 'REPRO_MATING' ,name : 'การผสม', farm : farm },
        { code : 'REPRO_CHECK' ,name : 'การตรวจท้อง', farm : farm },
        { code : 'BIRTH' ,name : 'การคลอด', farm : farm },
        { code : 'VACCINE_FMD' ,name : 'วัคซีนปากเท้าเปื่อย (FMD)', farm : farm },
        { code : 'VACCINE_LS' ,name : 'วัคซีนลัมพีสกิน (LUMPY SKIN)', farm : farm },
        { code : 'VACCINE_CDT' ,name : 'วัคซีนราดหลัง (CYDECTIN)', farm : farm },
        { code : 'VACCINE_BIO' ,name : 'ยาบำรุง (BIO)', farm : farm },
        { code : 'VACCINE_IVOMEC' ,name : 'ยาถ่ายพยาธิ (IVOMEC)', farm : farm },
    ]
  
    await NotiParam.insertMany(notiParams);
    // console.log("Param created : ",newParam);
    res.status(200).send("Create Successfully.");
};

exports.update = async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    const updatedNotiParam = await NotiParam.updateOne({_id:id},data).exec();
    // console.log("NotiParam updated : ",updatedNotiParam);
    res.status(200).send({updatedNotiParam});
};
