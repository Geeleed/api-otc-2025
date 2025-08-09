const crypto = require("crypto");
const jwt = require("jsonwebtoken");

function generateSecureOTP(length = 6) {
  const buffer = crypto.randomBytes(length);
  return Array.from(buffer)
    .map((b) => (b % 10).toString())
    .join("");
}

const CODE_SET = "123456789ABCDEFGHIJKLMNPQRSTUVWXYZ";
function generateSecureOTPV2(length = 4) {
  let otp = "";
  for (let i = 0; i < length; i++) {
    const idx = crypto.randomInt(0, CODE_SET.length);
    otp += CODE_SET[idx];
  }
  return otp;
}

const deToken = (token, JWT_SECRET) => {
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    return { ...verified, expired: false };
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      const decoded = jwt.decode(token);
      return { ...decoded, expired: true };
    } else {
      // token ผิดหรือปลอม
      return { error: "Invalid token" };
    }
  }
};

module.exports = { generateSecureOTP, generateSecureOTPV2, deToken };
