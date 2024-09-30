const mongoose = require('mongoose');
const moment = require('moment-timezone');

const rentLaptopInfo = new mongoose.Schema({
    amountFor6Months: {
        type: String
    },
    image: {
        type: String
    },
    images: [{
        type: String
    }],
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

const rentLaptopModel = mongoose.model('rental_laptop', rentLaptopInfo);
module.exports = rentLaptopModel;