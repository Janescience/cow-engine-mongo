const { verifyCreate,authJwt } = require("../middlewares");
const { logger } = require("../middlewares/log-events");

const controller = require("../controllers/recipe.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get('/recipe',[authJwt.verifyToken],controller.getAll);
  app.get('/recipe/:id',[authJwt.verifyToken],controller.get);
  app.post("/recipe",[authJwt.verifyToken,verifyCreate.recipeCheckDup,logger],controller.create);
  app.put("/recipe/:id",[authJwt.verifyToken,logger],controller.update);
  app.delete("/recipe/:id",[authJwt.verifyToken],controller.delete);
};