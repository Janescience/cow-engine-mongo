const cowController = require("./cow.controller");
const notiController = require("./notification.controller");


exports.jobNotify = async (req, res) => {
    const filter = req.query
    if(filter.key == 'dairy-farm-job'){
        await notiController.notify();
    }
    res.status(200).send("Job Notify Success")
};

exports.jobCalGrade = async (req, res) => {
    const filter = req.query
    if(filter.key == 'dairy-farm-job'){
        await cowController.calGrade();
    }
    res.status(200).send("Job Cal Grade Success")
};

exports.jobAll = async (req, res) => {
    const filter = req.query
    if(filter.key == 'dairy-farm-job'){
        await notiController.notify();
        await cowController.calGrade();
    }
    res.status(200).send("Job All Success")
};


