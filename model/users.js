const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    'name': {
        type: String,
        unique: true,
    },
    'email': String,
    'password': String,
    'type': String,
    'todos': [
        {
            "name": String,
            "done": {
                type: Boolean,
                default: false
            }
        }
    ]
});

const sessionSchema = mongoose.Schema({
    session: String
});

const userModel = mongoose.model('users', userSchema);
const sessionModel = mongoose.model('session', sessionSchema);

exports.userModel = userModel;
exports.sessionModel = sessionModel;

module.exports= {userModel, sessionModel}