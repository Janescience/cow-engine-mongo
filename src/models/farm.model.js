const mongoose = require("mongoose")

const Farm = mongoose.model(
    'farm',
    new mongoose.Schema({
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
