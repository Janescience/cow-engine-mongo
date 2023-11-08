const mongoose = require("mongoose")

const Equipment = mongoose.model(
    'equipment',
    new mongoose.Schema({
        code : { // Auto generate Ex. E001,E002
            type:String,
            required:true,
            unique : true
        },
        name:{
            type:String,
            required:true
        },
        startDate:{
            type:Date,
            required:true
        },
        endDate:{
            type:Date,
        },
        status : { // A:Active,I:Inactive
            type:String,
            required:true,
        },
        remark : {
            type:String,
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

module.exports = Equipment
