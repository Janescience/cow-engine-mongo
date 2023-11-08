const mongoose = require("mongoose")

const Building = mongoose.model(
    'building',
    new mongoose.Schema({
        code:{
            type:String,
            required:true
        },
        name:{
            type:String,
            required:true
        },
        date:{
            type:Date,
            required:true
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
        builder:{
            type:String,
        },
        farm:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "farm"
        },
    }, { timestamps: true })
)

module.exports = Building
