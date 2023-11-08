const mongoose = require("mongoose")

const NotificationParam = mongoose.model(
    'notificationParam',
    new mongoose.Schema({
        before:{ 
            type:Number,
            required:false
        },
        beforeType:{ // D : Day , M : Month
            type:String,
            required:false,
            default : 'D'
        },
        dueDate : { // Alert on due date ?
            type:Boolean,
            required: true,
            default : true
        },
        after:{ 
            type:Number,
            required:false
        },
        afterType:{  // D : Day , M : Month
            type:String,
            required:false,
            default : 'D'
        },
        code:{ // REPRO_ESTRUST, REPRO_MATING , REPRO_CHECK, BIRTH, VACCINE
            type:String,
            required:true
        },
        name:{ 
            type:String,
            required:true
        },
        farm:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "farm",
            required:true,
        },
    }, { timestamps: true })
)

module.exports = NotificationParam
