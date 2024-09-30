const mongoose = require('mongoose');
const moment = require('moment-timezone');

const orderInfo = new mongoose.Schema({
    requestId: {
        type: String
    },
    totalOrders: {
        type: Number
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
    image: {
        type: String
    },
    type: {
        type: String
    },
    details: {
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
    initialAmountPaidThrough: {
        type: String
    },
    quotationConfirmation: {
        type: String
    },
    status: {
        type: String
    },
    couponCode: {
        type: String
    },
    couponValue: {
        type: Number
    },
    notes: {
        type: String
    },
    assignedTo: {
        type: String
    },
    assignedOn: {
        type: String
    },
    technicianComments: {
        type: String
    },
    closedOn: {
        type: String
    },
    paidThrough: {
        type: String
    },
    finalTransactionId: {
        type: String
    },
    finalAmountPaid: {
        type: Number
    },
    totalAmountPaid: {
        type: Number
    },
    customerLocationReached: {
        type: Boolean
    },
    billGenerated: {
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

const orderModel = mongoose.model('order', orderInfo);
module.exports = orderModel;