const https = require("https");
const fs = require("fs");
const bodyParser = require("body-parser");
const express = require("express");
const handlePost = require("./controller.js");
const env = require("../env.js");

const app = express();

app.use(express.static("../public"));
app.use(bodyParser.urlencoded({extended: true}));
app.post("/", handlePost);

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
