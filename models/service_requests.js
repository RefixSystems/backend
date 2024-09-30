const mongoose = require('mongoose');
const moment = require('moment-timezone');

const serviceRequestsInfo = new mongoose.Schema({
    requestId: {
        type: String
    },
    phoneNumber: {
        type: String
    },
    alternatePhoneNumber: {
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
    device: {
        type: String
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
    operatingSystem: {
        type: String
    },
    issue: {
        type: String
    },
    issueDetails: {
        type: String
    },
    transactionId: {
        type: String
    },
    amount: {
        type: Number
    },      
    GST: {
        type: Number
    },
    totalAmountPaid: {
        type: Number
    },
    initialAmountPaidThrough: {
        type: String
    },
    status: {
        type: String
    },
    type: {
        type: String
    },
    couponCode: {
        type: String
    },
    couponValue: {
        type: Number
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

const serviceRequestsModel = mongoose.model('service_request', serviceRequestsInfo);
module.exports = serviceRequestsModel;