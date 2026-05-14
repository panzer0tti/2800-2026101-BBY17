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
app.use(express.static(__dirname + '/app/html'));
app.use(express.json());

const mongoSanitizer = require("mongo-sanitizer").default;
app.use(mongoSanitizer({replaceWith: "_"}));

const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const node_session_secret = process.env.NODE_SESSION_SECRET;

const {signupSubmit, loginSubmit, backupLoginSubmit} = require("./public/js/authentication");
const {displayUserInfo, updateUserInfo} = require("./public/js/profileData");
const {verifyIdentity, changePasswordSubmit} = require("./public/js/changePassword");
const gameManager = require("./public/js/gameManager");
const { name } = require("ejs");

function checkAuthentication(req, res, next) {
    if (!req.session.authenticated) {
        res.redirect("/");
        return;
    }
    next();
}

function alreadyLoggedIn(req, res, next) {
    if (req.session.authenticated) {
        res.redirect("/home");
        return;
    }
    next();
}

const navLinks = [
    { name: "Home", url: "/home", },
    { name: "Scan Plant", url: "/scan" },
    { name: "Map", url: "/plant-map" },
    { name: "Berry Guess", url: "/plant-game" },
    { name: "My Plants", url: "/my-plants" },
    { name: "Encyclopedia", url: "/encyclopedia" },
    { name: "Profile", url: "/profile" },
    { name: "Logout", url: "/logout" }
];

var mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/${mongodb_database}`,
    crypto: {
        secret: mongodb_session_secret,
    }
});

app.use(session({
    secret: node_session_secret,
    store: mongoStore,
    saveUninitialized: false,
    resave: true
}));

app.use((req, res, next) => {
    const pathFolders = req.path.split("/").slice(1);
    const folder = "/" + pathFolders[0];
    app.locals.folder = folder;
    app.locals.navLinks = navLinks;
    next();
});

app.get("/", alreadyLoggedIn, (req, res) => {
    res.redirect("/login");
});

app.get("/signup", alreadyLoggedIn, (req, res) => {
    res.render("signup");
});

app.post("/signupSubmit", signupSubmit);

app.get("/login", alreadyLoggedIn, (req, res) => {
    res.render("login");
});

app.post("/loginSubmit", loginSubmit);

app.get("/backupLogin", alreadyLoggedIn, (req, res) => {
    res.render("backup-login");
});

app.post("/backupLoginSubmit", backupLoginSubmit);

app.get("/home", checkAuthentication, (req, res) => {
    let html = fs.readFileSync(__dirname + "/app/html/home.html", "utf8");
    res.send(html);
});

app.get("/plant-map", checkAuthentication, (req, res) => {
    let html = fs.readFileSync(__dirname + "/app/html/plant-map.html", "utf8");
    res.send(html);
});

app.use("/plant-game", gameManager);

app.get("/profile", checkAuthentication, displayUserInfo);

app.post("/updateProfile", checkAuthentication, updateUserInfo);

app.get("/changePassword", checkAuthentication, (req, res) => {
    res.render("change-password");
});

app.post("/changePasswordSubmit", checkAuthentication, verifyIdentity);

app.get("/changePasswordForm", checkAuthentication, (req, res) => {
    res.render("change-password-form");
});

app.post("/changePasswordFormSubmit", checkAuthentication, changePasswordSubmit);

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.use((req, res) => {
    res.status(404);
    res.render("404");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
