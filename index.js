const https = require("https");
const fs = require("fs");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const express = require("express");
var escape = require("escape-html");
const xoauth2 = require("xoauth2");

const env = require("./env.js");
const {
  oauth_client_id,
  oauth_secret,
  refreshToken
} = require("./gmail_creds.json");
const clientSecret = require("./gmail_secret");

const app = express();
console.log("env:", JSON.stringify(env, null, 3));

console.log("Creating transporter");
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  secure: true,
  port: 465,
  auth: {
    xoauth2: xoauth2.createXOAuth2Generator({
      user: env.SENDER_EMAIL_USERNAME,
      clientId: oauth_client_id,
      clientSecret: oauth_secret,
      refreshToken
    })
  }
});
console.log("Created transporter");

const mailOptions = {
  from: `Knuckledragger SubBot <${env.SENDER_EMAIL_USERNAME}>`,
  to: env.RECIEVER_EMAIL_ADDRESS
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

const sendErrorEmail = (email) =>
  new Promise((resolve, reject) => {
    console.log("sending error mail");
    transporter.sendMail(
      {
        ...mailOptions,
        subject: "Error in KD Landing Page",
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
      key: fs.readFileSync("server.key"),
      cert: fs.readFileSync("server.cert")
    },
    app
  )
  .listen(env.PORT || 443, function() {
    console.log("Listening on", this.address());
  });
