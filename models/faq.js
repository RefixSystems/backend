const mongoose = require('mongoose');
const moment = require('moment-timezone');

const faqInfo = new mongoose.Schema({
    subtitle: {
        type: String
    },
    question: {
        type: String
    },
    answer: {
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

const faqModel = mongoose.model('faq', faqInfo);
module.exports = faqModel;