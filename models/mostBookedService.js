const mongoose = require('mongoose');
const moment = require('moment-timezone');

const mostBookedServiceInfo = new mongoose.Schema({
    serviceName: {
        type: String
    },
    applicableSystems: [{
        type: String
    }],
    image: {
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

const mostBookedServiceModel = mongoose.model('most_bookedService', mostBookedServiceInfo);
module.exports = mostBookedServiceModel;