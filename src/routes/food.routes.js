const { verifyCreate,authJwt } = require("../middlewares");
const { logger } = require("../middlewares/log-events");

const controller = require("../controllers/food.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get('/food',[authJwt.verifyToken,logger],controller.getAll);
  app.get('/food/:id',[authJwt.verifyToken,logger],controller.get);
  app.post("/food",[authJwt.verifyToken,verifyCreate.foodCheckDup,logger],controller.create);
  app.post("/food/delete/selected",[authJwt.verifyToken,logger],controller.deletes);
  app.put("/food/:id",[authJwt.verifyToken,logger],controller.update);
  app.delete("/food/:id",[authJwt.verifyToken,logger],controller.delete);
};
