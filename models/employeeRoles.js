const mongoose = require('mongoose');
const moment = require('moment-timezone');

const employeeRolesInfo = new mongoose.Schema({
    nameOfRole: {
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

const employeeRolesModel = mongoose.model('employee_role', employeeRolesInfo);
module.exports = employeeRolesModel;