const db = require("../models");
const Bill = db.bill;

exports.getAll = async (req, res) => {
    const filter = req.query
    filter.farm = req.farmId
    const bills = await Bill.find(filter).exec();
    res.json({bills});
};

exports.get = async (req, res) => {
    const id = req.params.id
    const bill = await Bill.findById(id).exec();
    res.status(200).send({bill});
};

exports.create = async (req, res) => {
    const data = req.body;
    data.farm = req.farmId
    const newBill = new Bill(data);
    await newBill.save((err, bill) => {
        if (err) {
            console.error("Bill save error : ",err)
            res.status(500).send({ message: err });
            return;
        }
    })

    // console.log("Bill created : ",newBill);
    res.status(200).send({newBill});
};

exports.update = async (req, res) => {
    const id = req.params.id;
    const data = req.body;

    const updatedBill = await Bill.updateOne({_id:id},data).exec();
    // console.log("Bill updated : ",updatedBill);

    res.status(200).send({updatedBill});
};

exports.delete = async (req, res) => {
    const id = req.params.id;

    const deletedBill = await Bill.deleteOne({_id:id});
    // console.log("Bill deleted : ",deletedBill);

    res.status(200).send({deletedBill});
};

exports.deletes = async (req, res) => {
    const datas = req.body;
    await Bill.deleteMany({_id:{$in:datas}});
    res.status(200).send('Delete selected successfully.');
};
