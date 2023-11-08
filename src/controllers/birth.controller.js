const db = require("../models");
const Birth = db.birth;
const Cow = db.cow;
const Reproduct = db.reproduction;

exports.getAll = async (req, res) => {
    const filter = req.query
    filter.farm = req.farmId
    const births = await Birth.find(filter)
    .populate('cow')
    .populate('reproduction')
    .populate('calf')
    .sort({createdAt:-1}).exec();

    res.status(200).send({births});
};

exports.get = async (req, res) => {
    const id = req.params.id
    const birth = await Birth.findById(id).exec();
    res.status(200).send({birth});
};

exports.create = async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    data.farm = req.farmId;

    const updatedBirth = await Birth.updateOne({_id:id},data).exec();

    if(data.sex === 'F'){ // เพศเมียจะสร้างวัวให้เลย

        const newCow = new Cow({
            code : 'C' + (parseInt(data.newCow.mom?.substring(1,4)) + 1),
            name : data.newCow.name,
            birthDate : new Date().setHours(0,0,0,0),
            status : 4,
            quality : 3,
            mom : data.newCow.mom,
            farm : data.farm
        });

        await newCow.save((err, cow) => {
            if(cow){
                Birth.updateOne({_id:id},{calf:cow._id}).exec();
                // console.log("Birth calf id updated.");
            }
            if (err) {
                console.error("New cow in birth create error : ",err)
                res.status(500).send({ message: err });
                return;
            }
            // console.log("Cow sex female created : ",cow)
        })
    }

    await Reproduct.updateOne({_id:data.reproduction},{status:3}); // ปรับสถานะ คลอดลูกแล้ว
    // console.log("Reproduction status = 3 updated.");

    res.status(200).send({updatedBirth});
};

exports.update = async (req, res) => {
    const id = req.params.id;
    const data = req.body;

    if(data.sex === 'M'){ // ถ้าแก้ไขเป็นเพศผู้ จะต้องลบวัวทึ่เคยสร้างตอนเลือกเป็นเพศเมีย
        const birth = await Birth.findById(id).exec();
        if(birth.calf){
            await Cow.deleteOne({_id:birth.calf});
            // console.log("Cow deleted becuase update sex = male.");
        }
        data.birthDate = null
        data.sex = null
        data.overgrown = null
    }

    const updatedBirth = await Birth.updateOne({_id:id},data).exec();
    // console.log("Birth updated");

    res.status(200).send({updatedBirth});
};

exports.delete = async (req, res) => {
    const id = req.params.id;
    const birth = await Birth.findOne({_id:id});

    await Reproduct.updateOne({_id:birth.reproduction},{"status":"1"}).exec();
    // console.log("Reproduction status = 1 updated.")

    const deletedBirth = await Birth.deleteOne({_id:id});
    // console.log("Birth deleted")

    res.status(200).send({deletedBirth});
};
