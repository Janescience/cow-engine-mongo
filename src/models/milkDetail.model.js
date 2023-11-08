const mongoose = require("mongoose")

const MilkDetail = mongoose.model(
    'milkDetail',
    new mongoose.Schema({
        qty:{
            type:Number,
            required:true
        },
        amount:{
            type:Number,
            required:false
        },
        relate : {
            type : Object
        },
        cow:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "cow",
            required:true,
        },
        milk:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "milk",
            required:true,
        },
    }, { timestamps: true })
)

module.exports = MilkDetail
