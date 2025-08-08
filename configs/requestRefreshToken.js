require("dotenv").config();
const { google } = require("googleapis");

// ใส่ค่าที่ได้จาก Google Cloud
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = "https://developers.google.com/oauthplayground"; // ใช้ OAuth Playground
const REFRESH_TOKEN = ""; // เว้นว่างไว้ก่อน

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

console.log(
  "Authorize this app by visiting this url:",
  oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://mail.google.com/"],
  })
);
