const mongoose = require("mongoose")

const Vaccine = mongoose.model(
    'vaccine',
    new mongoose.Schema({
        frequency:{
            type:Number,
            required:true
        },
        code:{
            type: String,
            required:true,
        },
        name:{
            type: String,
            required:true,
        },
        remark:{
            type: String,
            required:false,
        },
        price:{//ราคา
            type: Number,
            default: 0
        },
        use:{//ใชได้กี่ตัว
            type: Number,
            default: 0
        },
        amount:{//คิดเป็นเงิน/ตัว
            type: Number,
            default: 0        
        },
        quantity:{//ปริมาณ (ลิตร)
            type: Number,
            default: 0        
        },
        nextDate:{
            type: Date,
        },
        currentDate:{
            type: Date,
        },
        startDate:{
            type: Date,
        },
        protections:[{
            type: mongoose.Schema.Types.ObjectId,
            ref: "protection",
        }],
        farm:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "farm",
            required:true,
        },
    }, { timestamps: true })
)

module.exports = Vaccine
