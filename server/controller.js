var escape = require("escape-html");
const {sendErrorEmail, sendNewSubEmail} = require("./sendEmail.js");

module.exports = async (req, res) => {
  try {
    req.body.email = escape(req.body.email);
    await sendNewSubEmail(req.body.email);
    res.redirect("/thankyou.html");
  } catch (e) {
    try {
      await sendErrorEmail(e);
    } catch (err) {
      console.error("error sending submit err", err);
      res.sendStatus(400);
      return;
    }
    console.error("Error submitting:", e);
    res.sendStatus(400);
  }
};
