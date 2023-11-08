const db = require("../models");
const Param = db.param;

exports.getAll = async (req, res) => {
    const filter = req.query
    filter.farm = req.farmId
    if(filter.code && filter.code != ''){
        let code = filter.code
        filter.code = {'$regex' :  code , '$options' : 'i'}
    }
    if(filter.name && filter.name != ''){
        let name = filter.name
        filter.name = {'$regex' :  name , '$options' : 'i'}
    }
    if(filter.group && filter.group != ''){
        let group = filter.group
        filter.group = {'$regex' :  group , '$options' : 'i'}
    }
    if(filter.valueNumber && filter.valueNumber != ''){
        let valueNumber = filter.valueNumber
        filter.valueNumber = {'$regex' :  valueNumber , '$options' : 'i'}
    }
    if(filter.valueString && filter.valueString != ''){
        let valueString = filter.valueString
        filter.valueString = {'$regex' :  valueString , '$options' : 'i'}
    }
    const params = await Param.find(filter).sort({'createdAt':-1}).exec();
    res.json({params});
};

exports.get = async (req, res) => {
    const id = req.params.id
    const param = await Param.findById(id).exec();;
    res.status(200).send({param});
};

exports.create = async (req, res) => {
    const data = req.body;
    data.farm = req.farmId
    const newParam = new Param(data);
    await newParam.save()
    // console.log("Param created : ",newParam);
    res.status(200).send({newParam});
};

exports.update = async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    const updatedParam = await Param.updateOne({_id:id},data).exec();
    // console.log("Param updated : ",updatedParam);
    res.status(200).send({updatedParam});
};

exports.delete = async (req, res) => {
    const id = req.params.id;
    const deletedParam = await Param.deleteOne({_id:id});
    // console.log("Param deleted : ",deletedParam)
    res.status(200).send({deletedParam});
};
