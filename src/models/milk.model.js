const mongoose = require("mongoose")

const Milk = mongoose.model(
    'milk',
    new mongoose.Schema({
        time:{
            type:String,
            required:true
        },
        date:{
            type:Date,
            required:true
        },
        farm:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "farm",
            required:true,
        },
        milkDetails: [{ type: mongoose.Schema.Types.ObjectId, ref: 'milkDetail' }]
    }, { timestamps: true })
)

module.exports = Milk
