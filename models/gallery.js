const mongoose = require('mongoose');
const moment = require('moment-timezone');

const galleryInfo = new mongoose.Schema({
    location: {
        type: String
    },
    address: {
        type: String
    },
    landline: {
        type: String
    },
    mobile: {
        type: String
    },
    images: [{
        image: {type: String}
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

const galleryModel = mongoose.model('gallery', galleryInfo);
module.exports = galleryModel;