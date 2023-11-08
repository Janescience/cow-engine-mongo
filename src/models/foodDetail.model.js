const mongoose = require("mongoose")

const FoodDetail = mongoose.model(
    'foodDetail',
    new mongoose.Schema({
        qty : {
            type:Number,
            required:true
        },
        amount:{
            type:Number,
            required:true
        },
        relate : {
            type : Object
        },
        recipe : {
            type: mongoose.Schema.Types.ObjectId,
            ref: "recipe",
            required:true,
        },
        food:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "food",
            required:true,
        },
    }, { timestamps: true })
)

module.exports = FoodDetail
