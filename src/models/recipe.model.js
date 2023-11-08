const mongoose = require("mongoose")

const Recipe = mongoose.model(
    'recipe',
    new mongoose.Schema({
        name:{
            type: String,
            required:true
        },
        amount:{
            type: Number,
            required:true,
        },
        type:{
            type: Number,
            required:true,
        },
        recipeDetails:{
            type: Array
        },
        farm:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "farm",
            required:true,
        },
    }, { timestamps: true })
)

module.exports = Recipe
