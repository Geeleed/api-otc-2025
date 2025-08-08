const crypto = require("crypto");
const jwt = require("jsonwebtoken");

function generateSecureOTP(length = 6) {
  const buffer = crypto.randomBytes(length);
  return Array.from(buffer)
    .map((b) => (b % 10).toString())
    .join("");
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

module.exports = { generateSecureOTP, deToken };
