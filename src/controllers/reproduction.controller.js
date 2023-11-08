const db = require("../models");
const moment = require("moment");
const Reproduct = db.reproduction;
const Birth = db.birth;
const Cow = db.cow;
const Notification = db.notification
const NotificationParam = db.notificationParam

exports.getAll = async (req, res) => {
    const filter = req.query
    filter.farm = req.farmId
    const reproducts = await Reproduct.find(filter).populate('cow').sort({"status":1,"checkDate":1,'seq':-1}).exec();
    res.status(200).send({reproducts});
};

exports.get = async (req, res) => {
    const id = req.params.id
    const reproduct = await Reproduct.findById(id).exec();
    res.status(200).send({reproduct});
};

exports.create = async (req, res) => {
    const data = req.body;
    data.farm = req.farmId

    const count = await Reproduct.find({cow:data.cow,farm:data.farm}).countDocuments();
    data.seq = (count+1)

    if(data.result == "1"){//ผิดปกติ
        data.estrusDate = null
        data.matingDate = null
        data.checkDate = null
    }
    
    const newReproduct = new Reproduct(data);
    newReproduct.save(async (err, repro) => {

        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        const notiParams = await NotificationParam.find({code:{'$in' : ['REPRO_ESTRUST','REPRO_MATING','REPRO_CHECK']}}).exec();
        for(let notiParam of notiParams){
            const noti = new Notification(
                {
                    farm:req.farmId,
                    notificationParam:notiParam._id,
                    statusBefore : 'W',
                    statusAfter : 'W',
                    dataId : repro._id 
                }
            );
            await noti.save();
        }
        
    })


    res.status(200).send({newReproduct});
};

exports.update = async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    data.farm = req.farmId
    
    if(data.status == "2"){//ตั้งครร

        const add9Months = moment(data.matingDate).add(9,'months');
        const add15Days = moment(add9Months).add(15,'days');

        const count = await Birth.find({cow:data.cow,farm:data.farm}).countDocuments();
        const newBirth = new Birth({
            seq:(count+1),
            pregnantDate:data.matingDate,
            birthDate:add15Days,
            status : 'P',
            cow:data.cow,
            farm:data.farm,
            reproduction:id
        });
        await newBirth.save();

        // Update status cow to pregnant
        await Cow.updateOne({_id:data.cow},{status:1}).exec();

        const notiParam = await NotificationParam.findOne({code:'BIRTH'}).exec();
        const noti = new Notification(
            {
                farm:req.farmId,
                notificationParam:notiParam._id,
                statusBefore : 'W',
                statusAfter : 'W',
                dataId : newBirth._id 
            }
        );
        await noti.save();
        
    }

    if(data.result == "1"){//ผิดปกติ
        data.estrusDate = null
        data.matingDate = null
        data.checkDate = null
    }

    const updatedReproduct = await Reproduct.updateOne({_id:id},data).exec();

    res.status(200).send({updatedReproduct});
};

exports.delete = async (req, res) => {
    const id = req.params.id;
    const deletedReproduct = await Reproduct.deleteOne({_id:id});
    await Notification.deleteMany({dataId : id}).exec();
    res.status(200).send({deletedReproduct});
};

exports.deletes = async (req, res) => {
    const datas = req.body;
    await Reproduct.deleteMany({_id:{$in:datas}});
    res.status(200).send('Delete selected successfully.');
};
