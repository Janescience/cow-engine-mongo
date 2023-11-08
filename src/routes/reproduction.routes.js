const { verifyCreate,authJwt } = require("../middlewares");
const { logger } = require("../middlewares/log-events");

const controller = require("../controllers/reproduction.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get('/reproduction',[authJwt.verifyToken],controller.getAll);
  app.get('/reproduction/:id',[authJwt.verifyToken],controller.get);
  app.post("/reproduction",[authJwt.verifyToken,verifyCreate.reproCheckDup,logger],controller.create);
  app.post("/reproduction/delete/selected",[authJwt.verifyToken,logger],controller.deletes);
  app.put("/reproduction/:id",[authJwt.verifyToken,logger],controller.update);
  app.delete("/reproduction/:id",[authJwt.verifyToken],controller.delete);
};
