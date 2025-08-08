const express = require("express");
const { generateSecureOTP } = require("../pure_function/utils");
const bcrypt = require("bcrypt");
const { getUsers } = require("../constants/users");
const router = express.Router();

router.use(express.json());

let otcIndex = {};

router.route("/").get(async (req, res) => {
  try {
    res.json(otcIndex);
  } catch (err) {
    res.status(500).json({ error: "OTC failed" });
  }
});

router.route("/").post(async (req, res) => {
  const { email, password } = req.body;
  const users = getUsers();
  const result = users.find((el) => el.email === email);
  const hashPassword = result?.password || "";
  const auth = bcrypt.compareSync(password, hashPassword);
  try {
    if (auth === false) throw { message: "ข้อมูลไม่ถูกต้อง" };
    const otc = generateSecureOTP();
    let hasOtc = otcIndex?.[otc];
    let newOtc = otc;
    while (hasOtc) {
      const otc = generateSecureOTP();
      hasOtc = otcIndex?.[otc];
      newOtc = otc;
    }
    otcIndex[newOtc] = {
      expire: new Date().getTime() + 3 * 60 * 1000,
      organization: result.organization,
    };
    res.json({ otc: newOtc, organization: result.organization });
  } catch (error) {
    console.error(error);
    res.status(500).json({ err: "OTC failed", ...error });
  }
});

router.route("/check").post(async (req, res) => {
  const otc = req.body.otc;
  try {
    let otcData = otcIndex?.[otc];
    const isExpire = new Date().getTime() > otcData.expire;
    if (isExpire) {
      delete otcIndex[otc];
      otcData = undefined;
    }
    if (otcData) {
      delete otcIndex[otc];
    }
    res.json({ organization: otcData.organization });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error, organization: null });
  }
});

router.route("/check/:otc").get(async (req, res) => {
  const otc = req.params.otc;
  try {
    let otcData = otcIndex?.[otc];
    const isExpire = new Date().getTime() > otcData.expire;
    if (isExpire) {
      delete otcIndex[otc];
      otcData = undefined;
    }
    if (otcData) {
      delete otcIndex[otc];
    }
    res.json({ organization: otcData.organization });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

module.exports = router;
