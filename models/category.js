const mongoose = require('mongoose');
const moment = require('moment-timezone');

const categoryInfo = new mongoose.Schema({
    category: {
        type: String
    },
    image: {
        type: String
    },
    status: {
        type: String
    },
    showInHomePage: {
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

const categoryModel = mongoose.model('category', categoryInfo);
module.exports = categoryModel;