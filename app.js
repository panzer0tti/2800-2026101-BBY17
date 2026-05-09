require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const app = express();
const PORT = process.env.PORT || 3000;

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

app.use(express.urlencoded({extended: false}));
app.use(express.static(__dirname + "/public"));
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
  res.redirect('/login');
});

app.get('/signup', (req, res) => {
    res.send(`
        <h2>Create User</h2>
        <form action='/signupSubmit' method='post'>
            <input name='name' type='text' placeholder='name'><br>
            <input name='email' type='email' placeholder='email'><br>
            <input name='password' type='password' placeholder='password'><br>
            <button>Submit</button>
            <p>Already have an account? <a href='/login'>Log in</a></p>
        </form>
    `);
});

app.post('/signupSubmit', signupSubmit);

app.get('/login', (req, res) => {
    res.send(`
        <h2>Log in</h2>
        <form action='/loginSubmit' method='post'>
            <input name='email' type='email' placeholder='email'><br>
            <input name='password' type='password' placeholder='password'><br>
            <button>Submit</button>
            <p>Don't have an account? <a href='/signup'>Create one</a></p>
        </form>
    `);
});

app.post('/loginSubmit', loginSubmit);

app.get('/members', (req, res) => {
    if (!req.session.authenticated) {
        res.redirect('/');
        return;
    }

    res.send(`<h1>Hello, ${req.session.name}.</h1>
              <a href='/logout'><button>Sign out</button></a>`);
});

app.get('/logout', logout);

app.use((req, res) => {
    res.status(404);
    res.send("Page not found - 404");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
