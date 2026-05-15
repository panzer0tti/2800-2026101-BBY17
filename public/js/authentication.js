require('dotenv').config();
const bcrypt = require('bcrypt');
const Joi = require("joi");

const saltRounds = 12;
const expireTime = 60 * 60 * 1000;

const mongodb_database = process.env.MONGODB_DATABASE;

const {database} = require('./mongoDBConnection');
const userCollection = database.db(mongodb_database).collection('users');

async function signupSubmit(req, res) {
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;
    var question = req.body.question;
    var answer = req.body.answer;

    const schema = Joi.object({
        name: Joi.string().max(20).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).max(20).pattern(/[A-Z]/)
                     .pattern(/[a-z]/).pattern(/[0-9]/).required(),
        question: Joi.string().required(),
        answer: Joi.string().max(20).required()
    });

    const validationResult = schema.validate({name, email, password, question, answer});
    if (validationResult.error != null) {
        const signupError = findSignupError(name, email, password, question, answer);
        sendErrorMessage(res, signupError, "/signup");
        return;
    }

    const existingUser = await userCollection.findOne({email: email});
    if (existingUser) {
        sendErrorMessage(res, ["Email is already in use."], "/signup");
        return;
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const hashedAnswer = await bcrypt.hash(answer, saltRounds);
    await userCollection.insertOne({name: name.trim(), email: email, password: hashedPassword, question: question, answer: hashedAnswer, firstTime: true});

    makeNewSession(req, name.trim(), email, true);
    res.redirect('/home');
}

async function loginSubmit(req, res) {
    var email = req.body.email;
    var password = req.body.password;

    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    });
    
    const validationResult = schema.validate({email, password});
    if (validationResult.error != null) {
        const loginError = findLoginError(email, password);
        sendErrorMessage(res, loginError, "/login");
        return;
    }

    const result = await userCollection.find({email: email})
                                       .project({name: 1, email: 1, password: 1, firstTime: 1, _id: 1})
                                       .toArray();

    if (result.length == 0) {
        sendErrorMessage(res, ["User not found."], "/login");
        return;
    }

    if (await bcrypt.compare(password, result[0].password)) {
        if (result[0].firstTime) {
            await userCollection.updateOne({email: email}, {$set: {firstTime: false}});
        }

        const sessionName = result[0].name;
        const sessionEmail = result[0].email;
        makeNewSession(req, sessionName, sessionEmail, false);
        res.redirect('/home');
    } else {
        sendErrorMessage(res, ["Incorrect password."], "/login");
    }
}

async function backupLoginSubmit(req, res) {
    var email = req.body.email;
    var question = req.body.question;
    var answer = req.body.answer;

    const schema = Joi.object({
        email: Joi.string().email().required(),
        question: Joi.string().required(),
        answer: Joi.string().max(20).required()
    });
    
    const validationResult = schema.validate({email, question, answer});
    if (validationResult.error != null) {
        const backupLoginError = findBackupLoginError(email, question, answer);
        sendErrorMessage(res, backupLoginError, "/backupLogin");
        return;
    }

    const result = await userCollection.find({email: email})
                                       .project({email: 1, question: 1, answer: 1, _id: 1})
                                       .toArray();
    
    if (result.length == 0) {
        sendErrorMessage(res, ["User not found."], "/backupLogin");
        return;
    }

    if (result[0].question !== question) {
        sendErrorMessage(res, ["Incorrect security question."], "/backupLogin");
        return;
    }

    if (await bcrypt.compare(answer, result[0].answer)) {
        const sessionName = result[0].name;
        const sessionEmail = result[0].email;
        makeNewSession(req, sessionName, sessionEmail, false);
        res.redirect('/home');
    } else {
        sendErrorMessage(res, ["Incorrect answer."], "/backupLogin");
    }
}

function findSignupError(name, email, password, question, answer) {
    let signupError = [];
    if (!question || emptyEntrySubmitted(name, email, password, question, answer)) {
        signupError.push("Please fill in all fields.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        signupError.push("Please enter a valid email address.");
    }
    if (name.length > 20) {
        signupError.push("Name must be less than 20 characters.");
    }
    if (answer.length > 20) {
        signupError.push("Answer must be less than 20 characters.");
    }
    if (password.length < 8 || password.length > 20) {
        signupError.push("Password must be between 8 and 20 characters.");
    }
    if (!/[A-Z]/.test(password)) {
        signupError.push("Password must contain at least one uppercase letter.");
    }
    if (!/[a-z]/.test(password)) {
        signupError.push("Password must contain at least one lowercase letter.");
    }
    if (!/[0-9]/.test(password)) {
        signupError.push("Password must contain at least one digit.");
    }
    return signupError || null;
}

function findLoginError(email, password) {
    let loginError = [];
    if (email.length == 0 || password.length == 0) {
        loginError.push("Please fill in all fields.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        loginError.push("Please enter a valid email address.");
    }
    return loginError || null;
}

function findBackupLoginError(email, question, answer) {
    let backupLoginError = [];
    if (email.length == 0 || question.length == 0 || answer.length == 0) {
        backupLoginError.push("Please fill in all fields.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        backupLoginError.push("Please enter a valid email address.");
    }
    return backupLoginError || null;
}

function emptyEntrySubmitted(name, email, password, question, answer) {
    return name.length == 0 ||
           email.length == 0 ||
           password.length == 0 ||
           question.length == 0 ||
           answer.length == 0;
}

function sendErrorMessage(res, message, link) {
    res.render("popup-message", {
        message: message,
        link: link,
        button: "Try Again",
        alertType: "danger"
    });
}

function makeNewSession(req, name, email, firstTime) {
    req.session.authenticated = true;
    req.session.name = name;
    req.session.email = email;
    req.session.firstTime = firstTime;
    req.session.cookie.maxAge = expireTime;
}

module.exports = {signupSubmit, loginSubmit, backupLoginSubmit, sendErrorMessage};
