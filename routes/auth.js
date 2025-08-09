const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getUsers, setUsers } = require("../constants/users");
const getTransporter = require("../configs/mailConfig");
const { deToken } = require("../pure_function/utils");

const router = express.Router();
router.use(express.json());

router.route("/changePassword").post(async (req, res) => {
  const { email, password } = req.body;
  try {
    const emailAddressRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailAddressRegex.test(email)) {
      throw { message: "ไม่พบบัญชี", staus: "fail" };
    }

    const users = await getUsers();
    const hasUser = users.find((el) => el.email === email)?.email;
    if (Boolean(hasUser) === false) {
      throw { message: "ไม่พบบัญชี", staus: "fail" };
    }

    const hashPassword = bcrypt.hashSync(password, 10);
    const token = jwt.sign(
      { email, password: hashPassword },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    const transporter = await getTransporter();
    const mailOptions = {
      from: "ระบบยืนยันตัวตนองค์กร",
      to: email,
      subject: "เปลี่ยนรหัสผ่าน",
      html: `<a href="${
        process.env.BASE_URL
      }/auth/verifyChangePassword?token=${token}">คลิกลิงก์นี้เพื่อยืนยันการเปลี่ยนรหัส ภายใน ${new Date(
        new Date().getTime() + 1 * 60 * 60 * 1000
      ).toISOString()}</a>`,
    };

    await transporter.sendMail(mailOptions);
    res.send({ message: "Email sent successfully.", status: "success" });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.send({ message: "มีข้อผิดพลาด กรุณาลองอีกครั้ง", ...error });
  }
});

router.route("/verifyChangePassword").get(async (req, res) => {
  const token = req.query.token;
  try {
    const decoded = deToken(token, process.env.JWT_SECRET);
    if (decoded?.error || decoded?.expired) {
      throw { msg: decoded.error };
    }
    console.log("✅ มีการยืนยันเปลี่ยนรหัสผ่าน", decoded);
    const email = decoded?.email;
    const password = decoded?.password;
    const users = await getUsers();
    let data = users.find((el) => el.email === email);
    data = { ...data, password };
    await setUsers(data);
    res.send({ message: "เปลี่ยนรหัสผ่านสำเร็จ", status: "success" });
  } catch (error) {
    console.error(error);
    res.send({
      message: "เปลี่ยนรหัสไม่สำเร็จ กรุณาส่งคำขอเปลี่ยนรหัสใหม่",
      status: "fail",
    });
  }
});
module.exports = router;
