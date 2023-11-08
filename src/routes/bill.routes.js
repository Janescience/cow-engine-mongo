const { authJwt } = require("../middlewares");
const { logger } = require("../middlewares/log-events");

const controller = require("../controllers/bill.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get('/bill',[authJwt.verifyToken],controller.getAll);
  app.get('/bill/:id',[authJwt.verifyToken],controller.get);
  app.post("/bill",[authJwt.verifyToken,logger],controller.create);
  app.post("/bill/delete/selected",[authJwt.verifyToken,logger],controller.deletes);
  app.put("/bill/:id",[authJwt.verifyToken,logger],controller.update);
  app.delete("/bill/:id",[authJwt.verifyToken],controller.delete);
};
