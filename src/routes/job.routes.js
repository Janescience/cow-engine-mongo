const controller = require("../controllers/job.controller");
const { logger } = require("../middlewares/log-events");


module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get("/job/notify",[logger],controller.jobNotify);
  app.get("/job/grade",[logger],controller.jobCalGrade);
  app.get("/job/cowStatus",[logger],controller.jobCowStatusProcess);
  app.get("/job",[logger],controller.jobAll);
};


