require('dotenv').config();
const bcrypt = require('bcrypt');
const Joi = require("joi");
const saltRounds = 12;

const mongodb_database = process.env.MONGODB_DATABASE;

const {database} = require('./mongoDBConnection');
const {sendErrorMessage} = require('./authentication');
const userCollection = database.db(mongodb_database).collection('users');

async function verifyIdentity(req, res) {
    const email = req.session.email;
    const question = req.body.question;
    const answer = req.body.answer;

    const schema = Joi.object({
        question: Joi.string().required(),
        answer: Joi.string().max(20).required()
    });

    const validationResult = schema.validate({question, answer});
    if (validationResult.error != null) {
        const identityError = findIdentityError(question, answer);
        sendErrorMessage(req, res, "Invalid Input", identityError, "/changePassword", "Change Password");
        return;
    }

    const user = await userCollection.findOne({email: email});
    if (user.question !== question) {
        sendErrorMessage(req, res, "Incorrect Security Question", ["Incorrect security question."], "/changePassword", "Change Password");
        return;
    }

    if (await bcrypt.compare(answer, user.answer)) {
        res.redirect("/changePasswordForm");
    } else {
        sendErrorMessage(req, res, "Incorrect Answer", ["Incorrect answer."], "/changePassword", "Change Password");
    }
}

function findIdentityError(question, answer) {
    let identityError = [];
    if (!question || question.length == 0 || answer.length == 0) {
        identityError.push("Please fill in all fields.");
    }
    if (answer.length > 20) {
        identityError.push("Answer must be at most 20 characters long.");
    }
    return identityError || null;
}

async function changePasswordSubmit(req, res) {
    const email = req.session.email;
    const newPassword = req.body.newPassword;
    const confirmPassword = req.body.confirmPassword;

    const schema = Joi.object({
        newPassword: Joi.string().min(8).max(20).pattern(/[A-Z]/)
                     .pattern(/[a-z]/).pattern(/[0-9]/).required(),
        confirmPassword: Joi.string().required()
    });

    const validationResult = schema.validate({newPassword, confirmPassword});
    if (validationResult.error != null) {
        const passwordError = findPasswordError(newPassword, confirmPassword);
        sendErrorMessage(req, res, "Invalid Input", passwordError, "/changePasswordForm", "Change Password");
        return;
    }

    if (newPassword !== confirmPassword) {
        sendErrorMessage(req, res, "Password Mismatch", ["New password and confirm password do not match."], "/changePasswordForm", "Change Password");
        return;
    }

    const user = await userCollection.findOne({email: email});
    if (await bcrypt.compare(newPassword, user.password)) {
        sendErrorMessage(req, res, "Identical Password", ["New password cannot be the same as the old password."], "/changePasswordForm", "Change Password");
        return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    await userCollection.updateOne({email: email}, {$set: {password: hashedPassword}});
    sendSuccessMessage(req, res, "Password Changed", ["Password changed successfully."], "/profile", "Profile");
}

function findPasswordError(newPassword, confirmPassword) {
    let passwordError = [];
    if (newPassword.length == 0 || confirmPassword.length == 0) {
        passwordError.push("Please fill in all fields.");
    }
    if (newPassword.length < 8 || newPassword.length > 20) {
        passwordError.push("New password must be between 8 and 20 characters.");
    }
    if (!/[A-Z]/.test(newPassword)) {
        passwordError.push("New password must contain at least one uppercase letter.");
    }
    if (!/[a-z]/.test(newPassword)) {
        passwordError.push("New password must contain at least one lowercase letter.");
    }
    if (!/[0-9]/.test(newPassword)) {
        passwordError.push("New password must contain at least one digit.");
    }
    return passwordError || null;
}

function sendSuccessMessage(req, res, title, message, link, button) {
    res.render("popup-message", {
        title: title,
        message: message,
        link: link,
        button: "Go to " + button,
        alertType: "success",
        user: req.session.authenticated,
        cssFiles: []
    });
}

module.exports = {verifyIdentity, changePasswordSubmit};
