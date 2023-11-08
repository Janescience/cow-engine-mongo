const db = require("../models");
const Maintenance = db.maintenance;
const Equipment = db.equipment;
const Building = db.building;

exports.getAll = async (req, res) => {
    const filter = req.query
    filter.farm = req.farmId
    const maintenances = await Maintenance.find(filter).exec();
    res.json({maintenances});
};

exports.get = async (req, res) => {
    const id = req.params.id
    const maintenance = await Maintenance.findById(id).exec();
    res.status(200).send({maintenance});
};

exports.create = async (req, res) => {
    const data = req.body;
    data.farm = req.farmId

    if(data.category === 'E'){
        const e = await Equipment.findOne({code:data.code}).exec();
        data.name = e.name
    }else{
        const b = await Building.findOne({code:data.code}).exec();
        data.name = b.name
    }

    const newMaintenance = new Maintenance(data);
    await newMaintenance.save((err, maintenance) => {
        if (err) {
            console.error("Maintenance save error : ",err)
            res.status(500).send({ message: err });
            return;
        }
    })

    // console.log("Maintenance created : ",newMaintenance);
    res.status(200).send({newMaintenance});
};

exports.update = async (req, res) => {
    const id = req.params.id;
    const data = req.body;

    if(data.category === 'E'){
        const e = await Equipment.findOne({code:data.code}).exec();
        data.name = e.name
    }else{
        const b = await Building.findOne({code:data.code}).exec();
        data.name = b.name
    }

    const updatedMaintenance = await Maintenance.updateOne({_id:id},data).exec();
    // console.log("Maintenance updated : ",updatedMaintenance);

    res.status(200).send({updatedMaintenance});
};

exports.delete = async (req, res) => {
    const id = req.params.id;

    const deletedMaintenance = await Maintenance.deleteOne({_id:id});
    // console.log("Maintenance deleted : ",deletedMaintenance);

    res.status(200).send({deletedMaintenance});
};

exports.deletes = async (req, res) => {
    const datas = req.body;
    await Maintenance.deleteMany({_id:{$in:datas}});
    res.status(200).send('Delete selected successfully.');
};
