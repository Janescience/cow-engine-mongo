const db = require("../models");
const Salary = db.salary;

exports.getAll = async (req, res) => {
    const filter = req.query
    filter.farm = req.farmId
    const salarys = await Salary.find(filter).exec();
    res.json({salarys});
};

exports.get = async (req, res) => {
    const id = req.params.id
    const salary = await Salary.findById(id).exec();;
    res.status(200).send({salary});
};

exports.create = async (req, res) => {
    const data = req.body;
    data.farm = req.farmId
    const newSalary = new Salary(data);
    await newSalary.save((err, salary) => {
        if (err) {
            console.error("Salary save error : ",err)
            res.status(500).send({ message: err });
            return;
        }
    })

    // console.log("Salary created : ",newSalary);
    res.status(200).send({newSalary});
};

exports.update = async (req, res) => {
    const id = req.params.id;
    const data = req.body;

    const updatedSalary = await Salary.updateOne({_id:id},data).exec();
    // console.log("Salary updated : ",updatedSalary);

    res.status(200).send({updatedSalary});
};

exports.delete = async (req, res) => {
    const id = req.params.id;

    const deletedSalary = await Salary.deleteOne({_id:id});
    // console.log("Salary deleted : ",deletedSalary);

    res.status(200).send({deletedSalary});
};

exports.deletes = async (req, res) => {
    const datas = req.body;
    await Salary.deleteMany({_id:{$in:datas}});
    res.status(200).send('Delete selected successfully.');
};
