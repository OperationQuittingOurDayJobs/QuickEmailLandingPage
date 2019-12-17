const nodemailer = require("nodemailer");
const env = require("../env.js");

const mailOptions = {
  from: `Knuckledragger SubBot <${env.SENDER_EMAIL_USERNAME}>`,
  to: env.RECEIVER_EMAIL_ADDRESS
};

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.SENDER_EMAIL_USERNAME,
    pass: env.SENDER_EMAIL_PASSWORD
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
