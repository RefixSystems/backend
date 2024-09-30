const mongoose = require('mongoose');
const moment = require('moment-timezone');

const deviceInfo = new mongoose.Schema({
    image: {
        type: String
    },
    deviceName: {
        type: String
    },
    issues: [{
        issueName: {type: String},
        issueImage: {type: String},
        createdAt: {type: String},
        updatedAt: {type: String},
    }],
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

const deviceModel = mongoose.model('device', deviceInfo);
module.exports = deviceModel;