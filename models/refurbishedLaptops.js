const mongoose = require('mongoose');
const moment = require('moment-timezone');

const refurbishedLaptopInfo = new mongoose.Schema({
    image: {
        type: String
    },
    images: [{
        type: String
    }],
    amount: {
        type: Number
    },
    brand: {
        type: String
    },
    model: {
        type: String
    },
    processor: {
        type: String
    },
    ram: {
        type: String
    },
    screenSize: {
        type: String
    },
    storage: {
        type: String
    },
    color: {
        type: String
    },
    operatingSystem: {
        type: String
    },
    description: {
        type: String
    },
    status: {
        type: String
    },
    addInCarousel: {
        type: Boolean
    },
    type: {
        type: String
    },
    reviews: [{
        userName: {type: String},
        phoneNumber: {type: String},
        profileImage: {type: String},
        rating: {type: String},
        review: {type: String},
        status: {type: String},
        images: [{type: String}],
        date: {type: String}
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

const refurbishedLaptopModel = mongoose.model('refurbished_laptop', refurbishedLaptopInfo);
module.exports = refurbishedLaptopModel;