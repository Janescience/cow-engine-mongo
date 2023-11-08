const db = require("../models");
const Worker = db.worker;

exports.getAll = async (req, res) => {
    const filter = req.query
    filter.farm = req.farmId
    const workers = await Worker.find(filter).exec();
    res.json({workers});
};

exports.get = async (req, res) => {
    const id = req.params.id
    const worker = await Worker.findById(id).exec();;
    res.status(200).send({worker});
};

exports.create = async (req, res) => {
    const data = req.body;
    data.farm = req.farmId
    const newWorker = new Worker(data);
    await newWorker.save((err, worker) => {
        if (err) {
            console.error("Worker save error : ",err)
            res.status(500).send({ message: err });
            return;
        }
    })

    // console.log("Worker created : ",newWorker);
    res.status(200).send({newWorker});
};

exports.update = async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    const updatedWorker = await Worker.updateOne({_id:id},data).exec();
    res.status(200).send({updatedWorker});
};

exports.delete = async (req, res) => {
    const id = req.params.id;

    const deletedWorker = await Worker.deleteOne({_id:id});
    // console.log("Worker deleted : ",deletedWorker);

    res.status(200).send({deletedWorker});
};

exports.deletes = async (req, res) => {
    const datas = req.body;
    await Worker.deleteMany({_id:{$in:datas}});
    res.status(200).send('Delete selected successfully.');
};
