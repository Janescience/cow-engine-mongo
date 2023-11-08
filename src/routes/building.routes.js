const { authJwt } = require("../middlewares");
const { logger } = require("../middlewares/log-events");

const controller = require("../controllers/building.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get('/building',[authJwt.verifyToken],controller.getAll);
  app.get('/building/:id',[authJwt.verifyToken],controller.get);
  app.post("/building",[authJwt.verifyToken,logger],controller.create);
  app.post("/building/delete/selected",[authJwt.verifyToken,logger],controller.deletes);
  app.put("/building/:id",[authJwt.verifyToken,logger],controller.update);
  app.delete("/building/:id",[authJwt.verifyToken],controller.delete);
};
