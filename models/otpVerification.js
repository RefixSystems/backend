const mongoose = require('mongoose');
const moment = require('moment-timezone');

const otpVerificationInfo = new mongoose.Schema({
    phoneNumber: {
        type: String
    },    
    code: {
        type: String
    },
    email: {
        type: String
    },
    expiresAt: {
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

const otpVerificationModel = mongoose.model('otp_verification', otpVerificationInfo);
module.exports = otpVerificationModel;