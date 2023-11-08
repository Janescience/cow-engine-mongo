const { authJwt } = require("../middlewares");
const { logger } = require("../middlewares/log-events");

const controller = require("../controllers/worker.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get('/worker',[authJwt.verifyToken],controller.getAll);
  app.get('/worker/:id',[authJwt.verifyToken],controller.get);
  app.post("/worker",[authJwt.verifyToken,logger],controller.create);
  app.post("/worker/delete/selected",[authJwt.verifyToken,logger],controller.deletes);
  app.put("/worker/:id",[authJwt.verifyToken,logger],controller.update);
  app.delete("/worker/:id",[authJwt.verifyToken],controller.delete);
};
