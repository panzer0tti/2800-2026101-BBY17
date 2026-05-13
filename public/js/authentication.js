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

    const schema = Joi.object({
        name: Joi.string().max(20).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).max(64).pattern(/[A-Z]/)
                     .pattern(/[a-z]/).pattern(/[0-9]/).required()
    });

    const validationResult = schema.validate({name, email, password});
    if (validationResult.error != null) {
        const accountError = findAccountError(name, email, password);
        sendErrorMessage(res, accountError, "/signup");
        return;
    }

    const existingUser = await userCollection.findOne({email: email});
    if (existingUser) {
        sendErrorMessage(res, "Email is already in use.", "/signup");
        return;
    }

    var hashedPassword = await bcrypt.hash(password, saltRounds);
    await userCollection.insertOne({name: name, email: email, password: hashedPassword, firstTime: true});

    makeNewSession(req, name, true);
    res.redirect('/home');
}

async function loginSubmit(req, res) {
    var email = req.body.email;
    var password = req.body.password;

    const schema = Joi.string().email().required();
    const validationResult = schema.validate(email);

    if (validationResult.error != null) {
        sendErrorMessage(res, "Invalid email format.", "/login");
        return;
    }

    const result = await userCollection.find({email: email})
                                       .project({name: 1, email: 1, password: 1, firstTime: 1, _id: 1})
                                       .toArray();

    if (result.length == 0) {
        sendErrorMessage(res, "User not found.", "/login");
        return;
    }

    if (await bcrypt.compare(password, result[0].password)) {
        if (result[0].firstTime) {
            await userCollection.updateOne({email: email}, {$set: {firstTime: false}});
        }

        const name = result[0].name;
        makeNewSession(req, name, false);
        res.redirect('/home');
    } else {
        sendErrorMessage(res, "Invalid password.", "/login");
    }
}

function findAccountError(name, email, password) {
    if (name.length == 0 || email.length == 0 || password.length == 0) {
        return "All fields are required.";
    }
    if (password.length < 8 || password.length > 64) {
        return "Password must be between 8 and 64 characters.";
    }
    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter.";
    }
    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter.";
    }
    if (!/[0-9]/.test(password)) {
        return "Password must contain at least one number.";
    }
    return null;
}

function sendErrorMessage(res, message, link) {
    res.render("errorMessage", {
        message: message,
        link: link
    });
}

function makeNewSession(req, name, firstTime) {
    req.session.authenticated = true;
    req.session.name = name;
    req.session.firstTime = firstTime;
    req.session.cookie.maxAge = expireTime;
}

module.exports = {signupSubmit, loginSubmit};
