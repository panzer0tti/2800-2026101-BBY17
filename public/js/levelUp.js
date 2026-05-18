require('dotenv').config();

const mongodb_database = process.env.MONGODB_DATABASE;

const {database} = require('./mongoDBConnection');
const userLevelsCollection = database.db(mongodb_database).collection('user_levels');


