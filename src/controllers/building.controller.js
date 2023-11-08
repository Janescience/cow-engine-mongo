const db = require("../models");
const Building = db.building;

exports.getAll = async (req, res) => {
    const filter = req.query
    filter.farm = req.farmId
    const buildings = await Building.find(filter).exec();
    res.json({buildings});
};

exports.get = async (req, res) => {
    const id = req.params.id
    const building = await Building.findById(id).exec();;
    res.status(200).send({building});
};

exports.create = async (req, res) => {
    const data = req.body;
    data.farm = req.farmId
    const newBuilding = new Building(data);
    await newBuilding.save((err, building) => {
        if (err) {
            console.error("Building save error : ",err)
            res.status(500).send({ message: err });
            return;
        }
    })

    // console.log("Building created : ",newBuilding);
    res.status(200).send({newBuilding});
};

exports.update = async (req, res) => {
    const id = req.params.id;
    const data = req.body;

    const updatedBuilding = await Building.updateOne({_id:id},data).exec();
    // console.log("Building updated : ",updatedBuilding);

    res.status(200).send({updatedBuilding});
};

exports.delete = async (req, res) => {
    const id = req.params.id;

    const deletedBuilding = await Building.deleteOne({_id:id});
    // console.log("Building deleted : ",deletedBuilding);

    res.status(200).send({deletedBuilding});
};

exports.deletes = async (req, res) => {
    const datas = req.body;
    await Building.deleteMany({_id:{$in:datas}});
    res.status(200).send('Delete selected successfully.');
};
