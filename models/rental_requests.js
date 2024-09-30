const mongoose = require('mongoose');
const moment = require('moment-timezone');

const rentalRequestsInfo = new mongoose.Schema({
    requestId: {
        type: String
    },
    laptopId: {
        type: String
    },
    amountForOneMonth: {
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
    idProof: {
        type: String
    },
    aadharNumber: {
        type: Number
    },
    rentalPeriod: {
        type: String
    },
    purposeOfRental: {
        type: String
    },
    transactionId: {
        type: String
    },
    initialAmountPaidThrough: {
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
    quotationConfirmation: {
        type: String
    },
    type: {
        type: String
    },    
    couponCode: {
        type: String
    },
    couponType: {
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

const rentalRequestsModel = mongoose.model('rental_request', rentalRequestsInfo);
module.exports = rentalRequestsModel;