const { authJwt } = require("../middlewares");
const { logger } = require("../middlewares/log-events");

const controller = require("../controllers/notificationParam.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get('/notiparam',[authJwt.verifyToken,logger],controller.getAll);
  app.get('/notiparam/:id',[authJwt.verifyToken,logger],controller.get);
  app.post('/notiparam',[authJwt.verifyToken,logger],controller.create);
  app.put("/notiparam/:id",[authJwt.verifyToken,logger],controller.update);
};
