const db = require("../models");
const moment = require("moment");
const _ = require('lodash');
const Promise = require('bluebird');

const { notiService,lineApi } = require("../services");

const Logs = db.notificationLogs;
const Noti = db.notification;
const Reproduction = db.reproduction;
const Farm = db.farm;
const Birth = db.birth;

exports.getLogs = async (req, res) => {
    const filter = req.query
    filter.farm = req.farmId
    if(filter.message && filter.message != ''){
        let message = filter.message
        filter.message = {'$regex' :  message , '$options' : 'i'}
    }
    const notifications = await Logs.find(filter).sort({createdAt:-1}).exec();
    res.json({notifications});
};


exports.getCalendar = async (req, res) => {
    const filter = req.query;
    filter.farm = req.farmId;

    const notifications = await Noti.find(filter).populate('notificationParam').sort({createdAt:-1}).exec();
    let events = [];

    const promises = notifications.map(async (noti) => {
        const notiParam = noti.notificationParam;
        if(notiParam){
            const data = await notiService.filterData(notiParam,noti,filter.cow);            
        
            if(data){
                
                const eventPromises = [];

                if(notiParam.before && notiParam.before > 0){
                    const eventPromise = filterEvent(noti,notiParam,data,'before');
                    eventPromises.push(eventPromise);
                }

                if(notiParam.after && notiParam.after > 0){
                    const eventPromise = filterEvent(noti,notiParam,data,'after');
                    eventPromises.push(eventPromise);
                }
                
                const eventPromise = filterEvent(noti,notiParam,data,'today');
                eventPromises.push(eventPromise);

                const eventResults = await Promise.all(eventPromises);
                events.push(...eventResults);
            }
        }
    });

    await Promise.all(promises);

    res.json({events});
};

const filterEvent = (noti, notiParam, data, time) => {
    const id = `${noti._id}_${time}`;
    const type = notiParam.code.split('_')[0];

    let title = notiParam.name;
    let description = null;
    let alert = null;
    let period = 'today';

    const filterDate = moment(notiService.filterDueDate(notiParam, data));
    const dueDate = moment(notiService.filterDueDate(notiParam, data));
    const today = moment(new Date()).startOf('day');
    const cow = (type != 'VACCINE' ? ` / โค${data.cow?.name}` : '');
    const desc = (type != 'VACCINE' 
                    ? (time === 'today' ? `วันที่ครบกำหนด` : '') 
                    : `ครั้งที่ ${data.seq} ฉีดทั้งหมด ${data.qty} ตัว รวมเป็นเงิน ${data.amount} บาท | `);

    const updateDueDate = (days) => {
        dueDate.add(days, 'days');
    };

    const generateDescription = (days, period) => {
        return `${desc}แจ้งเตือน${period} ${days} วัน`;
    };

    const isAlert = (status) => {
        return status === 'S';
    };

    const generateTitle = (period) => {
        return `${title} (${period})${cow}`;
    };

    switch (time) {
        case 'before':
            title = generateTitle('ก่อน');
            updateDueDate(-notiParam.before);
            description = generateDescription(notiParam.before, 'ก่อน');
            alert = isAlert(noti.statusBefore);
            period = 'before';
            break;
        case 'after':
            title = generateTitle('หลัง');
            updateDueDate(notiParam.after);
            description = generateDescription(notiParam.after, 'หลัง');
            alert = isAlert(noti.statusAfter);
            period = 'after';
            break;
        case 'today':
            title += cow;
            description = desc;
            alert = today.isSame(dueDate) || today.isAfter(dueDate);
            break;
        default:
            break;
    }

    return {
        id: id,
        title: title,
        date: filterDate,
        time: { start: dueDate.format("YYYY-MM-DD") },
        description: description,
        alert: alert,
        type: type,
        code: notiParam.code,
        name: notiParam.name,
        period: period
    };
};

const checkLineToken = (farm) => {
    if (farm.lineToken != null) {
        return true;
    }
    return false;
};

exports.notify = async () => {
    let farmError,notiError;
    try {
        console.log('=======> Start schedule line notify <=======')
        console.log('-------> ' + new Date() + ' <-------')

        
        // Add 1 day because cloud server time -7 (UTC) and cron job time is 02.00 AM (Thai)
        const today = moment(new Date()).startOf('day').add(1, 'days');

        // Timezone on server is UTC 
        console.log('today : ', today);

        const notis = await Noti.find({ '$or': [{ statusBefore: 'W' },{ statusDueDate: 'W' }, { statusAfter: 'W' }] }).populate('notificationParam').exec();
        const notiGroupFarms = _.groupBy(notis, 'farm');

        let notiLen = notis.length

        console.log('notification size : ', notiLen);

        for (let key of Object.keys(notiGroupFarms)) {
            const notis = notiGroupFarms[key];

            const farm = await Farm.findOne({ _id: key }).exec();
            farmError = farm

            let textAlert = '\nแจ้งเตือนวันนี้ (' + today.format('dddd DD MMMM yyyy') + ')\n';
            let textAlertBefore = '\nแจ้งเตือนก่อนครบกำหนด (' + today.format('dddd DD MMMM yyyy') + ')\n';
            let textAlertAfter = '\nแจ้งเตือนหลังครบกำหนด (' + today.format('dddd DD MMMM yyyy') + ')\n';

            let notiIdToday = [];
            let notiIdBefores = [];
            let notiIdAfters = [];

            console.log('\n---------------------------------------------------------');
            console.log('=======> Farm : ' + farm.name + ' <=======');

            if (!checkLineToken(farm)) {
                await notiService.saveLog('Farm value of lineToken is empty', 'B', 'F', null, farm._id, [noti._id]);
                continue;
            }

            for (const noti of notis) {
                notiError = noti
                const notiParam = noti.notificationParam;

                if(notiParam){

                    const data = await notiService.filterData(notiParam, noti);

                    if (data != null) {

                        const alertToday = notiParam.dueDate;
                        const numBefore = notiParam.before;
                        const numAfter = notiParam.after;

                        if (alertToday) {
                            const dueDate = moment(notiService.filterDueDate(notiParam, data));

                            if (today.isSame(dueDate.startOf('day'))) {
                                notiIdToday.push(noti._id);
                                textAlert += '\nเรื่อง : ' + notiParam.name + (!data?.cow?.name ? ' ครั้งที่ ' + data.seq : '');
                                if(data?.cow?.name)
                                    textAlert += '\nโค : ' + data.cow.name;
                                textAlert += '\nครบกำหนด : วันนี้ !!';
                                textAlert += '\n*******************************';
                            }
                        }

                        if (noti.statusBefore === 'W' && numBefore) {

                            const dueDate = moment(notiService.filterDueDate(notiParam, data));
                            const dueDateBefore = moment(notiService.filterDueDate(notiParam, data)).startOf('day').subtract(numBefore, 'days')

                            if (dueDateBefore.isSame(today)) {
                                notiIdBefores.push(noti._id);
                                textAlertBefore += '\nเรื่อง : ' + notiParam.name + (!data?.cow?.name ? ' ครั้งที่ ' + data.seq : '');
                                if(data?.cow?.name)
                                    textAlertBefore += '\nโค : ' + data.cow.name;
                                textAlertBefore += '\nครบกำหนด : ' + moment(dueDate).format('dddd DD MMMM yyyy');
                                textAlertBefore += '\nระยะเวลา : อีก ' + numBefore + ' วัน ';
                                textAlertBefore += '\n*******************************';
                            }
                        }

                        if (noti.statusAfter === 'W' && numAfter) {

                            const dueDate = moment(notiService.filterDueDate(notiParam, data));
                            const dueDateAfter = moment(notiService.filterDueDate(notiParam, data)).startOf('day').add(numAfter, 'days')

                            if (dueDateAfter.isSame(today)) {
                                notiIdAfters.push(noti._id);
                                textAlertAfter += '\nเรื่อง : ' + notiParam.name + (!data?.cow?.name ? ' ครั้งที่ ' + data.seq : '');
                                if(data?.cow?.name)
                                    textAlertAfter += '\nโค : ' + data.cow.name;
                                textAlertAfter += '\nครบกำหนด : ' + moment(dueDate).format('dddd DD MMMM yyyy');
                                textAlertAfter += '\nระยะเวลา : ผ่านมาแล้ว ' + numBefore + ' วัน ';
                                textAlertAfter += '\n*******************************';
                            }
                        }
                    }
                }

                
            }

            if (notiIdToday.length > 0) {
                notiLen -= notiIdToday.length
                await lineApi.notify(textAlert, 'B', farm._id, farm.lineToken, notiIdToday, 'Today');
            }

            if (notiIdBefores.length > 0) {
                notiLen -= notiIdBefores.length
                await lineApi.notify(textAlertBefore, 'B', farm._id, farm.lineToken, notiIdBefores, 'Before');
            }

            if (notiIdAfters.length > 0) {
                notiLen -= notiIdAfters.length
                await lineApi.notify(textAlertAfter, 'B', farm._id, farm.lineToken, notiIdAfters, 'After');
            }

            if (notiIdToday.length == 0 && notiIdBefores.length == 0 && notiIdAfters.length == 0) {
                let retryNum = notiLen > 0 ? '(รายการที่ต้องซ่อม '+notiLen + ' รายการ)' : ''
                await lineApi.notify('วันนี้ไม่มีรายการแจ้งเตือน'+retryNum, 'B', farm._id, farm.lineToken, [], 'Empty');
            }
        }
        
        console.log('-------x ' + new Date() + ' x-------')
        console.log('=======x End schedule line notify x=======')
    } catch (error) {
        console.error('Job Line Noti Error : ',error)
        await lineApi.notify("มีรายการแจ้งเตือนไม่สำเร็จ กรุณาตรวจสอบ", 'B', farmError._id, farmError.lineToken, [], 'Empty');
        await notiService.saveLog('Job Line Noti Error', 'B', 'F', error+"", farmError._id, [notiError._id]);
        return;
    }
};


exports.retry = async () => {
    let farmError,notiError;
    try {
        console.log('=======> Start retry line notify <=======')
        console.log('-------> ' + new Date() + ' <-------')

        
        // Add 1 day because cloud server time -7 (UTC) and cron job time is 02.00 AM (Thai)
        const today = moment(new Date()).startOf('day').add(1, 'days');

        // Timezone on server is UTC 
        console.log('Date runing : ', today);

        const notis = await Noti.find({ '$or': [{ statusBefore: 'W' },{ statusDueDate: 'W' }, { statusAfter: 'W' }] }).populate('notificationParam').exec();
        const notiGroupFarms = _.groupBy(notis, 'farm');

        console.log('notification size : ', notis.length);

        for (let key of Object.keys(notiGroupFarms)) {
            const notis = notiGroupFarms[key];

            const farm = await Farm.findOne({ _id: key }).exec();
            farmError = farm

            let textAlert = '\nซ่อมรายการแจ้งเตือน เนื่องจากระบบขัดข้อง\n';
            let textAlertBefore = '\nซ่อมรายการแจ้งเตือนก่อนครบกำหนด\n';
            let textAlertAfter = '\nซ่อมรายการแจ้งเตือนหลังครบกำหนด\n';

            let notiIdToday = [];
            let notiIdBefores = [];
            let notiIdAfters = [];

            console.log('\n---------------------------------------------------------');
            console.log('=======> Farm : ' + farm.name + ' <=======');

            if (!checkLineToken(farm)) {
                await notiService.saveLog('Farm value of lineToken is empty', 'B', 'F', null, farm._id, [noti._id]);
                continue;
            }

            for (const noti of notis) {
                notiError = noti
                const notiParam = noti.notificationParam;

                if(notiParam){

                    const data = await notiService.filterData(notiParam, noti);

                    if (data != null) {

                        const alertToday = notiParam.dueDate;
                        const numBefore = notiParam.before;
                        const numAfter = notiParam.after;

                        if (alertToday) {
                            const dueDate = moment(notiService.filterDueDate(notiParam, data));

                            if (today.isAfter(dueDate.startOf('day'))) {
                                notiIdToday.push(noti._id);
                                textAlert += '\nเรื่อง : ' + notiParam.name + (!data?.cow?.name ? ' ครั้งที่ ' + data.seq : '');
                                if(data?.cow?.name)
                                    textAlert += '\nโค : ' + data.cow.name;
                                textAlert += '\nครบกำหนด : ' + moment(dueDate).format('dddd DD MMMM yyyy');
                                textAlert += '\n*******************************\n';
                            }
                        }

                        if (noti.statusBefore === 'W' && numBefore) {

                            const dueDate = moment(notiService.filterDueDate(notiParam, data));
                            const dueDateBefore = moment(notiService.filterDueDate(notiParam, data)).startOf('day').subtract(numBefore, 'days')

                            if (dueDateBefore.isBefore(today)) {
                                notiIdBefores.push(noti._id);
                                textAlertBefore += '\nเรื่อง : ' + notiParam.name + ' (ก่อนครบกำหนด) ' + (!data?.cow?.name ? ' ครั้งที่ ' + data.seq : '');
                                if(data?.cow?.name)
                                    textAlertBefore += '\nโค : ' + data.cow.name;
                                textAlertBefore += '\nครบกำหนด : ' + moment(dueDate).format('dddd DD MMMM yyyy');
                                textAlertBefore += '\nระยะเวลา : อีก ' + numBefore + ' วัน ';
                                textAlertBefore += '\n*******************************\n';
                            }
                        }

                        if (noti.statusAfter === 'W' && numAfter) {

                            const dueDate = moment(notiService.filterDueDate(notiParam, data));
                            const dueDateAfter = moment(notiService.filterDueDate(notiParam, data)).startOf('day').add(numAfter, 'days')

                            if (dueDateAfter.isBefore(today)) {
                                notiIdAfters.push(noti._id);
                                textAlertAfter += '\nเรื่อง : ' + notiParam.name + ' (หลังครบกำหนด) ' + (!data?.cow?.name ? ' ครั้งที่ ' + data.seq : '');
                                if(data?.cow?.name)
                                    textAlertAfter += '\nโค : ' + data.cow.name;
                                textAlertAfter += '\nครบกำหนด : ' + moment(dueDate).format('dddd DD MMMM yyyy');
                                textAlertAfter += '\nระยะเวลา : ผ่านมาแล้ว ' + numBefore + ' วัน ';
                                textAlertAfter += '\n*******************************\n';
                            }
                        }
                    }
                }

                
            }

            if (notiIdToday.length > 0) {
                await lineApi.notify(textAlert, 'B', farm._id, farm.lineToken, notiIdToday, 'Today');
                console.log('Notify today success')
            }

            if (notiIdBefores.length > 0) {
                await lineApi.notify(textAlertBefore, 'B', farm._id, farm.lineToken, notiIdBefores, 'Before');
                console.log('Notify before success')
            }

            if (notiIdAfters.length > 0) {
                await lineApi.notify(textAlertAfter, 'B', farm._id, farm.lineToken, notiIdAfters, 'After');
                console.log('Notify after success')
            }
        
            if (notiIdToday.length == 0 && notiIdBefores.length == 0 && notiIdAfters.length == 0) {
                await lineApi.notify('[Retry] ไม่มีรายการแจ้งเตือน', 'B', farm._id, farm.lineToken, [], 'Empty');
                console.log('all noti empty')
            }
        }
        
        console.log('-------x ' + new Date() + ' x-------')
        console.log('=======x End retry line notify x=======')
    } catch (error) {
        console.error('Retry Line Noti Error : ',error)
        await lineApi.notify("[Retry] ซ่อมรายการแจ้งเตือนไม่สำเร็จ กรุณาตรวจสอบ", 'B', farmError._id, farmError.lineToken, [], 'Empty');
        await notiService.saveLog('Retry Line Noti Error', 'B', 'F', error+"", farmError._id, [notiError._id]);
        return;
    }
};
