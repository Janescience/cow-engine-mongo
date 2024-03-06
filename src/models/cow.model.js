const mongoose = require("mongoose")

const Cow = mongoose.model(
    'cow',
    new mongoose.Schema({
        image:{
            type:String,
            required:false
        },
        code:{
            type:String,
            required:true
        },
        name:{
            type:String,
            required:true
        },
        birthDate:{
            type:Date,
            required:true
        },
        adopDate:{//วันที่นำเข้าฟาร์ม
            type:Date,
            required:true
        },
        corral:{
            type:String,
            required:false
        },
        weight:{
            type:Number
        },
        status:{//1:ท้อง,2:นมแห้ง,3:ให้ผลผลืต,4:วัวเด็ก
            type:Number,
            required:true
        },
        quality:{
            type:Number,
            required:true
        },
        flag:{
            type:String,
            required:true,
            default : "Y"
        },
        dad:{
            type:String,
            required:false
        },
        mom:{
            type:String,
            required:false
        },
        remark : {
            type : String
        },
        grade : {
            type : String
        },
        amount : {
            type : Number,
            default : 0
        },
        farm:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "farm",
            required:true,
        },
    }, { timestamps: true } , { strict: false })
)

module.exports = Cow
