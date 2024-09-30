const mongoose = require('mongoose');
const moment = require('moment-timezone');

const customConfigurationsInfo = new mongoose.Schema({
    supportId: {
        type: String
    },  
    phoneNumber: {
        type: String
    },  
    userName: {
        type: String
    },
    email: {
        type: String
    },  
    processor: {
        type: String
    },    
    operatingSystem: {
        type: String
    },
    ram: {
        type: String
    },
    screenSize: {
        type: String
    },
    quantity: {
        type: Number
    },
    type: {
        type: String
    },  
    message: {
        type: String
    },      
    note: {
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

const customConfigurationsModel = mongoose.model('custom_laptop_requests', customConfigurationsInfo);
module.exports = customConfigurationsModel;