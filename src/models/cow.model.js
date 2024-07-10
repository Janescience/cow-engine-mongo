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
        status:{
            // 1:โคท้อง (9.15 เดือน)
            // 2:โคปลดระวาง (7-10 ปี)
            // 3:โครีดนม (ให้นม 10-12 เดือนหลังคลอด)
            // 4:โคเด็ก(อายุ 0-6 เดือน)
            // 5:โคดราย(พักให้นม 2-3 เดือนก่อนคลอด)
            // 6:โคสาว(อายุ 6 เดือน - 2 ปี วัยผสม)
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
        sex:{
            type:String,
            required:true
        },
        farm:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "farm",
            required:true,
        },
    }, { timestamps: true } , { strict: false })
)

module.exports = Cow
