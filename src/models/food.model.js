const mongoose = require("mongoose")

const Food = mongoose.model(
    'food',
    new mongoose.Schema({
        corral:{
            type:String,
            required:true
        },
        numCow:{
            type:Number,
            required:true
        },
        month : {
            type:Number,
            required:true
        },
        year : {
            type:Number,
            required:true
        },
        foodDetails : [{type: mongoose.Schema.Types.ObjectId, ref: "foodDetail", }],
        farm:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "farm",
            required:true,
        },
    }, { timestamps: true })
)

module.exports = Food
