const mongoose = require("mongoose")

const Maintenance = mongoose.model(
    'maintenance',
    new mongoose.Schema({
        code:{
            type:String,
            required:true
        },
        name:{
            type:String,
            required:true
        },
        category:{//E:Equipment,B:Building
            type:String,
            required:true
        },
        date:{
            type:Date,
            required:true
        },
        reason : {
            type:String,
        },
        amount:{
            type:Number,
            required:true
        },
        maintenancer:{
            type:String,
        },
        farm:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "farm"
        },
    }, { timestamps: true })
)

module.exports = Maintenance
