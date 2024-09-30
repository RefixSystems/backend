const mongoose = require("mongoose");
const moment = require("moment-timezone");

const emailTemplateInfo = new mongoose.Schema(
  {
    templateName: {
      type: String,
    },
    subject: {
      type: String,
    },
    body: {
      type: String,
    },
    createdAt: {
      type: String,
    },
    updatedAt: {
      type: String,
    },
  },
  {
    timestamps: {
      currentTime: () =>
        moment.tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
    },
  }
);

const emailTemplateModel = mongoose.model("email_template", emailTemplateInfo);
module.exports = emailTemplateModel;
