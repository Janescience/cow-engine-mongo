const mongoose = require("mongoose")

const Birth = mongoose.model(
    'birth',
    new mongoose.Schema({
        seq:{
            type:Number,
            required:true
        },
        pregnantDate:{
            type:Date,
            required:true
        },
        sex:{
            type:String,
            required:false
        },
        status:{//B:Born, P:Pregnant, A:Abort
            type:String,
            required:true
        },
        birthDate:{
            type:Date,
            required:false
        },
        overgrown:{
            type:String,
            required:false
        },
        drugDate:{
            type:Date,
            required:false
        },
        washDate:{
            type:Date,
            required:false
        },
        gestAge:{
            type:String,
        },
        reproduction : {
            type: mongoose.Schema.Types.ObjectId,
            ref: "reproduction",
            required:true,
        },
        cow:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "cow",
            required:true,
        },
        calf:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "cow",
            required:false,
        },
        reason : {
            type:String,
        },
        farm:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "farm",
            required:true,
        },
    }, { timestamps: true })
)

module.exports = Birth
