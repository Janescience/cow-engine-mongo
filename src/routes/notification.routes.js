const controller = require("../controllers/notification.controller");
const { logger } = require("../middlewares/log-events");

const { authJwt } = require("../middlewares")
module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get("/notification/retry",[logger],controller.retry);
  app.get("/notification/logs",[authJwt.verifyToken,logger],controller.getLogs);
  app.get("/notification/calendar",[authJwt.verifyToken,logger],controller.getCalendar);
  // app.get("/notification/job",[logger],controller.notify);
};
