const { verifyCreate,authJwt } = require("../middlewares");
const { logger } = require("../middlewares/log-events");

const controller = require("../controllers/protection.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get('/protection',[authJwt.verifyToken,logger],controller.getAll);
  app.get('/protection/:id',[authJwt.verifyToken,logger],controller.get);
  app.post("/protection",[authJwt.verifyToken,verifyCreate.protectionCheckDup,logger],controller.create);
  app.put("/protection/:id",[authJwt.verifyToken,logger],controller.update);
  app.delete("/protection/:id",[authJwt.verifyToken,logger],controller.delete);
};
