require('dotenv').config();

// const bcrypt = require('bcrypt');
// const Joi = require("joi");
// const saltRounds = 12;
// const expireTime = 60 * 60 * 1000;

const mongodb_database = process.env.MONGODB_DATABASE;

const {database} = require('./mongoDBConnection');
const userLevelsCollection = database.db(mongodb_database).collection('user_levels');


