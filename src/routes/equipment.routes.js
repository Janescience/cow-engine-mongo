const { authJwt } = require("../middlewares");
const { logger } = require("../middlewares/log-events");

const controller = require("../controllers/equipment.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get('/equipment',[authJwt.verifyToken],controller.getAll);
  app.get('/equipment/:id',[authJwt.verifyToken],controller.get);
  app.post("/equipment",[authJwt.verifyToken,logger],controller.create);
  app.post("/equipment/delete/selected",[authJwt.verifyToken,logger],controller.deletes);
  app.put("/equipment/:id",[authJwt.verifyToken,logger],controller.update);
  app.delete("/equipment/:id",[authJwt.verifyToken],controller.delete);
};
