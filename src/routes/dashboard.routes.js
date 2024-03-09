const { verifySignUp,authJwt } = require("../middlewares");
const controller = require("../controllers/dashboard.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get('/dashboard/cow',[authJwt.verifyToken],controller.cow);
  app.get('/dashboard/quality',[authJwt.verifyToken],controller.quality);
  app.get('/dashboard/milks',[authJwt.verifyToken],controller.milks);
  app.get('/dashboard/events',[authJwt.verifyToken],controller.events);
  app.get('/dashboard/expense',[authJwt.verifyToken],controller.expense);
  app.get('/dashboard/income',[authJwt.verifyToken],controller.income);
  app.get('/dashboard/rawMilkDescSort',[authJwt.verifyToken],controller.rawMilkDescSort);
  app.get('/dashboard/rawMilkAscSort',[authJwt.verifyToken],controller.rawMilkAscSort);
  app.get('/dashboard/corrals',[authJwt.verifyToken],controller.corrals);
  app.get('/dashboard/statistics',[authJwt.verifyToken],controller.statistics);
  app.get('/dashboard/todolist',[authJwt.verifyToken],controller.todolist);
  app.get('/dashboard/food',[authJwt.verifyToken],controller.food);
};
