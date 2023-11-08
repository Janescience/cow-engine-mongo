
const db = require("../models");
const moment = require('moment');

const NotificationLog = db.notificationLogs;
const Notification = db.notification;
const Birth = db.birth;
const Reproduction = db.reproduction;
const Protection = db.protection;

const saveLog =  async (text,type,status,responseMsg,farm,notiIds) => {
    const newNotiLog = new NotificationLog({
        message : text,
        type : type,
        status : status,
        respMessage : responseMsg,
        farm : farm,
        notification : notiIds
    });
    await newNotiLog.save();
    // console.log('Notification log saved : ',text);
}

const updateStatusBefore =  async (notiIds,status) => {
    await Notification.updateMany({_id:{'$in':notiIds}},{statusBefore : status}).exec();
}

const updateStatusAfter =  async (notiIds,status) => {
    await Notification.updateMany({_id:{'$in':notiIds}},{statusAfter : status}).exec();
}

const filterDueDate = (notiParam,data) => {

    if(notiParam.code === 'REPRO_ESTRUST'){
        return data.estrusDate;
    }else if(notiParam.code === 'REPRO_MATING'){
        return data.matingDate;
    }else if(notiParam.code === 'REPRO_CHECK'){
        return data.checkDate; 
    }else if(notiParam.code === 'BIRTH'){
        return data.birthDate;
    }else{
        return data.date;
    }
}

const filterData = async (notiParam,noti,cowId) => {

    if(notiParam.code === 'REPRO_ESTRUST' || notiParam.code === 'REPRO_MATING' || notiParam.code === 'REPRO_CHECK'){
        if(cowId){
            return await Reproduction.findOne({_id:noti.dataId,cow:cowId}).populate('cow').exec();
        }else{
            return await Reproduction.findById(noti.dataId).populate('cow').exec();
        }
    }else if(notiParam.code === 'BIRTH'){
        if(cowId){
            return await Birth.findOne({_id:noti.dataId,cow:cowId}).populate('cow').exec();
        }else{
            return await Birth.findById(noti.dataId).populate('cow').exec();
        }
    }else{
        if(cowId){
            return await Protection.findOne({_id:noti.dataId,cows:{$in:[cowId]}}).populate('vaccine').exec();
        }else{
            return await Protection.findById(noti.dataId).populate('vaccine').exec();
        }
    }
}

const notification = {
    saveLog,
    updateStatusBefore,
    updateStatusAfter,
    filterDueDate,
    filterData
};

module.exports = notification;
