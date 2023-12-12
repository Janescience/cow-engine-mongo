const config = require('./src/config/job.config');

const { JOB_LINE_NOTI,JOB_CAL_GRADE } = config;
const cron = require('node-cron');

const notiController = require("./src/controllers/notification.controller");

cron.schedule(JOB_LINE_NOTI, () => {
  console.log('=x=x=x=x=x=x= JOB_LINE_NOTI =x=x=x=x=x=x=');
  notiController.notify();
});

const cowController = require("./src/controllers/cow.controller");

cron.schedule(JOB_CAL_GRADE, () => {
  console.log('=x=x=x=x=x=x= JOB_CAL_GRADE =x=x=x=x=x=x=');
  cowController.calGrade();
});
