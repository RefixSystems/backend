const mongoose = require('mongoose');
const moment = require('moment-timezone');

const usersInfo = new mongoose.Schema({
    phoneNumber: {
        type: String
    },
    profileImage: {
        type: String
    },
    userName: {
        type: String
    },
    email: {
        type: String
    },
    dob: {
        type: String
    },
    address: [{
        address: {type: String},
        primaryAddress: {type: Boolean},
    }],
    password: {
        type: String
    },
    createdAt: {
        type: String
    },
    updatedAt: {
        type: String
    }
}, {
    timestamps: {
        currentTime: () => moment.tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss")
    }
});

const usersModel = mongoose.model('user', usersInfo);
module.exports = usersModel;