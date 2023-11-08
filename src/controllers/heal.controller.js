const db = require("../models");
const Heal = db.heal;
const Cow = db.cow;

exports.getAll = async (req, res) => {
    const filter = req.query
    filter.farm = req.farmId
    const heals = await Heal.find(filter).populate('cow').sort({'seq':-1}).exec();
    res.json({heals});
};

exports.get = async (req, res) => {
    const id = req.params.id
    const heal = await Heal.findById(id).exec();;
    res.status(200).send({heal});
};

exports.create = async (req, res) => {
    const data = req.body;
    data.farm = req.farmId

    const count = await Heal.find({cow:data.cow,farm:data.farm}).countDocuments();
    data.seq = (count+1)

    const newHeal = new Heal(data);
    await newHeal.save((err, heal) => {
        if (err) {
            console.error("Heal save error : ",err)
            res.status(500).send({ message: err });
            return;
        }
    })

    // console.log("Heal created : ",newHeal);
    res.status(200).send({newHeal});
};

exports.update = async (req, res) => {
    const id = req.params.id;
    const data = req.body;

    const updatedHeal = await Heal.updateOne({_id:id},data).exec();
    // console.log("Heal updated : ",updatedHeal);

    res.status(200).send({updatedHeal});
};

exports.delete = async (req, res) => {
    const id = req.params.id;

    const deletedHeal = await Heal.deleteOne({_id:id});
    // console.log("Heal deleted : ",deletedHeal);

    res.status(200).send({deletedHeal});
};

exports.deletes = async (req, res) => {
    const datas = req.body;
    await Heal.deleteMany({_id:{$in:datas}});
    res.status(200).send('Delete selected successfully.');
};
