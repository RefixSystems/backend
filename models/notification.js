const mongoose = require('mongoose');
const moment = require('moment-timezone');

const notificationInfo = new mongoose.Schema({
    employeeName: {
        type: String
    },
    employeePhoneNumber: {
        type: String
    },
    title: {
        type: String
    },
    subtitle: {
        type: String
    },
    orderDetails: [{
        requestId: {type: String},
        type: {type: String},
        phoneNumber: {type: String},
        alternatePhoneNumber: {type: String},
        email: {type: String},
        dob: {type: String},
        userName: {type: String},
        query: {type: String},
        userStatus: {type: String},
        laptopBrand: {type: String},
        laptopModel: {type: String},
        note: {type: String},
        productId: {type: String},
        productType: {type: String},
        profileImage: {type: String},
        rating: {type: String},
        review: {type: String},
        brand: {type: String},
        model: {type: String},
        operatingSystem: {type: String},
        issue: {type: String},
        issueDetails: {type: String},
        typeOfOrder: {type: String},
        quantity: {type: Number},
        address: {
            type: String
        },
        message: {type: String},
        products: [{
            type: {type: String},
            image: {type: String},
            device: {type: String},
            brand: {type: String},
            model: {type: String},
            operatingSystem: {type: String},
            issue: {type: String},
            issueDetails: {type: String},
            query: {type: String},
        }],
        details: {type: String}
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

const notificationModel = mongoose.model('notification', notificationInfo);
module.exports = notificationModel;