"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var bodyPerser = require("body-parser");
const getUuid = require("uuid-by-string");
const dns = require("dns");

var cors = require("cors");

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/
process.env.DB_URI =
  "mongodb+srv://nerdySam:MAD22GEnius@cluster1-1blkv.mongodb.net/test?retryWrites=true&w=majority";

mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let Schema = mongoose.Schema;
let urlSchema = new Schema({
  url: String,
  shortUrl: Number,
});

let urlModel = mongoose.model("urlModel", urlSchema);
app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use(bodyPerser.urlencoded({ extended: false }));

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.post("/api/shorturl/new", (req, res) => {
  let url = new URL(req.body.url).hostname;

  dns.lookup(url, (err, address) => {
    if (err) {
      res.json({ error: "invalid URL" });
    } else {
      urlModel.findOne({ url: req.body.url }, (err, data) => {
        if (err) {
          res.send("something went wrong");
        } else {
          if (data !== null) {
            res.json({ original_url: req.body.url, short_url: data.shortUrl });
          } else if (data === null) {
            let newUrl = new urlModel({
              url: req.body.url,
              shortUrl: getNumberFromHash(getUuid(req.body.url)),
            });
            newUrl.save((err, newUrl) => {
              res.json({
                original_url: req.body.url,
                short_url: newUrl.shortUrl,
              });
            });
          }
        }
      });
    }
  });
});

// your first API endpoint...
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.get("/api/shorturl/:url", (req, res) => {
  const shortUrl = parseInt(req.params.url);

  urlModel.findOne({ shortUrl: shortUrl }, (err, data) => {
    console.log(data);
    if (err) {
      res.json({ error: "invalid URL" });
    } else if (data !== null) {
      res.redirect(data.url);
    }
  });
});

app.listen(port, function () {
  console.log("Node.js listening ...");
});

const getNumberFromHash = (hash) => {
  let splitted = hash.split("");
  const result = splitted.reduce((acc, current) => {
    return acc + current.charCodeAt(0);
  }, hash.charCodeAt(0));

  return result;
};
