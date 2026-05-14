require("dotenv").config();
// require("./public/js/utils.js");

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const app = express();
const PORT = process.env.PORT || 2800;

const fs = require("fs");

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/app/html"));
app.use(express.json());

const mongoSanitizer = require("mongo-sanitizer").default;
app.use(mongoSanitizer({ replaceWith: "_" }));

const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const node_session_secret = process.env.NODE_SESSION_SECRET;

const { signupSubmit, loginSubmit } = require("./public/js/authentication");
const gameManager = require("./public/js/gameManager.js");

function checkAuthentication(req, res, next) {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  next();
}

var mongoStore = MongoStore.create({
  mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/${mongodb_database}`,
  crypto: {
    secret: mongodb_session_secret,
  },
});

app.use(
  session({
    secret: node_session_secret,
    store: mongoStore,
    saveUninitialized: false,
    resave: true,
  }),
);

// Home Page Route
app.get("/", (req, res) => {
  if (req.session.authenticated) {
    res.redirect("/home");
    return;
  }
  res.redirect("/login");
});

// Signup Page Route
app.get("/signup", (req, res) => {
  res.render("signup", {
    title: "Sign Up",
    user: req.session.user,
    cssFiles: [],
  });
});

// Signup Handler
app.post("/signupSubmit", signupSubmit);

// Login Page Route
app.get("/login", (req, res) => {
  res.render("login", {
    title: "Log In",
    user: req.session.user,
    cssFiles: [],
  });
});

// Login Handler
app.post("/loginSubmit", loginSubmit);

// Static Homepage HTML Page Route
app.get("/home", checkAuthentication, (req, res) => {
  let html = fs.readFileSync(__dirname + "/app/html/home.html", "utf8");
  res.send(html);
});

// Static Plant Map HTML Page Route
app.get("/plant-map", checkAuthentication, (req, res) => {
  let html = fs.readFileSync(__dirname + "/app/html/plant-map.html", "utf8");
  res.send(html);
});

// Plant Games Page Route
app.use("/plant-game", (req, res) => {
  if (req.session.authenticated) {
    gameManager;
  }
});

// Logout Handler
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// Try-catch 404 Page-not-found Error Page
app.use((req, res) => {
  res.status(404);
  res.render("404", {
    title: "404 - Page not found",
    user: req.session.user,
    cssFiles: [],
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
