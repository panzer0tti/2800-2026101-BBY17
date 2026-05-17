require("dotenv").config();

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const mongoose = require("mongoose");
const mongoSanitizer = require("mongo-sanitizer").default;

const app = express();
const PORT = process.env.PORT || 2800;

const fs = require("fs");
const multer = require('multer');
const axios = require('axios');

const upload = multer({ dest: 'uploads/' });

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/app/html"));
app.use(express.json());

app.use(mongoSanitizer({ replaceWith: "_" }));

const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;

const mongoURL = `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/${mongodb_database}`;

mongoose
  .connect(mongoURL)
  .then(() => {
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed: ", err);
  });

const {checkAuthentication, alreadyLoggedIn,
       renderPage, HTMLRender} = require("./public/js/appHelper");
const {signupSubmit, loginSubmit,
       backupLoginSubmit} = require("./public/js/authentication");
const {displayUserInfo, updateUserInfo} = require("./public/js/profileData");
const {verifyIdentity, changePasswordSubmit} = require("./public/js/changePassword");
const gameManager = require("./public/js/gameManager");

// const {title} = require("process");
// console.log(title);

const navLinksUnauth = [
  { name: "Welcome", url: "/" },
  { name: "Sign Up", url: "/signup" },
  { name: "Log In", url: "/login" },
  { name: "Backup Log In", url: "/backupLogin" },
];

const navLinksAuth = [
  { name: "Home", url: "/home" },
  { name: "Scan Plant", url: "/scan" },
  { name: "Plant Map", url: "/plant-map" },
  { name: "My Plants", url: "/my-plants" },
  { name: "Encyclopedia", url: "/encyclopedia" },
  { name: "Plant Games", url: "/plant-game" },
  { name: "Profile", url: "/profile" },
  { name: "Logout", url: "/logout" },
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
app.get("/scan", checkAuthentication, (req, res) => {
  HTMLRender(res, "scan.html");
});

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

app.post('/api/scan', upload.single('plantImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ name: "Error", prep: "No image file was received by the server." });
        }

        // ADDED THIS LINE: Require form-data package
        const FormData = require('form-data'); 

        // Prepare the image file for Pl@ntNet
        const imageStream = fs.createReadStream(req.file.path);
        const formData = new FormData();
        formData.append('images', imageStream);

        const apiKey = process.env.PLANTNET_API_KEY || 'YOUR_PLANTNET_API_KEY'; 
        
        const plantNetResponse = await axios.post(
            `https://my-api.plantnet.org/v2/identify/all?api-key=${apiKey}`,
            formData,
            // FIXED THIS LINE: Use formData.getHeaders() for Node.js
            { headers: formData.getHeaders() } 
        );

        // Delete temporary file from our uploads folder
        fs.unlinkSync(req.file.path);

        const bestMatch = plantNetResponse.data.results[0];
        const speciesName = bestMatch.species.scientificNameWithoutAuthor;
        const confidenceScore = Math.round(bestMatch.score * 100) + "%";

        const realPlantData = {
            name: speciesName, 
            ripeStatus: "Determined by species", 
            inSeason: "Check local climate",
            safety: bestMatch.score > 0.5 ? "Verified Species" : "Uncertain Match",
            confidence: confidenceScore, 
            lookalike: "Cross-referencing database...",
            allergy: "Handle with standard caution",
            prep: "Always cross-reference wild plants with an expert guide before consuming."
        };

        res.json(realPlantData);

    } catch (err) {
        console.error("Pl@ntNet API Error:", err.response ? err.response.data : err.message);
        
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ name: "Scan Failed", prep: "The AI service was unable to identify this image." });
    }
});

// 404 Page-not-found Error Page
app.use((req, res) => {
  res.status(404);
  renderPage(req, res, "404", "404 - Page not found");
});
