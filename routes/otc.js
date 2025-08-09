const express = require("express");
const {
  generateSecureOTP,
  generateSecureOTPV2,
} = require("../pure_function/utils");
const bcrypt = require("bcrypt");
const { getUsers } = require("../constants/users");
const pool = require("../configs/db");
const router = express.Router();

router.use(express.json());

let otcIndex = {}; // {expire:1777777,organization:Ball}

router.route("/").get(async (req, res) => {
  try {
    res.json(otcIndex);
  } catch (err) {
    res.status(500).json({ error: "OTC failed" });
  }
});

router.route("/").post(async (req, res) => {
  const { email, password } = req.body;
  const users = await getUsers();
  const result = users.find((el) => el.email === email);
  const hashPassword = result?.password || "";
  const auth = bcrypt.compareSync(password, hashPassword);
  try {
    if (auth === false) throw { message: "ข้อมูลไม่ถูกต้อง" };
    const otc = generateSecureOTPV2();
    let hasOtc = otcIndex?.[otc];
    let newOtc = otc;
    while (hasOtc) {
      const otc = generateSecureOTPV2();
      hasOtc = otcIndex?.[otc];
      newOtc = otc;
    }
    otcIndex[newOtc] = {
      expire: new Date().getTime() + 3 * 60 * 1000,
      organization: result.organization,
    };
    res.json({
      otc: newOtc,
      organization: result.organization,
      status: "success",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ err: "OTC failed", ...error, status: "fail" });
  }
});

router.route("/check").post(async (req, res) => {
  const otc = req.body.otc;
  try {
    let otcData = otcIndex?.[otc];
    const isExpire = new Date().getTime() > otcData?.expire;
    if (isExpire) {
      delete otcIndex[otc];
      otcData = undefined;
    }
    if (otcData) {
      delete otcIndex[otc];
    }
    res.json({ organization: otcData?.organization });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error, organization: null });
  }
});

router.route("/check/:otc").get(async (req, res) => {
  const otc = req.params.otc;
  try {
    let otcData = otcIndex?.[otc];
    const isExpire = new Date().getTime() > otcData?.expire;
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

router.route("/requestRegister").post(async (req, res) => {
  const { name, email, tel, description } = req.body;
  const conn = await pool.connect();
  try {
    await conn.query("BEGIN");
    await conn.query(
      `INSERT INTO otc_tempolary (tempolary, marker_1) VALUES ($1, $2)`,
      [JSON.stringify({ name, email, tel, description }), "requestRegister"]
    );
    await conn.query("COMMIT");
    res.json({ status: "success" });
  } catch (error) {
    console.error(error);
    await conn.query("ROLLBACK");
    res.json({ status: "fail" });
  } finally {
    conn.release();
  }
});

module.exports = router;
