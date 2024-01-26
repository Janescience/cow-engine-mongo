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

  app.get('/report/cow',[authJwt.verifyToken],controller.cowExport);
  app.get('/report/view/cow',[authJwt.verifyToken],controller.cowView);
  app.get('/report/raw-milk',[authJwt.verifyToken],controller.getRawMilk);
  app.get('/report/reproduct',[authJwt.verifyToken],controller.reproductExport);
  app.get('/report/view/reproduct',[authJwt.verifyToken],controller.reproductView);
  app.get('/report/heal',[authJwt.verifyToken],controller.healExport);
  app.get('/report/view/heal',[authJwt.verifyToken],controller.healView);
  
};
