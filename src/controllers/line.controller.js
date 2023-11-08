
const { lineApi } = require("../services")
const db = require("../models");
const path = require("path")
const User = db.user;

exports.redirect = async (req, res) => {
  try {
    await lineApi.token(req.query.code,req.query.state);
    // console.log("Created Line Access Token Successfully.");
    res.sendFile(path.join(__dirname, '../../views','line-connected.html'));
  } catch (error) {
    return res.json(error);  
  }
};

exports.notify = async (req, res) => {
  try {
    await lineApi.notify(req.body.message,'T',req.farmId,req.body.lineToken)
    return res.status(200).send({ message: "Notify Successfully." });
  } catch (error) {
    return res.json({ error: error.response.data.message });  
  }
};

