const { authJwt } = require("../middlewares");
const { logger } = require("../middlewares/log-events");

const controller = require("../controllers/param.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get('/param',[authJwt.verifyToken,logger],controller.getAll);
  app.get('/param/:id',[authJwt.verifyToken,logger],controller.get);
  app.post("/param",[authJwt.verifyToken,logger],controller.create);
  app.put("/param/:id",[authJwt.verifyToken,logger],controller.update);
  app.delete("/param/:id",[authJwt.verifyToken,logger],controller.delete);
};