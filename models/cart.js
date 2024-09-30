const mongoose = require('mongoose');
const moment = require('moment-timezone');

const cartInfo = new mongoose.Schema({
    phoneNumber: {
        type: String
    },
    products: [{
        type: {type: String},
        image: {type: String},
        images: [{type: String}],
        device: {type: String},
        issue: {type: String},
        issueDetails: {type: String},
        laptopId: {type: String},
        brand: {type: String},
        model: {type: String},
        processor: {type: String},
        ram: {type: String},
        screenSize: {type: String},
        color: {type: String},
        description: {type: String},
        purposeOfRental: {type: String},
        operatingSystem: {type: String},
        rentalPeriod: {type: String},
        amount: {type: Number},
        quantity: {type: Number},
        reviews: [
          { rating: {type: String}}
        ],
        createdAt: {type: String},
        updatedAt: {type: String}
    }],
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

const cartModel = mongoose.model('cart', cartInfo);
module.exports = cartModel;