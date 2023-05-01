const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: String,
    email: String,
    password: String
});

const sessionSchema = mongoose.Schema({
    session: String
});

const userModel = mongoose.model('users', userSchema);
const sessionModel = mongoose.model('session', sessionSchema);

exports.userModel = userModel;
exports.sessionModel = sessionModel;

module.exports= {userModel, sessionModel}