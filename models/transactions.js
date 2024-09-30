const mongoose = require('mongoose');
const moment = require('moment-timezone');

const transactionInfo = new mongoose.Schema({
    phoneNumber: {
        type: String
    },
    amount: {
        type: Number
    },
    requestId: {
        type: String
    },
    transactionId: {
        type: String
    },
    couponCode: {
        type: String
    },
    couponValue: {
        type: Number
    },    
    type: [{
        type: String
      }],
      modeOfPayment: {
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

const transactionModel = mongoose.model('transaction', transactionInfo);
module.exports = transactionModel;