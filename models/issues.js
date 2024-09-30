const mongoose = require('mongoose');
const moment = require('moment-timezone');

const issueInfo = new mongoose.Schema({
    image: {
        type: String
    },
    issue: {
        type: String
    },
    mostBookedService: {
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

const issueModel = mongoose.model('issue', issueInfo);
module.exports = issueModel;