console.log("env:", JSON.stringify(process.env, null, 3));
const https = require("https");
var fs = require("fs");

const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const express = require("express");
var escape = require("escape-html");

const app = express();
console.log("Creating transporter");
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: "22",
  secure: true,
  auth: {
    type: "OAuth2",
    user: process.env.SENDER_EMAIL_USERNAME,
    serviceClient: process.env.GMAIL_OAUTH2_CLIENT_ID,
    privateKey: fs.readFileSync("./gmail_secret.js")
  }
});
console.log("Created transporter");

const mailOptions = {
  from: process.env.SENDER_EMAIL_USERNAME,
  to: process.env.RECIEVER_EMAIL_ADDRESS
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
  .listen(process.env.PORT || 443, function() {
    console.log("Listening on", this.address());
  });
