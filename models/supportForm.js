const mongoose = require('mongoose');
const moment = require('moment-timezone');

const supportFormInfo = new mongoose.Schema({
    supportId: {
        type: String
    },
    phoneNumber: {
        type: String
    },
    userName: {
        type: String
    },
    email: {
        type: String
    },   
    type: {
        type: String
    },
    message: {
        type: String
    },
    adminComments: {
        type: String
    },
    status: {
        type: String
    },
    doneBy: {
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

const supportFormModel = mongoose.model('support', supportFormInfo);
module.exports = supportFormModel;