const https = require("https");
const fs = require("fs");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const express = require("express");
var escape = require("escape-html");

const env = require("./env.js");
const {
  oauth_client_id,
  oauth_secret,
  refreshToken,
  accessToken,
  secondsToExpire
} = require("./gmail_creds.json");

const app = express();
console.log("env:", JSON.stringify(env, null, 3));

console.log("Creating transporter");
console.log(
  "creds: ",
  JSON.stringify(
    {
      type: "OAuth2",
      user: env.SENDER_EMAIL_USERNAME,
      clientId: oauth_client_id,
      clientSecret: oauth_secret,
      refreshToken,
      accessToken,
      expires: new Date(new Date().getTime() + secondsToExpire * 1000).getTime()
    },
    null,
    3
  )
);
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: env.SENDER_EMAIL_USERNAME,
    clientId: oauth_client_id,
    clientSecret: oauth_secret,
    refreshToken,
    accessToken
  }
});
console.log("Created transporter");

const mailOptions = {
  from: `Knuckledragger SubBot <${env.SENDER_EMAIL_USERNAME}>`,
  to: env.RECEIVER_EMAIL_ADDRESS
};

const sendNewSubEmail = (email) =>
  new Promise((resolve, reject) => {
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

const sendErrorEmail = (error) =>
  new Promise((resolve, reject) => {
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
  });

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

app.post("/", async (req, res) => {
  try {
    req.body.email = escape(req.body.email);
    console.log("inc email:", req.body.email);
    // send email
    await sendNewSubEmail(req.body.email);
    console.log("sent email");
    res.redirect("/");
  } catch (e) {
    console.error("Error submitting:", e);
    try {
      await sendErrorEmail(e);
    } catch (err) {
      console.error("error sending submit err", err);
    }
    res.sendStatus(400);
  }
});

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
