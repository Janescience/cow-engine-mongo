const mongoose = require("mongoose")

const Param = mongoose.model(
    'param',
    new mongoose.Schema({
        group : {
            type:String,
            required:true
        },
        code:{
            type:String,
            required:true
        },
        name:{
            type:String,
            required:true
        },
        valueNumber:{
            type:Number,
            required:false
        },
        valueString:{
            type:String,
            required:false
        },
        farm:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "farm",
            required:true,
        },
    }, { timestamps: true })
)

module.exports = Param
