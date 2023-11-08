const mongoose = require("mongoose")

const Farm = mongoose.model(
    'farm',
    new mongoose.Schema({
        code:{
            type:String,
            required:true,
            unique:true,
        },
        name:{
            type:String,
            required:true
        },
        lineToken:{
            type:String,
            required:false
        }
    }, { timestamps: true })
)

module.exports = Farm
