const db = require("../models");
const User = db.user;

const checkDuplicateUsername = (req, res, next) => {
    // Username
    User.findOne({
      username: req.body.username
    }).exec((err, user) => {
      if (user) {
        // console.log('Failed username is already in use , ',req.body.username)
        res.status(400).send({ message: "Failed! Username is already in use!" });
        return;
      }
      next();
    });
};
  
const verifySignUp = {
    checkDuplicateUsername
};

module.exports = verifySignUp;
