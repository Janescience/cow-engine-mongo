const mongoose = require("mongoose")

const Reproduction = mongoose.model(
    'reproduction',
    new mongoose.Schema({
        seq:{
            type:Number,
            required:true
        },
        remark:{
            type:String,
            required:false
        },
        type : {
            type:String,//F:พ่อพันธุ์, A:ผสมเทียม
            required:true
        },
        loginDate:{
            type:Date,
            required:true
        },
        estrusDate:{
            type:Date,
            required:false
        },
        matingDate:{
            type:Date,
            required:false
        },
        checkDate:{
            type:Date,
            required:false
        },
        result:{
            type:Number,
            required:false
        },
        status:{ // 1=อยู่ในกระบวนการสืบพันธุ์ , 2=ตั้งครร 3=คลอดลูกแล้ว 4=สืบพันธุ์ไม่สำเร็จ
            type:Number,
            required:true
        },
        howTo:{
            type:String,
            required:false
        },
        cow:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "cow",
            required:true,
        },
        farm:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "farm",
            required:true,
        },
    }, { timestamps: true })
)

module.exports = Reproduction
