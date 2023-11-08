const { authJwt } = require("../middlewares");
const { logger } = require("../middlewares/log-events");

const controller = require("../controllers/maintenance.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get('/maintenance',[authJwt.verifyToken],controller.getAll);
  app.get('/maintenance/:id',[authJwt.verifyToken],controller.get);
  app.post("/maintenance",[authJwt.verifyToken,logger],controller.create);
  app.post("/maintenance/delete/selected",[authJwt.verifyToken,logger],controller.deletes);
  app.put("/maintenance/:id",[authJwt.verifyToken,logger],controller.update);
  app.delete("/maintenance/:id",[authJwt.verifyToken],controller.delete);
};
