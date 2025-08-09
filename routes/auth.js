const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const getTransporter = require("../configs/mailConfig");
const { deToken } = require("../pure_function/utils");
const pool = require("../configs/db");

const router = express.Router();
router.use(express.json());

const getHtml = ({ FRONTEND_URL, BACKEND_URL, token, ip }) => `
  <div style="font-family: 'IBM Plex Sans Thai', sans-serif; background-color: #f8f8f8; padding: 20px;">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;700&display=swap');
    </style>
    <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      <div style="background-color: #e97132; color: white; padding: 16px 24px; font-size: 20px; font-weight: bold;">
        ระบบยืนยันตัวตนองค์กร
      </div>
      <div style="padding: 24px; color: #333; line-height: 1.6;">
        <h2 style="color: #e97132; margin-top: 0; font-weight: 700;">เปลี่ยนรหัสผ่าน</h2>
        <p>
          มีการร้องขอเปลี่ยนรหัสผ่านของ 
          <a href="${FRONTEND_URL}" style="color: #e97132; font-weight: bold; text-decoration: none;">ระบบยืนยันตัวตนองค์กร</a>
          จากอุปกรณ์หมายเลข IP: <strong>${ip}</strong>
        </p>
        <p>กรุณาตรวจสอบให้แน่ใจว่าคำขอนี้ถูกร้องขอจากอุปกรณ์ของท่านเอง</p>
        <p><a href="https://api.ipify.org" style="color: #e97132;">ดูหมายเลข IP ของอุปกรณ์นี้</a></p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">
        <p>หากคำขอนี้เป็นของท่านเอง กรุณาคลิกลิงก์ด้านล่างเพื่อยืนยันการเปลี่ยนรหัสผ่าน</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${BACKEND_URL}/auth/verifyChangePassword?token=${token}" 
             style="display: inline-block; background-color: #e97132; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            ยืนยันการเปลี่ยนรหัสผ่าน
          </a>
        </div>
        <p style="font-size: 14px; color: #666; text-align: center;">
          หากปุ่มด้านบนไม่ทำงาน ให้คัดลอกลิงก์นี้ไปวางในเบราว์เซอร์ของท่าน:<br/>
          <a href="${BACKEND_URL}/auth/verifyChangePassword?token=${token}" style="color: #e97132; word-break: break-all;">
            ${BACKEND_URL}/auth/verifyChangePassword?token=${token}
          </a>
        </p>
      </div>
      <div style="background-color: #f3f3f3; color: #888; font-size: 12px; text-align: center; padding: 12px;">
        © ${new Date().getFullYear()} ระบบยืนยันตัวตนองค์กร. All rights reserved.
      </div>
    </div>
  </div>`;

router.route("/changePassword").post(async (req, res) => {
  const { email, password, ip } = req.body;
  const conn = await pool.connect();
  try {
    const emailAddressRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailAddressRegex.test(email)) {
      throw { message: "ไม่พบบัญชี", staus: "fail" };
    }

    await conn.query("BEGIN");
    const { rowCount } = await conn.query(
      `SELECT * FROM otc_users WHERE email = $1`,
      [email]
    );
    if (rowCount === 0) {
      throw { message: "ไม่พบบัญชี", staus: "fail" };
    }

    const hashPassword = bcrypt.hashSync(password, 10);
    const token = jwt.sign(
      { email, password: hashPassword },
      process.env.JWT_SECRET,
      {
        expiresIn: "300s",
      }
    );

    await conn.query(
      `INSERT INTO otc_tempolary (tempolary, marker_1, marker_2) VALUES ($1, $2, $3)`,
      [token, "changePassword", email]
    );

    const transporter = await getTransporter();

    const mailOptions = {
      from: "ระบบยืนยันตัวตนองค์กร",
      to: email,
      subject: "เปลี่ยนรหัสผ่าน",
      html: getHtml({
        FRONTEND_URL: process.env.FRONTEND_URL,
        BACKEND_URL: process.env.BASE_URL,
        token,
        ip,
      }),
    };

    await transporter.sendMail(mailOptions);

    await conn.query("COMMIT");

    res.send({ message: "Email sent successfully.", status: "success" });
  } catch (error) {
    console.error("Unexpected error:", error);
    await conn.query("ROLLBACK");
    res.send({
      message: "มีข้อผิดพลาด กรุณาลองอีกครั้ง",
      ...error,
      status: "fail",
    });
  } finally {
    conn.release();
  }
});

router.route("/relink").post(async (req, res) => {
  const { token, ip } = req.body;
  const conn = await pool.connect();
  try {
    const decoded = deToken(token, process.env.JWT_SECRET);
    if (decoded?.error) {
      return res.redirect(`${process.env.FRONTEND_URL}`);
    }
    const { email, password } = decoded;

    await conn.query("BEGIN");
    const { rowCount } = await conn.query(
      `SELECT * FROM otc_users WHERE email = $1`,
      [email]
    );
    if (rowCount === 0) {
      throw { message: "ไม่พบบัญชี", staus: "fail" };
    }

    const newToken = jwt.sign({ email, password }, process.env.JWT_SECRET, {
      expiresIn: "300s",
    });

    await conn.query(
      `INSERT INTO otc_tempolary (tempolary, marker_1, marker_2) VALUES ($1, $2, $3)`,
      [token, "changePassword", email]
    );

    const transporter = await getTransporter();

    const mailOptions = {
      from: "ระบบยืนยันตัวตนองค์กร",
      to: email,
      subject: "เปลี่ยนรหัสผ่าน",
      html: getHtml({
        FRONTEND_URL: process.env.FRONTEND_URL,
        BACKEND_URL: process.env.BASE_URL,
        token: newToken,
        ip,
      }),
    };

    await transporter.sendMail(mailOptions);

    await conn.query("COMMIT");

    res.send({ message: "Email sent successfully.", status: "success" });
  } catch (error) {
    console.error("Unexpected error:", error);
    await conn.query("ROLLBACK");
    res.send({
      message: "มีข้อผิดพลาด กรุณาลองอีกครั้ง",
      ...error,
      status: "fail",
    });
  } finally {
    conn.release();
  }
});

router.route("/verifyChangePassword").get(async (req, res) => {
  const token = req.query.token;
  const conn = await pool.connect();
  try {
    const decoded = deToken(token, process.env.JWT_SECRET);
    if (decoded?.error) {
      return res.redirect(`${process.env.FRONTEND_URL}`);
    }

    const email = decoded?.email;
    const password = decoded?.password;

    await conn.query("BEGIN");
    const { rows: changePasswordRecord } = await conn.query(
      `SELECT * FROM otc_tempolary WHERE tempolary = $1 AND marker_1 = $2 AND marker_2 = $3`,
      [token, "changePassword", email]
    );

    if (changePasswordRecord.length === 0) {
      return res.redirect(`${process.env.FRONTEND_URL}`);
    }

    if (decoded?.expired) {
      const newToken = jwt.sign({ email, password }, process.env.JWT_SECRET, {
        expiresIn: "300s",
      });
      await conn.query(
        `DELETE FROM otc_tempolary WHERE tempolary = $1 AND marker_1 = $2 AND marker_2 = $3`,
        [token, "changePassword", email]
      );
      await conn.query("COMMIT");
      return res.redirect(
        `${process.env.FRONTEND_URL}/verifyChangePassword?status=fail&token=${newToken}`
      );
    }

    console.log("✅ มีการยืนยันเปลี่ยนรหัสผ่าน", decoded);

    await conn.query("UPDATE otc_users SET password = $1 WHERE email = $2", [
      password,
      email,
    ]);

    await conn.query(
      `DELETE FROM otc_tempolary WHERE marker_1 = $1 AND marker_2 = $2`,
      ["changePassword", email]
    );

    await conn.query("COMMIT");

    res.redirect(
      `${process.env.FRONTEND_URL}/verifyChangePassword?status=success`
    );
  } catch (error) {
    console.error(error);
    await conn.query("ROLLBACK");
    res.redirect(
      `${process.env.FRONTEND_URL}/verifyChangePassword?status=fail`
    );
  } finally {
    conn.release();
  }
});
module.exports = router;
