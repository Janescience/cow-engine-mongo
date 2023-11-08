const { verifySignUp,authJwt } = require("../middlewares");
const { logger } = require("../middlewares/log-events");

const controller = require("../controllers/auth.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get('/auth/user',[authJwt.verifyToken],controller.user);

  app.post("/auth/signup",
    [
      verifySignUp.checkDuplicateUsername,
      logger
    ],
    controller.signup
  );

  app.post("/auth/signin",[logger],controller.signin);
  app.post("/auth/refreshToken",[logger],controller.refreshToken);
};