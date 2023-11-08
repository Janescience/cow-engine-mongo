const mongoose = require("mongoose")

const Salary = mongoose.model(
    'salary',
    new mongoose.Schema({
        remark : {
            type:String,
        },
        amount : { 
            type:Number,
            required:true,
        },
        year : {
            type:Number,
            required:true,
        },
        month : {
            type:Number,
            required:true,
        },
        worker:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "worker"
        },
        farm:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "farm"
        },
    }, { timestamps: true })
)

module.exports = Salary
