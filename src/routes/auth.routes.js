const { verifySignUp,authJwt } = require("../middlewares");
const { logger } = require("../middlewares/log-events");
const rateLimit = require("express-rate-limit");

const controller = require("../controllers/auth.controller");

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  message: "Too many request",
});

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
      logger,
      limiter
    ],
    controller.signup
  );

  app.post("/auth/signin",[logger],controller.signin);
  app.post("/auth/refreshToken",[logger,limiter],controller.refreshToken);
};
