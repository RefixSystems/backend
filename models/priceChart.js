const mongoose = require('mongoose');
const moment = require('moment-timezone');

const priceChartInfo = new mongoose.Schema({
    component: {
        type: String
    },
    description: {
        type: String
    },
    serviceCharge: {
        type: Number
    },
    labourCharge: {
        type: Number
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

const priceChartModel = mongoose.model('price_chart', priceChartInfo);
module.exports = priceChartModel;