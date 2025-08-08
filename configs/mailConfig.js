const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

async function getTransporter() {
  try {
    const accessTokenObject = await oAuth2Client.getAccessToken();
    const accessToken = accessTokenObject?.token;

    if (!accessToken) {
      throw new Error("Unable to retrieve access token from OAuth2 client.");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken,
      },
    });

    return transporter;
  } catch (error) {
    console.error("Failed to create transporter:", error);
    throw error;
  }
}

module.exports = getTransporter;
