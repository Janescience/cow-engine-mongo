const cowController = require("./cow.controller");
const notiController = require("./notification.controller");


exports.jobSchedule = async (req, res) => {
    const filter = req.query
    if(filter.key == 'dairy-farm-job'){
        await cowController.calGrade();
        await notiController.notify();
    }
    res.status(200).send("Job Schedule Success")
};


