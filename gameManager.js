require("dotenv").config();
require("./utils.js");

const fs = require("fs");
const path = require("path");
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const Joi = require("joi");
const bcrypt = require("bcrypt");
const mongoSanitize = require("express-mongo-sanitize");

const { database } = include("mongoDBConnection");
const userCollection = database
  .db(process.env.MONGODB_USER_DATABASE)
  .collection("users");

const app = express();
const port = process.env.PORT || 3000;

/* Secret Information Section */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_user_database = process.env.MONGODB_USER_DATABASE;
const mongodb_plant_database = process.env.MONGODB_PLANT_DATABASE;
const mongodb_session_database = process.env.MONGODB_SESSION_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const node_session_secret = process.env.NODE_SESSION_SECRET;
/* END Secret Section */

app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(express.json());
app.use(mongoSanitize({ replaceWith: "%" }));

var mongoStore = MongoStore.create({
  mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/${mongodb_session_database}`,
  collectionName: `${mongodb_session_secret}`,
});

app.use(
  session({
    secret: node_session_secret,
    store: mongoStore,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 }, // expires after 1 hour (60 mins * 60 s * 1000ms)
  }),
);

app.set("view engine", "ejs");

/* Define routes to game pages here */

// Game's Main Page
app.get("/plant-games", (req, res) => {
  if (req.session.authenticated) {
    const player = {
      level: 12,
      currentExp: 1200,
      expToNextLevel: 1500,
    };

    const xpPercentage = (player.currentExp / player.expToNextLevel) * 100;

    const remainingExp = player.expToNextLevel - player.currentExp;

    res.render("pages/games", { player, xpPercentage, remainingExp });
  }
});
