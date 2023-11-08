const mongoose = require("mongoose")

const HistoryChange = mongoose.model(
    'historyChange',
    new mongoose.Schema({
        code:{//RECIPE,SALARY
            type:String,
            required:true
        },
        key:{
            type:String,
            required:true
        },
        startDate:{
            type:Date,
            required:true
        },
        endDate:{
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

module.exports = HistoryChange
