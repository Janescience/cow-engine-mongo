const { verifyCreate,authJwt } = require("../middlewares");
const { logger } = require("../middlewares/log-events");

const controller = require("../controllers/vaccine.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get('/vaccine',[authJwt.verifyToken,logger],controller.getAll);
  app.get('/vaccine/:id',[authJwt.verifyToken,logger],controller.get);
  app.post("/vaccine",[authJwt.verifyToken,verifyCreate.protectionCheckDup,logger],controller.create);
  app.put("/vaccine/:id",[authJwt.verifyToken,logger],controller.update);
  app.delete("/vaccine/:id",[authJwt.verifyToken,logger],controller.delete);
};
