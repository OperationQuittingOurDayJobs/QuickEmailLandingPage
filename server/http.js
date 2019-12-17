const express = require("express");

const app = express();

app.use((req, res) => {
  res.redirect("https://knuckledraggerrpg.com", 301);
});

app.listen(80, function() {
  console.log("listening on ", this.address());
});
