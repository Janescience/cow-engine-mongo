const mongoose = require("mongoose")

const Bill = mongoose.model(
    'bill',
    new mongoose.Schema({
        remark:{
            type:String,
        },
        code:{//WATER,ELECTRIC,ACCOM,RENT,INTERNAET,OTH
            type:String,
            required:true
        },
        name:{//ค่าน้ำ,ค่าไฟ,ค่าที่พักคนงาน,ค่าเช่า,ค่าอินเทอร์เน็ต,อื่นๆ
            type:String,
            required:true
        },
        date:{
            type:Date,
            required:true
        },
        amount:{
            type:Number,
            required:true
        },
        farm:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "farm"
        },
    }, { timestamps: true })
)

module.exports = Bill
