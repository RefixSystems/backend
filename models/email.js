const mongoose = require('mongoose');
const moment = require('moment-timezone');

const emailInfo = new mongoose.Schema({
    phoneNumber: {
        type: String
    },
    email: {
        type: String
    },
    templateName: {
        type: String
    },
    subject: {
        type: String
    },
    body: {
        type: String
    },
    type: {
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

const emailModel = mongoose.model('email', emailInfo);
module.exports = emailModel;