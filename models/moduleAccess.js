const mongoose = require('mongoose');
const moment = require('moment-timezone');

const moduleAccessInfo = new mongoose.Schema({
    roleOfEmployee: {
        type: String
    },
    modules: [{
        name: {type: String},
        moduleName: {type: String},
        read: {type: Boolean},
        write: {type: Boolean},
        fullAccess: {type: Boolean}
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

const moduleAccessModel = mongoose.model('module_access', moduleAccessInfo);
module.exports = moduleAccessModel;