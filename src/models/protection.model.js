const mongoose = require("mongoose")

const Protection = mongoose.model(
    'protection',
    new mongoose.Schema({
        seq : {
            type : Number
        },
        date:{
            type:Date,
            required:true
        },
        remark:{
            type: String,
        },
        amount:{
            type: Number,
        },
        qty:{
            type: Number,
        },
        cows:[{
            type: mongoose.Schema.Types.ObjectId,
            ref: "cow",
            required:true,
        }],
        vaccine:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "vaccine",
            required:true,
        },
        farm:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "farm",
            required:true,
        },
    }, { timestamps: true })
)

module.exports = Protection
