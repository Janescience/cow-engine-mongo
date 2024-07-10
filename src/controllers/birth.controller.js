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

    try{
        const reproduct = await Reproduct.findById(data.reproduction).exec();
        const newCow = new Cow({
            code : data.calf.code,
            name : data.calf.name,
            corral : data.calf.corral,
            birthDate : data.birthDate,
            adopDate : data.birthDate,
            status : 4,
            quality : 4,
            mom : data.cow.code,
            dad : reproduct.type +"-"+ data.dad,
            farm : data.farm,
            sex : data.sex
        });

        newCow.save((err, cow) => {
            if (cow) {
                Birth.updateOne({ _id: id }, { calf: cow._id }).exec();
            }
            if (err) {
                console.error("New cow in birth create error : ", err);
                res.status(500).send({ message: err });
            }
        })
        

        const updatedBirth = await Birth.updateOne({_id:id},{
            status:data.status,
            birthDate:data.birthDate,
            sex:data.sex,
            overgrown:data.overgrown,
            washDate:data.washDate,
            drugDate:data.drugDate
        }).exec();
        
        await Reproduct.updateOne({_id:data.reproduction},{status:3}); // ปรับสถานะ คลอดลูกแล้ว
        await Cow.updateOne({_id:data.cow},{status:3}); // ปรับสถานะ โคตัวแม่กลับเป็นโครีดนม

        res.status(200).send({updatedBirth});
    }catch(err){
        console.error('Error : ',err)
        res.status(500).send({err});
    }
    
};

// exports.update = async (req, res) => {
//     const id = req.params.id;
//     const data = req.body;

//     if(data.sex === 'M'){ // ถ้าแก้ไขเป็นเพศผู้ จะต้องลบวัวทึ่เคยสร้างตอนเลือกเป็นเพศเมีย
//         const birth = await Birth.findById(id).exec();
//         if(birth.calf){
//             await Cow.deleteOne({_id:birth.calf});
//         }
//         data.birthDate = null
//         data.sex = null
//         data.overgrown = null
//     }

//     const updatedBirth = await Birth.updateOne({_id:id},data).exec();

//     res.status(200).send({updatedBirth});
// };

exports.delete = async (req, res) => {
    const id = req.params.id;
    const birth = await Birth.findOne({_id:id});

    await Reproduct.updateOne({_id:birth.reproduction},{"status":"1"}).exec();
    // console.log("Reproduction status = 1 updated.")

    const deletedBirth = await Birth.deleteOne({_id:id});
    // console.log("Birth deleted")

    res.status(200).send({deletedBirth});
};
