const mongoose = require('mongoose');
const moment = require('moment-timezone');

const couponCodeInfo = new mongoose.Schema({
    image: {
        type: String
    },
    limit: {
        type: Number
    },
    code: {
        type: String
    },
    value: {
        type: Number
    },
    title: {
        type: String
    },
    description: {
        type: String
    },
    applicable: {type: String},
    startDate: {
        type: String
    },
    endDate: {
        type: String
    },
    status: {
        type: String
    },
    redemeedUsers: [{
        phoneNumber: {type: String}
    }],
    createdAt: {
        type: String
    },
    updatedAt: {
        type: String
    },
}, {
    timestamps: {
        currentTime: () => moment.tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss")
    }
});

const couponCodeModel = mongoose.model("coupon_code", couponCodeInfo);
module.exports = couponCodeModel;