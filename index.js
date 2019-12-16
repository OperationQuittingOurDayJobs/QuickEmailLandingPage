const https = require("https");
const fs = require("fs");
const axios = require("axios");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const express = require("express");
var escape = require("escape-html");

const env = require("./env.js");

const {
  oauth_client_id,
  oauth_secret,
  // authToken,
  refreshToken,
  accessToken,
  expires
} = require("./gmail_creds.json");

const app = express();

const refreshAccessToken = async (
  {authToken, oauth_client_id, oauth_secret},
  auth_settings
) => {
  try {
    console.log(
      "authToken",
      authToken,
      "oauth_client_id",
      oauth_client_id,
      "oauth_secret",
      oauth_secret
    );
    console.log(auth_settings);
    const {
      data: {access_token, refresh_token, expires_in}
    } = await axios({
      url: "https://oauth2.googleapis.com/token",
      method: "POST",
      code: authToken,
      client_id: oauth_client_id,
      client_secret: oauth_secret,
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
  }
};

const mailOptions = {
  from: `Knuckledragger SubBot <${env.SENDER_EMAIL_USERNAME}>`,
  to: env.RECEIVER_EMAIL_ADDRESS
};

const sendNewSubEmail = async (email, handlePost) =>
  new Promise(async (resolve, reject) => {
    console.log("this email auth_settings", handlePost.auth_settings);
    if (new Date().getTime() > handlePost.auth_settings.expires) {
      handlePost.auth_settings = await refreshAccessToken(
        handlePost.auth_settings
      );
    }
    console.log("this email auth_settings", handlePost.auth_settings);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: handlePost.auth_settings
    });

    console.log("sending mail");

    transporter.sendMail(
      {
        ...mailOptions,
        subject: "New KnuckleDragger Subscription",
        text: email
      },
      (error, info) => {
        if (error) {
          reject(error);
        } else {
          resolve(info);
        }
      }
    );
  });

const sendErrorEmail = (error, handlePost) =>
  new Promise(async (resolve, reject) => {
    try {
      if (new Date().getTime() > handlePost.auth_settings.expires) {
        handlePost.auth_settings = await refreshAccessToken(
          handlePost.auth_settings
        );
      }

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: handlePost.auth_settings
      });

      console.log("sending error mail");
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
    }
  });

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

const handlePost = async (req, res) => {
  console.log("got req");
  try {
    req.body.email = escape(req.body.email);
    console.log("inc email:", req.body.email);
    // send email
    await sendNewSubEmail(req.body.email, handlePost);
    console.log("sent email");
    res.redirect("/");
  } catch (e) {
    console.error("Error submitting:", e);
    try {
      console.log("sending err");
      await sendErrorEmail(e, handlePost);
    } catch (err) {
      console.error("error sending submit err", err);
      res.sendStatus(400);
      return;
    }
    res.sendStatus(400);
  }
};

handlePost.auth_settings = {
  type: "OAuth2",
  user: env.SENDER_EMAIL_USERNAME,
  clientId: oauth_client_id,
  clientSecret: oauth_secret,
  refreshToken,
  accessToken,
  expires
};

app.post("/", handlePost);
console.log("auth_settings:", handlePost.auth_settings);

console.log("env:", JSON.stringify(env, null, 3));

console.log("creds: ", JSON.stringify(null, 3));

console.log("Mail options:", mailOptions);
https
  .createServer(
    {
      key: fs.readFileSync(env.SSL_KEY_PATH, "utf8"),
      cert: fs.readFileSync(env.SSL_CERT_PATH, "utf8")
    },
    app
  )
  .listen(env.PORT || 443, function() {
    console.log("Listening on", this.address());
  });
