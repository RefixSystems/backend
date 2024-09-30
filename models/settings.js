const mongoose = require('mongoose');
const moment = require('moment-timezone');

const settingsInfo = new mongoose.Schema({
    nameOfCredentials: {
        type: String
    },
    type: {
        type: String
    },
    image: {
        type: String
    },
    credentialsKey: {
        type: String
    },
    credentialsValue: {
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

const settingsModel = mongoose.model('settings', settingsInfo);
module.exports = settingsModel;