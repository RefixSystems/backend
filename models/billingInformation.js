const mongoose = require('mongoose');
const moment = require('moment-timezone');

const billingInfoInfo = new mongoose.Schema({
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
    totalOrders: {
        type: Number
    },
    orderCreatedOn: {
        type: String
    },
    orderCompletedOn: {
        type: String
    },   
    initialAmount: {
        type: Number
    },
    finalAmount: {
        type: Number
    },
    labourCharges: {
        type: Number
    },
    serviceCharges: {
        type: Number
    },
    finalAmountPaid: {
        type: Number
    },   
    totalChargesBeforeGST: {
        type: Number
    },
    GST: {
        type: Number
    },
    initialAmountGST: {
        type: Number
    },
    totalCharges: {
        type: Number
    },
    toBePaid: {
        type: Number
    },   
    paidThrough: {
        type: String
    },
    transactionId: {
        type: String
    },
    typeOfService: {
        type: String
    },
    details: [{
        description: {
            type: String
        },
        component: {
            type: String
        },
        serviceCharge: {
            type: Number
        },
        labourCharge: {
            type: Number
        },
    }],
    logo: {
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

const billingInfoModel = mongoose.model('billing_information', billingInfoInfo);
module.exports = billingInfoModel;