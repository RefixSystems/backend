const mongoose = require('mongoose');
const moment = require('moment-timezone');

const serviceAreaInfo = new mongoose.Schema({
    pincode: {
        type: String
    },    
    provideService: {
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

const serviceAreaModel = mongoose.model('service_area', serviceAreaInfo);
module.exports = serviceAreaModel;