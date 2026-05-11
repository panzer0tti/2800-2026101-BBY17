require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const app = express();
const PORT = process.env.PORT || 2800;

const fs = require('fs');

// const bcrypt = require('bcrypt');
// const saltRounds = 12;
// const expireTime = 60 * 60 * 1000;
// const Joi = require("joi");

// const {database} = require('./mongoDBConnection');
// const userCollection = database.db(mongodb_database).collection('users');

const mongoSanitizer = require('mongo-sanitizer').default;

const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const node_session_secret = process.env.NODE_SESSION_SECRET;

const {signupSubmit, loginSubmit, logout} = require('./public/js/authentication');

app.set('view engine', 'ejs'); 

app.use(express.urlencoded({extended: false}));
app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + '/app/html'));
app.use(express.json());

app.use(mongoSanitizer(
    {replaceWith: '_'}
));

var mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/${mongodb_database}`,
    crypto: {
        secret: mongodb_session_secret
    }
});

app.use(session({
    secret: node_session_secret,
    store: mongoStore, 
    saveUninitialized: false, 
    resave: true,
}));

app.get('/', (req, res) => {
    if (req.session.authenticated) {
        res.redirect('/members');
        return;
    }
    res.redirect('/login');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signupSubmit', signupSubmit);

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/loginSubmit', loginSubmit);

app.get('/members', (req, res) => {
    if (!req.session.authenticated) {
        res.redirect('/');
        return;
    }

    let html = fs.readFileSync(__dirname + '/app/html/home.html', 'utf8');
    res.send(html);
});

app.get('/logout', logout);

app.use((req, res) => {
    res.status(404);
    res.render('404');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
