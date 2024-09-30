const mongoose = require('mongoose');
const moment = require('moment-timezone');

const chatBotInfo = new mongoose.Schema({
    phoneNumber: {
        type: String
    },
    userName: {
        type: String
    },
    email: {
        type: String
    },
    query: {
        type: String
    },
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

const chatBotModel = mongoose.model('chatbot', chatBotInfo);
module.exports = chatBotModel;