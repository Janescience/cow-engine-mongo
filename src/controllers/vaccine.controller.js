const db = require("../models");
const Cow = db.cow;
const Vaccine = db.vaccine;
const NotiParam = db.notificationParam;
const Protection = db.protection;

exports.getAll = async (req, res) => {
    const filter = req.query
    filter.farm = req.farmId
    const vaccines = await Vaccine.find(filter).populate('protections').exec();
    res.json({vaccines});
};

exports.get = async (req, res) => {
    const id = req.params.id
    const vaccine = await Vaccine.findById(id).exec();
    res.status(200).send({vaccine});
};

exports.create = async (req, res) => {
    const data = req.body;
    data.farm = req.farmId
    
    data.code = 'VACCINE_'+data.code;

    const newVaccine = new Vaccine(data);
    await newVaccine.save()

    const newNotiParam = new NotiParam({
        code:data.code,
        name:data.name,
        beforeType : 'D',
        before : 7,
        farm:data.farm});
    await newNotiParam.save()

    res.status(200).send({newVaccine});
};

exports.update = async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    const updatedVaccine = await Vaccine.updateOne({_id:id},data).exec();
    res.status(200).send({updatedVaccine});
};

exports.delete = async (req, res) => {
    const id = req.params.id;
    const deletedProtection = await Protection.deleteOne({_id:id});
    res.status(200).send({deletedProtection});
};
