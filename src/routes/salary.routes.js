const { authJwt } = require("../middlewares");
const { logger } = require("../middlewares/log-events");

const controller = require("../controllers/salary.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get('/salary',[authJwt.verifyToken],controller.getAll);
  app.get('/salary/:id',[authJwt.verifyToken],controller.get);
  app.post("/salary",[authJwt.verifyToken,logger],controller.create);
  app.put("/salary/:id",[authJwt.verifyToken,logger],controller.update);
  app.delete("/salary/:id",[authJwt.verifyToken],controller.delete);
};
