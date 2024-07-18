const { verifyCreate,authJwt } = require("../middlewares");
const { logger } = require("../middlewares/log-events");

const controller = require("../controllers/cow.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get('/cow',[authJwt.verifyToken],controller.getAll);
  app.get('/cow/ddl',[authJwt.verifyToken],controller.getAllDDL);
  app.get('/cow/:id',[authJwt.verifyToken],controller.get);
  app.get('/cow/detail/:id',[authJwt.verifyToken],controller.getDetails);
  app.post("/cow",[authJwt.verifyToken,verifyCreate.cowCheckDup,logger],controller.create);
  app.post("/cow/:id",[authJwt.verifyToken,logger],controller.update);
  app.post("/cow/upload/:id",[authJwt.verifyToken,logger],controller.upload);
  app.delete("/cow/:id",[authJwt.verifyToken],controller.delete);
  app.get("/cow/grade",[logger],controller.calGrade);
  app.get("/cow/status",[logger],controller.updateStatus);
};
