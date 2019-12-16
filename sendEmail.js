const nodemailer = require("nodemailer");
const axios = require("axios");
const env = require("./env.js");

const {
  oauth_client_id,
  oauth_secret,
  authToken,
  refreshToken,
  accessToken,
  expires
} = require("./gmail_creds.json");

const mailOptions = {
  from: `Knuckledragger SubBot <${env.SENDER_EMAIL_USERNAME}>`,
  to: env.RECEIVER_EMAIL_ADDRESS
};

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    // type: "OAuth2",
    user: env.SENDER_EMAIL_USERNAME,
    pass: env.SENDER_EMAIL_PASSWORD
    // clientId: oauth_client_id,
    // clientSecret: oauth_secret,
    // refreshToken,
    // accessToken,
    // expires
  },
  tls: {
    rejectUnauthorized: false
  }
});

module.exports.sendNewSubEmail = async (email) =>
  new Promise(async (resolve, reject) => {
    transporter.sendMail(
      {
        ...mailOptions,
        subject: "New KnuckleDragger Subscription",
        text: email
      },
      (error, info) => {
        if (error) {
          return reject(error);
        } else {
          return resolve(info);
        }
      }
    );
  });

module.exports.sendErrorEmail = (error, handlePost) =>
  new Promise(async (resolve, reject) => {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: handlePost.auth_settings
      });
      transporter.sendMail(
        {
          ...mailOptions,
          subject: "Error in KD Landing Page",
          text: error
        },
        (error, info) => {
          if (error) {
            reject(error);
          } else {
            resolve(info);
          }
        }
      );
    } catch (e) {
      console.error("error sending error email:", e);
      throw e;
    }
  });

module.exports.refreshAccessToken = async (
  {clientId, clientSecret},
  auth_settings,
  authToken
) => {
  try {
    const {
      data: {access_token, refresh_token, expires_in}
    } = await axios({
      url: "https://oauth2.googleapis.com/token",
      method: "POST",
      code: authToken,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: "https://knuckledraggerrpg.com",
      grant_type: "authorization_code"
    });

    return {
      ...auth_settings,
      accessToken: access_token,
      refreshToken: refresh_token,
      expires: new Date(new Date().getTime() + expires_in * 1000).getTime()
    };
  } catch (e) {
    console.error("error refreshing", e.message);
    throw e;
  }
};
