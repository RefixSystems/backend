const mongoose = require('mongoose');
const moment = require('moment-timezone');

const aboutUsInfo = new mongoose.Schema({
    type: {
        type: String
    },
    
    title: {
        type: String
    },
    text: {
        type: String
    },
    image: {
        type: String
    },      
    images: [{
        image: {type: String}
    }],
    section2: [{
        title: {
            type: String
        },
        text: {
            type: String
        },
        image: {
            type: String
        },
        type: {
            type: String
        },
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

const aboutUsModel = mongoose.model('about_us', aboutUsInfo);
module.exports = aboutUsModel;