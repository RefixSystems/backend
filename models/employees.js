const mongoose = require('mongoose');
const moment = require('moment-timezone');

const employeesInfo = new mongoose.Schema({
    employeeId: {
        type: String
    },
    image: {
        type: String
    },
    nameOfEmployee: {
        type: String
    },  
    phoneNumber: {
        type: String
    },
    dateOfBirth: {
        type: String
    },
    roleOfEmployee: {
        type: String
    },
    email: {
        type: String
    },
    password: {
        type: String
    },
    idProof: {
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

const employeesModel = mongoose.model('employee', employeesInfo);
module.exports = employeesModel;