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
        res.send(`Error: ${validationResult.error.message}. <a href='/signup'>Try again</a>`);
        return;
    }

    const existingUser = await userCollection.findOne({email: email});
    if (existingUser) {
        res.send(`Email is already in use. <a href='/signup'>Try again</a>`);
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
        res.send("User not found. <a href='/login'>Try again</a>");
        return;
    }

    const result = await userCollection.find({email: email})
                                       .project({name: 1, email: 1, password: 1, firstTime: 1, _id: 1})
                                       .toArray();

    if (result.length == 0) {
        res.send("User not found. <a href='/login'>Try again</a>");
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
        res.send("Invalid password. <a href='/login'>Try again</a>");
    }
}

function logout(req, res) {
    req.session.destroy();
    res.redirect('/');
}

module.exports = {signupSubmit,loginSubmit,logout};
