const { authJwt } = require("../middlewares");

const controller = require("../controllers/report.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get('/report/cow',[authJwt.verifyToken],controller.getCowAll);
  app.get('/report/raw-milk',[authJwt.verifyToken],controller.getRawMilk);
  app.get('/report/reproduction',[authJwt.verifyToken],controller.reproduction);
  
};
