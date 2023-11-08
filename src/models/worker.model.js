const mongoose = require("mongoose")

const Worker = mongoose.model(
    'worker',
    new mongoose.Schema({
        name:{
            type:String,
            required:true,
            unique:true
        },
        age : {
            type : Number,
            required:true,
        },
        startDate:{
            type:Date,
            required:true
        },
        endDate:{
            type:Date,
        },
        duty : {
            type:String,
            required:true,
        },
        phoneNumber : {
            type:String,
        },
        status : { // W:Working, L:Lay off, S:Stay
            type:String,
            required:true,
        },
        country : {
            type:String,
            required:true,
        },
        remark : {
            type:String,
        },
        salary:{
            type:Number,
            required:true
        },
        farm:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "farm"
        },
    }, { timestamps: true })
)

module.exports = Worker
