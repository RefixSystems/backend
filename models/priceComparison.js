const mongoose = require('mongoose');
const moment = require('moment-timezone');

const priceComparisonInfo = new mongoose.Schema({
    nameOfFeature: {
        type: String
    },    
    serviceCenter: {
        type: Boolean
    },
    localShop: {
        type: Boolean
    },
    ourServices: {
        type: Boolean
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

const priceComparisonModel = mongoose.model('price_comparison', priceComparisonInfo);
module.exports = priceComparisonModel;