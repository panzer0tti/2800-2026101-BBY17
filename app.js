require("dotenv").config();

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const mongoose = require("mongoose");
const mongoSanitizer = require("mongo-sanitizer").default;

const app = express();
const PORT = process.env.PORT || 2800;

app.set("view engine", "ejs");

app.use(express.urlencoded({extended: false}));
app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/app/html"));
app.use(express.json());

app.use(mongoSanitizer({replaceWith: "_"}));

const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;

const mongoURL = `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/${mongodb_database}`;

mongoose.connect(mongoURL)
    .then(() => {
        console.log("MongoDB is connected to the server.");

        app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection failed: ", err);
    });

const {checkAuthentication, alreadyLoggedIn} = require("./public/js/appHelper");
const {renderPage, HTMLRender} = require("./public/js/appHelper");
const {signupSubmit, loginSubmit} = require("./public/js/authentication");
const {backupLoginSubmit} = require("./public/js/authentication");
const {displayUserInfo, updateUserInfo} = require("./public/js/profileData");
const {verifyIdentity, changePasswordSubmit} = require("./public/js/changePassword");
const {apiScan} = require("./public/js/plantScanAPI");
const gameManager = require("./public/js/gameManager");

// const {title} = require("process");
// console.log(title);

const navLinksUnauth = [
  {name: "Welcome", url: "/"},
  {name: "Sign Up", url: "/signup"},
  {name: "Log In", url: "/login"},
  {name: "Backup Log In", url: "/backupLogin"}
];

const navLinksAuth = [
  {name: "Home", url: "/home"},
  {name: "Scan Plant", url: "/plant-scan"},
  {name: "Plant Map", url: "/plant-map"},
  {name: "My Plants", url: "/my-plants"},
  {name: "Encyclopedia", url: "/encyclopedia"},
  {name: "Plant Games", url: "/plant-game"},
  {name: "Profile", url: "/profile"},
  {name: "Logout", url: "/logout"}
];

app.use((req, res, next) => {
  const pathFolders = req.path.split("/").slice(1);
  const folder = "/" + pathFolders[0];
  app.locals.folder = folder;
  app.locals.navLinksAuth = navLinksAuth;
  app.locals.navLinksUnauth = navLinksUnauth;
  next();
});

var mongoStore = MongoStore.create({
  mongoUrl: mongoURL,
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
app.get("/", alreadyLoggedIn, (req, res) => {
  res.redirect("/login");
});

// Signup Page Route
app.get("/signup", alreadyLoggedIn, (req, res) => {
  renderPage(req, res, "signup", "Sign Up");
});

// Signup Handler
app.post("/signupSubmit", signupSubmit);

// Login Page Route
app.get("/login", alreadyLoggedIn, (req, res) => {
  renderPage(req, res, "login", "Log In");
});

// Login Handler
app.post("/loginSubmit", loginSubmit);

// Backup Login Page Route
app.get("/backupLogin", alreadyLoggedIn, (req, res) => {
  renderPage(req, res, "backup-login", "Backup Log In");
});

// Backup Login Handler
app.post("/backupLoginSubmit", backupLoginSubmit);

// Static Homepage HTML Route
app.get("/home", checkAuthentication, (req, res) => {
  HTMLRender(res, "home.html");
});

// Static Plant Map Page HTML Route
app.get("/plant-map", checkAuthentication, (req, res) => {
  HTMLRender(res, "plant-map.html");
});

// Static Plant Scan Page Route
app.get("/plant-scan", checkAuthentication, (req, res) => {
  HTMLRender(res, "plant-scan.html");
});

// Plant Scan API Route
app.post('/scanningPlant', apiScan);

// Plant Games Page Route
app.use("/plant-game", checkAuthentication, gameManager);

// Profile Page Route
app.get("/profile", checkAuthentication, displayUserInfo);

// Update Profile Handler
app.post("/updateProfile", checkAuthentication, updateUserInfo);

// Change Password Security Page
app.get("/changePassword", checkAuthentication, (req, res) => {
  renderPage(req, res, "change-password", "Change Password");
});

// Change Password Security Handler
app.post("/changePasswordSubmit", checkAuthentication, verifyIdentity);

// Change Password Form Page
app.get("/changePasswordForm", checkAuthentication, (req, res) => {
  renderPage(req, res, "change-password-form", "Change Password");
});

// Change Password Form Handler
app.post("/changePasswordFormSubmit", checkAuthentication, changePasswordSubmit);

// Logout Handler
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// 404 Page-not-found Error Page
app.use((req, res) => {
  res.status(404);
  renderPage(req, res, "404", "404 - Page not found");
});
