const mongoose = require('mongoose');
const moment = require('moment-timezone');

const quotationInfo = new mongoose.Schema({
    requestId: {
        type: String
    },
    type: {
        type: String
    },
    phoneNumber: {
        type: String
    },
    alternatePhoneNumber: {
        type: String
    },
    userName: {
        type: String
    },
    email: {
        type: String
    },
    address: {
        type: String
    },
    notes: {
        type: String
    },
    amount: {
        type: Number
    },
    initialAmountPaidThrough: {type: String},
        laptopId: {type: String},
    // products: [{
    //     requestId: {type: String},
    //     phoneNumber: {type: String},
    //     alternatePhoneNumber: {type: String},
    //     type: {type: String},
    //     image: {type: String},
    //     device: {type: String},
    //     issue: {type: String},
    //     issueDetails: {type: String},
    //     laptopId: {type: String},
    //     brand: {type: String},
    //     model: {type: String},
    //     quantity: {type: Number},
    //     operatingSystem: {type:String},
    //     address: {type:String},
    // }],
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

const quotationModel = mongoose.model('quotation_requests', quotationInfo);
module.exports = quotationModel;

// const mongoose = require('mongoose');
// const moment = require('moment-timezone');

// const quotationInfo = new mongoose.Schema({
//     phoneNumber: {
//         type: String
//     },
    // userName: {
    //     type: String
    // },
    // email: {
    //     type: String
    // },
//     laptopId: {
//         type: String
//     },
//     laptopBrand: {
//         type: String
//     },
//     laptopModel: {
//         type: String
//     },
//     device: {
//         type: String
//     },
//     issue: {
//         type: String
//     },
//     issueDetails: {
//         type: String
//     },
//     amount: {
//         type: Number
//     },
//     coupon: {
//         type: String
//     },
//     image: {
//         type: String
//     },
    // bookingAddress: {
    //     type: String
    // },
    // shippingAddress: {
    //     type: String
    // },
//     type: {
//         type: String
//     },
    // note: {
    //     type: String
    // },
//     status: {
//         type: String
//     },
//     createdAt: {
//         type: String
//     },
//     updatedAt: {
//         type: String
//     }
// }, {
//     timestamps: {
//         currentTime: () => moment.tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss")
//     }
// });

// const quotationModel = mongoose.model('quotation_requests', quotationInfo);
// module.exports = quotationModel;