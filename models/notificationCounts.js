const mongoose = require('mongoose');
const moment = require('moment-timezone');

const notificationCountInfo = new mongoose.Schema({
    type: {
        type: String
    },
    details: [{
        employeePhoneNumber: {type: String},
        count: {type: Number},
        updatedAt: {type: String}
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

const notificationCountModel = mongoose.model('notification_count', notificationCountInfo);
module.exports = notificationCountModel;