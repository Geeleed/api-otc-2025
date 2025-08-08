require("dotenv").config();
const { google } = require("googleapis");

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI; // ต้องตรงกับตอนขอ authorization code

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

async function getTokens(authCode) {
  try {
    const { tokens } = await oAuth2Client.getToken(authCode);
    // tokens จะมี access_token, refresh_token, expiry_date ฯลฯ
    console.log("Access Token:", tokens.access_token);
    console.log("Refresh Token:", tokens.refresh_token); // เก็บไว้ใช้ยาวๆ
    return tokens;
  } catch (error) {
    console.error("Error getting tokens:", error);
  }
}

// เรียกใช้ฟังก์ชันนี้พร้อมโค้ดที่ได้มา
getTokens(process.env.AUTH_CODE);
