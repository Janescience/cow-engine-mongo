const { authJwt } = require("../middlewares");
const { logger } = require("../middlewares/log-events");

const controller = require("../controllers/birth.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get('/birth',[authJwt.verifyToken],controller.getAll);
  app.get('/birth/:id',[authJwt.verifyToken],controller.get);
  app.post("/birth/:id",[authJwt.verifyToken,logger],controller.create);
  // app.put("/birth/:id",[authJwt.verifyToken,logger],controller.update);
  app.delete("/birth/:id",[authJwt.verifyToken],controller.delete);
};
