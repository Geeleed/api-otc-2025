const express = require("express");
const bcrypt = require("bcrypt");
const { getUsers } = require("../constants/users");
const router = express.Router();

router.route("/hash/:password").get(async (req, res) => {
  const password = req.params.password;
  const saltRounds = 10;

  try {
    const hash = await bcrypt.hash(password, saltRounds);
    res.json({ hash });
  } catch (err) {
    res.status(500).json({ error: "Hashing failed" });
  }
});

router.route("/database").get(async (req, res) => {
  try {
    const users = await getUsers();
    const database = users.map((el) => el.organization);
    res.json(database);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "get database failed" });
  }
});

module.exports = router;
