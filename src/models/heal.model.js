const mongoose = require("mongoose")

const Heal = mongoose.model(
    'heal',
    new mongoose.Schema({
        healer:{
            type:String,
            required:false
        },
        method:{
            type:String,
            required:false
        },
        disease:{
            type:String,
            required:true
        },
        date:{
            type:Date,
            required:true
        },
        seq:{
            type:Number,
            required:true
        },
        amount :{
            type:Number
        },
        relate : {
            type : Object
        },
        cow:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "cow",
            required:true,
        },
        farm:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "farm",
            required:true,
        },
    }, { timestamps: true })
)

module.exports = Heal
