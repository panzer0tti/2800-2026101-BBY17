require("dotenv").config();
require("./public/js/utils.js");

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const app = express();
const PORT = process.env.PORT || 2800;

const fs = require("fs");
const multer = require('multer');
const axios = require('axios');

const upload = multer({ dest: 'uploads/' });

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

const {signupSubmit, loginSubmit} = require("./public/js/authentication");
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
    }
});

app.use(session({
    secret: node_session_secret,
    store: mongoStore,
    saveUninitialized: false,
    resave: true
}));

app.get("/", (req, res) => {
    if (req.session.authenticated) {
        res.redirect("/home");
        return;
    }
    res.redirect("/login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.post("/signupSubmit", signupSubmit);

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/loginSubmit", loginSubmit);

app.get("/home", checkAuthentication, (req, res) => {
    let html = fs.readFileSync(__dirname + "/app/html/home.html", "utf8");
    res.send(html);
});

app.get("/plant-map", checkAuthentication, (req, res) => {
    let html = fs.readFileSync(__dirname + "/app/html/plant-map.html", "utf8");
    res.send(html);
});

app.use("/plant-game", gameManager);

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect('/');
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

app.use((req, res) => {
    res.status(404);
    res.render("404");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});