const mongoose = require("mongoose")

const NotificationLogs = mongoose.model(
    'notificationLogs',
    new mongoose.Schema({
        respMessage:{
            type:String,
        },
        status:{
            type:String,
            required:true
        },
        type:{
            type:String,
            required:true
        },
        message:{
            type:String,
            required:true
        },
        notification : [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "notification",
        }],
        farm:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "farm",
            required:true,
        },
    }, { timestamps: true })
)

module.exports = NotificationLogs
