const mongoose = require('mongoose');
const moment = require('moment-timezone');

const productReviewInfo = new mongoose.Schema({
    productId: {
        type: String
    },
    productType: {
        type: String
    },
    reviewId: {
        type: String
    },
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
    images: [{
        type: String
    }],
    status: {
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

const productReviewModel = mongoose.model('reviews_products', productReviewInfo);
module.exports = productReviewModel;