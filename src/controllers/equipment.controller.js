const db = require("../models");
const Equipment = db.equipment;

exports.getAll = async (req, res) => {
    const filter = req.query
    filter.farm = req.farmId
    const equipments = await Equipment.find(filter).exec();
    res.json({equipments});
};

exports.get = async (req, res) => {
    const id = req.params.id
    const equipment = await Equipment.findById(id).exec();;
    res.status(200).send({equipment});
};

exports.create = async (req, res) => {
    const data = req.body;
    data.farm = req.farmId
    const newEquipment = new Equipment(data);
    await newEquipment.save((err, equipment) => {
        if (err) {
            console.error("Equipment save error : ",err)
            res.status(500).send({ message: err });
            return;
        }
    })

    // console.log("Equipment created : ",newEquipment);
    res.status(200).send({newEquipment});
};

exports.update = async (req, res) => {
    const id = req.params.id;
    const data = req.body;

    const updatedEquipment = await Equipment.updateOne({_id:id},data).exec();
    // console.log("Equipment updated : ",updatedEquipment);

    res.status(200).send({updatedEquipment});
};

exports.delete = async (req, res) => {
    const id = req.params.id;

    const deletedEquipment = await Equipment.deleteOne({_id:id});
    // console.log("Equipment deleted : ",deletedEquipment);

    res.status(200).send({deletedEquipment});
};

exports.deletes = async (req, res) => {
    const datas = req.body;
    await Equipment.deleteMany({_id:{$in:datas}});
    res.status(200).send('Delete selected successfully.');
};
