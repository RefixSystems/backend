const mongoose = require('mongoose');
const moment = require('moment-timezone');

const refurbishedRequestsInfo = new mongoose.Schema({
    requestId: {
        type: String
    },
    laptopId: {
        type: String
    },
    amount: {
        type: Number
    },
    brand: {
        type: String
    },
    model: {
        type: String
    },
    image: {
        type: String
    },
    phoneNumber: {
        type: String
    },
    alternatePhoneNumber: {
        type: String
    },
    description: {
        type: String
    },
    userName: {
        type: String
    },
    email: {
        type: String
    },
    address: {
        type: String
    },
    transactionId: {
        type: String
    },
    amount: {
        type: Number
    },
    quantity: {
        type: Number
    },
    status: {
        type: String
    },
    initialAmountPaidThrough: {
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

const refurbishedRequestsModel = mongoose.model('refurbished_request', refurbishedRequestsInfo);
module.exports = refurbishedRequestsModel;