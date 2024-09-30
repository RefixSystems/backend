const mongoose = require('mongoose');
const moment = require('moment-timezone');

const callbackRequestInfo = new mongoose.Schema({
    phoneNumber: {
        type: String
    },
    userName: {
        type: String
    },
    email: {
        type: String
    },
    message: {
        type: String
    },
    status: {
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

const callbackRequestModel = mongoose.model('callback_request', callbackRequestInfo);
module.exports = callbackRequestModel;