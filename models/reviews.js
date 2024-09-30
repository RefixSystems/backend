const mongoose = require('mongoose');
const moment = require('moment-timezone');

const reviewInfo = new mongoose.Schema({
    phoneNumber: {
        type: String
    },
    userName: {
        type: String
    },
    profileImage: {
        type: String
    },
    rating: {
        type: String
    },
    review: {
        type: String
    },
    status: {
        type: String
    },
    showInHomePage: {
        type: String
    },
    images: [{type: String}],
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

const reviewModel = mongoose.model('review', reviewInfo);
module.exports = reviewModel;