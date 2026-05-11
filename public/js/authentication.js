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
        res.render("errorMessage", {
            message: validationResult.error.message,
            link: "/signup"
        });
        return;
    }

    const existingUser = await userCollection.findOne({email: email});
    if (existingUser) {
        res.render("errorMessage", {
            message: "Email is already in use.",
            link: "/signup"
        });
        return;
    }

    var hashedPassword = await bcrypt.hash(password, saltRounds);
    await userCollection.insertOne({name: name, email: email, password: hashedPassword, firstTime: true});

    req.session.authenticated = true;
    req.session.name = name;
    req.session.firstTime = true;
    req.session.cookie.maxAge = expireTime;
    res.redirect('/members');
}

async function loginSubmit(req, res) {
    var email = req.body.email;
    var password = req.body.password;

    const schema = Joi.string().email().required();
    const validationResult = schema.validate(email);

    if (validationResult.error != null) {
        res.render("errorMessage", {
            message: "Invalid email format.",
            link: "/login"
        });
        return;
    }

    const result = await userCollection.find({email: email})
                                       .project({name: 1, email: 1, password: 1, firstTime: 1, _id: 1})
                                       .toArray();

    if (result.length == 0) {
        res.render("errorMessage", {
            message: "User not found.",
            link: "/login"
        });
        return;
    }

    if (await bcrypt.compare(password, result[0].password)) {
        req.session.authenticated = true;
        req.session.name = result[0].name;
        req.session.cookie.maxAge = expireTime;

        if (result[0].firstTime) {
            await userCollection.updateOne({email: email}, {$set: {firstTime: false}});
        }

        req.session.firstTime = result[0].firstTime;
        res.redirect('/members');
    } else {
        res.render("errorMessage", {
            message: "Invalid password.",
            link: "/login"
        });
    }
}

function logout(req, res) {
    req.session.destroy();
    res.redirect('/');
}

module.exports = {signupSubmit, loginSubmit, logout};
