require('dotenv').config();
const Joi = require("joi");

const mongodb_database = process.env.MONGODB_DATABASE;

const {database} = require('./mongoDBConnection');
const {sendErrorMessage} = require('./authentication');
const userCollection = database.db(mongodb_database).collection('users');

async function displayUserInfo(req, res) {
    const email = req.session.email;
    const user = await userCollection.findOne({email: email});
    res.render("profile", {
        title: "Profile",
        user: req.session.authenticated,
        cssFiles: [],
        name: user.name,
        location: user.city,
        phoneNum: user.phoneNum,
        jsFile: "profile.js"
    });
}

async function updateUserInfo(req, res) {
    const email = req.session.email;
    const tempName = req.body.name;
    const tempLocation = req.body.location;
    const phoneNum = req.body.phoneNum;

    const isValid = validateUserInfo(req, res, tempName, tempLocation, phoneNum);
    if (!isValid) {
        return;
    }

    const name = tempName.trim();
    const location = toTitleCase(tempLocation.trim());
    await userCollection.updateOne({email: email}, {$set: {name: name, city: location, phoneNum: phoneNum}});
    res.redirect("/profile");
}

function validateUserInfo(req, res, name, location, phoneNum) {
    const schema = Joi.object({
        name: Joi.string().max(20).required(),
        location: Joi.string().max(20).allow(''),
        phoneNum: Joi.string().pattern(/^\d{3}-\d{3}-\d{4}$/).allow('')
    });

    const validationResult = schema.validate({name, location, phoneNum});
    if (validationResult.error) {
        const profileDataError = findProfileDataError(name, location, phoneNum);
        sendErrorMessage(req, res, "Invalid Input", profileDataError, "/profile", "Profile");
        return false;
    }
    return true;
}

function findProfileDataError(name, location, phoneNum) {
    let profileDataError = [];
    if (!name && !location && !phoneNum) {
        return ["Do not press 'Save' without editing any fields."];
    }
    if (name.length == 0) {
        profileDataError.push("Name is required.");
    }
    if (name.length > 20) {
        profileDataError.push("Name must be less than 20 characters.");
    }
    if (location.length > 20) {
        profileDataError.push("Location must be less than 20 characters.");
    }
    if (phoneNum.length > 0 && !/^\d{3}-\d{3}-\d{4}$/.test(phoneNum)) {
        profileDataError.push("Phone number must be in the format XXX-XXX-XXXX.");
    }
    return profileDataError || null;
}

function toTitleCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

module.exports = {displayUserInfo, updateUserInfo};