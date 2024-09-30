const express = require("express");
const router = express.Router();
const multer = require("multer");
const rentLaptopModel = require("../models/rentLaptops");
const upload = multer();
var admin = require("firebase-admin");
const serviceAccount = require("../firebase.json");
const nodemailer = require("nodemailer");
const refurbishedLaptopModel = require("../models/refurbishedLaptops");
const issueModel = require("../models/issues");
const emailModel = require("../models/email");
const usersModel = require("../models/users");
const transactionModel = require("../models/transactions");
const reviewModel = require("../models/reviews");
const serviceRequestsModel = require("../models/service_requests");
const rentalRequestsModel = require("../models/rental_requests");
const refurbishedRequestsModel = require("../models/refurbished_requests");
const productReviewModel = require("../models/productReviews");
const categoryModel = require("../models/category");
const supportFormModel = require("../models/supportForm");
const settingsModel = require("../models/settings");
const quotationModel = require("../models/quotations");
const orderModel = require("../models/orders");
const couponCodeModel = require("../models/couponCode");
const cron = require("node-cron");
const axios = require("axios");
const moment = require("moment-timezone");
const employeesModel = require("../models/employees");
const employeeRolesModel = require("../models/employeeRoles");
const moduleAccessModel = require("../models/moduleAccess");
const { trusted, default: mongoose } = require("mongoose");
const notificationModel = require("../models/notification");
const galleryModel = require("../models/gallery");
const deviceModel = require("../models/devices");

const { ObjectId } = require("mongodb");
const xlsx = require("xlsx");
const fs = require("fs");
const mostBookedServiceModel = require("../models/mostBookedService");
const cartModel = require("../models/cart");
const emailTemplateModel = require("../models/emailTemplate");
const priceChartModel = require("../models/priceChart");
const faqModel = require("../models/faq");
const aboutUsModel = require("../models/aboutUs");
const priceComparisonModel = require("../models/priceComparison");
const upload1 = multer({ storage: multer.memoryStorage() });
const AWS = require("aws-sdk");
const billingInfoModel = require("../models/billingInformation");
const customConfigurationsModel = require("../models/customConfigurations");
const notificationCountModel = require("../models/notificationCounts");
const serviceAreaModel = require("../models/serviceArea");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "meetinground-464c9.appspot.com",
  });
}

async function getToken() {
  try {
    const country = await settingsModel.findOne({
      credentialsKey: "MESSAGE_CENTRAL_COUNTRY",
    });
    const cid = await settingsModel.findOne({
      credentialsKey: "MESSAGE_CENTRAL_CID",
    });
    const key = await settingsModel.findOne({
      credentialsKey: "MESSAGE_CENTRAL_KEY",
    });
    const url = `https://cpaas.messagecentral.com/auth/v1/authentication/token?country=${country.credentialsValue}&customerId=${cid.credentialsValue}&key=${key.credentialsValue}&scope=NEW`;

    // const url = `https://cpaas.messagecentral.com/auth/v1/authentication/token?country=${process.env.COUNTRY}&customerId=${process.env.CID}&key=${process.env.KEY}&scope=NEW`;
    const response = await axios.get(url);
    return response.data.token;
  } catch (error) {
    console.error("Error fetching token:", error.message);
    throw error;
  }
}

const allowedImageExtensions = [".jpg", ".jpeg", ".png", ".svg", ".webp"];

const isValidImageExtension = (filename) => {
  const extension = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return allowedImageExtensions.includes(extension);
};

const allowedFileExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".svg",
  ".webp",
  ".mp4",
  ".avi",
  ".mov",
  ".mkv",
];

const isValidFileExtension = (filename) => {
  const extension = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return allowedFileExtensions.includes(extension);
};

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

function getRandomGenerationId() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// cron.schedule("* * * * *", async (req, res) => {
//   try {
//     const now = moment().format("DD/MM/YYYY");
//     const pendingCoupons = await couponCodeModel.find({
//       startDate: now,
//       status: "Pending",
//     });
//     for (const coupon of pendingCoupons) {
//       await couponCodeModel.findOneAndUpdate(
//         { _id: coupon._id },
//         { $set: { status: "Active" } },
//         { new: true }
//       );
//     }

//     const activeCoupons = await couponCodeModel.find({
//       endDate: { $lte: now },
//     });
//     for (const coupon of activeCoupons) {
//       await couponCodeModel.findOneAndUpdate(
//         { _id: coupon._id },
//         { $set: { status: "InActive" } },
//         { new: true }
//       );
//     }
//   } catch (error) {
//     console.error({ error: error.message });
//     res.status(500).send({ error: "Error in CRON schedule" });
//   }
// });

cron.schedule("* * * * *", async (req, res) => {
  try {
    const activeCouponsss = await couponCodeModel.find({ status: "Active" });
    for (const coupon of activeCouponsss) {
      if (coupon.redemeedUsers.length >= coupon.limit) {
        await couponCodeModel.findOneAndUpdate(
          { _id: coupon._id },
          { $set: { status: "InActive" } },
          { new: true }
        );
      }
    }
    const now = moment().tz("Asia/Kolkata").format("DD/MM/YYYY");
    const pendingCoupons = await couponCodeModel.find({
      startDate: now,
      status: "Pending",
    });
    for (const coupon of pendingCoupons) {
      await couponCodeModel.findOneAndUpdate(
        { _id: coupon._id },
        { $set: { status: "Active" } },
        { new: true }
      );
    }

    const activeCoupons = await couponCodeModel.find({
      endDate: { $lte: now },
    });
    for (const coupon of activeCoupons) {
      await couponCodeModel.findOneAndUpdate(
        { _id: coupon._id },
        { $set: { status: "InActive" } },
        { new: true }
      );
    }
  } catch (error) {
    console.error({ error: error.message });
    res.status(500).send({ error: "Error in CRON schedule" });
  }
});

router.post("/login1", async (req, res) => {
  const { userName, password } = req.body;
  try {
    if (userName === "admin01@gmail.com") {
      if (
        (userName === "admin01@gmail.com" || userName === "8978722969") &&
        password === "admin@123"
      ) {
        return res
          .status(200)
          .send({
            message: "Login Successfull!",
            role: "Admin",
            phoneNumber: "+918978722969",
          });
      } else {
        return res.status(400).send({ error: "Incorrect Credentials!" });
      }
    } else {
      let query = {};
      if (userName.includes("@")) {
        query = { email: userName };
      } else {
        let phoneNumber = userName.trim();

        if (!phoneNumber.startsWith("+91")) {
          phoneNumber = `+91${phoneNumber}`;
        }
        query = { phoneNumber: phoneNumber };
      }

      const validEmployee = await employeesModel.findOne({
        ...query,
        status: "Active",
      });
      if (!validEmployee) {
        return res.status(404).send({ error: "Invalid Credentials!" });
      }
      if (validEmployee.password === password) {
        return res.status(200).send({
          message: "Login Successfull!",
          role: validEmployee.roleOfEmployee,
          phoneNumber: validEmployee.phoneNumber,
        });
      } else {
        return res.status(400).send({ error: "Incorrect Credentials!" });
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

router.post("/login", async (req, res) => {
  const { userName, password } = req.body;
  try {

      let query = {};
      if (userName.includes("@")) {
        query = { email: userName };
      } else {
        let phoneNumber = userName.trim();

        if (!phoneNumber.startsWith("+91")) {
          phoneNumber = `+91${phoneNumber}`;
        }
        query = { phoneNumber: phoneNumber };
      }

      const validEmployee = await employeesModel.findOne({
        ...query,
        status: "Active",
      });
      if (!validEmployee) {
        return res.status(404).send({ error: "Invalid Credentials!" });
      }
      if (validEmployee.password === password) {
        return res.status(200).send({
          message: "Login Successfull!",
          role: validEmployee.roleOfEmployee,
          phoneNumber: validEmployee.phoneNumber,
          email: validEmployee.email
        });
      } else {
        return res.status(400).send({ error: "Incorrect Credentials!" });
      }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// firstOne
router.get("/viewUsers1/:role/:phoneNumber/:search?", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const searchString = req.params.search || "";
  const role = req.params.role;
  let phoneNumber = req.params.phoneNumber;
  try {
    let moduleAccess;
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "user" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "user"
      );
    }

    if (!phoneNumber.startsWith("+91")) {
      phoneNumber = `+91${phoneNumber}`;
    }

    console.log(phoneNumber);
    const skip = (page - 1) * limit;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const escapedSearchString = searchString.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
    const searchRegex = new RegExp(escapedSearchString, "i");
    const query = {
      $or: [
        { phoneNumber: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
      ],
    };

    const response = await usersModel
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const serialNumberStart = skip + 1;
    const serialNumbers = Array.from(
      { length: response.length },
      (_, index) => serialNumberStart + index
    );

    const users = response.map((user, index) => {
      return {
        ...user.toObject(),
        s_no: serialNumbers[index],
      };
    });

    const totalItems = await usersModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const paginationInfo = {
      totalItems,
      totalPages,
      currentPage: page,
      startIndex: skip + 1,
      endIndex: skip + users.length,
      itemsPerPage: users.length,
    };

    console.log(phoneNumber);

    let userCount;
    const previousUserCountss = await notificationCountModel.findOne({
      type: "userCount",
      "details.employeePhoneNumber": phoneNumber,
    });

    const previousUserCount = previousUserCountss.details.find(
      (emp) => emp.employeePhoneNumber === phoneNumber
    );

    const currentUser = await usersModel.countDocuments();

    const userCountings = currentUser - previousUserCount.count;
    if (userCountings === currentUser) {
      userCount = 0;
    } else {
      userCount = userCountings;
    }

    // await notificationCountModel.findOneAndUpdate({type: "userCount", "details.employeePhoneNumber": phoneNumber}, {$set: {'details.$.count': currentUser}}, {new: true});

    return res
      .status(200)
      .send({
        data: users,
        pagination: paginationInfo,
        moduleAccess,
        userCount,
      });
  } catch (error) {
    console.error("Error:", error.message);
    return res
      .status(500)
      .send({
        error: "Couldn't view Users now! Please try again later",
        error1: error.message,
      });
  }
});

router.get("/viewUsers/:role/:phoneNumber/:search?", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const searchString = req.params.search || "";
  const role = req.params.role;
  let phoneNumber = req.params.phoneNumber;
  try {
    let moduleAccess;
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "user" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "user"
      );
    }

    if (!phoneNumber.startsWith("+91")) {
      phoneNumber = `+91${phoneNumber}`;
    }

    const skip = (page - 1) * limit;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const escapedSearchString = searchString.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
    const searchRegex = new RegExp(escapedSearchString, "i");
    const query = {
      $or: [
        { phoneNumber: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { userName: { $regex: searchRegex } },
      ],
    };

    const response = await usersModel
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const serialNumberStart = skip + 1;
    const serialNumbers = Array.from(
      { length: response.length },
      (_, index) => serialNumberStart + index
    );

    const users = response.map((user, index) => {
      return {
        ...user.toObject(),
        s_no: serialNumbers[index],
      };
    });

    const totalItems = await usersModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const paginationInfo = {
      totalItems,
      totalPages,
      currentPage: page,
      startIndex: skip + 1,
      endIndex: skip + users.length,
      itemsPerPage: users.length,
    };

    const previousUserCountss = await notificationCountModel.findOne({
      type: "userCount",
      "details.employeePhoneNumber": phoneNumber,
    });

    const previousUserCount = previousUserCountss.details.find(
      (emp) => emp.employeePhoneNumber === phoneNumber
    );

    const currentUserCount = await usersModel.countDocuments();

    const newUserCount = currentUserCount - (previousUserCount.count || 0);

    const remainingCounts = newUserCount - (page - 1) * limit;
    const userCount =
      remainingCounts > limit ? limit : Math.max(0, remainingCounts);
    // await notificationCountModel.findOneAndUpdate({type: "userCount", "details.employeePhoneNumber": phoneNumber}, {$set: {'details.$.count': currentUserCount}}, {new: true});

    return res
      .status(200)
      .send({
        data: users,
        pagination: paginationInfo,
        moduleAccess,
        userCount,
      });
  } catch (error) {
    console.error("Error:", error.message);
    return res
      .status(500)
      .send({
        error: "Couldn't view Users now! Please try again later",
        error1: error.message,
      });
  }
});

router.delete("/deleteUser/:id/:role", async (req, res) => {
  const { id } = req.params;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });

    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "user" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const response = await usersModel.findByIdAndDelete(id);
    if (response) {
      return res.status(200).send({ message: "User deleted successfully!" });
    } else {
      return res.status(404).send({ error: "User not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't delete User now! Please try again later" });
  }
});

// // firebase
// router.post(
//   "/addRentalLaptop/:role",
//   upload.fields([
//     { name: "image1", maxCount: 1 },
//     { name: "image2", maxCount: 1 },
//     { name: "image3", maxCount: 1 },
//     { name: "image4", maxCount: 1 },
//     { name: "image5", maxCount: 1 },
//     { name: "excelFile", maxCount: 1 },
//   ]),
//   async (req, res) => {
//     const role = req.params.role;
//     try {
//       const validUser = await moduleAccessModel.findOne({
//         roleOfEmployee: role,
//       });

//       if (
//         !validUser ||
//         !validUser.modules.some(
//           (module) =>
//             module.moduleName === "rental_laptop" && module.write === true
//         )
//       ) {
//         return res.status(403).send({ error: "You have no access to do this!" });
//       }

//       const uploadFile = async (file, fieldName) => {
//         const fileName = `${Date.now()}_${file.originalname}`;
//         const fileUpload = admin.storage().bucket().file(`images/${fileName}`);

//         return new Promise((resolve, reject) => {
//           const stream = fileUpload.createWriteStream({
//             metadata: {
//               contentType: file.mimetype,
//             },
//           });
//           stream.on("error", (err) => {
//             console.error(`Error uploading ${fieldName}:`, err);
//             reject(err);
//           });
//           stream.on("finish", async () => {
//             await fileUpload.makePublic();
//             resolve(fileUpload.publicUrl());
//           });
//           stream.end(file.buffer);
//         });
//       };

//       const processFileField = async (field, fieldName) => {
//         if (field && typeof field === "object" && field.buffer) {
//           if (!isValidImageExtension(field.originalname)) {
//             throw new Error(
//               `Invalid image type!`
//             );
//           }
//           return await uploadFile(field, fieldName);
//         }
//         return field;
//       };

//       const imageUrls = [];
//       const imageFields = ["image1", "image2", "image3", "image4", "image5"];

//       for (const fieldName of imageFields) {
//         try {
//           const imageUrl = await processFileField(
//             req.files[fieldName] ? req.files[fieldName][0] : null,
//             fieldName
//           );
//           if (imageUrl) {
//             imageUrls.push(imageUrl);
//           }
//         } catch (error) {
//           return res.status(400).send({ error: error.message });
//         }
//       }

//       if (req.files.excelFile) {
//         const file = req.files.excelFile[0];
//         const workbook = xlsx.read(file.buffer, { type: "buffer" });
//         const sheetName = workbook.SheetNames[0];
//         const sheet = workbook.Sheets[sheetName];
//         const rows = xlsx.utils.sheet_to_json(sheet);

//         const rentalLaptops = rows.map((row) => ({
//           images: imageUrls.slice(1),
//           image: imageUrls[0],
//           amountFor6Months: row.amountFor6Months,
//           brand: row.brand,
//           model: row.model,
//           processor: row.processor,
//           ram: row.ram,
//           screenSize: row.screenSize,
//           storage: row.storage,
//           color: row.color,
//           operatingSystem: row.operatingSystem,
//           description: row.description,
//           addInCarousel: row.addInCarousel === "true",
//           quantity: row.quantity,
//           status: "Active",
//           type: "Rental",
//         }));

//         await rentLaptopModel.insertMany(rentalLaptops);

//         return res
//           .status(200)
//           .send({ message: "Laptops added in Rental Section successfully!" });
//       } else {
//         const {
//           amountFor6Months,
//           brand,
//           model,
//           processor,
//           ram,
//           screenSize,
//           storage,
//           color,
//           operatingSystem,
//           description,
//           addInCarousel,
//           quantity,
//         } = req.body;

//         if (
//           !amountFor6Months ||
//           !brand ||
//           !model ||
//           !processor ||
//           !ram ||
//           !screenSize ||
//           !storage ||
//           !color ||
//           !operatingSystem ||
//           !description
//         ) {
//           return res.status(400).send({ error: "Please fill all fields!" });
//         }

//         const newRentalLaptop = new rentLaptopModel({
//           images: imageUrls.slice(1),
//           image: imageUrls[0],
//           amountFor6Months,
//           brand,
//           model,
//           processor,
//           ram,
//           screenSize,
//           storage,
//           color,
//           operatingSystem,
//           description,
//           addInCarousel,
//           quantity,
//           status: "Active",
//           type: "Rental",
//         });

//         await newRentalLaptop.save();

//         return res
//           .status(200)
//           .send({ message: "Laptop added in Rental Section successfully!" });
//       }
//     } catch (error) {
//       console.error("Error:", error.message);
//       res.status(500).send({
//         error: "Couldn't add laptop now! Please try again later",
//       });
//     }
//   }
// );

// s3
router.post(
  "/addRentalLaptop/:role",
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
    { name: "image5", maxCount: 1 },
  ]),
  async (req, res) => {
    const role = req.params.role;
    try {
      const validUser = await moduleAccessModel.findOne({
        roleOfEmployee: role,
      });

      if (
        !validUser ||
        !validUser.modules.some(
          (module) =>
            module.moduleName === "rental_laptop" && module.write === true
        )
      ) {
        return res
          .status(403)
          .send({ error: "You have no access to do this!" });
      }

      const uploadFile = async (file, fieldName) => {
        const fileName = `${Date.now()}_${file.originalname}`;
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `images/${fileName}`,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: "public-read",
        };

        return new Promise((resolve, reject) => {
          s3.upload(params, (err, data) => {
            if (err) {
              console.error(`Error uploading ${fieldName}:`, err);
              reject(err);
            } else {
              resolve(data.Location);
            }
          });
        });
      };

      const processFileField = async (field, fieldName) => {
        if (field && typeof field === "object" && field.buffer) {
          if (!isValidImageExtension(field.originalname)) {
            throw new Error(`Invalid image type!`);
          }
          return await uploadFile(field, fieldName);
        }
        return null;
      };

      const imageFields = ["image1", "image2", "image3", "image4", "image5"];
      const imageUrls = await Promise.all(
        imageFields.map(async (fieldName) => {
          const imageUrl = await processFileField(
            req.files[fieldName] ? req.files[fieldName][0] : null,
            fieldName
          );
          return imageUrl;
        })
      );

      const filteredImageUrls = imageUrls.filter((url) => url !== null);

      const {
        amountFor6Months,
        brand,
        model,
        processor,
        ram,
        screenSize,
        storage,
        color,
        operatingSystem,
        description,
        addInCarousel,
      } = req.body;

      const requiredFields = [
        "brand",
        "model",
        "processor",
        "ram",
        "screenSize",
        "storage",
        "color",
        "operatingSystem",
        "description",
      ];

      const missingFields = requiredFields.filter((field) => !req.body[field]);

      if (missingFields.length) {
        return res
          .status(400)
          .send({ error: `Missing fields: ${missingFields.join(", ")}` });
      }

      const newRentalLaptop = new rentLaptopModel({
        images: filteredImageUrls.slice(1),
        image: filteredImageUrls[0],
        amountFor6Months: amountFor6Months || null,
        brand,
        model,
        processor,
        ram,
        screenSize,
        storage,
        color,
        operatingSystem,
        description,
        addInCarousel: false,
        status: "Active",
        type: "Rental",
      });

      await newRentalLaptop.save();

      return res
        .status(200)
        .send({ message: "Laptop added in Rental Section successfully!" });
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).send({
        error: "Couldn't add laptop now! Please try again later",
      });
    }
  }
);

router.get("/viewRentalLaptops/:role/:search?", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const searchString = req.params.search || "";
  const role = req.params.role;
  try {
    let moduleAccess;
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "rental_laptop" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "rental_laptop"
      );
    }

    const skip = (page - 1) * limit;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const searchRegex = new RegExp(searchString, "i");
    const query = {
      $or: [
        {
          _id: ObjectId.isValid(searchString)
            ? new ObjectId(searchString)
            : null,
        },
        { brand: { $regex: searchRegex } },
        { model: { $regex: searchRegex } },
        { processor: { $regex: searchRegex } },
        { ram: { $regex: searchRegex } },
        { screenSize: { $regex: searchRegex } },
        { storage: { $regex: searchRegex } },
        { color: { $regex: searchRegex } },
        { operatingSystem: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
      ],
    };

    const response = await rentLaptopModel
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const serialNumberStart = skip + 1;
    const serialNumbers = Array.from(
      { length: response.length },
      (_, index) => serialNumberStart + index
    );

    const rentalLaptops = response.map((laptops, index) => {
      return {
        ...laptops.toObject(),
        s_no: serialNumbers[index],
      };
    });

    const totalItems = await rentLaptopModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = page;

    const paginationInfo = {
      totalItems,
      totalPages,
      currentPage,
      startIndex: skip + 1,
      endIndex: skip + rentalLaptops.length,
      itemsPerPage: rentalLaptops.length,
    };

    return res
      .status(200)
      .send({ data: rentalLaptops, pagination: paginationInfo, moduleAccess });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view laptops now! Please try again later" });
  }
});

router.get("/viewRentalLaptopById/:id/:role", async (req, res) => {
  const { id } = req.params;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });

    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "rental_laptop" && module.read === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }
    const response = await rentLaptopModel.findById(id);
    if (response) {
      return res.status(200).send({ data: response });
    } else {
      return res.status(404).send({ error: "Laptop not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view laptops now! Please try again later" });
  }
});

// // firebase
// router.patch(
//   "/updateRentalLaptop/:id/:role",
//   upload.fields([
//     { name: "image1", maxCount: 1 },
//     { name: "image2", maxCount: 1 },
//     { name: "image3", maxCount: 1 },
//     { name: "image4", maxCount: 1 },
//     { name: "image5", maxCount: 1 },
//   ]),
//   async (req, res) => {
//     const {
//       amountFor6Months,
//       brand,
//       model,
//       processor,
//       ram,
//       screenSize,
//       storage,
//       color,
//       operatingSystem,
//       description,
//       addInCarousel,
//       quantity,
//       status,
//     } = req.body;

//     const { id } = req.params;
//     const role = req.params.role;

//     try {
//       const validUser = await moduleAccessModel.findOne({
//         roleOfEmployee: role,
//       });
//       if (
//         !validUser ||
//         !validUser.modules.some(
//           (module) =>
//             module.moduleName === "rental_laptop" && module.fullAccess === true
//         )
//       ) {
//         return res
//           .status(403)
//           .send({ error: "You have no access to do this!" });
//       }

//       const existingLaptop = await rentLaptopModel.findById(id);
//       if (!existingLaptop) {
//         return res.status(404).send({ error: "Laptop not found!" });
//       }

//       const uploadFile = async (file, fieldName) => {
//         const fileName = `${Date.now()}_${file.originalname}`;
//         const fileUpload = admin.storage().bucket().file(`images/${fileName}`);
//         return new Promise((resolve, reject) => {
//           const stream = fileUpload.createWriteStream({
//             metadata: {
//               contentType: file.mimetype,
//             },
//           });
//           stream.on("error", (err) => {
//             console.error(`Error uploading ${fieldName}:`, err);
//             reject(err);
//           });
//           stream.on("finish", async () => {
//             await fileUpload.makePublic();
//             resolve(fileUpload.publicUrl());
//           });
//           stream.end(file.buffer);
//         });
//       };

//       const processFileField = async (field, fieldName) => {
//         if (field && typeof field === "object" && field.buffer) {
//           if (!isValidImageExtension(field.originalname)) {
//             throw new Error("Invalid image type!");
//           }
//           return await uploadFile(field, fieldName);
//         }
//         return null;
//       };

//       const imageFields = ["image1", "image2", "image3", "image4", "image5"];

//       for (const fieldName of imageFields) {
//         try {
//           const imageUrl = await processFileField(
//             req.files[fieldName] ? req.files[fieldName][0] : null,
//             fieldName
//           );
//           if (imageUrl) {
//             if (fieldName === "image1") {
//               existingLaptop.image = imageUrl;
//             } else {
//               existingLaptop.images[imageFields.indexOf(fieldName) - 1] = imageUrl;
//             }
//           }
//         } catch (error) {
//           return res.status(400).send({ error: error.message });
//         }
//       }

//       if (amountFor6Months)
//         existingLaptop.amountFor6Months = amountFor6Months;
//       if (brand) existingLaptop.brand = brand;
//       if (model) existingLaptop.model = model;
//       if (processor) existingLaptop.processor = processor;
//       if (ram) existingLaptop.ram = ram;
//       if (screenSize) existingLaptop.screenSize = screenSize;
//       if (storage) existingLaptop.storage = storage;
//       if (color) existingLaptop.color = color;
//       if (operatingSystem) existingLaptop.operatingSystem = operatingSystem;
//       if (description) existingLaptop.description = description;
//       if (addInCarousel) existingLaptop.addInCarousel = addInCarousel;
//       if (quantity) existingLaptop.quantity = quantity;
//       if (status) existingLaptop.status = status;

//       await existingLaptop.save();

//       return res
//         .status(200)
//         .send({ message: "Laptop updated in Rental Section successfully!" });
//     } catch (error) {
//       console.error("Error:", error.message);
//       res
//         .status(500)
//         .send({ error: "Couldn't update laptop now! Please try again later" });
//     }
//   }
// );

// s3
router.patch(
  "/updateRentalLaptop/:id/:role",
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
    { name: "image5", maxCount: 1 },
  ]),
  async (req, res) => {
    const {
      amountFor6Months,
      brand,
      model,
      processor,
      ram,
      screenSize,
      storage,
      color,
      operatingSystem,
      description,
      addInCarousel,
      status,
    } = req.body;

    const { id } = req.params;
    const role = req.params.role;

    try {
      const validUser = await moduleAccessModel.findOne({
        roleOfEmployee: role,
      });
      if (
        !validUser ||
        !validUser.modules.some(
          (module) =>
            module.moduleName === "rental_laptop" && module.fullAccess === true
        )
      ) {
        return res
          .status(403)
          .send({ error: "You have no access to do this!" });
      }

      const existingLaptop = await rentLaptopModel.findById(id);
      if (!existingLaptop) {
        return res.status(404).send({ error: "Laptop not found!" });
      }

      const uploadFile = async (file, fieldName) => {
        const fileName = `${Date.now()}_${file.originalname}`;

        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `images/${fileName}`,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: "public-read",
        };

        return new Promise((resolve, reject) => {
          s3.upload(params, (err, data) => {
            if (err) {
              console.error(`Error uploading ${fieldName}:`, err);
              reject(err);
            } else {
              resolve(data.Location);
            }
          });
        });
      };

      const processFileField = async (field, fieldName) => {
        if (field && typeof field === "object" && field.buffer) {
          if (!isValidImageExtension(field.originalname)) {
            throw new Error("Invalid image type!");
          }
          return await uploadFile(field, fieldName);
        }
        return null;
      };

      const imageFields = ["image1", "image2", "image3", "image4", "image5"];

      for (const fieldName of imageFields) {
        try {
          const imageUrl = await processFileField(
            req.files[fieldName] ? req.files[fieldName][0] : null,
            fieldName
          );
          if (imageUrl) {
            if (fieldName === "image1") {
              existingLaptop.image = imageUrl;
            } else {
              existingLaptop.images[imageFields.indexOf(fieldName) - 1] =
                imageUrl;
            }
          }
        } catch (error) {
          return res.status(400).send({ error: error.message });
        }
      }

      if (amountFor6Months) existingLaptop.amountFor6Months = amountFor6Months;
      if (brand) existingLaptop.brand = brand;
      if (model) existingLaptop.model = model;
      if (processor) existingLaptop.processor = processor;
      if (ram) existingLaptop.ram = ram;
      if (screenSize) existingLaptop.screenSize = screenSize;
      if (storage) existingLaptop.storage = storage;
      if (color) existingLaptop.color = color;
      if (operatingSystem) existingLaptop.operatingSystem = operatingSystem;
      if (description) existingLaptop.description = description;
      if (addInCarousel) existingLaptop.addInCarousel = addInCarousel;
      if (status) existingLaptop.status = status;

      await existingLaptop.save();

      return res
        .status(200)
        .send({ message: "Laptop updated in Rental Section successfully!" });
    } catch (error) {
      console.error("Error:", error.message);
      res
        .status(500)
        .send({ error: "Couldn't update laptop now! Please try again later" });
    }
  }
);

router.delete("/deleteRentalLaptop1/:id/:role", async (req, res) => {
  const { id } = req.params;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "rental_laptop" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const response = await rentLaptopModel.findOneAndDelete({ _id: id });

    if (response) {
      return res.status(200).send({ message: "Laptop deleted successfully!" });
    } else {
      return res.status(404).send({ error: "Laptop not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't delete laptop now! Please try again later" });
  }
});

router.delete("/deleteRentalLaptop/:id/:role", async (req, res) => {
  const { id } = req.params;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "rental_laptop" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const existLaptop = await rentLaptopModel.findOne({ _id: id });
    if (!existLaptop) {
      return res.status(404).send({ error: "Product not found!" });
    }

    const availOrders = await rentalRequestsModel.find({ laptopId: id });

    const unClosedOrders = [];
    if (availOrders.length > 0) {
      for (const order of availOrders) {
        if (order.status !== "Completed") {
          unClosedOrders.push(order);
        }
      }
    }

    if (unClosedOrders.length > 0) {
      return res
        .status(400)
        .send({ error: "There are some orders associated with this Product!" });
    } else {
      const existReview = await productReviewModel.find({ productId: id });
      if (existReview.length > 0) {
        await productReviewModel.deleteMany({ productId: id });
      }

      await rentLaptopModel.findOneAndDelete({ _id: id });

      return res.status(200).send({ message: "Laptop deleted successfully!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't delete laptop now! Please try again later" });
  }
});

// // firebase
// router.post(
//   "/addRefurbishedLaptop/:role",
//   upload.fields([
//     { name: "image1", maxCount: 1 },
//     { name: "image2", maxCount: 1 },
//     { name: "image3", maxCount: 1 },
//     { name: "image4", maxCount: 1 },
//     { name: "image5", maxCount: 1 },
//   ]),
//   async (req, res) => {
//     const {
//       amount,
//       brand,
//       model,
//       processor,
//       ram,
//       screenSize,
//       storage,
//       color,
//       operatingSystem,
//       description,
//       addInCarousel,
//       quantity,
//     } = req.body;
//     const role = req.params.role;
//     try {
//       const validUser = await moduleAccessModel.findOne({
//         roleOfEmployee: role,
//       });

//       if (
//         !validUser ||
//         !validUser.modules.some(
//           (module) =>
//             module.moduleName === "refurbished_laptop" && module.write === true
//         )
//       ) {
//         return res
//           .status(403)
//           .send({ error: "You have no access to do this!" });
//       }

//       if (
//         !amount ||
//         !brand ||
//         !model ||
//         !processor ||
//         !ram ||
//         !screenSize ||
//         !storage ||
//         !color ||
//         !operatingSystem ||
//         !description
//       ) {
//         return res.status(400).send({ error: "Please fill all fields!" });
//       }
//       const uploadFile = async (file, fieldName) => {
//         const fileName = `${Date.now()}_${file.originalname}`;
//         const fileUpload = admin.storage().bucket().file(`images/${fileName}`);
//         return new Promise((resolve, reject) => {
//           const stream = fileUpload.createWriteStream({
//             metadata: {
//               contentType: file.mimetype,
//             },
//           });
//           stream.on("error", (err) => {
//             console.error(`Error uploading ${fieldName}:`, err);
//             reject(err);
//           });
//           stream.on("finish", async () => {
//             await fileUpload.makePublic();
//             resolve(fileUpload.publicUrl());
//           });
//           stream.end(file.buffer);
//         });
//       };

//       const processFileField = async (field, fieldName) => {
//         if (field && typeof field === "object" && field.buffer) {
//           if(!isValidImageExtension(field.originalname)){
//             throw new Error("Invalid image type!");
//           }
//           return await uploadFile(field, fieldName);
//         }
//         return field;
//       };

//       const imageUrls = [];
//       const imageFields = ["image1", "image2", "image3", "image4", "image5"];

//       for (const fieldName of imageFields) {
//         try{
//         const imageUrl = await processFileField(
//           req.files[fieldName] ? req.files[fieldName][0] : null,
//           fieldName
//         );
//         if (imageUrl) {
//           imageUrls.push(imageUrl);
//         }
//       }catch(error){
//         return res.status(400).send({error: error.message});
//       }
//       }

//       const newRefurbishedLaptop = new refurbishedLaptopModel({
//         images: imageUrls.slice(1),
//         image: imageUrls[0],
//         amount,
//         brand,
//         model,
//         processor,
//         ram,
//         screenSize,
//         storage,
//         color,
//         operatingSystem,
//         description,
//         addInCarousel: false,
//         quantity,
//         status: "Active",
//         type: "Refurbished",
//       });
//       await newRefurbishedLaptop.save();

//       return res
//         .status(200)
//         .send({ message: "Laptop added in Refurbished Section successfully!" });
//     } catch (error) {
//       console.error("Error:", error.message);
//       res
//         .status(500)
//         .send({ error: "Couldn't add laptop now! Please try again later" });
//     }
//   }
// );

// s3
router.post(
  "/addRefurbishedLaptop/:role",
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
    { name: "image5", maxCount: 1 },
  ]),
  async (req, res) => {
    const {
      amount,
      brand,
      model,
      processor,
      ram,
      screenSize,
      storage,
      color,
      operatingSystem,
      description,
      addInCarousel,
    } = req.body;
    const role = req.params.role;
    try {
      const validUser = await moduleAccessModel.findOne({
        roleOfEmployee: role,
      });

      if (
        !validUser ||
        !validUser.modules.some(
          (module) =>
            module.moduleName === "refurbished_laptop" && module.write === true
        )
      ) {
        return res
          .status(403)
          .send({ error: "You have no access to do this!" });
      }

      if (
        !brand ||
        !model ||
        !processor ||
        !ram ||
        !screenSize ||
        !storage ||
        !color ||
        !operatingSystem ||
        !description
      ) {
        return res.status(400).send({ error: "Please fill all fields!" });
      }
      const uploadFile = async (file, fieldName) => {
        const fileName = `${Date.now()}_${file.originalname}`;
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `images/${fileName}`,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: "public-read",
        };

        return new Promise((resolve, reject) => {
          s3.upload(params, (err, data) => {
            if (err) {
              console.error(`Error uploading ${fieldName}:`, err);
              reject(err);
            } else {
              resolve(data.Location);
            }
          });
        });
      };

      const processFileField = async (field, fieldName) => {
        if (field && typeof field === "object" && field.buffer) {
          if (!isValidImageExtension(field.originalname)) {
            throw new Error("Invalid image type!");
          }
          return await uploadFile(field, fieldName);
        }
        return field;
      };

      const imageFields = ["image1", "image2", "image3", "image4", "image5"];
      const imageUrls = [];

      for (const fieldName of imageFields) {
        try {
          const imageUrl = await processFileField(
            req.files[fieldName] ? req.files[fieldName][0] : null,
            fieldName
          );
          if (imageUrl) {
            imageUrls.push(imageUrl);
          }
        } catch (error) {
          return res.status(400).send({ error: error.message });
        }
      }

      const newRefurbishedLaptop = new refurbishedLaptopModel({
        images: imageUrls.slice(1),
        image: imageUrls[0],
        amount: amount || null,
        brand,
        model,
        processor,
        ram,
        screenSize,
        storage,
        color,
        operatingSystem,
        description,
        addInCarousel: false,
        status: "Active",
        type: "Refurbished",
      });
      await newRefurbishedLaptop.save();

      return res
        .status(200)
        .send({ message: "Laptop added in Refurbished Section successfully!" });
    } catch (error) {
      console.error("Error:", error.message);
      res
        .status(500)
        .send({ error: "Couldn't add laptop now! Please try again later" });
    }
  }
);

router.get("/viewRefurbishedLaptops/:role/:search?", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const searchString = req.params.search || "";
  const role = req.params.role;
  try {
    let moduleAccess;
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "refurbished_laptop" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "refurbished_laptop"
      );
    }

    const skip = (page - 1) * limit;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const searchRegex = new RegExp(searchString, "i");
    const query = {
      $or: [
        {
          _id: ObjectId.isValid(searchString)
            ? new ObjectId(searchString)
            : null,
        },
        { brand: { $regex: searchRegex } },
        { model: { $regex: searchRegex } },
        { processor: { $regex: searchRegex } },
        { ram: { $regex: searchRegex } },
        { screenSize: { $regex: searchRegex } },
        { storage: { $regex: searchRegex } },
        { color: { $regex: searchRegex } },
        { operatingSystem: { $regex: searchRegex } },
      ],
    };

    const response = await refurbishedLaptopModel
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const serialNumberStart = skip + 1;
    const serialNumbers = Array.from(
      { length: response.length },
      (_, index) => serialNumberStart + index
    );

    const refurbishedLaptops = response.map((laptops, index) => {
      return {
        ...laptops.toObject(),
        s_no: serialNumbers[index],
      };
    });

    const totalItems = await refurbishedLaptopModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = page;

    const paginationInfo = {
      totalItems,
      totalPages,
      currentPage,
      startIndex: skip + 1,
      endIndex: skip + refurbishedLaptops.length,
      itemsPerPage: refurbishedLaptops.length,
    };

    return res.status(200).send({
      data: refurbishedLaptops,
      pagination: paginationInfo,
      moduleAccess,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view laptops now! Please try again later" });
  }
});

router.get("/viewRefurbishedLaptopById/:id/:role", async (req, res) => {
  const { id } = req.params;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "refurbished_laptop" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    }

    const response = await refurbishedLaptopModel.findById(id);
    if (response) {
      return res.status(200).send({ data: response });
    } else {
      return res.status(404).send({ error: "Laptop not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view laptops now! Please try again later" });
  }
});

// // firebase
// router.patch(
//   "/updateRefurbishedLaptop/:id/:role",
//   upload.fields([
//     { name: "image1", maxCount: 1 },
//     { name: "image2", maxCount: 1 },
//     { name: "image3", maxCount: 1 },
//     { name: "image4", maxCount: 1 },
//     { name: "image5", maxCount: 1 },
//   ]),
//   async (req, res) => {
//     const {
//       amount,
//       brand,
//       model,
//       processor,
//       ram,
//       screenSize,
//       storage,
//       color,
//       operatingSystem,
//       description,
//       addInCarousel,
//       quantity,
//       status,
//     } = req.body;

//     const { id } = req.params;
//     const role = req.params.role;

//     try {
//       const validUser = await moduleAccessModel.findOne({
//         roleOfEmployee: role,
//       });
//       if (
//         !validUser ||
//         !validUser.modules.some(
//           (module) =>
//             module.moduleName === "refurbished_laptop" &&
//             module.fullAccess === true
//         )
//       ) {
//         return res
//           .status(403)
//           .send({ error: "You have no access to do this!" });
//       }

//       const existingLaptop = await refurbishedLaptopModel.findById(id);
//       if (!existingLaptop) {
//         return res.status(404).send({ error: "Laptop not found!" });
//       }

//       const uploadFile = async (file, fieldName) => {
//         const fileName = `${Date.now()}_${file.originalname}`;
//         const fileUpload = admin.storage().bucket().file(`images/${fileName}`);
//         return new Promise((resolve, reject) => {
//           const stream = fileUpload.createWriteStream({
//             metadata: {
//               contentType: file.mimetype,
//             },
//           });
//           stream.on("error", (err) => {
//             console.error(`Error uploading ${fieldName}:`, err);
//             reject(err);
//           });
//           stream.on("finish", async () => {
//             await fileUpload.makePublic();
//             resolve(fileUpload.publicUrl());
//           });
//           stream.end(file.buffer);
//         });
//       };

//       const processFileField = async (field, fieldName) => {
//         if (field && typeof field === "object" && field.buffer) {
//           if (!isValidImageExtension(field.originalname)) {
//             throw new Error("Invalid image type!");
//           }
//           return await uploadFile(field, fieldName);
//         }
//         return null;
//       };

//       const imageFields = ["image1", "image2", "image3", "image4", "image5"];

//       for (const fieldName of imageFields) {
//         try {
//           const imageUrl = await processFileField(
//             req.files && req.files[fieldName] ? req.files[fieldName][0] : null,
//             fieldName
//           );
//           if (imageUrl) {
//             if (fieldName === "image1") {
//               existingLaptop.image = imageUrl;
//             } else {
//               const index = imageFields.indexOf(fieldName) - 1;
//               if (existingLaptop.images[index]) {
//                 existingLaptop.images[index] = imageUrl;
//               } else {
//                 existingLaptop.images.push(imageUrl);
//               }
//             }
//           }
//         } catch (error) {
//           return res.status(400).send({ error: error.message });
//         }
//       }

//       if (amount) existingLaptop.amount = amount;
//       if (brand) existingLaptop.brand = brand;
//       if (model) existingLaptop.model = model;
//       if (processor) existingLaptop.processor = processor;
//       if (ram) existingLaptop.ram = ram;
//       if (screenSize) existingLaptop.screenSize = screenSize;
//       if (storage) existingLaptop.storage = storage;
//       if (color) existingLaptop.color = color;
//       if (operatingSystem) existingLaptop.operatingSystem = operatingSystem;
//       if (description) existingLaptop.description = description;
//       if (addInCarousel) existingLaptop.addInCarousel = addInCarousel;
//       if (quantity) existingLaptop.quantity = quantity;
//       if (status) existingLaptop.status = status;

//       await existingLaptop.save();

//       return res
//         .status(200)
//         .send({
//           message: "Laptop updated in Refurbished Section successfully!",
//           body: req.body,
//         });
//     } catch (error) {
//       console.error("Error:", error.message);
//       res
//         .status(500)
//         .send({
//           error: "Couldn't update laptop now! Please try again later",
//         });
//     }
//   }
// );

// s3
router.patch(
  "/updateRefurbishedLaptop/:id/:role",
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
    { name: "image5", maxCount: 1 },
  ]),
  async (req, res) => {
    const {
      amount,
      brand,
      model,
      processor,
      ram,
      screenSize,
      storage,
      color,
      operatingSystem,
      description,
      addInCarousel,
      status,
    } = req.body;

    const { id } = req.params;
    const role = req.params.role;

    try {
      const validUser = await moduleAccessModel.findOne({
        roleOfEmployee: role,
      });
      if (
        !validUser ||
        !validUser.modules.some(
          (module) =>
            module.moduleName === "refurbished_laptop" &&
            module.fullAccess === true
        )
      ) {
        return res
          .status(403)
          .send({ error: "You have no access to do this!" });
      }

      const existingLaptop = await refurbishedLaptopModel.findById(id);
      if (!existingLaptop) {
        return res.status(404).send({ error: "Laptop not found!" });
      }

      const uploadFile = async (file, fieldName) => {
        const fileName = `${Date.now()}_${file.originalname}`;
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `images/${fileName}`,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: "public-read",
        };

        return new Promise((resolve, reject) => {
          s3.upload(params, (err, data) => {
            if (err) {
              console.error(`Error uploading ${fieldName}:`, err);
              reject(err);
            } else {
              resolve(data.Location);
            }
          });
        });
      };

      const processFileField = async (field, fieldName) => {
        if (field && typeof field === "object" && field.buffer) {
          if (!isValidImageExtension(field.originalname)) {
            throw new Error("Invalid image type!");
          }
          return await uploadFile(field, fieldName);
        }
        return null;
      };

      const imageFields = ["image1", "image2", "image3", "image4", "image5"];

      for (const fieldName of imageFields) {
        try {
          const imageUrl = await processFileField(
            req.files && req.files[fieldName] ? req.files[fieldName][0] : null,
            fieldName
          );
          if (imageUrl) {
            if (fieldName === "image1") {
              existingLaptop.image = imageUrl;
            } else {
              const index = imageFields.indexOf(fieldName) - 1;
              if (existingLaptop.images[index]) {
                existingLaptop.images[index] = imageUrl;
              } else {
                existingLaptop.images.push(imageUrl);
              }
            }
          }
        } catch (error) {
          return res.status(400).send({ error: error.message });
        }
      }

      if (amount) existingLaptop.amount = amount;
      if (brand) existingLaptop.brand = brand;
      if (model) existingLaptop.model = model;
      if (processor) existingLaptop.processor = processor;
      if (ram) existingLaptop.ram = ram;
      if (screenSize) existingLaptop.screenSize = screenSize;
      if (storage) existingLaptop.storage = storage;
      if (color) existingLaptop.color = color;
      if (operatingSystem) existingLaptop.operatingSystem = operatingSystem;
      if (description) existingLaptop.description = description;
      if (addInCarousel) existingLaptop.addInCarousel = addInCarousel;
      if (status) existingLaptop.status = status;

      await existingLaptop.save();

      return res.status(200).send({
        message: "Laptop updated in Refurbished Section successfully!",
        body: req.body,
      });
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).send({
        error: "Couldn't update laptop now! Please try again later",
      });
    }
  }
);

router.delete("/deleteRefurbishedLaptop1/:id/:role", async (req, res) => {
  const { id } = req.params;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });

    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "refurbished_laptop" &&
          module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const response = await refurbishedLaptopModel.findOneAndDelete({ _id: id });

    if (response) {
      return res.status(200).send({ message: "Laptop deleted successfully!" });
    } else {
      return res.status(404).send({ error: "Laptop not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't delete laptop now! Please try again later" });
  }
});

router.delete("/deleteRefurbishedLaptop/:id/:role", async (req, res) => {
  const { id } = req.params;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });

    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "refurbished_laptop" &&
          module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const existLaptop = await refurbishedLaptopModel.findOne({ _id: id });
    if (!existLaptop) {
      return res.status(404).send({ error: "Product not found!" });
    }

    const availOrders = await refurbishedRequestsModel.find({ laptopId: id });

    const unClosedOrders = [];
    if (availOrders.length > 0) {
      for (const order of availOrders) {
        if (order.status !== "Completed") {
          unClosedOrders.push(order);
        }
      }
    }

    if (unClosedOrders.length > 0) {
      return res
        .status(400)
        .send({ error: "There are some orders associated with this Product!" });
    } else {
      const existReview = await productReviewModel.find({ productId: id });
      if (existReview.length > 0) {
        await productReviewModel.deleteMany({ productId: id });
      }

      await refurbishedLaptopModel.findOneAndDelete({ _id: id });

      return res.status(200).send({ message: "Laptop deleted successfully!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't delete laptop now! Please try again later" });
  }
});

// // firebase
// router.post("/addDevice/:role", upload.single("image"), async (req, res) => {
//   const { deviceName } = req.body;
//   const image = req.file;
//   const role = req.params.role;
//   try {
//     const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });

//     if (
//       !validUser ||
//       !validUser.modules.some(
//         (module) => module.moduleName === "device" && module.write === true
//       )
//     ) {
//       return res.status(403).send({ error: "You have no access to do this!" });
//     }

//     if (!image || !deviceName) {
//       return res.status(400).send({ error: "Please fill all fields!" });
//     }

//     const existingDevice = await deviceModel.findOne({ deviceName });
//     if (existingDevice) {
//       return res.status(400).send({ error: "Device already exists!" });
//     }

//     let imageUrl;
//     if(image){
//     const imageName = `${Date.now()}_${image.originalname}`;
//     const imageUpload = admin.storage().bucket().file(`images/${imageName}`);

//     const fileType = image.originalname.split(".").pop().toLowerCase();
//     if(fileType !== "jpg" && fileType !== "jpeg" && fileType !== "png" && fileType !== "svg" && fileType !== "webp"){
//       return res.status(400).send({error: "Invalid image type!"});
//     }
//     await new Promise((resolve, reject) => {
//       const stream = imageUpload.createWriteStream({
//         metadata: {
//           contentType: image.mimetype,
//         },
//       });

//       stream.on("error", (err) => {
//         console.error("Error uploading file:", err);
//         reject(err);
//       });

//       stream.on("finish", async () => {
//         await imageUpload.makePublic();
//         imageUrl = imageUpload.publicUrl();
//         console.log(imageUrl);
//         resolve();
//       });

//       stream.end(image.buffer);
//     });
//   };

//     const newDevice = new deviceModel({
//       image: imageUrl,
//       deviceName,
//     });

//     await newDevice.save();

//     return res.status(200).send({ message: "Device added successfully!" });
//   } catch (error) {
//     console.error("Error:", error.message);
//     res
//       .status(500)
//       .send({ error: "Couldn't add device now! Please try again later" });
//   }
// });

// s3
router.post("/addDevice/:role", upload.single("image"), async (req, res) => {
  const { deviceName } = req.body;
  const image = req.file;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });

    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "device" && module.write === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    if (!image || !deviceName) {
      return res.status(400).send({ error: "Please fill all fields!" });
    }

    const existingDevice = await deviceModel.findOne({ deviceName });
    if (existingDevice) {
      return res.status(400).send({ error: "Device already exists!" });
    }

    let imageUrl;
    if (image) {
      const imageName = `${Date.now()}_${image.originalname}`;

      const fileType = image.originalname.split(".").pop().toLowerCase();
      if (
        fileType !== "jpg" &&
        fileType !== "jpeg" &&
        fileType !== "png" &&
        fileType !== "svg" &&
        fileType !== "webp"
      ) {
        return res.status(400).send({ error: "Invalid image type!" });
      }

      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `images/${imageName}`,
        Body: image.buffer,
        ACL: "public-read",
        ContentType: image.mimetype,
      };

      const uploadResult = await s3.upload(params).promise();
      imageUrl = uploadResult.Location;
    }

    const newDevice = new deviceModel({
      image: imageUrl,
      deviceName,
    });

    await newDevice.save();

    return res.status(200).send({ message: "Device added successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't add device now! Please try again later" });
  }
});

router.get("/viewDevices/:role/:search?", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sortBy = req.query.sortBy || "deviceName";
  const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
  const searchString = req.params.search || "";
  const role = req.params.role;
  try {
    let moduleAccess;
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "device" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "device"
      );
    }

    const skip = (page - 1) * limit;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const searchRegex = new RegExp(searchString, "i");
    const query = {
      $or: [{ deviceName: { $regex: searchRegex } }],
    };

    const response = await deviceModel
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const serialNumberStart = skip + 1;
    const serialNumbers = Array.from(
      { length: response.length },
      (_, index) => serialNumberStart + index
    );

    const devices = response.map((device, index) => {
      return {
        ...device.toObject(),
        s_no: serialNumbers[index],
      };
    });

    const totalItems = await deviceModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const paginationInfo = {
      totalItems,
      totalPages,
      currentPage: page,
      startIndex: skip + 1,
      endIndex: skip + devices.length,
      itemsPerPage: devices.length,
    };

    return res
      .status(200)
      .send({ data: devices, pagination: paginationInfo, moduleAccess });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view Devices now! Please try again later" });
  }
});

// // firebase
// router.patch(
//   "/updateDevice/:id/:role",
//   upload.single("image"),
//   async (req, res) => {
//     const image = req.file;
//     const { deviceName } = req.body;
//     const { role, id } = req.params;
//     try {
//       const validUser = await moduleAccessModel.findOne({
//         roleOfEmployee: role,
//       });

//       if (
//         !validUser ||
//         !validUser.modules.some(
//           (module) =>
//             module.moduleName === "device" && module.fullAccess === true
//         )
//       ) {
//         return res
//           .status(403)
//           .send({ error: "You have no access to do this!" });
//       }

//       const existingDevice = await deviceModel.findOne({ _id: id });
//       if (!existingDevice) {
//         return res.status(404).send({ error: "Device Not Found!" });
//       }

//       let imageUrl;
//       if (image) {
//         const imageName = `${Date.now()}_${image.originalname}`;
//         const imageUpload = admin
//           .storage()
//           .bucket()
//           .file(`images/${imageName}`);

//     const fileType = image.originalname.split(".").pop().toLowerCase();
//     if(fileType !== "jpg" && fileType !== "jpeg" && fileType !== "png" && fileType !== "svg" && fileType !== "webp"){
//       return res.status(400).send({error: "Invalid image type!"});
//     }
//         await new Promise((resolve, reject) => {
//           const stream = imageUpload.createWriteStream({
//             metadata: {
//               contentType: image.mimetype,
//             },
//           });

//           stream.on("error", (err) => {
//             console.error("Error uploading file:", err);
//             reject(err);
//           });

//           stream.on("finish", async () => {
//             await imageUpload.makePublic();
//             imageUrl = imageUpload.publicUrl();
//             console.log(imageUrl);
//             resolve();
//           });

//           stream.end(image.buffer);
//         });
//       }

//       await deviceModel.findOneAndUpdate(
//         { _id: id },
//         { $set: { deviceName, image: imageUrl } },
//         { new: true }
//       );

//       return res.status(200).send({ message: "Device Updated Successfully!" });
//     } catch (error) {
//       console.error("Error:", error.message);
//       res
//         .status(500)
//         .send({ error: "Couldn't update Device now! Please try again later" });
//     }
//   }
// );

// s3
router.patch(
  "/updateDevice/:id/:role",
  upload.single("image"),
  async (req, res) => {
    const image = req.file;
    const { deviceName } = req.body;
    const { role, id } = req.params;
    try {
      const validUser = await moduleAccessModel.findOne({
        roleOfEmployee: role,
      });

      if (
        !validUser ||
        !validUser.modules.some(
          (module) =>
            module.moduleName === "device" && module.fullAccess === true
        )
      ) {
        return res
          .status(403)
          .send({ error: "You have no access to do this!" });
      }

      const existingDevice = await deviceModel.findOne({ _id: id });
      if (!existingDevice) {
        return res.status(404).send({ error: "Device Not Found!" });
      }

      let imageUrl;
      if (image) {
        const imageName = `${Date.now()}_${image.originalname}`;
        const imageUpload = admin
          .storage()
          .bucket()
          .file(`images/${imageName}`);

        const fileType = image.originalname.split(".").pop().toLowerCase();
        if (
          fileType !== "jpg" &&
          fileType !== "jpeg" &&
          fileType !== "png" &&
          fileType !== "svg" &&
          fileType !== "webp"
        ) {
          return res.status(400).send({ error: "Invalid image type!" });
        }

        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `images/${imageName}`,
          Body: image.buffer,
          ContentType: image.mimetype,
          ACL: "public-read",
        };

        const uploadResult = await s3.upload(params).promise();
        imageUrl = uploadResult.Location;
      }

      await deviceModel.findOneAndUpdate(
        { _id: id },
        { $set: { deviceName, image: imageUrl } },
        { new: true }
      );

      return res.status(200).send({ message: "Device Updated Successfully!" });
    } catch (error) {
      console.error("Error:", error.message);
      res
        .status(500)
        .send({ error: "Couldn't update Device now! Please try again later" });
    }
  }
);

router.delete("/deleteDevice/:id/:role", async (req, res) => {
  const { role, id } = req.params;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });

    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "device" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }
    const response = await deviceModel.findOneAndDelete({ _id: id });

    if (response) {
      return res.status(200).send({ message: "Device deleted successfully!" });
    } else {
      return res.status(404).send({ error: "Device not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't delete Device now! Please try again later" });
  }
});

router.get("/viewIssues/:role/:search?", async (req, res) => {
  const role = req.params.role;
  const device = req.query.device;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const searchString = req.params.search || "";
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "device" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    }

    const moduleAccess = validUser.modules.find(
      (module) => module.moduleName === "device"
    );

    const searchRegex = new RegExp(searchString, "i");
    const query = {
      ...(device && { deviceName: device }),
      "issues.issueName": { $regex: searchRegex },
    };

    const response = await deviceModel.findOne(query).select("issues");

    if (!response || !response.issues || response.issues.length === 0) {
      return res.status(200).send({ data: [], pagination: [], moduleAccess });
    }

    response.issues.sort((a, b) => {
      if (sortOrder === 1) {
        return new Date(a[sortBy]) - new Date(b[sortBy]);
      } else {
        return new Date(b[sortBy]) - new Date(a[sortBy]);
      }
    });

    let issues = response.issues.filter((issue) =>
      searchRegex.test(issue.issueName)
    );

    const totalItems = issues.length;
    const totalPages = Math.ceil(totalItems / limit);

    const paginatedIssues = issues.slice(skip, skip + limit);

    const serialNumberStart = skip + 1;
    const serialNumbers = Array.from(
      { length: paginatedIssues.length },
      (_, index) => serialNumberStart + index
    );

    const issuesWithSerialNumbers = paginatedIssues.map((issue, index) => {
      return {
        ...issue.toObject(),
        s_no: serialNumbers[index],
      };
    });

    const paginationInfo = {
      totalItems,
      totalPages,
      currentPage: page,
      startIndex: skip + 1,
      endIndex: skip + issuesWithSerialNumbers.length,
      itemsPerPage: limit,
    };

    return res.status(200).send({
      data: issuesWithSerialNumbers,
      pagination: paginationInfo,
      moduleAccess,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view Issues now! Please try again later" });
  }
});

// // firebase
// router.post("/addIssue/:role", upload.single("image"), async (req, res) => {
//   const { device, issue } = req.body;
//   const image = req.file;
//   const role = req.params.role;
//   try {
//     const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });

//     if (
//       !validUser ||
//       !validUser.modules.some(
//         (module) => module.moduleName === "device" && module.write === true
//       )
//     ) {
//       return res.status(403).send({ error: "You have no access to do this!" });
//     }

//     if (!device || !image || !issue) {
//       return res.status(400).send({ error: "Please fill all fields!" });
//     }

//     const validDevice = await deviceModel.findOne({ deviceName: device });
//     if (!validDevice) {
//       return res.status(404).send({ error: "Invalid Device!" });
//     }

//     const existIssue = validDevice.issues.find(
//       (iss) => iss.issueName === issue
//     );
//     if (existIssue) {
//       return res.status(400).send({ error: "Issue already exists!" });
//     }

//     let imageUrl;
//     if (image) {
//       const imageName = `${Date.now()}_${image.originalname}`;
//       const imageUpload = admin.storage().bucket().file(`images/${imageName}`);

//     const fileType = image.originalname.split(".").pop().toLowerCase();
//     if(fileType !== "jpg" && fileType !== "jpeg" && fileType !== "png" && fileType !== "svg" && fileType !== "webp"){
//       return res.status(400).send({error: "Invalid image type!"});
//     }

//       await new Promise((resolve, reject) => {
//         const stream = imageUpload.createWriteStream({
//           metadata: {
//             contentType: image.mimetype,
//           },
//         });

//         stream.on("error", (err) => {
//           console.error("Error uploading file:", err);
//           reject(err);
//         });

//         stream.on("finish", async () => {
//           await imageUpload.makePublic();
//           imageUrl = imageUpload.publicUrl();
//           console.log(imageUrl);
//           resolve();
//         });

//         stream.end(image.buffer);
//       });
//     }

//     const newIssue = await deviceModel.findOneAndUpdate(
//       { deviceName: device },
//       {
//         $addToSet: {
//           issues: {
//             issueName: issue,
//             issueImage: imageUrl,
//             createdAt: moment(Date.now()).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
//             updatedAt: moment(Date.now()).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
//           },
//         },
//       },
//       { new: true }
//     );
//     await newIssue.save();

//     return res.status(200).send({ message: "Issue added successfully!" });
//   } catch (error) {
//     console.error("Error:", error.message);
//     res
//       .status(500)
//       .send({ error: "Couldn't add issue now! Please try again later" });
//   }
// });

// s3
router.post("/addIssue/:role", upload.single("image"), async (req, res) => {
  const { device, issue } = req.body;
  const image = req.file;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });

    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "device" && module.write === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    if (!device || !image || !issue) {
      return res.status(400).send({ error: "Please fill all fields!" });
    }

    const validDevice = await deviceModel.findOne({ deviceName: device });
    if (!validDevice) {
      return res.status(404).send({ error: "Invalid Device!" });
    }

    const existIssue = validDevice.issues.find(
      (iss) => iss.issueName === issue
    );
    if (existIssue) {
      return res.status(400).send({ error: "Issue already exists!" });
    }

    let imageUrl;
    if (image) {
      const imageName = `${Date.now()}_${image.originalname}`;

      const fileType = image.originalname.split(".").pop().toLowerCase();
      if (
        fileType !== "jpg" &&
        fileType !== "jpeg" &&
        fileType !== "png" &&
        fileType !== "svg" &&
        fileType !== "webp"
      ) {
        return res.status(400).send({ error: "Invalid image type!" });
      }

      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `images/${imageName}`,
        Body: image.buffer,
        ContentType: image.mimetype,
        ACL: "public-read",
      };

      const uploadResult = await s3.upload(params).promise();
      imageUrl = uploadResult.Location;
    }

    const newIssue = await deviceModel.findOneAndUpdate(
      { deviceName: device },
      {
        $addToSet: {
          issues: {
            issueName: issue,
            issueImage: imageUrl,
            createdAt: moment(Date.now())
              .tz("Asia/Kolkata")
              .format("YYYY-MM-DD HH:mm:ss"),
            updatedAt: moment(Date.now())
              .tz("Asia/Kolkata")
              .format("YYYY-MM-DD HH:mm:ss"),
          },
        },
      },
      { new: true }
    );
    await newIssue.save();

    return res.status(200).send({ message: "Issue added successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't add issue now! Please try again later" });
  }
});

// // firebase
// router.patch("/updateIssue/:role", upload.single("image"), async (req, res) => {
//   const image = req.file;
//   const { device, issueId, issue } = req.body;
//   const role = req.params.role;
//   try {
//     const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });

//     if (
//       !validUser ||
//       !validUser.modules.some(
//         (module) => module.moduleName === "device" && module.fullAccess === true
//       )
//     ) {
//       return res.status(403).send({ error: "You have no access to do this!" });
//     }

//     const validDevice = await deviceModel.findOne({ deviceName: device });
//     if (!validDevice) {
//       return res.status(404).send({ error: "Device not found!" });
//     }

//     const existIssue = validDevice.issues.find((iss) =>
//       iss._id.equals(new mongoose.Types.ObjectId(issueId))
//     );
//     if (!existIssue) {
//       return res.status(404).send({ error: "Issue not found!" });
//     }

//     let imageUrl;
//     if (image) {
//       const imageName = `${Date.now()}_${image.originalname}`;
//       const imageUpload = admin.storage().bucket().file(`images/${imageName}`);

//       const fileType = image.originalname.split(".").pop().toLowerCase();
//       if(fileType !== "jpg" && fileType !== "jpeg" && fileType !== "png" && fileType !== "svg" && fileType !== "webp"){
//         return res.status(400).send({error: "Invalid image type!"});
//       }

//       await new Promise((resolve, reject) => {
//         const stream = imageUpload.createWriteStream({
//           metadata: {
//             contentType: image.mimetype,
//           },
//         });

//         stream.on("error", (err) => {
//           console.error("Error uploading file:", err);
//           reject(err);
//         });

//         stream.on("finish", async () => {
//           await imageUpload.makePublic();
//           imageUrl = imageUpload.publicUrl();
//           console.log(imageUrl);
//           resolve();
//         });

//         stream.end(image.buffer);
//       });
//     }

//     await deviceModel.findOneAndUpdate(
//       { deviceName: device, "issues._id": existIssue._id },
//       {
//         $set: { "issues.$.issueName": issue, "issues.$.issueImage": imageUrl, "issues.$.updatedAt": moment(Date.now()).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss")},
//       },
//       { new: true }
//     );

//     return res.status(200).send({ message: "Issue Updated Successfully!" });
//   } catch (error) {
//     console.error("Error:", error.message);
//     res
//       .status(500)
//       .send({ error: "Couldn't update Issue now! Please try again later" });
//   }
// });

// s3
router.patch("/updateIssue/:role", upload.single("image"), async (req, res) => {
  const image = req.file;
  const { device, issueId, issue } = req.body;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });

    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "device" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const validDevice = await deviceModel.findOne({ deviceName: device });
    if (!validDevice) {
      return res.status(404).send({ error: "Device not found!" });
    }

    const existIssue = validDevice.issues.find((iss) =>
      iss._id.equals(new mongoose.Types.ObjectId(issueId))
    );
    if (!existIssue) {
      return res.status(404).send({ error: "Issue not found!" });
    }

    let imageUrl;
    if (image) {
      const imageName = `${Date.now()}_${image.originalname}`;

      const fileType = image.originalname.split(".").pop().toLowerCase();
      if (
        fileType !== "jpg" &&
        fileType !== "jpeg" &&
        fileType !== "png" &&
        fileType !== "svg" &&
        fileType !== "webp"
      ) {
        return res.status(400).send({ error: "Invalid image type!" });
      }

      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `images/${imageName}`,
        Body: image.buffer,
        ContentType: image.mimetype,
        ACL: "public-read",
      };

      const uploadResult = await s3.upload(params).promise();
      imageUrl = uploadResult.Location;
    }

    await deviceModel.findOneAndUpdate(
      { deviceName: device, "issues._id": existIssue._id },
      {
        $set: {
          "issues.$.issueName": issue,
          "issues.$.issueImage": imageUrl,
          "issues.$.updatedAt": moment(Date.now())
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD HH:mm:ss"),
        },
      },
      { new: true }
    );

    return res.status(200).send({ message: "Issue Updated Successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't update Issue now! Please try again later" });
  }
});

router.delete("/deleteIssue/:role", async (req, res) => {
  const { issueId, device } = req.body;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "device" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const response = await deviceModel.findOneAndUpdate(
      { deviceName: device },
      { $pull: { issues: { _id: new mongoose.Types.ObjectId(issueId) } } },
      { new: true }
    );

    if (response) {
      return res.status(200).send({ message: "Issue deleted successfully!" });
    } else {
      return res.status(404).send({ error: "Issue not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't delete Issue now! Please try again later" });
  }
});

// router.get("/viewCallbackRequests/:search?", async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const sortBy = req.query.sortBy || "createdAt";
//   const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
//   const searchString = req.params.search || "";
//   try {
//     const skip = (page - 1) * limit;

//     const sortOptions = {};
//     sortOptions[sortBy] = sortOrder;

//     const escapedSearchString = searchString.replace(/\+/g, "\\+");
//     const searchRegex = new RegExp(escapedSearchString, "i");
//     const query = {
//       $or: [
//         { phoneNumber: { $regex: searchRegex } },
//         { userName: { $regex: searchRegex } },
//         { email: { $regex: searchRegex } },
//         { message: { $regex: searchRegex } },
//         { status: { $regex: searchRegex } },
//       ],
//     };

//     const response = await callbackRequestModel
//       .find(query)
//       .sort(sortOptions)
//       .skip(skip)
//       .limit(limit);

//     const serialNumberStart = skip + 1;
//     const serialNumbers = Array.from(
//       { length: response.length },
//       (_, index) => serialNumberStart + index
//     );

//     const requests = response.map((device, index) => {
//       return {
//         ...device.toObject(),
//         s_no: serialNumbers[index],
//       };
//     });

//     const totalItems = await callbackRequestModel.countDocuments(query);
//     const totalPages = Math.ceil(totalItems / limit);

//     const paginationInfo = {
//       totalItems,
//       totalPages,
//       currentPage: page,
//       startIndex: skip + 1,
//       endIndex: skip + requests.length,
//       itemsPerPage: requests.length,
//     };

//     if (requests && requests.length === 0) {
//       return res.status(404).send({ error: "No Requests Found!" });
//     }

//     return res.status(200).send({ data: requests, pagination: paginationInfo });
//   } catch (error) {
//     console.error("Error:", error.message);
//     res
//       .status(500)
//       .send({ error: "Couldn't view Requests now! Please try again later" });
//   }
// });

// router.patch("/updateCallbackRequest/:id", async (req, res) => {
//   const { id } = req.params;
//   const { status } = req.body;
//   try {
//     if (!status) {
//       return res.status(400).send({ error: "Please fill all fields!" });
//     }

//     const response = await callbackRequestModel.findByIdAndUpdate(
//       id,
//       { $set: { status } },
//       { new: true }
//     );

//     if (response) {
//       return res.status(200).send({ message: `Request updated successfully!` });
//     } else {
//       return res.status(404).send({ error: "Request not found!" });
//     }
//   } catch (error) {
//     console.error("Error:", error.message);
//     res
//       .status(500)
//       .send({ error: "Couldn't delete Request now! Please try again later" });
//   }
// });

// router.delete("/deleteCallbackRequest/:id", async (req, res) => {
//   const { id } = req.params;
//   try {
//     const response = await callbackRequestModel.findOneAndDelete({ _id: id });

//     if (response) {
//       return res.status(200).send({ message: "Request deleted successfully!" });
//     } else {
//       return res.status(404).send({ error: "Request not found!" });
//     }
//   } catch (error) {
//     console.error("Error:", error.message);
//     res
//       .status(500)
//       .send({ error: "Couldn't delete Request now! Please try again later" });
//   }
// });

router.post("/addTransaction/:role", async (req, res) => {
  let { phoneNumber, amount, transactionId, modeOfPayment, type, requestId } =
    req.body;
  const { role } = req.params;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "transaction" && module.write === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    if (!phoneNumber.startsWith("+91")) {
      phoneNumber = `+91${phoneNumber}`;
    }

    const existUser = await usersModel.findOne({ phoneNumber });
    if (!existUser) {
      return res.status(404).send({ error: "User not found!" });
    }

    const validOrder = await orderModel.findOne({ requestId });
    if (!validOrder) {
      return res.status(404).send({ error: "Order not found!" });
    }

    const newTransaction = new transactionModel({
      phoneNumber,
      amount,
      transactionId,
      modeOfPayment,
      type,
      requestId,
    });
    await newTransaction.save();

    return res.status(200).send({ message: "Transaction added successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't add Transaction now! Please try again later" });
  }
});

// router.get("/viewTransactions/:role/:search?", async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) | 10;
//   const sortBy = req.query.sortBy || "createdAt";
//   const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
//   const searchString = req.params.search || "";
//   const role = req.params.role;
//   let phoneNumber =  req.query.phoneNumber;
//   let moduleAccess;
//   const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
//   if (
//     !validUser ||
//     !validUser.modules.some(
//       (module) => module.moduleName === "transaction" && module.read === true
//     )
//   ) {
//     return res
//       .status(403)
//       .send({ error: "You have no access to view this Page!" });
//   } else {
//     moduleAccess = validUser.modules.find(
//       (module) => module.moduleName === "transaction"
//     );
//   }
//   try {
//     if(!phoneNumber.startsWith("+91")){
//       phoneNumber = `+91${phoneNumber}`
//     }

//     const skip = (page - 1) * limit;
//     const sortOptions = {};
//     sortOptions[sortBy] = sortOrder;

//     const escapedSearchString = searchString.replace(/\+/g, "\\+");
//     const searchRegex = new RegExp(escapedSearchString, "i");
//     const query = {
//       $or: [
//         { phoneNumber: { $regex: searchRegex } },
//         { transactionId: { $regex: searchRegex } },
//         { requestId: { $regex: searchRegex } },
//         { type: { $regex: searchRegex } },
//       ],
//     };

//     const response = await transactionModel
//       .find(query)
//       .skip(skip)
//       .sort(sortOptions)
//       .limit(limit);

//     const serialNumberStart = skip + 1;
//     const serialNumbers = Array.from(
//       { length: response.length },
//       (_, index) => serialNumberStart + index
//     );

//     const transactions = await Promise.all(
//       response.map(async (transaction, index) => {
//         const orderStatus = await orderModel.findOne({
//           requestId: transaction.requestId,
//         });
//         return {
//           ...transaction.toObject(),
//           s_no: serialNumbers[index],
//           orderStatus: orderStatus.status,
//         };
//       })
//     );

//     const totalItems = await transactionModel.countDocuments(query);
//     const totalPages = Math.ceil(totalItems / limit);

//     const paginationInfo = {
//       totalItems,
//       totalPages,
//       currentPage: page,
//       startIndex: skip + 1,
//       endIndex: skip + transactions.length,
//       itemsPerPage: transactions.length,
//     };

//     let transactionCount;
//     const previousTransactionCountss = await notificationCountModel.findOne({type: "transactionCount", 'details.employeePhoneNumber': phoneNumber});

//     const previousTransactionCount = previousTransactionCountss.details.find((emp) => emp.employeePhoneNumber === phoneNumber);

//     const currentTransaction = await transactionModel.countDocuments();

//     const transactionCountings = currentTransaction - previousTransactionCount.count;
//     if(transactionCountings === currentTransaction){
//       transactionCount = 0
//     } else {
//       transactionCount = transactionCountings
//     };

//     await notificationCountModel.findOneAndUpdate({type: "transactionCount", "details.employeePhoneNumber": phoneNumber}, {$set: {'details.$.count': currentTransaction}}, {new: true});

//     return res
//       .status(200)
//       .send({ data: transactions, pagination: paginationInfo, moduleAccess, transactionCount });
//   } catch (error) {
//     console.error("Error:", error.message);
//     res.status(500).send({
//       error: "Couldn't view Transactions now! Please try again later",
//       moduleAccess,
//     });
//   }
// });

router.get(
  "/viewTransactions/:role/:phoneNumber/:search?",
  async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) | 10;
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const searchString = req.params.search || "";
    const role = req.params.role;
    let phoneNumber = req.params.phoneNumber;
    let moduleAccess;
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "transaction" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "transaction"
      );
    }
    try {
      if (!phoneNumber.startsWith("+91")) {
        phoneNumber = `+91${phoneNumber}`;
      }

      const skip = (page - 1) * limit;
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder;

      const escapedSearchString = searchString.replace(/\+/g, "\\+");
      const searchRegex = new RegExp(escapedSearchString, "i");

      let query;
      if (role === "Technician") {
        const employee = await employeesModel.findOne({ phoneNumber });
        const assignedOrders = await orderModel.find({
          assignedTo: employee.nameOfEmployee,
        });

        const requestIds = assignedOrders.map((order) => order.requestId);

        query = {
          $and: { requestId: { $in: requestIds } },
          $or: [
            { phoneNumber: { $regex: searchRegex } },
            { transactionId: { $regex: searchRegex } },
            { requestId: { $regex: searchRegex } },
            { type: { $regex: searchRegex } },
          ],
        };
      } else {
        query = {
          $or: [
            { phoneNumber: { $regex: searchRegex } },
            { transactionId: { $regex: searchRegex } },
            { requestId: { $regex: searchRegex } },
            { type: { $regex: searchRegex } },
          ],
        };
      }

      const response = await transactionModel
        .find(query)
        .skip(skip)
        .sort(sortOptions)
        .limit(limit);

      const serialNumberStart = skip + 1;
      const serialNumbers = Array.from(
        { length: response.length },
        (_, index) => serialNumberStart + index
      );

      const transactions = await Promise.all(
        response.map(async (transaction, index) => {
          const orderStatus = await orderModel.findOne({
            requestId: transaction.requestId,
          });
          return {
            ...transaction.toObject(),
            s_no: serialNumbers[index],
            orderStatus: orderStatus.status,
          };
        })
      );

      const totalItems = await transactionModel.countDocuments(query);
      const totalPages = Math.ceil(totalItems / limit);

      const paginationInfo = {
        totalItems,
        totalPages,
        currentPage: page,
        startIndex: skip + 1,
        endIndex: skip + transactions.length,
        itemsPerPage: transactions.length,
      };

      // let transactionCount;
      // const previousTransactionCountss = await notificationCountModel.findOne({type: "transactionCount", 'details.employeePhoneNumber': phoneNumber});

      // const previousTransactionCount = previousTransactionCountss.details.find((emp) => emp.employeePhoneNumber === phoneNumber);

      // const currentTransaction = await transactionModel.countDocuments();

      // const transactionCountings = currentTransaction - previousTransactionCount.count;
      // if(transactionCountings === currentTransaction){
      //   transactionCount = 0
      // } else {
      //   transactionCount = transactionCountings
      // };

      // await notificationCountModel.findOneAndUpdate({type: "transactionCount", "details.employeePhoneNumber": phoneNumber}, {$set: {'details.$.count': currentTransaction}}, {new: true});

      return res
        .status(200)
        .send({ data: transactions, pagination: paginationInfo, moduleAccess });
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).send({
        error: "Couldn't view Transactions now! Please try again later",
        moduleAccess,
        error1: error.message,
      });
    }
  }
);

router.get("/viewTransactionDetails/:id/:role", async (req, res) => {
  const { id, role } = req.params;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "transaction" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    }

    const validTransaction = await transactionModel.findOne({ requestId: id });
    if (!validTransaction) {
      return res.status(404).send({ error: "Transaction not found!" });
    }

    const orderStatus = await orderModel.findOne({
      requestId: validTransaction.requestId,
    });

    return res
      .status(200)
      .send({ data: validTransaction, orderStatus: orderStatus.status });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't view transaction details now! Please try again later",
    });
  }
});

router.delete("/deleteTransaction/:id/:role", async (req, res) => {
  const { id } = req.params;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "transaction" && module.fullAccess === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    }

    const response = await transactionModel.findOneAndDelete({ _id: id });

    if (response) {
      return res.status(200).send({ message: "Request deleted successfully!" });
    } else {
      return res.status(404).send({ error: "Request not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't delete Request now! Please try again later" });
  }
});

router.get("/viewReviews1/:role/:phoneNumber/:search?", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) | 10;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const searchString = req.params.search || "";
  const role = req.params.role;
  let phoneNumber = req.params.phoneNumber;
  try {
    let moduleAccess;
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "review" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "review"
      );
    }

    if (!phoneNumber.startsWith("+91")) {
      phoneNumber = `+91${phoneNumber}`;
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const escapedSearchString = searchString.replace(/\+/g, "\\+");
    const searchRegex = new RegExp(escapedSearchString, "i");
    const query = {
      $or: [
        { phoneNumber: { $regex: searchRegex } },
        { review: { $regex: searchRegex } },
        { userName: { $regex: searchRegex } },
        { status: { $regex: searchRegex } },
        { rating: { $regex: searchRegex } },
      ],
    };

    const response = await reviewModel
      .find(query)
      .skip(skip)
      .sort(sortOptions)
      .limit(limit);

    const serialNumberStart = skip + 1;
    const serialNumbers = Array.from(
      { length: response.length },
      (_, index) => serialNumberStart + index
    );

    const reviews = response.map((review, index) => {
      return {
        ...review.toObject(),
        s_no: serialNumbers[index],
      };
    });

    const totalItems = await reviewModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const paginationInfo = {
      totalItems,
      totalPages,
      currentPage: page,
      startIndex: skip + 1,
      endIndex: skip + reviews.length,
      itemsPerPage: reviews.length,
    };

    let generalReviewCount;
    const previousGeneralReviewCountss = await notificationCountModel.findOne({
      type: "generalReviewCount",
      "details.employeePhoneNumber": phoneNumber,
    });

    const previousGeneralReviewCount =
      previousGeneralReviewCountss.details.find(
        (emp) => emp.employeePhoneNumber === phoneNumber
      );

    const currentGeneralReview = await reviewModel.countDocuments();

    const generalReviewCountings =
      currentGeneralReview - previousGeneralReviewCount.count;
    if (generalReviewCountings === currentGeneralReview) {
      generalReviewCount = 0;
    } else {
      generalReviewCount = generalReviewCountings;
    }

    // await notificationCountModel.findOneAndUpdate({type: "generalReviewCount", "details.employeePhoneNumber": phoneNumber}, {$set: {'details.$.count': currentGeneralReview}}, {new: true});

    return res
      .status(200)
      .send({
        data: reviews,
        pagination: paginationInfo,
        moduleAccess,
        generalReviewCount,
      });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view Reviews now! Please try again later" });
  }
});

router.get("/viewReviews/:role/:phoneNumber/:search?", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) | 10;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const searchString = req.params.search || "";
  const role = req.params.role;
  let phoneNumber = req.params.phoneNumber;
  try {
    let moduleAccess;
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "review" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "review"
      );
    }

    if (!phoneNumber.startsWith("+91")) {
      phoneNumber = `+91${phoneNumber}`;
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const escapedSearchString = searchString.replace(/\+/g, "\\+");
    const searchRegex = new RegExp(escapedSearchString, "i");
    const query = {
      $or: [
        { phoneNumber: { $regex: searchRegex } },
        { review: { $regex: searchRegex } },
        { userName: { $regex: searchRegex } },
        { status: { $regex: searchRegex } },
        { rating: { $regex: searchRegex } },
      ],
    };

    const response = await reviewModel
      .find(query)
      .skip(skip)
      .sort(sortOptions)
      .limit(limit);

    const serialNumberStart = skip + 1;
    const serialNumbers = Array.from(
      { length: response.length },
      (_, index) => serialNumberStart + index
    );

    const reviews = response.map((review, index) => {
      return {
        ...review.toObject(),
        s_no: serialNumbers[index],
      };
    });

    const totalItems = await reviewModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const paginationInfo = {
      totalItems,
      totalPages,
      currentPage: page,
      startIndex: skip + 1,
      endIndex: skip + reviews.length,
      itemsPerPage: reviews.length,
    };

    const previousGeneralReviewCountss = await notificationCountModel.findOne({
      type: "generalReviewCount",
      "details.employeePhoneNumber": phoneNumber,
    });

    const previousGeneralReviewCount =
      previousGeneralReviewCountss.details.find(
        (emp) => emp.employeePhoneNumber === phoneNumber
      );

    const currentGeneralReview = await reviewModel.countDocuments();

    const generalReviewCountings =
      currentGeneralReview - (previousGeneralReviewCount?.count || 0);

    // const reviewCountPerPage = [];
    // for(let i = 1; i<=totalPages; i++){
    const remainingCounts = generalReviewCountings - (page - 1) * limit;
    const reviewCount =
      remainingCounts > limit ? limit : Math.max(0, remainingCounts);
    //   reviewCountPerPage.push({page: i, reviewCount})
    // }

    // await notificationCountModel.findOneAndUpdate({type: "generalReviewCount", "details.employeePhoneNumber": phoneNumber}, {$set: {'details.$.count': currentGeneralReview}}, {new: true});

    return res
      .status(200)
      .send({
        data: reviews,
        pagination: paginationInfo,
        moduleAccess,
        reviewCount,
      });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view Reviews now! Please try again later" });
  }
});

router.patch("/updateReview/:id/:role", async (req, res) => {
  const { id } = req.params;
  const { status, showInHomePage } = req.body;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "review" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    if (status && !showInHomePage) {
      await reviewModel.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true }
      );
      return res.status(200).send({ message: `Review updated successfully!` });
    }

    if (status && showInHomePage) {
      if (showInHomePage === "yes") {
        const validReview = await reviewModel.findOne({ _id: id });
        if (validReview.images.length === 0) {
          return res.status(400).send({
            error:
              "Review doesn't contain Images/Videos to show in HomePage Testimonial!",
          });
        }
      }
      await reviewModel.findByIdAndUpdate(
        id,
        { $set: { status, showInHomePage } },
        { new: true }
      );
      return res
        .status(200)
        .send({ message: `Review status updated successfully!` });
    }
    if (!status && showInHomePage) {
      if (showInHomePage === "yes") {
        const validReview = await reviewModel.findOne({ _id: id });
        if (validReview.images.length === 0) {
          return res.status(400).send({
            error:
              "Review doesn't contain Images/Videos to show in HomePage Testimonial!",
          });
        }
      }
      await reviewModel.findByIdAndUpdate(
        id,
        { $set: { showInHomePage } },
        { new: true }
      );
      return res
        .status(200)
        .send({ message: `Review status updated successfully!` });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't Update Review now! Please try again later" });
  }
});

router.delete("/deleteReview/:id/:role", async (req, res) => {
  const { id } = req.params;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "review" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const response = await reviewModel.findByIdAndDelete(id);

    if (response) {
      return res.status(200).send({ message: "Review deleted successfully!" });
    } else {
      return res.status(404).send({ error: "Review not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't delete Review now! Please try again later" });
  }
});

router.get(
  "/viewProductReviews1/:role/:phoneNumber/:search?",
  async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) | 10;
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const searchString = req.params.search || "";
    const role = req.params.role;
    let phoneNumber = req.params.phoneNumber;
    try {
      let moduleAccess;
      const validUser = await moduleAccessModel.findOne({
        roleOfEmployee: role,
      });
      if (
        !validUser ||
        !validUser.modules.some(
          (module) =>
            module.moduleName === "reviews_products" && module.read === true
        )
      ) {
        return res
          .status(403)
          .send({ error: "You have no access to view this Page!" });
      } else {
        moduleAccess = validUser.modules.find(
          (module) => module.moduleName === "reviews_products"
        );
      }

      if (!phoneNumber.startsWith("+91")) {
        phoneNumber = `+91${phoneNumber}`;
      }

      const skip = (page - 1) * limit;
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder;

      const escapedSearchString = searchString.replace(/\+/g, "\\+");
      const searchRegex = new RegExp(escapedSearchString, "i");
      const query = {
        $or: [
          { phoneNumber: { $regex: searchRegex } },
          { review: { $regex: searchRegex } },
          { productId: { $regex: searchRegex } },
          { productType: { $regex: searchRegex } },
          { userName: { $regex: searchRegex } },
          { status: { $regex: searchRegex } },
          { rating: { $regex: searchRegex } },
        ],
      };

      const response = await productReviewModel
        .find(query)
        .skip(skip)
        .sort(sortOptions)
        .limit(limit);

      const serialNumberStart = skip + 1;
      const serialNumbers = Array.from(
        { length: response.length },
        (_, index) => serialNumberStart + index
      );

      const reviews = response.map((review, index) => {
        return {
          ...review.toObject(),
          s_no: serialNumbers[index],
        };
      });

      const totalItems = await productReviewModel.countDocuments(query);
      const totalPages = Math.ceil(totalItems / limit);

      const paginationInfo = {
        totalItems,
        totalPages,
        currentPage: page,
        startIndex: skip + 1,
        endIndex: skip + reviews.length,
        itemsPerPage: reviews.length,
      };

      let productReviewCount;
      const previousProductReviewCountss = await notificationCountModel.findOne(
        {
          type: "productReviewCount",
          "details.employeePhoneNumber": phoneNumber,
        }
      );

      const previousProductReviewCount =
        previousProductReviewCountss.details.find(
          (emp) => emp.employeePhoneNumber === phoneNumber
        );

      const currentProductReview = await productReviewModel.countDocuments();

      const productReviewCountings =
        currentProductReview - previousProductReviewCount.count;
      if (productReviewCountings === currentProductReview) {
        productReviewCount = 0;
      } else {
        productReviewCount = productReviewCountings;
      }

      // await notificationCountModel.findOneAndUpdate({type: "productReviewCount", "details.employeePhoneNumber": phoneNumber}, {$set: {'details.$.count': currentProductReview}}, {new: true});

      return res
        .status(200)
        .send({
          data: reviews,
          pagination: paginationInfo,
          moduleAccess,
          productReviewCount,
        });
    } catch (error) {
      console.error("Error:", error.message);
      res
        .status(500)
        .send({
          error: "Couldn't view Reviews now! Please try again later",
          error1: error.message,
        });
    }
  }
);

router.get(
  "/viewProductReviews/:role/:phoneNumber/:search?",
  async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) | 10;
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const searchString = req.params.search || "";
    const role = req.params.role;
    let phoneNumber = req.params.phoneNumber;
    try {
      let moduleAccess;
      const validUser = await moduleAccessModel.findOne({
        roleOfEmployee: role,
      });
      if (
        !validUser ||
        !validUser.modules.some(
          (module) =>
            module.moduleName === "reviews_products" && module.read === true
        )
      ) {
        return res
          .status(403)
          .send({ error: "You have no access to view this Page!" });
      } else {
        moduleAccess = validUser.modules.find(
          (module) => module.moduleName === "reviews_products"
        );
      }

      if (!phoneNumber.startsWith("+91")) {
        phoneNumber = `+91${phoneNumber}`;
      }

      const skip = (page - 1) * limit;
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder;

      const escapedSearchString = searchString.replace(/\+/g, "\\+");
      const searchRegex = new RegExp(escapedSearchString, "i");
      const query = {
        $or: [
          { phoneNumber: { $regex: searchRegex } },
          { review: { $regex: searchRegex } },
          { productId: { $regex: searchRegex } },
          { productType: { $regex: searchRegex } },
          { userName: { $regex: searchRegex } },
          { status: { $regex: searchRegex } },
          { rating: { $regex: searchRegex } },
        ],
      };

      const response = await productReviewModel
        .find(query)
        .skip(skip)
        .sort(sortOptions)
        .limit(limit);

      const serialNumberStart = skip + 1;
      const serialNumbers = Array.from(
        { length: response.length },
        (_, index) => serialNumberStart + index
      );

      const reviews = response.map((review, index) => {
        return {
          ...review.toObject(),
          s_no: serialNumbers[index],
        };
      });

      const totalItems = await productReviewModel.countDocuments(query);
      const totalPages = Math.ceil(totalItems / limit);

      const paginationInfo = {
        totalItems,
        totalPages,
        currentPage: page,
        startIndex: skip + 1,
        endIndex: skip + reviews.length,
        itemsPerPage: reviews.length,
      };

      // let productReviewCount;
      const previousProductReviewCountss = await notificationCountModel.findOne(
        {
          type: "productReviewCount",
          "details.employeePhoneNumber": phoneNumber,
        }
      );

      const previousProductReviewCount =
        previousProductReviewCountss.details.find(
          (emp) => emp.employeePhoneNumber === phoneNumber
        );

      const currentProductReview = await productReviewModel.countDocuments();

      const productReviewCountings =
        currentProductReview - (previousProductReviewCount?.count || 0);

      // const productReviewCountPerPage = [];
      // for(let i = 1; i<=totalPages; i++){
      const remainingCounts = productReviewCountings - (page - 1) * limit;
      const reviewCount =
        remainingCounts > limit ? limit : Math.max(0, remainingCounts);
      //   productReviewCountPerPage.push({page: i, reviewCount})
      // }

      // await notificationCountModel.findOneAndUpdate({type: "productReviewCount", "details.employeePhoneNumber": phoneNumber}, {$set: {'details.$.count': currentProductReview}}, {new: true});

      return res
        .status(200)
        .send({
          data: reviews,
          pagination: paginationInfo,
          moduleAccess,
          reviewCount,
        });
    } catch (error) {
      console.error("Error:", error.message);
      res
        .status(500)
        .send({
          error: "Couldn't view Reviews now! Please try again later",
          error1: error.message,
        });
    }
  }
);

router.patch("/updateProductReview/:id/:role", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "reviews_products" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    if (!status) {
      return res.status(400).send({ errro: "Please fill all fields!" });
    }

    const response = await productReviewModel.findOneAndUpdate(
      { _id: id },
      { $set: { status } },
      { new: true }
    );

    if (!response) {
      return res.status(404).send({ error: "Review not found!" });
    }

    let validProduct;
    if (response.productType === "Refurbished") {
      validProduct = await refurbishedLaptopModel.findOneAndUpdate(
        {
          _id: response.productId,
          "reviews.phoneNumber": response.phoneNumber,
        },
        { $set: { "reviews.$.status": status } },
        { new: true }
      );
    } else if (response.productType === "Rental") {
      validProduct = await rentLaptopModel.findOneAndUpdate(
        {
          _id: response.productId,
          "reviews.phoneNumber": response.phoneNumber,
        },
        { $set: { "reviews.$.status": status } },
        { new: true }
      );
    }

    if (!validProduct) {
      return res.status(404).send({ error: "Product not found!" });
    }

    return res
      .status(200)
      .send({ message: `Review status changed to ${status} successfully!` });
  } catch (error) {
    console.error("Error:", error.message);
    return res
      .status(500)
      .send({ error: "Couldn't Update Review now! Please try again later" });
  }
});

router.delete("/deleteProductReview/:id/:role", async (req, res) => {
  const { id } = req.params;
  const role = req.params.role;

  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });

    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "reviews_products" && module.fullAccess
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const response = await productReviewModel.findOneAndDelete({ _id: id });

    if (!response) {
      return res.status(404).send({ error: "Review not found!" });
    }

    let existProduct;
    if (response.productType === "Refurbished") {
      existProduct = await refurbishedLaptopModel.findOneAndUpdate(
        { _id: response.productId },
        { $pull: { reviews: { phoneNumber: response.phoneNumber } } },
        { new: true }
      );
    } else if (response.productType === "Rental") {
      existProduct = await rentLaptopModel.findOneAndUpdate(
        { _id: response.productId },
        { $pull: { reviews: { phoneNumber: response.phoneNumber } } },
        { new: true }
      );
    } else {
      return res.status(400).send({ error: "Invalid product type!" });
    }

    if (!existProduct) {
      return res.status(404).send({ error: "Product not found!" });
    }

    return res.status(200).send({ message: "Review deleted successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't delete review now! Please try again later." });
  }
});

router.get("/viewServiceRequests/:role/:search?", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) | 10;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const searchString = req.params.search || "";
  const role = req.params.role;
  try {
    let moduleAccess;
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "order" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "order"
      );
    }
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const escapedSearchString = searchString.replace(/\+/g, "\\+");
    const searchRegex = new RegExp(escapedSearchString, "i");
    const query = {
      $or: [
        { requestId: { $regex: searchRegex } },
        { transactionId: { $regex: searchRegex } },
        { phoneNumber: { $regex: searchRegex } },
        { userName: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { address: { $regex: searchRegex } },
        { deviceName: { $regex: searchRegex } },
        { issue: { $regex: searchRegex } },
        { issueDetails: { $regex: searchRegex } },
        { status: { $regex: searchRegex } },
        { initialAmountPaidThrough: { $regex: searchRegex } },
      ],
    };

    const response = await serviceRequestsModel
      .find(query)
      .skip(skip)
      .sort(sortOptions)
      .limit(limit);

    const serialNumberStart = skip + 1;
    const serialNumbers = Array.from(
      { length: response.length },
      (_, index) => serialNumberStart + index
    );

    const requests = response.map((request, index) => {
      return {
        ...request.toObject(),
        s_no: serialNumbers[index],
      };
    });

    const totalItems = await serviceRequestsModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const paginationInfo = {
      totalItems,
      totalPages,
      currentPage: page,
      startIndex: skip + 1,
      endIndex: skip + requests.length,
      itemsPerPage: requests.length,
    };

    if (requests && requests.length == 0) {
      return res.status(404).send({ error: "No Service Requests Found!" });
    }
    return res
      .status(200)
      .send({ data: requests, pagination: paginationInfo, moduleAccess });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view Reviews now! Please try again later" });
  }
});

router.patch("/updateServiceRequest/:id/:role", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "order" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const response = await serviceRequestsModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );
    if (response) {
      return res
        .status(200)
        .send({ message: `Request status updated to ${status} successfully!` });
    } else {
      return res.status(404).send({ error: "Service Request not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't Update Request now! Please try again later" });
  }
});

router.delete("/deleteServiceRequest/:id/:role", async (req, res) => {
  const { id } = req.params;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "order" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const response = await serviceRequestsModel.findByIdAndDelete(id);
    if (response) {
      return res
        .status(200)
        .send({ message: "Service request deleted successfully!" });
    } else {
      return res.status(404).send({ error: "Service request not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't Delete Service Request now! Please try again later",
    });
  }
});

router.get("/viewRentalRequests/:role/:search?", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) | 10;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const searchString = req.params.search || "";
  const role = req.params.role;
  try {
    let moduleAccess;
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "order" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "order"
      );
    }
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const escapedSearchString = searchString.replace(/\+/g, "\\+");
    const searchRegex = new RegExp(escapedSearchString, "i");
    const query = {
      $or: [
        { requestId: { $regex: searchRegex } },
        { phoneNumber: { $regex: searchRegex } },
        { brand: { $regex: searchRegex } },
        { model: { $regex: searchRegex } },
        { laptopId: { $regex: searchRegex } },
        { userName: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { purposeOfRental: { $regex: searchRegex } },
        { rentalPeriod: { $regex: searchRegex } },
        { address: { $regex: searchRegex } },
        { transactionId: { $regex: searchRegex } },
        { purposeOfRental: { $regex: searchRegex } },
        { rentalPeriod: { $regex: searchRegex } },
      ],
    };

    const response = await rentalRequestsModel
      .find(query)
      .skip(skip)
      .sort(sortOptions)
      .limit(limit);

    const serialNumberStart = skip + 1;
    const serialNumbers = Array.from(
      { length: response.length },
      (_, index) => serialNumberStart + index
    );

    const requests = response.map((request, index) => {
      return {
        ...request.toObject(),
        s_no: serialNumbers[index],
      };
    });

    const totalItems = await rentalRequestsModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const paginationInfo = {
      totalItems,
      totalPages,
      currentPage: page,
      startIndex: skip + 1,
      endIndex: skip + requests.length,
      itemsPerPage: requests.length,
    };

    if (requests && requests.length == 0) {
      return res.status(404).send({ error: "No Rental Requests Found!" });
    }
    return res
      .status(200)
      .send({ data: requests, pagination: paginationInfo, moduleAccess });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't View Rental Reviews now! Please try again later",
    });
  }
});

router.patch("/updateRentalRequest/:id/:role", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "order" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const response = await rentalRequestsModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );
    if (response) {
      return res.status(200).send({
        message: `Rental request status updated to ${status} successfully!`,
      });
    } else {
      return res.status(404).send({ error: "Rental request not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't Update Rental Request now! Please try again later",
    });
  }
});

router.delete("/deleteRentalRequest/:id/:role", async (req, res) => {
  const { id } = req.params;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "order" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const response = await rentalRequestsModel.findByIdAndDelete(id);
    if (response) {
      return res
        .status(200)
        .send({ message: "Rental request deleted successfully!" });
    } else {
      return res.status(404).send({ error: "Rental request not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't Delete Rental Request now! Please try again later",
    });
  }
});

router.get("/viewRefurbishedRequests/:role/:search?", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) | 10;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const searchString = req.params.search || "";
  const role = req.params.role;
  try {
    let moduleAccess;
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "order" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "order"
      );
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const escapedSearchString = searchString.replace(/\+/g, "\\+");
    const searchRegex = new RegExp(escapedSearchString, "i");
    const query = {
      $or: [
        { requestId: { $regex: searchRegex } },
        { phoneNumber: { $regex: searchRegex } },
        { brand: { $regex: searchRegex } },
        { model: { $regex: searchRegex } },
        { laptopId: { $regex: searchRegex } },
        { userName: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { address: { $regex: searchRegex } },
        { transactionId: { $regex: searchRegex } },
        { status: { $regex: searchRegex } },
      ],
    };

    const response = await refurbishedRequestsModel
      .find(query)
      .skip(skip)
      .sort(sortOptions)
      .limit(limit);

    const serialNumberStart = skip + 1;
    const serialNumbers = Array.from(
      { length: response.length },
      (_, index) => serialNumberStart + index
    );

    const requests = response.map((request, index) => {
      return {
        ...request.toObject(),
        s_no: serialNumbers[index],
      };
    });

    const totalItems = await refurbishedRequestsModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const paginationInfo = {
      totalItems,
      totalPages,
      currentPage: page,
      startIndex: skip + 1,
      endIndex: skip + requests.length,
      itemsPerPage: requests.length,
    };

    if (requests && requests.length == 0) {
      return res.status(404).send({ error: "No Refurbished Requests Found!" });
    }
    return res
      .status(200)
      .send({ data: requests, pagination: paginationInfo, moduleAccess });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't View Refurbished Reviews now! Please try again later",
    });
  }
});

router.patch("/updateRefurbishedRequest/:id/:role", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "order" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const response = await refurbishedRequestsModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );
    if (response) {
      return res.status(200).send({
        message: `Refurbished request status updated to ${status} successfully!`,
      });
    } else {
      return res.status(404).send({ error: "Refurbished request not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't Update Refurbished Request now! Please try again later",
    });
  }
});

router.delete("/deleteRefurbishedRequest/:id/:role", async (req, res) => {
  const { id } = req.params;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "order" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const response = await refurbishedRequestsModel.findByIdAndDelete(id);
    if (response) {
      return res
        .status(200)
        .send({ message: "Refurbished request deleted successfully!" });
    } else {
      return res.status(404).send({ error: "Refurbished request not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't Delete Refurbished Request now! Please try again later",
    });
  }
});

router.get("/viewGeneralSettings/:role", async (req, res) => {
  const role = req.params.role;
  try {
    let moduleAccess;
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "general_settings" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "general_settings"
      );
    }
    let data = [];
    const logo = await settingsModel.find({ type: "logo" });
    const generalBanner = await settingsModel.find({ type: "generalBanner" });
    const rentalBanner = await settingsModel.find({ type: "rentalBanner" });
    const refurbishedBanner = await settingsModel.find({
      type: "refurbishedBanner",
    });
    const modelBanner = await settingsModel.find({ type: "modelBanner" });
    const laptop = await settingsModel.find({ type: "laptopBrands" });
    const socialLinks = await settingsModel.find({ type: "socialLinks" });
    const video = await settingsModel.find({ type: "video" });
    const theme = await settingsModel.find({ type: "theme" });
    const initialAmount = await settingsModel.findOne({
      type: "initialAmount",
    });

    data.push({
      logo,
      video,
      generalBanner,
      rentalBanner,
      refurbishedBanner,
      modelBanner,
      laptop,
      socialLinks,
      theme,
      initialAmount,
    });
    if (data && data.length > 0) {
      return res.status(200).send({ data: data, moduleAccess });
    } else {
      return res.status(404).send({ error: "No Data Found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view settings now! Please try again later" });
  }
});

router.get("/viewCredentials/:role", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const role = req.params.role;
  try {
    let moduleAccess;
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "credentials_settings" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "credentials_settings"
      );
    }
    const response = await settingsModel.find({ type: "credential" });
    const serialNumberStart = skip + 1;

    const serialNumbers = Array.from(
      { length: response.length },
      (_, index) => serialNumberStart + index
    );

    const credentials = response.map((credential, index) => {
      return {
        ...credential.toObject(),
        s_no: serialNumbers[index],
      };
    });

    const totalItems = await settingsModel.countDocuments({
      type: "credential",
    });
    const totalPages = Math.ceil(totalItems / limit);

    const paginationInfo = {
      totalPages,
      totalItems,
      currentPage: page,
      startIndex: skip + 1,
      endIndex: skip + credentials.length,
      itemsPerPage: credentials.length,
    };

    if (response) {
      return res
        .status(200)
        .send({ data: credentials, pagination: paginationInfo, moduleAccess });
    } else {
      return res.status(404).send({ error: "Credentials not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't View Credentials now! Please try again later" });
  }
});

// // firebase
// router.post(
//   "/addCredential/:role",
//   upload.single("image"),
//   async (req, res) => {
//     const { credentialsKey, credentialsValue, type } = req.body;
//     const image = req.file;
//     const role = req.params.role;
//     try {
//       if (type === "credential") {
//         const validUser = await moduleAccessModel.findOne({
//           roleOfEmployee: role,
//         });
//         if (
//           !validUser ||
//           !validUser.modules.some(
//             (module) =>
//               module.moduleName === "credentials_settings" &&
//               module.write === true
//           )
//         ) {
//           return res
//             .status(403)
//             .send({ error: "You have no access to do this!" });
//         }
//       } else {
//         const validUser = await moduleAccessModel.findOne({
//           roleOfEmployee: role,
//         });
//         if (
//           !validUser ||
//           !validUser.modules.some(
//             (module) =>
//               module.moduleName === "general_settings" && module.write === true
//           )
//         ) {
//           return res
//             .status(403)
//             .send({ error: "You have no access to do this!" });
//         }
//       }

//       if (image) {
//         let imageUrl;
//         const imageName = `${Date.now()}_${image.originalname}`;
//         const imageUpload = admin
//           .storage()
//           .bucket()
//           .file(`images/${imageName}`);

//           const fileType = image.originalname.split(".").pop().toLowerCase();
//           if(fileType !== "jpg" && fileType !== "jpeg" && fileType !== "png" && fileType !== "svg" && fileType !== "webp" && fileType !== "gif"&& fileType !== "mp4" && fileType !== "avi" && fileType !== "mov" && fileType !== "mkv"){
//             return res.status(400).send({error: "Invalid image type!"});
//           }

//         await new Promise((resolve, reject) => {
//           const stream = imageUpload.createWriteStream({
//             metadata: {
//               contentType: image.mimetype,
//             },
//           });

//           stream.on("error", (err) => {
//             console.error("Error uploading file:", err);
//             reject(err);
//           });

//           stream.on("finish", async () => {
//             await imageUpload.makePublic();
//             imageUrl = imageUpload.publicUrl();
//             console.log(imageUrl);
//             resolve();
//           });

//           stream.end(image.buffer);
//         });

//         const newSetting = new settingsModel({
//           credentialsKey,
//           credentialsValue,
//           image: imageUrl,
//           type,
//         });
//         await newSetting.save();

//         return res
//           .status(200)
//           .send({ message: "Credentials added successully!" });
//       } else {
//         const newSetting = new settingsModel({
//           credentialsKey,
//           credentialsValue,
//           type,
//         });
//         await newSetting.save();

//         return res
//           .status(200)
//           .send({ message: "Credentials added successully!" });
//       }
//     } catch (error) {
//       console.error("Error:", error.message);
//       res
//         .status(500)
//         .send({
//           error: "Couldn't Add Credentials now! Please try again later",
//         });
//     }
//   }
// );

// s3

router.post(
  "/addCredential/:role",
  upload.single("image"),
  async (req, res) => {
    const { credentialsKey, credentialsValue, type } = req.body;
    const image = req.file;
    const role = req.params.role;
    try {
      if (type === "credential") {
        const validUser = await moduleAccessModel.findOne({
          roleOfEmployee: role,
        });
        if (
          !validUser ||
          !validUser.modules.some(
            (module) =>
              module.moduleName === "credentials_settings" &&
              module.write === true
          )
        ) {
          return res
            .status(403)
            .send({ error: "You have no access to do this!" });
        }
      } else {
        const validUser = await moduleAccessModel.findOne({
          roleOfEmployee: role,
        });
        if (
          !validUser ||
          !validUser.modules.some(
            (module) =>
              module.moduleName === "general_settings" && module.write === true
          )
        ) {
          return res
            .status(403)
            .send({ error: "You have no access to do this!" });
        }
      }

      if (
        type === "logo" ||
        type === "video" ||
        type === "initialAmount" ||
        type === "credential"
      ) {
        return res
          .status(400)
          .send({ error: "You were unable to add this type of data!" });
      }

      if (image) {
        let imageUrl;
        const imageName = `${Date.now()}_${image.originalname}`;

        const fileType = image.originalname.split(".").pop().toLowerCase();
        if (
          fileType !== "jpg" &&
          fileType !== "jpeg" &&
          fileType !== "png" &&
          fileType !== "svg" &&
          fileType !== "webp" &&
          fileType !== "gif" &&
          fileType !== "mp4" &&
          fileType !== "avi" &&
          fileType !== "mov" &&
          fileType !== "mkv"
        ) {
          return res.status(400).send({ error: "Invalid image type!" });
        }

        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `images/${imageName}`,
          Body: image.buffer,
          ContentType: image.mimetype,
          ACL: "public-read",
        };

        const uploadResult = await s3.upload(params).promise();
        imageUrl = uploadResult.Location;

        const newSetting = new settingsModel({
          credentialsKey,
          credentialsValue,
          image: imageUrl,
          type,
        });
        await newSetting.save();

        return res
          .status(200)
          .send({ message: "Credentials added successully!" });
      } else {
        if (type === "socialLinks") {
          const newSetting = new settingsModel({
            credentialsKey,
            credentialsValue,
            type,
            status: "yes",
          });
          await newSetting.save();
        } else {
          const newSetting = new settingsModel({
            credentialsKey,
            credentialsValue,
            type,
          });
          await newSetting.save();
        }

        return res
          .status(200)
          .send({ message: "Credentials added successully!" });
      }
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).send({
        error: "Couldn't Add Credentials now! Please try again later",
      });
    }
  }
);

// // firebase
// router.patch(
//   "/updateCredential/:id/:role",
//   upload.single("image"),
//   async (req, res) => {
//     const image = req.file;
//     const { id } = req.params;
//     const { credentialsKey, credentialsValue, type } = req.body;
//     const role = req.params.role;
//     try {
//       if (!type) {
//         return res.status(400).send({ error: "Please fill all fields!" });
//       }
//       if (type === "credential") {
//         const validUser = await moduleAccessModel.findOne({
//           roleOfEmployee: role,
//         });
//         if (
//           !validUser ||
//           !validUser.modules.some(
//             (module) =>
//               module.moduleName === "credentials_settings" &&
//               module.fullAccess === true
//           )
//         ) {
//           return res
//             .status(403)
//             .send({ error: "You have no access to do this!" });
//         }
//         if (credentialsKey) {
//           return res
//             .status(400)
//             .send({ error: "You shouldn't edit the Key Name" });
//         }
//       } else {
//         const validUser = await moduleAccessModel.findOne({
//           roleOfEmployee: role,
//         });
//         if (
//           !validUser ||
//           !validUser.modules.some(
//             (module) =>
//               module.moduleName === "general_settings" && module.write === true
//           )
//         ) {
//           return res
//             .status(403)
//             .send({ error: "You have no access to do this!" });
//         }
//       }

//       const validCredential = await settingsModel.findOne({ _id: id });
//       if (!validCredential) {
//         return res.status(400).send({ error: "Please fill all fields!" });
//       }
//       let imageUrl;
//       if (image) {
//         const imageName = `${Date.now()}_${image.originalname}`;
//         const imageUpload = admin
//           .storage()
//           .bucket()
//           .file(`images/${imageName}`);

//           const fileType = image.originalname.split(".").pop().toLowerCase();
//           if(fileType !== "jpg" && fileType !== "jpeg" && fileType !== "png" && fileType !== "svg" && fileType !== "webp" && fileType !== "gif"&& fileType !== "mp4" && fileType !== "avi" && fileType !== "mov" && fileType !== "mkv"){
//             return res.status(400).send({error: "Invalid image type!"});
//           }
//         await new Promise((resolve, reject) => {
//           const stream = imageUpload.createWriteStream({
//             metadata: {
//               contentType: image.mimetype,
//             },
//           });

//           stream.on("error", (err) => {
//             console.error("Error uploading file:", err);
//             reject(err);
//           });

//           stream.on("finish", async () => {
//             await imageUpload.makePublic();
//             imageUrl = imageUpload.publicUrl();
//             console.log(imageUrl);
//             resolve();
//           });

//           stream.end(image.buffer);
//         });
//       }

//       await settingsModel.findOneAndUpdate(
//         { _id: id },
//         {
//           $set: {
//             type,
//             credentialsKey,
//             credentialsValue,
//             image: imageUrl,
//           },
//         },
//         { new: true }
//       );

//       return res
//         .status(200)
//         .send({ message: "Credentials updated successfully!" });
//     } catch (error) {
//       console.error("Error:", error.message);
//       res.status(500).send({
//         error: "Couldn't Update Credentials now! Please try again later",
//       });
//     }
//   }
// );

// s3
router.patch(
  "/updateCredential/:id/:role",
  upload.single("image"),
  async (req, res) => {
    const image = req.file;
    const { id } = req.params;
    const { credentialsKey, credentialsValue, type, status } = req.body;
    const role = req.params.role;
    try {
      if (!type) {
        return res.status(400).send({ error: "Please fill all fields!" });
      }
      if (type === "credential") {
        const validUser = await moduleAccessModel.findOne({
          roleOfEmployee: role,
        });
        if (
          !validUser ||
          !validUser.modules.some(
            (module) =>
              module.moduleName === "credentials_settings" &&
              module.fullAccess === true
          )
        ) {
          return res
            .status(403)
            .send({ error: "You have no access to do this!" });
        }
        if (credentialsKey) {
          return res
            .status(400)
            .send({ error: "You shouldn't edit the Key Name" });
        }
      } else {
        const validUser = await moduleAccessModel.findOne({
          roleOfEmployee: role,
        });
        if (
          !validUser ||
          !validUser.modules.some(
            (module) =>
              module.moduleName === "general_settings" && module.write === true
          )
        ) {
          return res
            .status(403)
            .send({ error: "You have no access to do this!" });
        }
      }

      const validCredential = await settingsModel.findOne({ _id: id });
      if (!validCredential) {
        return res.status(400).send({ error: "Please fill all fields!" });
      }
      let imageUrl;
      if (image) {
        const imageName = `${Date.now()}_${image.originalname}`;
        if (
          type === "logo" ||
          type === "socialLinks" ||
          type === "laptopBrands"
        ) {
          const fileType = image.originalname.split(".").pop().toLowerCase();
          if (
            fileType !== "jpg" &&
            fileType !== "jpeg" &&
            fileType !== "png" &&
            fileType !== "svg" &&
            fileType !== "webp"
          ) {
            return res.status(400).send({ error: "Invalid file type!" });
          }
        }
        if (
          type === "generalBanner" ||
          type === "rentalBanner" ||
          type === "refurbishedBanner" ||
          type === "modelBanner"
        ) {
          const fileType = image.originalname.split(".").pop().toLowerCase();
          if (
            fileType !== "jpg" &&
            fileType !== "jpeg" &&
            fileType !== "png" &&
            fileType !== "svg" &&
            fileType !== "webp" &&
            fileType !== "gif"
          ) {
            return res.status(400).send({ error: "Invalid file type!" });
          }
        }
        if (type === "video") {
          const fileType = image.originalname.split(".").pop().toLowerCase();
          if (
            fileType !== "gif" &&
            fileType !== "mp4" &&
            fileType !== "avi" &&
            fileType !== "mov" &&
            fileType !== "mkv"
          ) {
            return res.status(400).send({ error: "Invalid file type!" });
          }
        }

        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `images/${imageName}`,
          Body: image.buffer,
          ContentType: image.mimetype,
          ACL: "public-read",
        };

        const uploadResult = await s3.upload(params).promise();
        imageUrl = uploadResult.Location;
      }

      if (status) {
        if (type !== "socialLinks") {
          return res
            .status(400)
            .send({ error: "Status only applicable to SocialLinks!" });
        }
      }

      await settingsModel.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            type,
            credentialsKey,
            credentialsValue,
            image: imageUrl,
            status,
          },
        },
        { new: true }
      );

      return res
        .status(200)
        .send({ message: "Credentials updated successfully!" });
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).send({
        error: "Couldn't Update Credentials now! Please try again later",
      });
    }
  }
);

router.delete("/deleteCredential/:id/:role", async (req, res) => {
  const { id } = req.params;
  const role = req.params.role;
  try {
    const type = await settingsModel.findById(id);

    if (type.type === "credential") {
      const validUser = await moduleAccessModel.findOne({
        roleOfEmployee: role,
      });
      if (
        !validUser ||
        !validUser.modules.some(
          (module) =>
            module.moduleName === "credentials_settings" &&
            module.write === true
        )
      ) {
        return res
          .status(403)
          .send({ error: "You have no access to do this!" });
      }
    } else {
      const validUser = await moduleAccessModel.findOne({
        roleOfEmployee: role,
      });
      if (
        !validUser ||
        !validUser.modules.some(
          (module) =>
            module.moduleName === "general_settings" && module.write === true
        )
      ) {
        return res
          .status(403)
          .send({ error: "You have no access to do this!" });
      }
    }

    const response = await settingsModel.findByIdAndDelete(id);
    if (response) {
      return res
        .status(200)
        .send({ message: "Credential deleted successfully!" });
    } else {
      return res.status(404).send({ error: "Credential not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't Delete Credential now! Please try again later",
    });
  }
});

router.get("/dashboard", async (req, res) => {
  try {
    const users = await usersModel.find().sort({ createdAt: -1 }).limit(5);
    const transaction = await transactionModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5);
    const quotationRequest = await quotationModel
      .find({ status: "Pending" })
      .sort({ createdAt: -1 })
      .limit(5);

    const totalUsers = await usersModel.countDocuments();
    const unClosedQuotationRequests = await quotationModel.countDocuments({
      status: "Pending",
    });
    const unVerifiedProductReviews = await productReviewModel.countDocuments({
      status: "Pending",
    });
    const unVerifiedReviews = await reviewModel.countDocuments({
      status: "Pending",
    });

    const reviews = unVerifiedProductReviews + unVerifiedReviews;

    console.log(reviews);

    const rentalLaptops = await rentLaptopModel.countDocuments({
      status: "Active",
    });
    const totalRentalLaptops = await rentLaptopModel.countDocuments();
    const rentalLaptopsInHand = `${rentalLaptops} / ${totalRentalLaptops} `;

    const newOrders = await orderModel.countDocuments({ status: "Pending" });

    return res.status(200).send({
      data: {
        users,
        transaction,
        quotationRequest,
        reviews,
        totalUsers,
        unClosedQuotationRequests,
        unVerifiedReviews,
        rentalLaptopsInHand,
        // refurbishedLaptopsInHand,
        newOrders,
      },
    });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't View Dashboard now! Please try again later" });
  }
});

router.get("/viewCategories/:role/:search?", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) | 10;
  const sortBy = req.query.sortBy || "status";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const searchString = req.params.search || "";
  const role = req.params.role;
  try {
    let moduleAccess;
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "category" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "category"
      );
    }
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const escapedSearchString = searchString.replace(/\+/g, "\\+");
    const searchRegex = new RegExp(escapedSearchString, "i");
    const query = {
      $or: [
        { category: { $regex: searchRegex } },
        { status: { $regex: searchRegex } },
      ],
    };

    const response = await categoryModel
      .find(query)
      .skip(skip)
      .sort(sortOptions)
      .limit(limit);

    const serialNumberStart = skip + 1;
    const serialNumbers = Array.from(
      { length: response.length },
      (_, index) => serialNumberStart + index
    );

    const categories = response.map((request, index) => {
      return {
        ...request.toObject(),
        s_no: serialNumbers[index],
      };
    });

    const totalItems = await categoryModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const paginationInfo = {
      totalItems,
      totalPages,
      currentPage: page,
      startIndex: skip + 1,
      endIndex: skip + categories.length,
      itemsPerPage: categories.length,
    };

    return res
      .status(200)
      .send({ data: categories, pagination: paginationInfo, moduleAccess });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't View Categories now! Please try again later",
    });
  }
});

// // firebase
// router.post("/addCategory/:role", upload.single("image"), async (req, res) => {
//   const { category } = req.body;
//   const image = req.file;
//   const role = req.params.role;
//   try {
//     const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
//     if (
//       !validUser ||
//       !validUser.modules.some(
//         (module) => module.moduleName === "category" && module.write === true
//       )
//     ) {
//       return res.status(403).send({ error: "You have no access to do this!" });
//     }

//     if (!category || !image) {
//       return res.status(400).send({ error: "Please fill all fields!" });
//     }

//     const existCategory = await categoryModel.findOne({ category });
//     if (existCategory) {
//       return res.status(400).send({ error: "Category already exists!" });
//     }

//     let imageUrl;
//     const imageName = `${Date.now()}_${image.originalname}`;
//     const imageUpload = admin.storage().bucket().file(`images/${imageName}`);

//     const fileType = image.originalname.split(".").pop().toLowerCase();
//     if(fileType !== "jpg" && fileType !== "jpeg" && fileType !== "png" && fileType !== "svg" && fileType !== "webp"){
//       return res.status(400).send({error: "Invalid image type!"});
//     }
//     await new Promise((resolve, reject) => {
//       const stream = imageUpload.createWriteStream({
//         metadata: {
//           contentType: image.mimetype,
//         },
//       });

//       stream.on("error", (err) => {
//         console.error("Error uploading file:", err);
//         reject(err);
//       });

//       stream.on("finish", async () => {
//         await imageUpload.makePublic();
//         imageUrl = imageUpload.publicUrl();
//         console.log(imageUrl);
//         resolve();
//       });

//       stream.end(image.buffer);
//     });

//     const existingCategory = await categoryModel
//       .find()
//       .sort({ _id: -1 })
//       .limit(1);
//     let newCategoryId = 1;
//     if (existingCategory.length > 0) {
//       newCategoryId = existingCategory[0].categoryId + 1;
//     }

//     const newCategory = new categoryModel({
//       categoryId: newCategoryId,
//       category,
//       image: imageUrl,
//       status: "InActive",
//     });
//     await newCategory.save();

//     return res
//       .status(200)
//       .send({ message: `${category} added in categories successfully!` });
//   } catch (error) {
//     console.error("Error:", error.message);
//     res.status(500).send({
//       error: "Couldn't Configure Categories now! Please try again later",
//     });
//   }
// });

// s3
router.post("/addCategory/:role", upload.single("image"), async (req, res) => {
  const { category } = req.body;
  const image = req.file;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "category" && module.write === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    if (!category || !image) {
      return res.status(400).send({ error: "Please fill all fields!" });
    }

    const existCategory = await categoryModel.findOne({ category });
    if (existCategory) {
      return res.status(400).send({ error: "Category already exists!" });
    }

    let imageUrl;
    const imageName = `${Date.now()}_${image.originalname}`;

    const fileType = image.originalname.split(".").pop().toLowerCase();
    if (
      fileType !== "jpg" &&
      fileType !== "jpeg" &&
      fileType !== "png" &&
      fileType !== "svg" &&
      fileType !== "webp"
    ) {
      return res.status(400).send({ error: "Invalid image type!" });
    }
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `images/${imageName}`,
      Body: image.buffer,
      ContentType: image.mimetype,
      ACL: "public-read",
    };

    const uploadResult = await s3.upload(params).promise();
    imageUrl = uploadResult.Location;

    // const existingCategory = await categoryModel
    //   .find()
    //   .sort({ _id: -1 })
    //   .limit(1);
    // let newCategoryId = 1;
    // if (existingCategory.length > 0) {
    //   newCategoryId = existingCategory[0].categoryId + 1;
    // }

    const newCategory = new categoryModel({
      category,
      image: imageUrl,
      status: "InActive",
      showInHomePage: "no",
    });
    await newCategory.save();

    return res
      .status(200)
      .send({ message: `${category} added in categories successfully!` });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't Configure Categories now! Please try again later",
    });
  }
});

// // firebase
// router.patch(
//   "/updateCategory/:id/:role",
//   upload.single("image"),
//   async (req, res) => {
//     const { category, status } = req.body;
//     const { id } = req.params;
//     const image = req.file;
//     const role = req.params.role;
//     try {
//       const validUser = await moduleAccessModel.findOne({
//         roleOfEmployee: role,
//       });

//       if (
//         !validUser ||
//         !validUser.modules.some(
//           (module) =>
//             module.moduleName === "category" && module.fullAccess === true
//         )
//       ) {
//         return res
//           .status(403)
//           .send({ error: "You have no access to do this!" });
//       }

//       let imageUrl;
//       if (image) {
//         const imageName = `${Date.now()}_${image.originalname}`;
//         const imageUpload = admin
//           .storage()
//           .bucket()
//           .file(`images/${imageName}`);

//           const fileType = image.originalname.split(".").pop().toLowerCase();
//           if(fileType !== "jpg" && fileType !== "jpeg" && fileType !== "png" && fileType !== "svg" && fileType !== "webp"){
//             return res.status(400).send({error: "Invalid image type!"});
//           }
//         await new Promise((resolve, reject) => {
//           const stream = imageUpload.createWriteStream({
//             metadata: {
//               contentType: image.mimetype,
//             },
//           });

//           stream.on("error", (err) => {
//             console.error("Error uploading file:", err);
//             reject(err);
//           });

//           stream.on("finish", async () => {
//             await imageUpload.makePublic();
//             imageUrl = imageUpload.publicUrl();
//             console.log(imageUrl);
//             resolve();
//           });

//           stream.end(image.buffer);
//         });
//       }

//       const response = await categoryModel.findByIdAndUpdate(
//         id,
//         { $set: { category, image: imageUrl, status } },
//         { new: true }
//       );
//       if (response) {
//         return res
//           .status(200)
//           .send({ message: `Category updated successfully!` });
//       } else {
//         return res.status(404).send({ error: "Category not found!" });
//       }
//     } catch (error) {
//       console.error("Error:", error.message);
//       res.status(500).send({
//         error: "Couldn't Update Category now! Please try again later",
//       });
//     }
//   }
// );

// s3
router.patch(
  "/updateCategory/:id/:role",
  upload.single("image"),
  async (req, res) => {
    const { category, status, showInHomePage } = req.body;
    const { id } = req.params;
    const image = req.file;
    const role = req.params.role;
    try {
      const validUser = await moduleAccessModel.findOne({
        roleOfEmployee: role,
      });

      if (
        !validUser ||
        !validUser.modules.some(
          (module) =>
            module.moduleName === "category" && module.fullAccess === true
        )
      ) {
        return res
          .status(403)
          .send({ error: "You have no access to do this!" });
      }

      const validCategory = await categoryModel.findOne({ _id: id });
      if (!validCategory) {
        return res.status(404).send({ error: "Category not found!" });
      }

      if (
        status === "Active" &&
        (showInHomePage === null ||
          showInHomePage === undefined ||
          showInHomePage === "no")
      ) {
        if (validCategory.showInHomePage !== "yes") {
          return res.status(404).send({
            error:
              "Category is now disabled in the HomePage! Please enable it to update the status",
          });
        }
      }

      let imageUrl;
      if (image) {
        const imageName = `${Date.now()}_${image.originalname}`;

        const fileType = image.originalname.split(".").pop().toLowerCase();
        if (
          fileType !== "jpg" &&
          fileType !== "jpeg" &&
          fileType !== "png" &&
          fileType !== "svg" &&
          fileType !== "webp"
        ) {
          return res.status(400).send({ error: "Invalid image type!" });
        }
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `images/${imageName}`,
          Body: image.buffer,
          ContentType: image.mimetype,
          ACL: "public-read",
        };

        const uploadResult = await s3.upload(params).promise();
        imageUrl = uploadResult.Location;
      }

      await categoryModel.findByIdAndUpdate(
        id,
        { $set: { category, image: imageUrl, status, showInHomePage } },
        { new: true }
      );
      return res
        .status(200)
        .send({ message: `Category updated successfully!`, body: req.body });
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).send({
        error: "Couldn't Update Category now! Please try again later",
      });
    }
  }
);

router.delete("/deleteCategory/:id/:role", async (req, res) => {
  const { id } = req.params;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "category" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const response = await categoryModel.findByIdAndDelete(id);
    if (response) {
      return res
        .status(200)
        .send({ message: "Category deleted successfully!" });
    } else {
      return res.status(404).send({ error: "Category not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't Delete Category now! Please try again later" });
  }
});

router.get(
  "/viewSupportForms1/:role/:phoneNumber/:search?",
  async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const searchString = req.params.search || "";
    const role = req.params.role;
    let phoneNumber = req.params.phoneNumber;
    try {
      let moduleAccess;
      const validUser = await moduleAccessModel.findOne({
        roleOfEmployee: role,
      });
      if (
        !validUser ||
        !validUser.modules.some(
          (module) => module.moduleName === "support" && module.read === true
        )
      ) {
        return res
          .status(403)
          .send({ error: "You have no access to view this Page!" });
      } else {
        moduleAccess = validUser.modules.find(
          (module) => module.moduleName === "support"
        );
      }

      if (!phoneNumber.startsWith("+91")) {
        phoneNumber = `+91${phoneNumber}`;
      }

      const skip = (page - 1) * limit;

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder;

      const escapedSearchString = searchString.replace(/\+/g, "\\+");
      const searchRegex = new RegExp(escapedSearchString, "i");

      const query = {
        $or: [
          { phoneNumber: { $regex: searchRegex } },
          { userName: { $regex: searchRegex } },
          { email: { $regex: searchRegex } },
          { message: { $regex: searchRegex } },
          { status: { $regex: searchRegex } },
          { doneBy: { $regex: searchRegex } },
        ],
      };

      const response = await supportFormModel
        .find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);

      const serialNumberStart = skip + 1;
      const serialNumbers = Array.from(
        { length: response.length },
        (_, index) => serialNumberStart + index
      );

      const support = response.map((form, index) => {
        return {
          ...form.toObject(),
          s_no: serialNumbers[index],
        };
      });

      const totalItems = await supportFormModel.countDocuments(query);
      const totalPages = Math.ceil(totalItems / limit);

      const paginationInfo = {
        totalItems,
        totalPages,
        currentPage: page,
        startIndex: skip + 1,
        endIndex: skip + support.length,
        itemsPerPage: support.length,
      };

      let supportCount;
      const previousSupportCountss = await notificationCountModel.findOne({
        type: "supportCount",
        "details.employeePhoneNumber": phoneNumber,
      });

      const previousSupportCount = previousSupportCountss.details.find(
        (emp) => emp.employeePhoneNumber === phoneNumber
      );

      const currentSupport = await supportFormModel.countDocuments();

      const supportCountings = currentSupport - previousSupportCount.count;
      if (supportCountings === currentSupport) {
        supportCount = 0;
      } else {
        supportCount = supportCountings;
      }

      // await notificationCountModel.findOneAndUpdate({type: "supportCount", "details.employeePhoneNumber": phoneNumber}, {$set: {'details.$.count': currentSupport}}, {new: true});

      return res
        .status(200)
        .send({
          data: support,
          pagination: paginationInfo,
          moduleAccess,
          supportCount,
        });
    } catch (error) {
      console.error("Error:", error.message);
      res
        .status(500)
        .send({ error: "Couldn't View Details now! Please try again later" });
    }
  }
);

router.get(
  "/viewSupportForms/:role/:phoneNumber/:search?",
  async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const searchString = req.params.search || "";
    const role = req.params.role;
    let phoneNumber = req.params.phoneNumber;
    try {
      let moduleAccess;
      const validUser = await moduleAccessModel.findOne({
        roleOfEmployee: role,
      });
      if (
        !validUser ||
        !validUser.modules.some(
          (module) => module.moduleName === "support" && module.read === true
        )
      ) {
        return res
          .status(403)
          .send({ error: "You have no access to view this Page!" });
      } else {
        moduleAccess = validUser.modules.find(
          (module) => module.moduleName === "support"
        );
      }

      if (!phoneNumber.startsWith("+91")) {
        phoneNumber = `+91${phoneNumber}`;
      }

      const skip = (page - 1) * limit;

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder;

      const escapedSearchString = searchString.replace(/\+/g, "\\+");
      const searchRegex = new RegExp(escapedSearchString, "i");

      const query = {
        $or: [
          { phoneNumber: { $regex: searchRegex } },
          { userName: { $regex: searchRegex } },
          { email: { $regex: searchRegex } },
          { message: { $regex: searchRegex } },
          { status: { $regex: searchRegex } },
          { doneBy: { $regex: searchRegex } },
        ],
      };

      const response = await supportFormModel
        .find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);

      const serialNumberStart = skip + 1;
      const serialNumbers = Array.from(
        { length: response.length },
        (_, index) => serialNumberStart + index
      );

      const support = response.map((form, index) => {
        return {
          ...form.toObject(),
          s_no: serialNumbers[index],
        };
      });

      const totalItems = await supportFormModel.countDocuments(query);
      const totalPages = Math.ceil(totalItems / limit);

      const paginationInfo = {
        totalItems,
        totalPages,
        currentPage: page,
        startIndex: skip + 1,
        endIndex: skip + support.length,
        itemsPerPage: support.length,
      };

      const previousSupportCountss = await notificationCountModel.findOne({
        type: "supportCount",
        "details.employeePhoneNumber": phoneNumber,
      });

      const previousSupportCount = previousSupportCountss.details.find(
        (emp) => emp.employeePhoneNumber === phoneNumber
      );

      const currentSupport = await supportFormModel.countDocuments();

      const supportCountings =
        currentSupport - (previousSupportCount?.count || 0);

      // const supportCountPerPage = [];

      // for(let i = 1; i<=totalPages; i++){
      const remainingCounts = supportCountings - (page - 1) * limit;
      const supportCount =
        remainingCounts > limit ? limit : Math.max(0, remainingCounts);
      //   supportCountPerPage.push({page: i, supportCount})
      // }

      // await notificationCountModel.findOneAndUpdate({type: "supportCount", "details.employeePhoneNumber": phoneNumber}, {$set: {'details.$.count': currentSupport}}, {new: true});

      return res
        .status(200)
        .send({
          supportCount,
          data: support,
          pagination: paginationInfo,
          moduleAccess,
        });
    } catch (error) {
      console.error("Error:", error.message);
      res
        .status(500)
        .send({ error: "Couldn't View Details now! Please try again later" });
    }
  }
);

// router.patch("/updateSupportForms/:id/:role/:phoneNumber", async (req, res) => {
//   const { id } = req.params;
//   const { adminComments, status } = req.body;
//   const role = req.params.role;
//   let phoneNumber = req.params.phoneNumber;
//   try {
//     const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
//     if (
//       !validUser ||
//       !validUser.modules.some(
//         (module) =>
//           module.moduleName === "support" && module.fullAccess === true
//       )
//     ) {
//       return res.status(403).send({ error: "You have no access to do this!" });
//     }

//     const validSupport = await supportFormModel.findOne({_id: id});
//     if(!validSupport){
//       return res.status(404).send({error: "Support request not found!"})
//     }

//     if(validSupport.status === "Closed"){
//       return res.status(400).send({error: "Support already closed!"});
//     }

//     if (!id || !status) {
//       return res.status(400).send({ errro: "Please fill all fields!" });
//     }

//     if(phoneNumber){
//       if(!phoneNumber.startsWith("+91")){
//         phoneNumber = `+91${phoneNumber}`;
//       }
//     }

//     if (status === "Closed") {
//       if (!phoneNumber || !adminComments) {
//         return res.status(400).send({ error: "Please fill all fields!" });
//       }

//       var employee;
//       if(role === "Admin"){
//         employee = {nameOfEmployee: "Admin"}
//       } else {
//         employee = await employeesModel.findOne({phoneNumber});
//       }
//     }

//     await supportFormModel.findByIdAndUpdate(
//       id,
//       { $set: { adminComments, status, doneBy: employee ? employee.nameOfEmployee : null } },
//       { new: true }
//     );
//       return res.status(200).send({ message: `Form updated successfully!` });

//   } catch (error) {
//     console.error("Error:", error.message);
//     res
//       .status(500)
//       .send({ error: "Couldn't Update Form now! Please try again later" });
//   }
// });

router.patch("/updateSupportForms/:id/:role/:phoneNumber", async (req, res) => {
  const { id } = req.params;
  const { adminComments, status } = req.body;
  const role = req.params.role;
  let phoneNumber = req.params.phoneNumber;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "support" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const validSupport = await supportFormModel.findOne({ _id: id });
    if (!validSupport) {
      return res.status(404).send({ error: "Support request not found!" });
    }

    if (validSupport.status === "Closed") {
      return res.status(400).send({ error: "Support already closed!" });
    }

    if (!id || !status) {
      return res.status(400).send({ errro: "Please fill all fields!" });
    }

    if (phoneNumber) {
      if (!phoneNumber.startsWith("+91")) {
        phoneNumber = `+91${phoneNumber}`;
      }
    }

    if (validSupport.type === "Custom Laptop Request") {
      await customConfigurationsModel.findOneAndUpdate(
        { supportId: validSupport.supportId },
        { $set: { status, note: adminComments } },
        { new: true }
      );
    }

    if (status === "Closed") {
      if (!phoneNumber || !adminComments) {
        return res.status(400).send({ error: "Please fill all fields!" });
      }

      var employee;
      if (role === "Admin") {
        employee = { nameOfEmployee: "Admin" };
      } else {
        employee = await employeesModel.findOne({ phoneNumber });
      }
    }

    await supportFormModel.findByIdAndUpdate(
      id,
      {
        $set: {
          adminComments,
          status,
          doneBy: employee ? employee.nameOfEmployee : null,
        },
      },
      { new: true }
    );
    return res.status(200).send({ message: `Form updated successfully!` });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't Update Form now! Please try again later" });
  }
});

router.delete("/deleteSupportForms/:id/:role", async (req, res) => {
  const { id } = req.params;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "support" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const response = await supportFormModel.findByIdAndDelete(id);
    if (response) {
      return res.status(200).send({ message: "Form deleted successfully!" });
    } else {
      return res.status(404).send({ error: "Form not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't Delete Form now! Please try again later" });
  }
});

router.post("/addReview/:role", upload.array("images"), async (req, res) => {
  let { phoneNumber, userName, rating, review } = req.body;
  const role = req.params.role;
  const images = req.files;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "review" && module.write === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    phoneNumber = `+91${phoneNumber}`;

    if (!phoneNumber || !userName || !rating || !review) {
      return res.status(400).send({ errro: "Please fill all fields!" });
    }

    let imageUrls = [];
    if (images) {
      for (const image of images) {
        if (!isValidFileExtension(image.originalname)) {
          return res.status(400).send({ error: "Invalid file type!" });
        }
        const imageName = `${Date.now()}_${image.originalname}`;

        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `images/${imageName}`,
          Body: image.buffer,
          ContentType: image.mimetype,
          ACL: "public-read",
        };

        const imageUploadResult = await s3.upload(params).promise();
        imageUrls.push(imageUploadResult.Location);
      }
    }

    const newReview = new reviewModel({
      phoneNumber,
      userName: userName,
      profileImage:
        "https://storage.googleapis.com/meetinground-464c9.appspot.com/images%2F1720499308802_user%20(11).png",
      rating,
      review,
      images: imageUrls,
      showInHomePage: "no",
      status: "Approved",
    });
    await newReview.save();

    return res.status(200).send({ message: "Thanks for your Review!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't add Review now! Please try again later" });
  }
});

// router.post("/productReview/:role", async (req, res) => {
//   let { phoneNumber, userName, productId, productType, rating, review } =
//     req.body;
//   const role = req.params.role;
//   try {
//     const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });

//     if (
//       !validUser ||
//       !validUser.modules.some(
//         (module) =>
//           module.moduleName === "reviews_products" && module.write === true
//       )
//     ) {
//       return res.status(403).send({ error: "You have no access to do this!" });
//     }

//     if (
//       !phoneNumber ||
//       !userName ||
//       !productId ||
//       !productType ||
//       !rating ||
//       !review
//     ) {
//       return res.status(400).send({ error: "Please fill all fields!" });
//     }

//     phoneNumber = `+91${phoneNumber}`;

//     const existReview = await productReviewModel.findOne({
//       userName,
//       productId,
//     });
//     if (existReview) {
//       return res
//         .status(400)
//         .send({ error: "Review already exists for this Name!" });
//     }

//     const reviews = {
//       phoneNumber,
//       userName,
//       profileImage:
//         "https://storage.googleapis.com/meetinground-464c9.appspot.com/images%2F1720499308802_user%20(11).png",
//       rating,
//       review,
//       status: "Approved",
//     };

//     let validProduct;
//     if (productType === "refurbished") {
//       validProduct = await refurbishedLaptopModel.findOne({ _id: productId });
//       await refurbishedLaptopModel.findOneAndUpdate(
//         { _id: productId },
//         { $addToSet: { reviews: reviews } }
//       );
//     } else if (productType === "rental") {
//       validProduct = await rentLaptopModel.findOne({ _id: productId });
//       await rentLaptopModel.findOneAndUpdate(
//         { _id: productId },
//         { $addToSet: { reviews: reviews } }
//       );
//     }

//     if (!validProduct) {
//       return res.status(404).send({ error: "Product not found!" });
//     }

//     const newReview = new productReviewModel({
//       productId,
//       productType,
//       phoneNumber,
//       userName,
//       profileImage:
//         "https://storage.googleapis.com/meetinground-464c9.appspot.com/images%2F1720499308802_user%20(11).png",
//       rating,
//       review,
//       status: "Approved",
//     });
//     await newReview.save();

//     return res.status(200).send({ message: "Review added successfully!" });
//   } catch (error) {
//     console.error("Error:", error.message);
//     console.log({ error: "Couldn't Add Review now! Please try again later" });
//   }
// });

router.post(
  "/productReview/:role",
  upload.array("images"),
  async (req, res) => {
    let { phoneNumber, userName, productId, productType, rating, review } =
      req.body;
    const role = req.params.role;
    const images = req.files;
    try {
      const validUser = await moduleAccessModel.findOne({
        roleOfEmployee: role,
      });

      if (
        !validUser ||
        !validUser.modules.some(
          (module) =>
            module.moduleName === "reviews_products" && module.write === true
        )
      ) {
        return res
          .status(403)
          .send({ error: "You have no access to do this!" });
      }

      if (
        !phoneNumber ||
        !userName ||
        !productId ||
        !productType ||
        !rating ||
        !review
      ) {
        return res.status(400).send({ error: "Please fill all fields!" });
      }

      phoneNumber = `+91${phoneNumber}`;

      const existReview = await productReviewModel.findOne({
        userName,
        productId,
      });
      if (existReview) {
        return res
          .status(400)
          .send({ error: "Review already exists for this Name!" });
      }

      let imageUrls = [];

      if (images) {
        for (const image of images) {
          if (!isValidFileExtension(image.originalname)) {
            return res.status(400).send({ error: "Invalid file type!" });
          }
          const imageName = `${Date.now()}_${image.originalname}`;
          const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Body: image.buffer,
            Key: `images/${imageName}`,
            ContentType: image.mimetype,
            ACL: "public-read",
          };

          const imageUploadResult = await s3.upload(params).promise();
          imageUrls.push(imageUploadResult.Location);
        }
      }

      const reviews = {
        phoneNumber,
        userName,
        profileImage:
          "https://storage.googleapis.com/meetinground-464c9.appspot.com/images%2F1720499308802_user%20(11).png",
        rating,
        review,
        images: imageUrls,
        status: "Approved",
      };

      let validProduct;
      if (productType === "Refurbished") {
        validProduct = await refurbishedLaptopModel.findOne({ _id: productId });
        await refurbishedLaptopModel.findOneAndUpdate(
          { _id: productId },
          { $addToSet: { reviews: reviews } }
        );
      } else if (productType === "Rental") {
        validProduct = await rentLaptopModel.findOne({ _id: productId });
        await rentLaptopModel.findOneAndUpdate(
          { _id: productId },
          { $addToSet: { reviews: reviews } }
        );
      }

      if (!validProduct) {
        return res.status(404).send({ error: "Product not found!" });
      }

      const newReview = new productReviewModel({
        productId,
        productType,
        phoneNumber,
        userName,
        profileImage:
          "https://storage.googleapis.com/meetinground-464c9.appspot.com/images%2F1720499308802_user%20(11).png",
        rating,
        review,
        images: imageUrls,
        status: "Approved",
      });
      await newReview.save();

      return res.status(200).send({ message: "Review added successfully!" });
    } catch (error) {
      console.error("Error:", error.message);
      console.log({ error: "Couldn't Add Review now! Please try again later" });
    }
  }
);

router.get("/viewQuotes1/:role/:phoneNumber/:search?", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const searchString = req.params.search || "";
  const role = req.params.role;
  let phoneNumber = req.params.phoneNumber;
  try {
    let moduleAccess;
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "quotation_requests" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "quotation_requests"
      );
    }

    if (!phoneNumber.startsWith("+91")) {
      phoneNumber = `+91${phoneNumber}`;
    }
    const skip = (page - 1) * limit;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const escapedSearchString = searchString.replace(/\+/g, "\\+");
    const searchRegex = new RegExp(escapedSearchString, "i");

    const query = {
      status: { $in: ["Pending", "Cancelled"] },
      $or: [
        { phoneNumber: { $regex: searchRegex } },
        { userName: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { laptopId: { $regex: searchRegex } },
        { laptopModel: { $regex: searchRegex } },
        { laptopBrand: { $regex: searchRegex } },
        { note: { $regex: searchRegex } },
        { type: { $regex: searchRegex } },
        { status: { $regex: searchRegex } },
      ],
    };

    const response = await quotationModel
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const serialNumberStart = skip + 1;
    const serialNumbers = Array.from(
      { length: response.length },
      (_, index) => serialNumberStart + index
    );

    const support = response.map((form, index) => {
      return {
        ...form.toObject(),
        s_no: serialNumbers[index],
      };
    });

    const totalItems = await quotationModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const paginationInfo = {
      totalItems,
      totalPages,
      currentPage: page,
      startIndex: skip + 1,
      endIndex: skip + support.length,
      itemsPerPage: support.length,
    };

    let quoteCount;
    const previousQuoteCountss = await notificationCountModel.findOne({
      type: "quoteCount",
      "details.employeePhoneNumber": phoneNumber,
    });

    const previousQuoteCount = previousQuoteCountss.details.find(
      (emp) => emp.employeePhoneNumber === phoneNumber
    );

    const currentQuote = await quotationModel.countDocuments();

    const quoteCountings = currentQuote - previousQuoteCount.count;
    if (quoteCountings === currentQuote) {
      quoteCount = 0;
    } else {
      quoteCount = quoteCountings;
    }

    // await notificationCountModel.findOneAndUpdate({type: "quoteCount", "details.employeePhoneNumber": phoneNumber}, {$set: {'details.$.count': currentQuote}}, {new: true});

    return res
      .status(200)
      .send({
        quoteCount,
        data: support,
        pagination: paginationInfo,
        moduleAccess,
      });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't View Quote Requests now! Please try again later",
    });
  }
});

router.get("/viewQuotes/:role/:phoneNumber/:search?", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const searchString = req.params.search || "";
  const role = req.params.role;
  let phoneNumber = req.params.phoneNumber;
  try {
    let moduleAccess;
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "quotation_requests" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "quotation_requests"
      );
    }

    if (!phoneNumber.startsWith("+91")) {
      phoneNumber = `+91${phoneNumber}`;
    }
    const skip = (page - 1) * limit;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const escapedSearchString = searchString.replace(/\+/g, "\\+");
    const searchRegex = new RegExp(escapedSearchString, "i");

    const query = {
      status: { $in: ["Pending", "Cancelled"] },
      $or: [
        { phoneNumber: { $regex: searchRegex } },
        { userName: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { laptopId: { $regex: searchRegex } },
        { laptopModel: { $regex: searchRegex } },
        { laptopBrand: { $regex: searchRegex } },
        { note: { $regex: searchRegex } },
        { type: { $regex: searchRegex } },
        { status: { $regex: searchRegex } },
      ],
    };

    const response = await quotationModel
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const serialNumberStart = skip + 1;
    const serialNumbers = Array.from(
      { length: response.length },
      (_, index) => serialNumberStart + index
    );

    const support = response.map((form, index) => {
      return {
        ...form.toObject(),
        s_no: serialNumbers[index],
      };
    });

    const totalItems = await quotationModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const paginationInfo = {
      totalItems,
      totalPages,
      currentPage: page,
      startIndex: skip + 1,
      endIndex: skip + support.length,
      itemsPerPage: support.length,
    };

    let quoteCount;
    const previousQuoteCountss = await notificationCountModel.findOne({
      type: "quoteCount",
      "details.employeePhoneNumber": phoneNumber,
    });

    const previousQuoteCount = previousQuoteCountss.details.find(
      (emp) => emp.employeePhoneNumber === phoneNumber
    );

    const currentQuote = await quotationModel.countDocuments();

    const quoteCountings = currentQuote - (previousQuoteCount?.count || 0);

    // const quoteCountPerPage = [];
    // for(let i = 1; i<=totalPages;i++){
    const remainingCounts = quoteCountings - (page - 1) * limit;
    const quoteCounts =
      remainingCounts > limit ? limit : Math.max(0, remainingCounts);
    //   quoteCountPerPage.push({page: i, quoteCounts})
    // }

    // await notificationCountModel.findOneAndUpdate({type: "quoteCount", "details.employeePhoneNumber": phoneNumber}, {$set: {'details.$.count': currentQuote}}, {new: true});

    return res
      .status(200)
      .send({
        quoteCounts,
        data: support,
        pagination: paginationInfo,
        moduleAccess,
      });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't View Quote Requests now! Please try again later",
    });
  }
});

router.get("/viewQuotationDetails/:role", async (req, res) => {
  const { role } = req.params;
  const { requestId } = req.query;
  try {
    let moduleAccess;
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "quotation_requests" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "quotation_requests"
      );
    }

    const validQuote = await quotationModel.findOne({ requestId });
    if (!validQuote) {
      return res.status(404).send({ error: "Quote not found!" });
    }

    const customerDetails = {
      requestId: validQuote.requestId,
      userName: validQuote.userName,
      email: validQuote.email,
      phoneNumber: validQuote.phoneNumber,
      alternatePhoneNumber: validQuote.alternatePhoneNumber,
      amount: validQuote.amount,
      transactionId: validQuote.transactionId,
      address: validQuote.address,
      status: validQuote.status,
    };

    return res
      .status(200)
      .send({ data: validQuote.products, customerDetails, moduleAccess });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view quotation now! Please try again later" });
  }
});

// router.patch("/updateQuote/:id/:role", async (req, res) => {
//   const quoteId = req.params.id;
//   let { status, address, notes, alternatePhoneNumber } =
//     req.body;
//   const role = req.params.role;

//   try {
//     const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
//     if (
//       !validUser ||
//       !validUser.modules.some(
//         (module) =>
//           module.moduleName === "quotation_requests" && module.fullAccess
//       )
//     ) {
//       return res.status(403).send({ error: "You have no access to do this!" });
//     }

//     if (alternatePhoneNumber) {
//       if (!alternatePhoneNumber.startsWith("+91")) {
//         alternatePhoneNumber = `+91${alternatePhoneNumber}`;
//       }
//     }

//     const quotationRequest = await quotationModel.findOne({
//       _id: quoteId
//     });
//     if (!quotationRequest) {
//       return res.status(404).send({ error: "Quote not found!" });
//     };

//     if(quotationRequest.status === "Confirmed"){
//       if(status){
//         return res.status(400).send({error: "Order has been confirmed! You can't change the status now"});
//       }
//     }

//     const requestId = await orderModel.find({requestId: quotationRequest.requestId});
//     if(status === "Confirmed"){
//     if(requestId && requestId.length > 0){
//       await quotationModel.findOneAndUpdate({_id: quoteId},  { $set: { address, notes, status } }, {new: true});
//       return res.status(200).send({message: "Status changed successfully!"});
//     }
//   }

//   if(requestId && requestId.length > 0){
//     if(status === "Cancelled"){
//         return res.status(400).send({error: "You can't change the status now! Please try to change status in Order itself!"})
//     }
//   }

//     if (status === "Confirmed") {
//       const newOrders = [];

//       for (const product of quotationRequest.products) {
//         let newRequest;
//         let requestType;

//         if (product.type === "Rental") {
//           const validLaptop = await rentLaptopModel.findOne({
//             _id: product.laptopId,
//           });
//           if (!validLaptop) {
//             return res.status(404).send({ error: "Rental product not found!" });
//           }

//           newRequest = new rentalRequestsModel({
//             requestId: quotationRequest.requestId,
//             laptopId: validLaptop._id,
//             amountFor6Months: validLaptop.amountFor6Months,
//             brand: validLaptop.brand,
//             model: validLaptop.model,
//             image: validLaptop.image,
//             description: validLaptop.description,
//             phoneNumber: quotationRequest.phoneNumber,
//             alternatePhoneNumber: quotationRequest.alternatePhoneNumber,
//             userName: quotationRequest.userName,
//             email: quotationRequest.email,
//             rentalPeriod: product.note ? product.note : null,
//             address: address || quotationRequest.address,
//             quantity: product.quantity,
//             status: "Pending",
//             type: "Rental",
//           });
//           requestType = "Rental";
//         }

//         if (product.type === "Refurbished") {
//           const validLaptop = await refurbishedLaptopModel.findOne({
//             _id: product.laptopId,
//           });
//           if (!validLaptop) {
//             return res
//               .status(404)
//               .send({ error: "Refurbished product not found!" });
//           }

//           newRequest = new refurbishedRequestsModel({
//             requestId: quotationRequest.requestId,
//             laptopId: product.laptopId,
//             brand: validLaptop.brand,
//             image: validLaptop.image,
//             model: validLaptop.model,
//             amount: validLaptop.amount,
//             phoneNumber: quotationRequest.phoneNumber,
//             alternatePhoneNumber: quotationRequest.alternatePhoneNumber,
//             userName: quotationRequest.userName,
//             email: quotationRequest.email,
//             address: address || quotationRequest.address,
//             quantity: product.quantity,
//             status: "Pending",
//             type: "Refurbished",
//           });
//           requestType = "Refurbished";
//         }

//         if (product.type === "Repair") {
//           newRequest = new serviceRequestsModel({
//             requestId: quotationRequest.requestId,
//             phoneNumber: quotationRequest.phoneNumber,
//             alternatePhoneNumber: quotationRequest.alternatePhoneNumber,
//             email: quotationRequest.email,
//             userName: quotationRequest.userName,
//             device: product.device,
//             brand: product.brand,
//             model: product.model,
//             image: product.image,
//             operatingSystem: product.operatingSystem,
//             issue: product.issue,
//             issueDetails: product.issueDetails,
//             address: address || quotationRequest.address,
//             status: "Pending",
//             transactionId: quotationRequest.transactionId,
//             type: "Repair",
//           });
//           requestType = "Repair";
//         }

//         if (newRequest) {
//           await newRequest.save();
//           newOrders.push(newRequest);

//           const validTemplate = await emailTemplateModel.findOne({templateName: "Order Confirmation Email"});
//           if(validTemplate){
//             const gmailUserName = await settingsModel.findOne({credentialsKey: "GMAIL_USER" });
//             const gmailPassword = await settingsModel.findOne({credentialsKey: "GMAIL_PASSWORD"});
//             const transporter = nodemailer.createTransport({
//               service: "Gmail",
//               auth: {
//                 user: gmailUserName.credentialsValue,
//                 pass: gmailPassword.credentialsValue,
//               }
//             });

//             const message = {
//             from: gmailUserName.credentialsValue,
//             to: quotationRequest.email,
//             subject: validTemplate.subject,
//             text: validTemplate.body
//             };

//             transporter.sendMail(message);

//             const newEmail = new emailModel({
//               phoneNumber: quotationRequest.phoneNumber,
//               email: quotationRequest.email,
//               templateName: validTemplate.templateName
//             });
//             await newEmail.save();
//           } else {
//             const notification = new notificationModel({
//               title: `"Order Confirmation Email" Template not Exist!!`,
//               subtitle: `"Order Confirmation Email" was not exist in the Database. Please add this as soon as possible to send "Order Confirmation Email" to the new Users.`
//             });
//             await notification.save();
//           }
//         }
//       }

//       const len = quotationRequest.products.length;
//       let totalOrder;
//       if (len === 1) {
//         (totalOrder = 1), (typeOfOrder = "Single");
//       } else {
//         (totalOrder = len), (typeOfOrder = "Multiple");
//       }

//       const newOrder = new orderModel({
//         requestId: quotationRequest.requestId,
//         phoneNumber: quotationRequest.phoneNumber,
//         alternatePhoneNumber: quotationRequest.alternatePhoneNumber,
//         userName: quotationRequest.userName,
//         email: quotationRequest.email,
//         address: quotationRequest.address || address,
//         type: typeOfOrder,
//         transactionId: quotationRequest.transactionId || null,
//         amount: quotationRequest.amount || null,
//         status: "Pending",
//         totalOrders: totalOrder,
//         notes: notes || null,
//         assignedTo: null,
//         assignedOn: null,
//         technicianComments: null,
//         closedOn: null,
//         paidThrough: null,
//         finalTransactionId: null,
//         totalAmount: null,
//       });
//       await newOrder.save();

//       const notification = new notificationModel({
//         title: `New Order Received!!`,
//         subtitle: `${newOrder.userName} | ${newOrder.phoneNumber} | ${newOrder.type} Order`,
//         orderDetails: {
//           phoneNumber: newOrder.phoneNumber,
//           alternatePhoneNumber: newOrder.alternatePhoneNumber,
//           email: newOrder.email,
//           userName: newOrder.userName,
//           requestId: newOrder.requestId,
//           type: newOrder.type,
//         },
//       });
//       await notification.save();

//       await quotationModel.findOneAndUpdate(
//         { _id: quoteId },
//         { $set: { address, notes, status } },
//         { new: true }
//       );
//       return res.status(200).send({ message: "Status changed successfully!" });
//     } else {
//       await quotationModel.findOneAndUpdate(
//         { _id: quoteId },
//         { $set: { address, notes, status } },
//         { new: true }
//       );
//       return res.status(200).send({ message: "Status changed successfully!" });
//     }
//   } catch (error) {
//     console.error("Error:", error.message);
//     res
//       .status(500)
//       .send({ error: "Couldn't update quote now! Please try again later" });
//   }
// });

router.patch("/updateQuote/:id/:role", async (req, res) => {
  const quoteId = req.params.id;
  let { status, address, notes, alternatePhoneNumber } = req.body;
  const role = req.params.role;

  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "quotation_requests" && module.fullAccess
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    if (alternatePhoneNumber) {
      if (!alternatePhoneNumber.startsWith("+91")) {
        alternatePhoneNumber = `+91${alternatePhoneNumber}`;
      }
    }

    const quotationRequest = await quotationModel.findOne({
      _id: quoteId,
    });
    if (!quotationRequest) {
      return res.status(404).send({ error: "Quote not found!" });
    }

    if (quotationRequest.status === "Confirmed") {
      if (status) {
        return res.status(400).send({
          error: "Order has been confirmed! You can't change the status now",
        });
      }
    }

    const requestId = await orderModel.find({
      requestId: quotationRequest.requestId,
    });
    if (status === "Confirmed") {
      if (requestId && requestId.length > 0) {
        await quotationModel.findOneAndUpdate(
          { _id: quoteId },
          { $set: { address, notes, status } },
          { new: true }
        );
        console.log("requestId:", quotationRequest.requestId);

        await rentalRequestsModel.findOneAndUpdate(
          { requestId: quotationRequest.requestId },
          { $set: { quotationConfirmation: status } },
          { new: true }
        );

        return res
          .status(200)
          .send({ message: "Status changed successfully!" });
      }
    }

    if (requestId && requestId.length > 0) {
      if (status === "Cancelled") {
        return res.status(400).send({
          error:
            "You can't change the status now! Please try to change status in Order itself!",
        });
      }
    }

    if (status === "Confirmed") {
      const validLaptop = await rentLaptopModel.findOne({
        _id: quotationRequest.laptopId,
      });
      if (!validLaptop) {
        return res.status(404).send({ error: "Rental product not found!" });
      }

      const validTemplate = await emailTemplateModel.findOne({
        templateName: "Order Confirmation Email",
      });
      if (validTemplate) {
        const gmailUserName = await settingsModel.findOne({
          credentialsKey: "GMAIL_USER",
        });
        const gmailPassword = await settingsModel.findOne({
          credentialsKey: "GMAIL_PASSWORD",
        });
        const transporter = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: gmailUserName.credentialsValue,
            pass: gmailPassword.credentialsValue,
          },
        });

        const socialMediaLinks = await settingsModel.find({
          credentialsKey: {
            $in: ["facebook", "whatsapp", "twitter", "instagram", "linkedin"],
          },
        });

        const socialMediaMap = socialMediaLinks.reduce((acc, item) => {
          acc[item.credentialsKey] = item.credentialsValue;
          return acc;
        }, {});

        const message = {
          from: gmailUserName.credentialsValue,
          to: quotationRequest.email,
          subject: validTemplate.subject,
          text: `
${validTemplate.body}

Follow Us On:
Facebook:  ${socialMediaMap.facebook || "N/A"}
Twitter:   ${socialMediaMap.twitter || "N/A"}
Whatsapp:  ${socialMediaMap.whatsapp || "N/A"}
Instagram: ${socialMediaMap.instagram || "N/A"}
LinkedIn:  ${socialMediaMap.linkedin || "N/A"}
`,
        };

        transporter.sendMail(message);

        const newEmail = new emailModel({
          phoneNumber: quotationRequest.phoneNumber,
          email: quotationRequest.email,
          templateName: validTemplate.templateName,
        });
        await newEmail.save();
      } else {
        const notification = new notificationModel({
          title: `"Order Confirmation Email" Template not Exist!!`,
          subtitle: `"Order Confirmation Email" was not exist in the Database. Please add this as soon as possible to send "Order Confirmation Email" to the new Users.`,
        });
        await notification.save();
      }

      const newOrder = new orderModel({
        requestId: quotationRequest.requestId,
        phoneNumber: quotationRequest.phoneNumber,
        alternatePhoneNumber: quotationRequest.alternatePhoneNumber,
        userName: quotationRequest.userName,
        email: quotationRequest.email,
        address: quotationRequest.address || address,
        type: "Rental",
        status: "Pending",
        notes: notes || null,
        assignedTo: null,
        assignedOn: null,
        technicianComments: null,
        closedOn: null,
        initialAmountPaidThrough: "COD",
        finalTransactionId: null,
        totalAmount: null,
        billGenerated: "no",
        totalAmountPaid: 0,
      });
      await newOrder.save();

      const notification = new notificationModel({
        title: `Rental Order Received!!`,
        subtitle: `${newOrder.userName} | ${newOrder.phoneNumber} | ${newOrder.type} Order`,
        orderDetails: {
          phoneNumber: newOrder.phoneNumber,
          alternatePhoneNumber: newOrder.alternatePhoneNumber,
          email: newOrder.email,
          userName: newOrder.userName,
          requestId: newOrder.requestId,
          type: newOrder.type,
        },
      });
      await notification.save();

      await quotationModel.findOneAndUpdate(
        { _id: quoteId },
        { $set: { address, notes, status } },
        { new: true }
      );
      console.log(quotationRequest.requestId);

      await rentalRequestsModel.findOneAndUpdate(
        { requestId: quotationRequest.requestId },
        { $set: { quotationConfirmation: status } },
        { new: true }
      );
      return res.status(200).send({ message: "Status changed successfully!" });
    } else {
      await quotationModel.findOneAndUpdate(
        { _id: quoteId },
        { $set: { address, notes, status } },
        { new: true }
      );
      return res.status(200).send({ message: "Status changed successfully!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't update quote now! Please try again later" });
  }
});

router.delete("/deleteQuote/:id/:role", async (req, res) => {
  const { id } = req.params;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "quotation_requests" &&
          module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const response = await quotationModel.findByIdAndDelete(id);
    if (response) {
      return res.status(200).send({ message: `Quote deleted successfully!` });
    } else {
      return res.status(404).send({ error: "Quote not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't update quote now! Please try again later" });
  }
});

router.get("/viewAssignedEmployeesList/:role/:search?", async (req, res) => {
  const searchString = req.params.search || "";
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "employee" && module.read === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const searchRegex = new RegExp(searchString, "i");

    const query = {
      $or: [{ assignedTo: { $regex: searchRegex } }],
    };
    const response = await orderModel.find(query);

    const employees = new Set(
      response.filter((emp) => emp.assignedTo).map((emp) => emp.assignedTo)
    );

    if (employees && employees.size > 0) {
      return res.status(200).send({ data: Array.from(employees) });
    } else {
      return res.status(404).send({ error: "No Employees Found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't View Employees now! Please try again later" });
  }
});

router.post("/addOrder/:role", async (req, res) => {
  let role = req.params.role;
  let {
    type,
    phoneNumber,
    alternatePhoneNumber,
    address,
    userName,
    notes,
    laptopId,
    rentalPeriod,
    purposeOfRental,
    quantity,
  } = req.body;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "order" && module.write === true
      )
    ) {
      return res.status(403).send({ error: "You've no access to do this!" });
    }

    if (!type || !phoneNumber || !address || !userName || !laptopId) {
      return res.status(400).send({ error: "Please fill all fields!" });
    }

    if (!phoneNumber.startsWith("+91")) {
      phoneNumber = `+91${phoneNumber}`;
    }
    if (!alternatePhoneNumber.startsWith("+91")) {
      alternatePhoneNumber = `+91${alternatePhoneNumber}`;
    }

    const existUser = await usersModel.findOne({ phoneNumber });
    if (!existUser) {
      return res.status(404).send({ error: "User not found!" });
    }

    if (type === "Rental") {
      const validLaptop = await rentLaptopModel.findOne({
        _id: laptopId,
      });
      if (!validLaptop) {
        return res.status(404).send({ error: "Rental product not found!" });
      }
      const randomId = getRandomGenerationId();

      const newOrder = new orderModel({
        requestId: `${randomId}REN`,
        phoneNumber: phoneNumber,
        alternatePhoneNumber: alternatePhoneNumber,
        userName: userName,
        email: existUser.email,
        address: address,
        type: "Rental",
        status: "Pending",
        notes: notes || null,
        assignedTo: null,
        assignedOn: null,
        technicianComments: null,
        closedOn: null,
        paidThrough: null,
        finalTransactionId: null,
        totalAmount: null,
        billGenerated: "no",
      });
      await newOrder.save();

      const notification = new notificationModel({
        title: `Rental Order Received!!`,
        subtitle: `${newOrder.userName} | ${newOrder.phoneNumber} | ${newOrder.type} Order`,
        orderDetails: {
          phoneNumber: newOrder.phoneNumber,
          alternatePhoneNumber: newOrder.alternatePhoneNumber,
          email: newOrder.email,
          userName: newOrder.userName,
          requestId: newOrder.requestId,
          type: newOrder.type,
        },
      });
      await notification.save();

      const newRequest = new rentalRequestsModel({
        requestId: newOrder.requestId,
        laptopId: validLaptop._id,
        amountFor6Months: validLaptop.amountFor6Months,
        brand: validLaptop.brand,
        model: validLaptop.model,
        image: validLaptop.image,
        description: validLaptop.description,
        phoneNumber: newOrder.phoneNumber,
        alternatePhoneNumber: newOrder.alternatePhoneNumber,
        userName: newOrder.userName,
        email: newOrder.email,
        rentalPeriod: rentalPeriod || null,
        address: newOrder.address,
        quantity,
        purposeOfRental,
        status: "Pending",
        type: "Rental",
        quotationConfirmation: "Confirmed",
        totalAmountPaid: 0,
      });
      await newRequest.save();

      const validTemplate = await emailTemplateModel.findOne({
        templateName: "Order Confirmation Email",
      });
      if (validTemplate) {
        const gmailUserName = await settingsModel.findOne({
          credentialsKey: "GMAIL_USER",
        });
        const gmailPassword = await settingsModel.findOne({
          credentialsKey: "GMAIL_PASSWORD",
        });

        const transporter = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: gmailUserName.credentialsValue,
            pass: gmailPassword.credentialsValue,
          },
        });

        const socialMediaLinks = await settingsModel.find({
          credentialsKey: {
            $in: ["facebook", "whatsapp", "twitter", "instagram", "linkedin"],
          },
        });

        const socialMediaMap = socialMediaLinks.reduce((acc, item) => {
          acc[item.credentialsKey] = item.credentialsValue;
          return acc;
        }, {});

        const message = {
          from: gmailUserName.credentialsValue,
          to: existUser.email,
          subject: validTemplate.subject,
          text: `
  ${validTemplate.body}
  
  Follow Us On:
  Facebook:  ${socialMediaMap.facebook || "N/A"}
  Twitter:   ${socialMediaMap.twitter || "N/A"}
  Whatsapp:  ${socialMediaMap.whatsapp || "N/A"}
  Instagram: ${socialMediaMap.instagram || "N/A"}
  LinkedIn:  ${socialMediaMap.linkedin || "N/A"}
  `,
        };

        transporter.sendMail(message);

        const newEmail = new emailModel({
          phoneNumber,
          email: existUser.email,
          templateName: validTemplate.templateName,
        });
        await newEmail.save();
      } else {
        const notification = new notificationModel({
          title: `"Order Confirmation Email" Template not Exist!!`,
          subtitle: `"Order Confirmation Email" was not exist in the Database. Please add this as soon as possible to send "Order Confirmation Email" to the Users.`,
        });
        await notification.save();
      }
    }

    if (type === "Refurbished") {
      const validLaptop = await refurbishedLaptopModel.findOne({
        _id: laptopId,
      });
      if (!validLaptop) {
        return res
          .status(404)
          .send({ error: "Refurbished product not found!" });
      }
      const randomId = getRandomGenerationId();

      const newOrder = new orderModel({
        requestId: `${randomId}REN`,
        phoneNumber: phoneNumber,
        alternatePhoneNumber: alternatePhoneNumber,
        userName: userName,
        email: existUser.email,
        address: address,
        type: "Refurbished",
        status: "Pending",
        notes: notes || null,
        assignedTo: null,
        assignedOn: null,
        technicianComments: null,
        closedOn: null,
        paidThrough: null,
        finalTransactionId: null,
        totalAmount: null,
        billGenerated: "no",
      });
      await newOrder.save();

      const notification = new notificationModel({
        title: `Refurbished Order Received!!`,
        subtitle: `${newOrder.userName} | ${newOrder.phoneNumber} | ${newOrder.type} Order`,
        orderDetails: {
          phoneNumber: newOrder.phoneNumber,
          alternatePhoneNumber: newOrder.alternatePhoneNumber,
          email: newOrder.email,
          userName: newOrder.userName,
          requestId: newOrder.requestId,
          type: newOrder.type,
        },
      });
      await notification.save();

      const newRequest = new refurbishedRequestsModel({
        requestId: newOrder.requestId,
        laptopId: validLaptop._id,
        amount: validLaptop.amount,
        brand: validLaptop.brand,
        model: validLaptop.model,
        image: validLaptop.image,
        description: validLaptop.description,
        phoneNumber: newOrder.phoneNumber,
        alternatePhoneNumber: newOrder.alternatePhoneNumber,
        userName: newOrder.userName,
        email: newOrder.email,
        address: newOrder.address,
        quantity,
        status: "Pending",
        type: "Refurbished",
      });
      await newRequest.save();

      const validTemplate = await emailTemplateModel.findOne({
        templateName: "Order Confirmation Email",
      });
      if (validTemplate) {
        const gmailUserName = await settingsModel.findOne({
          credentialsKey: "GMAIL_USER",
        });
        const gmailPassword = await settingsModel.findOne({
          credentialsKey: "GMAIL_PASSWORD",
        });

        const transporter = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: gmailUserName.credentialsValue,
            pass: gmailPassword.credentialsValue,
          },
        });

        const socialMediaLinks = await settingsModel.find({
          credentialsKey: {
            $in: ["facebook", "whatsapp", "twitter", "instagram", "linkedin"],
          },
        });

        const socialMediaMap = socialMediaLinks.reduce((acc, item) => {
          acc[item.credentialsKey] = item.credentialsValue;
          return acc;
        }, {});

        const message = {
          from: gmailUserName.credentialsValue,
          to: existUser.email,
          subject: validTemplate.subject,
          text: `
  ${validTemplate.body}
  
  Follow Us On:
  Facebook:  ${socialMediaMap.facebook || "N/A"}
  Twitter:   ${socialMediaMap.twitter || "N/A"}
  Whatsapp:  ${socialMediaMap.whatsapp || "N/A"}
  Instagram: ${socialMediaMap.instagram || "N/A"}
  LinkedIn:  ${socialMediaMap.linkedin || "N/A"}
  `,
        };

        transporter.sendMail(message);

        const newEmail = new emailModel({
          phoneNumber,
          email: existUser.email,
          templateName: validTemplate.templateName,
        });
        await newEmail.save();
      } else {
        const notification = new notificationModel({
          title: `"Order Confirmation Email" Template not Exist!!`,
          subtitle: `"Order Confirmation Email" was not exist in the Database. Please add this as soon as possible to send "Order Confirmation Email" to the Users.`,
        });
        await notification.save();
      }
    }

    return res.status(200).send({ message: "Order created successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't add order now! Please try again later" });
  }
});

router.get("/viewOrders1/:role/:phoneNumber/:search?", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const searchString = req.params.search || "";
  const role = req.params.role;
  let phoneNumber = req.params.phoneNumber;
  const assignedTo = req.query.assignedTo;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  const dayFilter = req.query.dayFilter;
  try {
    let moduleAccess;
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "order" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "order"
      );
    }

    if (startDate && endDate) {
      if (dayFilter) {
        return res.status(400).send({ error: "Please apply any one filter!" });
      }
    }

    const skip = (page - 1) * limit;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const escapedSearchString = searchString.replace(/\+/g, "\\+");
    const searchRegex = new RegExp(escapedSearchString, "i");

    const baseQuery = {
      $or: [
        { phoneNumber: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { userName: { $regex: searchRegex } },
        { requestId: { $regex: searchRegex } },
        { address: { $regex: searchRegex } },
        { type: { $regex: searchRegex } },
        { status: { $regex: searchRegex } },
        { details: { $regex: searchRegex } },
        { assignedTo: { $regex: searchRegex } },
        { assignedOn: { $regex: searchRegex } },
        { technicianComments: { $regex: searchRegex } },
        { closedOn: { $regex: searchRegex } },
        { paidThrough: { $regex: searchRegex } },
        { finalTransactionId: { $regex: searchRegex } },
        { initialAmountPaidThrough: { $regex: searchRegex } },
      ],
    };

    if (!phoneNumber.startsWith("+91")) {
      phoneNumber = `+91${phoneNumber}`;
    }
    var userphoneNumber = await employeesModel.findOne({ phoneNumber });
    if (!userphoneNumber) {
      return res.status(404).send({ error: "Employee not found!" });
    }

    let query = {};
    if (role === "Admin") {
      query = { ...baseQuery };
      if (assignedTo) {
        query.assignedTo = assignedTo;
      }
    } else {
      query = {
        ...baseQuery,
        assignedTo: userphoneNumber.nameOfEmployee,
      };
    }

    if (startDate && endDate) {
      const startDateTime = `${startDate} 00:00:00`;
      const endDateTime = `${endDate} 23:59:59`;
      query.createdAt = {
        $gte: startDateTime,
        $lte: endDateTime,
      };
    }

    if (dayFilter === "lastWeek") {
      const startDatee = moment().subtract("7", "days").format("YYYY-MM-DD");
      const startDateTime = `${startDatee} 00:00:00`;
      const now = moment().format("YYYY-MM-DD HH:mm:ss");
      query.createdAt = {
        $gte: startDateTime,
        $lte: now,
      };
    }

    if (dayFilter === "lastMonth") {
      const startDatee = moment().subtract("31", "days").format("YYYY-MM-DD");
      const startDateTime = `${startDatee} 00:00:00`;
      const now = moment().format("YYYY-MM-DD HH:mm:ss");
      query.createdAt = {
        $gte: startDateTime,
        $lte: now,
      };
    }

    if (dayFilter === "lastYear") {
      const startDatee = moment().subtract("365", "days").format("YYYY-MM-DD");
      const startDateTime = `${startDatee} 00:00:00`;
      const now = moment().format("YYYY-MM-DD HH:mm:ss");
      query.createdAt = {
        $gte: startDateTime,
        $lte: now,
      };
    }
    const response = await orderModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort(sortOptions);

    const serialNumberStart = skip + 1;
    const serialNumbers = Array.from(
      { length: response.length },
      (_, index) => serialNumberStart + index
    );

    const orders = response.map((order, index) => {
      return {
        ...order.toObject(),
        s_no: serialNumbers[index],
      };
    });

    const totalItems = await orderModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const paginationInfo = {
      totalItems,
      totalPages,
      curentPage: page,
      startIndex: skip + 1,
      endIndex: skip + orders.length,
      itemsPerPage: orders.length,
    };

    var orderCount;
    if (role !== "Technician") {
      const previousOrder = await notificationCountModel.findOne({
        type: "orderCount",
        "details.employeePhoneNumber": userphoneNumber.phoneNumber,
      });

      const previousOrderCount = previousOrder.details.find(
        (emp) => emp.employeePhoneNumber === userphoneNumber.phoneNumber
      );

      const newOrderCount = await orderModel.countDocuments();

      const orderCountings = newOrderCount - previousOrderCount.count;

      if (orderCountings === newOrderCount) {
        orderCount = 0;
      } else {
        orderCount = orderCountings;
      }
      // await notificationCountModel.findOneAndUpdate({type: "orderCount", "details.employeePhoneNumber": userphoneNumber.phoneNumber}, {$set: {"details.$.count": newOrderCount}}, {new: true});

      completedOrders = await orderModel.countDocuments({
        status: "Completed",
      });
      inProcessOrders = await orderModel.countDocuments({
        status: "In Process",
      });
      pendingOrders = await orderModel.countDocuments({ status: "Pending" });
      totalOrders = await orderModel.countDocuments();
    } else {
      const previousOrder = await notificationCountModel.findOne({
        type: "orderCount",
        "details.employeePhoneNumber": phoneNumber,
      });
      const previousOrderCount = previousOrder.details.find(
        (emp) => emp.employeePhoneNumber === phoneNumber
      );

      const currentOrder = await orderModel.countDocuments({
        assignedTo: userphoneNumber.nameOfEmployee,
      });

      const orderCountings = currentOrder - previousOrderCount.count;

      if (orderCountings === currentOrder) {
        orderCount = 0;
      } else {
        orderCount = orderCountings;
      }

      // await notificationCountModel.findOneAndUpdate({type:"orderCount", "details.employeePhoneNumber": phoneNumber}, {$set: {'details.$.count': currentOrder}}, {new: true});

      completedOrders = await orderModel.countDocuments({
        status: "Completed",
        assignedTo: userphoneNumber.nameOfEmployee,
      });
      inProcessOrders = await orderModel.countDocuments({
        status: "In Process",
        assignedTo: userphoneNumber.nameOfEmployee,
      });
      pendingOrders = await orderModel.countDocuments({
        status: "Pending",
        assignedTo: userphoneNumber.nameOfEmployee,
      });
      totalOrders = await orderModel.countDocuments({
        assignedTo: userphoneNumber.nameOfEmployee,
      });
    }

    return res
      .status(200)
      .send({
        data: orders,
        pagination: paginationInfo,
        moduleAccess,
        orderCount,
        totalOrders,
        completedOrders,
        inProcessOrders,
        pendingOrders,
      });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({
        error: "Couldn't View Orders now! Please try again later",
        error1: error.message,
      });
  }
});

router.get("/viewOrders/:role/:phoneNumber/:search?", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const searchString = req.params.search || "";
  const role = req.params.role;
  let phoneNumber = req.params.phoneNumber;
  const assignedTo = req.query.assignedTo;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  const dayFilter = req.query.dayFilter;
  try {
    let moduleAccess;
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "order" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "order"
      );
    }

    if (startDate && endDate) {
      if (dayFilter) {
        return res.status(400).send({ error: "Please apply any one filter!" });
      }
    }

    const skip = (page - 1) * limit;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const escapedSearchString = searchString.replace(/\+/g, "\\+");
    const searchRegex = new RegExp(escapedSearchString, "i");

    const baseQuery = {
      $or: [
        { phoneNumber: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { userName: { $regex: searchRegex } },
        { requestId: { $regex: searchRegex } },
        { address: { $regex: searchRegex } },
        { type: { $regex: searchRegex } },
        { status: { $regex: searchRegex } },
        { details: { $regex: searchRegex } },
        { assignedTo: { $regex: searchRegex } },
        { assignedOn: { $regex: searchRegex } },
        { technicianComments: { $regex: searchRegex } },
        { closedOn: { $regex: searchRegex } },
        { paidThrough: { $regex: searchRegex } },
        { finalTransactionId: { $regex: searchRegex } },
        { initialAmountPaidThrough: { $regex: searchRegex } },
      ],
    };

    if (!phoneNumber.startsWith("+91")) {
      phoneNumber = `+91${phoneNumber}`;
    }
    var userphoneNumber = await employeesModel.findOne({ phoneNumber });
    if (!userphoneNumber) {
      return res.status(404).send({ error: "Employee not found!" });
    }

    let query = {};
    if (role === "Technician") {
      query = {
        ...baseQuery,
        assignedTo: userphoneNumber.nameOfEmployee,
      };
    } else {
      query = { ...baseQuery };
      if (assignedTo) {
        query.assignedTo = assignedTo;
      }
    }

    if (startDate && endDate) {
      const startDateTime = `${startDate} 00:00:00`;
      const endDateTime = `${endDate} 23:59:59`;
      query.createdAt = {
        $gte: startDateTime,
        $lte: endDateTime,
      };
    }

    if (dayFilter === "lastWeek") {
      const startDatee = moment().subtract("7", "days").format("YYYY-MM-DD");
      const startDateTime = `${startDatee} 00:00:00`;
      const now = moment().format("YYYY-MM-DD HH:mm:ss");
      query.createdAt = {
        $gte: startDateTime,
        $lte: now,
      };
    }

    if (dayFilter === "lastMonth") {
      const startDatee = moment().subtract("31", "days").format("YYYY-MM-DD");
      const startDateTime = `${startDatee} 00:00:00`;
      const now = moment().format("YYYY-MM-DD HH:mm:ss");
      query.createdAt = {
        $gte: startDateTime,
        $lte: now,
      };
    }

    if (dayFilter === "lastYear") {
      const startDatee = moment().subtract("365", "days").format("YYYY-MM-DD");
      const startDateTime = `${startDatee} 00:00:00`;
      const now = moment().format("YYYY-MM-DD HH:mm:ss");
      query.createdAt = {
        $gte: startDateTime,
        $lte: now,
      };
    }
    const response = await orderModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort(sortOptions);

    const serialNumberStart = skip + 1;
    const serialNumbers = Array.from(
      { length: response.length },
      (_, index) => serialNumberStart + index
    );

    const orders = response.map((order, index) => {
      return {
        ...order.toObject(),
        s_no: serialNumbers[index],
      };
    });

    const totalItems = await orderModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const paginationInfo = {
      totalItems,
      totalPages,
      curentPage: page,
      startIndex: skip + 1,
      endIndex: skip + orders.length,
      itemsPerPage: orders.length,
    };

    var orderCount;
    if (role !== "Technician") {
      const previousOrder = await notificationCountModel.findOne({
        type: "orderCount",
        "details.employeePhoneNumber": userphoneNumber.phoneNumber,
      });

      const previousOrderCount = previousOrder.details.find(
        (emp) => emp.employeePhoneNumber === userphoneNumber.phoneNumber
      );

      const newOrderCount = await orderModel.countDocuments();

      const orderCountings = newOrderCount - (previousOrderCount?.count || 0);

      // for(let i = 1; i<=totalPages;i++){
      const remainingCounts = orderCountings - (page - 1) * limit;
      orderCount =
        remainingCounts > limit ? limit : Math.max(0, remainingCounts);
      //   orderCountPerPage.push({page: i, orderCount})
      // }

      // await notificationCountModel.findOneAndUpdate({type: "orderCount", "details.employeePhoneNumber": userphoneNumber.phoneNumber}, {$set: {"details.$.count": newOrderCount}}, {new: true});

      completedOrders = await orderModel.countDocuments({
        status: "Completed",
      });
      inProcessOrders = await orderModel.countDocuments({
        status: "In Process",
      });
      pendingOrders = await orderModel.countDocuments({ status: "Pending" });
      inTransitOrders = await orderModel.countDocuments({
        status: "In Transit",
      });
      cancelledOrders = await orderModel.countDocuments({
        status: "Cancelled",
      });
      totalOrders = await orderModel.countDocuments();
    } else {
      const previousOrder = await notificationCountModel.findOne({
        type: "orderCount",
        "details.employeePhoneNumber": phoneNumber,
      });
      const previousOrderCount = previousOrder.details.find(
        (emp) => emp.employeePhoneNumber === phoneNumber
      );

      const currentOrder = await orderModel.countDocuments({
        assignedTo: userphoneNumber.nameOfEmployee,
      });

      const orderCountings = currentOrder - (previousOrderCount?.count || 0);

      // for(let i = 1; i<=totalPages;i++){
      const remainingCounts = orderCountings - (page - 1) * limit;
      orderCount =
        remainingCounts > limit ? limit : Math.max(0, remainingCounts);
      //   orderCountPerPage.push({page: i, orderCount})
      // }

      // await notificationCountModel.findOneAndUpdate({type:"orderCount", "details.employeePhoneNumber": phoneNumber}, {$set: {'details.$.count': currentOrder}}, {new: true});

      completedOrders = await orderModel.countDocuments({
        status: "Completed",
        assignedTo: userphoneNumber.nameOfEmployee,
      });
      inProcessOrders = await orderModel.countDocuments({
        status: "In Process",
        assignedTo: userphoneNumber.nameOfEmployee,
      });
      pendingOrders = await orderModel.countDocuments({
        status: "Pending",
        assignedTo: userphoneNumber.nameOfEmployee,
      });
      totalOrders = await orderModel.countDocuments({
        assignedTo: userphoneNumber.nameOfEmployee,
      });
      inTransitOrders = await orderModel.countDocuments({
        status: "In Transit",
      });
      cancelledOrders = await orderModel.countDocuments({
        status: "Cancelled",
      });
    }

    return res
      .status(200)
      .send({
        data: orders,
        pagination: paginationInfo,
        moduleAccess,
        orderCount,
        totalOrders,
        pendingOrders,
        inProcessOrders,
        inTransitOrders,
        completedOrders,
        cancelledOrders,
      });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({
        error: "Couldn't View Orders now! Please try again later",
        error1: error.message,
      });
  }
});

// router.get("/exportData/:role/:search?", async (req, res) => {
//   const sortBy = req.query.sortBy || "createdAt";
//   const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
//   const role = req.params.role;
//   const startDate = req.query.startDate;
//   const endDate = req.query.endDate;
//   const dayFilter = req.query.dayFilter;
//   const assignedTo = req.query.assignedTo;
//   const type = req.query.type;
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 0;
//   const skip = (page - 1) * limit;
//   const searchString = req.params.search || "";
//   const phoneNumber = req.query.phoneNumber;
//   try {
//     const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });

//     let moduleAccess;
//     if (type === "order") {
//       moduleAccess = validUser.modules.find(
//         (module) => module.moduleName === "order_reports"
//       );
//       if (
//         !validUser ||
//         !validUser.modules.some(
//           (module) =>
//             module.moduleName === "order_reports" && module.read === true
//         )
//       ) {
//         const moduleAccess = validUser.modules.find(
//           (module) => module.moduleName === "order_reports"
//         );
//         return res
//           .status(403)
//           .send({ error: "You have no access to do this!", moduleAccess });
//       }
//     } else if (type === "employee") {
//       moduleAccess = validUser.modules.find(
//         (module) => module.moduleName === "employee_reports"
//       );
//       if (
//         !validUser ||
//         !validUser.modules.some(
//           (module) =>
//             module.moduleName === "employee_reports" && module.read === true
//         )
//       ) {
//         const moduleAccess = validUser.modules.find(
//           (module) => module.moduleName === "employee_reports"
//         );
//         return res
//           .status(403)
//           .send({ error: "You have no access to do this!", moduleAccess });
//       }
//     }

//     if (startDate && endDate) {
//       const start = new Date(startDate);
//       const end = new Date(endDate);

//       if (end < start) {
//         return res
//           .status(400)
//           .send({ error: "End date can't before the Start date!" });
//       }

//       if (dayFilter) {
//         return res.status(400).send({ error: "Please apply any one filter!" });
//       }
//     }

//     if (role === "Admin") {
//       if (type === "category") {
//         moduleAccess = {
//           name: "Category",
//           moduleName: "category",
//           read: true,
//           write: true,
//           fullAccess: true,
//         };
//       }
//       if (type === "rentalProduct") {
//         moduleAccess = {
//           name: "Rental Product",
//           moduleName: "rental_product",
//           read: true,
//           write: true,
//           fullAccess: true,
//         };
//       }
//       if (type === "refurbishedProduct") {
//         moduleAccess = {
//           name: "Refurbished Product",
//           moduleName: "refurbished_product",
//           read: true,
//           write: true,
//           fullAccess: true,
//         };
//       }
//     }

//     const sortOptions = {};
//     sortOptions[sortBy] = sortOrder;

//     const escapedSearchString = searchString.replace(
//       /[.*+?^${}()|[\]\\]/g,
//       "\\$&"
//     );
//     const searchRegex = new RegExp(escapedSearchString, "i");

//     let query = {
//       $or: [
//         { phoneNumber: { $regex: searchRegex } },
//         { email: { $regex: searchRegex } },
//         { userName: { $regex: searchRegex } },
//         { requestId: { $regex: searchRegex } },
//         { address: { $regex: searchRegex } },
//         { type: { $regex: searchRegex } },
//         { status: { $regex: searchRegex } },
//         { details: { $regex: searchRegex } },
//         { assignedTo: { $regex: searchRegex } },
//         { assignedOn: { $regex: searchRegex } },
//         { technicianComments: { $regex: searchRegex } },
//         { closedOn: { $regex: searchRegex } },
//         { paidThrough: { $regex: searchRegex } },
//         { finalTransactionId: { $regex: searchRegex } },
//         { employeeId: { $regex: searchRegex } },
//         { nameOfEmployee: { $regex: searchRegex } },
//         { roleOfEmployee: { $regex: searchRegex } },
//         { category: { $regex: searchRegex } },
//         { brand: { $regex: searchRegex } },
//         { model: { $regex: searchRegex } },
//         { processor: { $regex: searchRegex } },
//         { ram: { $regex: searchRegex } },
//         { screenSize: { $regex: searchRegex } },
//         { storage: { $regex: searchRegex } },
//         { color: { $regex: searchRegex } },
//         { operatingSystem: { $regex: searchRegex } },
//         { description: { $regex: searchRegex } },
//       ],
//     };

//     if (role !== "Admin") {
//       if (
//         type === "category" ||
//         type === "rentalProduct" ||
//         type === "refurbishedProduct"
//       ) {
//         return res
//           .status(403)
//           .send({ error: "You've not access to view this page!" });
//       }
//       const employeeName = await employeesModel.findOne({ phoneNumber });
//       if (!employeeName) {
//         return res.status(404).send({ error: "Employee not found!" });
//       }
//       if (type === "order") {
//         query.assignedTo = employeeName.nameOfEmployee;
//       } else if (type === "employee") {
//         query.phoneNumber = phoneNumber;
//       }
//     }

//     if (assignedTo) {
//       if (type === "order") {
//         query.assignedTo = assignedTo;
//       } else {
//         return res
//           .status(400)
//           .send({ error: "This filter works only on Order Reports!" });
//       }
//     }

//     if (startDate && endDate) {
//       const startDateTime = `${startDate} 00:00:00`;
//       const endDateTime = `${endDate} 23:59:59`;
//       query.createdAt = {
//         $gte: startDateTime,
//         $lte: endDateTime,
//       };
//     }

//     if (dayFilter === "lastWeek") {
//       const startDatee = moment().subtract("7", "days").format("YYYY-MM-DD");
//       const startDateTime = `${startDatee} 00:00:00`;
//       const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
//       console.log(now);
//       query.createdAt = {
//         $gte: startDateTime,
//         $lte: now,
//       };
//     }

//     if (dayFilter === "lastMonth") {
//       const startDatee = moment().subtract("31", "days").format("YYYY-MM-DD");
//       const startDateTime = `${startDatee} 00:00:00`;
//       const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
//       query.createdAt = {
//         $gte: startDateTime,
//         $lte: now,
//       };
//     }

//     if (dayFilter === "lastYear") {
//       const startDatee = moment().subtract("365", "days").format("YYYY-MM-DD");
//       const startDateTime = `${startDatee} 00:00:00`;
//       const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
//       query.createdAt = {
//         $gte: startDateTime,
//         $lte: now,
//       };
//     }

//     let response;
//     let totalItems;
//     if (type === "order") {
//       response = await orderModel.find(query).limit(limit).skip(skip);
//       totalItems = await orderModel.countDocuments(query);
//       if (phoneNumber) {
//         response = await orderModel.find(query).limit(limit).skip(skip);
//         totalItems = await orderModel.countDocuments(query);
//       }
//     } else if (type === "employee") {
//       response = await employeesModel.find(query).limit(limit).skip(skip);
//       totalItems = await employeesModel.countDocuments(query);
//     } else if (type === "rentalProduct") {
//       response = await rentLaptopModel.find(query).limit(limit).skip(skip);
//       totalItems = await rentLaptopModel.countDocuments(query);
//     } else if (type === "refurbishedProduct") {
//       response = await refurbishedLaptopModel
//         .find(query)
//         .limit(limit)
//         .skip(skip);
//       totalItems = await refurbishedLaptopModel.countDocuments(query);
//     } else {
//       return res.status(400).send({ error: "Invalid data to export!" });
//     }

//     const serialNumberStart = skip + 1;
//     const serialNumbers = Array.from(
//       { length: response.length },
//       (_, index) => serialNumberStart + index
//     );

//     const responseData = response.map((form, index) => {
//       return {
//         ...form.toObject(),
//         s_no: serialNumbers[index],
//       };
//     });

//     const totalPages = Math.ceil(totalItems / limit);
//     let pages;
//     if (
//       totalPages === null ||
//       totalPages === undefined ||
//       !isFinite(totalPages)
//     ) {
//       pages = 1;
//     } else {
//       pages = totalPages;
//     }
//     const paginationInfo = {
//       totalItems,
//       totalPages: pages,
//       currentPage: page,
//       startIndex: skip + 1,
//       endIndex: skip + responseData.length,
//       itemsPerPage: responseData.length,
//     };

//     return res
//       .status(200)
//       .send({ data: responseData, pagination: paginationInfo, moduleAccess });
//   } catch (error) {
//     console.error("Error:", error.message);
//     res
//       .status(500)
//       .send({ error: "Couldn't export now! Please try again later" });
//   }
// });

router.get("/exportData/:role/:search?", async (req, res) => {
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const role = req.params.role;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  const dayFilter = req.query.dayFilter;
  const assignedTo = req.query.assignedTo;
  const type = req.query.type;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 0;
  const skip = (page - 1) * limit;
  const searchString = req.params.search || "";
  const phoneNumber = req.query.phoneNumber;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });

    let moduleAccess;
    if (type === "order") {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "order_reports"
      );
      if (
        !validUser ||
        !validUser.modules.some(
          (module) =>
            module.moduleName === "order_reports" && module.read === true
        )
      ) {
        const moduleAccess = validUser.modules.find(
          (module) => module.moduleName === "order_reports"
        );
        return res
          .status(403)
          .send({ error: "You have no access to do this!", moduleAccess });
      }
    } else if (type === "employee") {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "employee_reports"
      );
      if (
        !validUser ||
        !validUser.modules.some(
          (module) =>
            module.moduleName === "employee_reports" && module.read === true
        )
      ) {
        const moduleAccess = validUser.modules.find(
          (module) => module.moduleName === "employee_reports"
        );
        return res
          .status(403)
          .send({ error: "You have no access to do this!", moduleAccess });
      }
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end < start) {
        return res
          .status(400)
          .send({ error: "End date can't before the Start date!" });
      }

      if (dayFilter) {
        return res.status(400).send({ error: "Please apply any one filter!" });
      }
    }

    if (role === "Admin") {
      if (type === "category") {
        moduleAccess = {
          name: "User List",
          moduleName: "user",
          read: true,
          write: true,
          fullAccess: true,
        };
      }
      if (type === "rentalProduct") {
        moduleAccess = {
          name: "Rental Product",
          moduleName: "rental_product",
          read: true,
          write: true,
          fullAccess: true,
        };
      }
      if (type === "refurbishedProduct") {
        moduleAccess = {
          name: "Refurbished Product",
          moduleName: "refurbished_product",
          read: true,
          write: true,
          fullAccess: true,
        };
      }
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const escapedSearchString = searchString.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
    const searchRegex = new RegExp(escapedSearchString, "i");

    let query = {
      $or: [
        { phoneNumber: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { userName: { $regex: searchRegex } },
        { requestId: { $regex: searchRegex } },
        { type: { $regex: searchRegex } },
        { status: { $regex: searchRegex } },
        { assignedTo: { $regex: searchRegex } },
        { assignedOn: { $regex: searchRegex } },
        { technicianComments: { $regex: searchRegex } },
        { closedOn: { $regex: searchRegex } },
        { paidThrough: { $regex: searchRegex } },
        { finalTransactionId: { $regex: searchRegex } },
        { employeeId: { $regex: searchRegex } },
        { nameOfEmployee: { $regex: searchRegex } },
        { roleOfEmployee: { $regex: searchRegex } },
        { brand: { $regex: searchRegex } },
        { model: { $regex: searchRegex } },
        { processor: { $regex: searchRegex } },
        { ram: { $regex: searchRegex } },
        { screenSize: { $regex: searchRegex } },
        { storage: { $regex: searchRegex } },
        { color: { $regex: searchRegex } },
        { operatingSystem: { $regex: searchRegex } },
      ],
    };

    if (role !== "Admin") {
      if (
        type === "employee" ||
        type === "rentalProduct" ||
        type === "refurbishedProduct" ||
        type === "user"
      ) {
        return res
          .status(403)
          .send({ error: "You've not access to view this page!" });
      }
      const employeeName = await employeesModel.findOne({ phoneNumber });
      if (!employeeName) {
        return res.status(404).send({ error: "Employee not found!" });
      }
      if (type === "order") {
        query.assignedTo = employeeName.nameOfEmployee;
      } else if (type === "employee") {
        query.phoneNumber = phoneNumber;
      }
    }

    if (assignedTo) {
      if (type === "order") {
        query.assignedTo = assignedTo;
      } else {
        return res
          .status(400)
          .send({ error: "This filter works only on Order Reports!" });
      }
    }

    if (startDate && endDate) {
      const startDateTime = `${startDate} 00:00:00`;
      const endDateTime = `${endDate} 23:59:59`;
      query.createdAt = {
        $gte: startDateTime,
        $lte: endDateTime,
      };
    }

    if (dayFilter === "lastWeek") {
      const startDatee = moment().subtract("7", "days").format("YYYY-MM-DD");
      const startDateTime = `${startDatee} 00:00:00`;
      const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
      console.log(now);
      query.createdAt = {
        $gte: startDateTime,
        $lte: now,
      };
    }

    if (dayFilter === "lastMonth") {
      const startDatee = moment().subtract("31", "days").format("YYYY-MM-DD");
      const startDateTime = `${startDatee} 00:00:00`;
      const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
      query.createdAt = {
        $gte: startDateTime,
        $lte: now,
      };
    }

    if (dayFilter === "lastYear") {
      const startDatee = moment().subtract("365", "days").format("YYYY-MM-DD");
      const startDateTime = `${startDatee} 00:00:00`;
      const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
      query.createdAt = {
        $gte: startDateTime,
        $lte: now,
      };
    }

    let response;
    let totalItems;
    if (type === "order") {
      response = await orderModel.find(query).limit(limit).skip(skip);
      totalItems = await orderModel.countDocuments(query);
      if (phoneNumber) {
        response = await orderModel.find(query).limit(limit).skip(skip);
        totalItems = await orderModel.countDocuments(query);
      }
    } else if (type === "employee") {
      response = await employeesModel.find(query).limit(limit).skip(skip);
      totalItems = await employeesModel.countDocuments(query);
    } else if (type === "rentalProduct") {
      response = await rentLaptopModel.find(query).limit(limit).skip(skip);
      totalItems = await rentLaptopModel.countDocuments(query);
    } else if (type === "refurbishedProduct") {
      response = await refurbishedLaptopModel
        .find(query)
        .limit(limit)
        .skip(skip);
      totalItems = await refurbishedLaptopModel.countDocuments(query);
    } else if (type === "user") {
      response = await usersModel.find(query).limit(limit).skip(skip);
      totalItems = await usersModel.countDocuments(query);
    } else {
      return res.status(400).send({ error: "Invalid data to export!" });
    }

    const serialNumberStart = skip + 1;
    const serialNumbers = Array.from(
      { length: response.length },
      (_, index) => serialNumberStart + index
    );

    const responseData = response.map((form, index) => {
      return {
        ...form.toObject(),
        s_no: serialNumbers[index],
      };
    });

    const totalPages = Math.ceil(totalItems / limit);
    let pages;
    if (
      totalPages === null ||
      totalPages === undefined ||
      !isFinite(totalPages)
    ) {
      pages = 1;
    } else {
      pages = totalPages;
    }
    const paginationInfo = {
      totalItems,
      totalPages: pages,
      currentPage: page,
      startIndex: skip + 1,
      endIndex: skip + responseData.length,
      itemsPerPage: responseData.length,
    };

    return res
      .status(200)
      .send({ data: responseData, pagination: paginationInfo, moduleAccess });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't export now! Please try again later" });
  }
});

router.get(
  "/completedOrdersByEmployee/:role/:employeeName/:search?",
  async (req, res) => {
    const { role, employeeName } = req.params;
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const searchString = req.params.search || "";
    try {
      const validUser = await moduleAccessModel.findOne({
        roleOfEmployee: role,
      });
      if (
        !validUser ||
        !validUser.modules.some(
          (module) => module.moduleName === "employee" && module.read === true
        )
      ) {
        return res
          .status(403)
          .send({ error: "You've no access to view this Page!" });
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder;

      const skip = (page - 1) * limit;

      const escapedSearchString = searchString.replace(/\+/g, "\\+");
      const searchRegex = new RegExp(escapedSearchString, "i");

      let query = {
        assignedTo: employeeName,
        $or: [
          { phoneNumber: { $regex: searchRegex } },
          { email: { $regex: searchRegex } },
          { userName: { $regex: searchRegex } },
          { requestId: { $regex: searchRegex } },
          { address: { $regex: searchRegex } },
          { type: { $regex: searchRegex } },
          { status: { $regex: searchRegex } },
          { details: { $regex: searchRegex } },
          { assignedTo: { $regex: searchRegex } },
          { assignedOn: { $regex: searchRegex } },
          { technicianComments: { $regex: searchRegex } },
          { closedOn: { $regex: searchRegex } },
          { paidThrough: { $regex: searchRegex } },
          { finalTransactionId: { $regex: searchRegex } },
          { initialAmountPaidThrough: { $regex: searchRegex } },
        ],
      };

      const response = await orderModel
        .find(query)
        .skip(skip)
        .sort(sortOptions)
        .limit(limit);

      const serialNumberStart = skip + 1;
      const serialNumbers = Array.from(
        { length: response.length },
        (_, index) => serialNumberStart + index
      );

      const orders = response.map((order, index) => {
        return {
          ...order.toObject(),
          s_no: serialNumbers[index],
        };
      });

      const totalItems = await orderModel.countDocuments(query);
      const totalPages = Math.ceil(totalItems / limit);
      const currentPage = page;

      const paginationInfo = {
        totalItems,
        totalPages,
        currentPage,
        itemsPerPage: orders.length,
        startIndex: skip + 1,
        endIndex: skip + orders.length,
      };

      return res.status(200).send({ data: orders, pagination: paginationInfo });
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).send({
        error: "Couldn't view completed orders now! Please try again later",
      });
    }
  }
);

router.get("/viewOrderById/:id/:role", async (req, res) => {
  const { id } = req.params;
  const role = req.params.role;

  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "order" && module.read === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const response = await orderModel.findById(id);
    if (response) {
      return res.status(200).send({ data: response });
    } else {
      return res.status(404).send({ error: "Order Not Found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't View Order now! Please try again later" });
  }
});

router.get("/getEmployee/:role/:search?", async (req, res) => {
  const searchString = req.params.search || "";
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "employee" && module.read === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const searchRegex = new RegExp(searchString, "i");

    const query = {
      $or: [{ nameOfEmployee: { $regex: searchRegex } }],
      roleOfEmployee: { $ne: "Admin" },
    };

    const response = await employeesModel.find(query);

    const employees = response.map((emp) => emp.nameOfEmployee);

    if (employees && employees.length > 0) {
      return res.status(200).send({ data: employees });
    } else {
      return res.status(404).send({ error: "No Employees Found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't Get Employee List now! Please try again later",
    });
  }
});

router.post("/sendCustomerVerificationCode", async (req, res) => {
  let { phoneNumber } = req.body;
  try {
    const token = await getToken();

    const countryCode = await settingsModel.findOne({
      credentialsKey: "MESSAGE_CENTRAL_COUNTRYCODE",
    });
    const cid = await settingsModel.findOne({
      credentialsKey: "MESSAGE_CENTRAL_CID",
    });
    const url = `https://cpaas.messagecentral.com/verification/v2/verification/send?countryCode=${countryCode.credentialsValue}&customerId=${cid.credentialsValue}&flowType=SMS&mobileNumber=${phoneNumber}`;

    // const url = `https://cpaas.messagecentral.com/verification/v2/verification/send?countryCode=${process.env.COUNTRYCODE}&customerId=${process.env.CID}&flowType=SMS&mobileNumber=${phoneNumber}`;

    const headers = {
      authToken: token,
    };

    const response = await axios.post(url, null, { headers });

    return res.status(200).send({ data: response.data });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't Send Verification Code now! Please try again later",
    });
  }
});

router.post("/verifyCustomer", async (req, res) => {
  let { requestId, phoneNumber, verificationId, code } = req.body;
  try {
    if (!requestId || !phoneNumber || !verificationId || !code) {
      return res.status(400).send({ error: "Please fill all fields!" });
    }

    const token = await getToken();
    const url = `https://cpaas.messagecentral.com/verification/v2/verification/validateOtp`;

    const headers = {
      authToken: token,
    };

    const cid = await settingsModel.findOne({
      credentialsKey: "MESSAGE_CENTRAL_CID",
    });
    const params = {
      customerId: cid.credentialsValue,
      mobileNumber: phoneNumber,
      verificationId: verificationId,
      code: code,
    };

    await orderModel.findOneAndUpdate(
      { requestId },
      { $set: { customerLocationReached: true } },
      { new: true }
    );

    const response = await axios.get(url, { headers, params });
    return res.status(200).send({ data: response.data });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't Verify User now! Please try again later" });
  }
});

// router.patch("/updateOrder/:id/:role", async (req, res) => {
//   const { id } = req.params;
//   let {
//     status,
//     assignedTo,
//     assignedOn,
//     technicianComments,
//     closedOn,
//     paidThrough,
//     finalTransactionId,
//     finalAmountPaid,
//     notes,
//     alternatePhoneNumber,
//   } = req.body;
//   const role = req.params.role;
//   try {
//     const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
//     if (
//       !validUser ||
//       !validUser.modules.some(
//         (module) => module.moduleName === "order" && module.read === true
//       )
//     ) {
//       return res.status(403).send({ error: "You have no access to do this!" });
//     }

//     if (alternatePhoneNumber) {
//       if (!alternatePhoneNumber.startsWith("+91")) {
//         alternatePhoneNumber = `+91${alternatePhoneNumber}`;
//       }
//     }

//     const validOrder = await orderModel.findOne({ _id: id });
//     if (!validOrder) {
//       return res.status(404).send({ error: "Order not found!" });
//     }

//     if (role !== "Admin") {
//       const customerLocation = await orderModel.findOne({
//         _id: id,
//         customerLocationReached: true,
//       });
//       if (!customerLocation) {
//         return res
//           .status(400)
//           .send({ error: "You've not reached the customer location yet!" });
//       }
//     }

//     if(status === "Completed"){
//       const validBill = await billingInfoModel.findOne({requestId: validOrder.requestId});
//       if(!validBill){
//         return res.status(400).send({error: "You can't Complete the Order without Generating Bill!"})
//       }
//     }

//     if(assignedOn){
//       if(!validOrder.assignedTo && !assignedTo){
//         return res.status(400).send({error:"Please select a Employee!"});
//       }

//       const now = moment().startOf('day');
//       var start = moment(assignedOn, "DD/MM/YYYY").startOf('day');
//       if(start.isBefore(now)){
//         return res.status(400).send({error: "AssignedOn shouldn't be the Past Date!"});
//       }
//     }

//     if(assignedOn && closedOn){
//       const closed = moment(closedOn, "DD/MM/YYYY").startOf('day');
//       if(closed.isBefore(start)){
//         return res.status(400).send({error: "ClosedOn date shouldn't be earlier than the AssignedOn date"});
//       }

//       const now = moment().startOf('day');
//       if(closed.isAfter(now)){
//         return res.status(400).send({error: "ClosedOn date shouldn't be the future date"});
//       }
//     }

//     if(!assignedOn && closedOn){
//       const closed = moment(closedOn, "DD/MM/YYYY").startOf('day');
//       const assigned = validOrder.assignedOn;
//       const assignedDate = moment(assigned, "DD/MM/YYYY").startOf('day');
//       if(closed.isBefore(assignedDate)){
//         return res.status(400).send({error: "ClosedOn date shouldn't be earlier than the AssignedOn date"});
//       }

//       const now = moment().startOf('day');
//       if(closed.isAfter(now)){
//         return res.status(400).send({error: "ClosedOn date shouldn't be the future date"});
//       }
//     }

//     if (assignedTo) {
//       if(!validOrder.assignedOn && !assignedOn){
//         return res.status(400).send({error:"Please select Assigned On Date!"});
//       }

//       var validEmployee = await employeesModel.findOne({
//         nameOfEmployee: assignedTo,
//       });
//       if (!validEmployee) {
//         return res.status(404).send({ error: "Please select valid Employee!" });
//       }
//     }

//     if(status === "Completed" && !technicianComments){
//       return res.status(400).send({error: "Technician comments are required when you complete the order!"});
//     }

//     let updateFields = {};
//     if (role === "Technician") {
//       updateFields = {
//         status,
//         technicianComments,
//         closedOn,
//         paidThrough,
//         finalTransactionId,
//         finalAmountPaid,
//         notes,
//         alternatePhoneNumber,
//       };
//     } else {
//       if (assignedTo) {
//         updateFields.status = "In Process";
//         updateFields.assignedTo = assignedTo;
//         updateFields.assignedOn = assignedOn;
//       }
//       updateFields = {
//         ...updateFields,
//         status: status,
//         technicianComments,
//         closedOn,
//         paidThrough,
//         finalTransactionId,
//         finalAmountPaid,
//         notes,
//         alternatePhoneNumber,
//       };
//     }

//     const response = await orderModel.findByIdAndUpdate(
//       id,
//       { $set: updateFields },
//       { new: true }
//     );

//     if (status === "Completed") {
//       const validTemplate = await emailTemplateModel.findOne({templateName: "Feedback Email"});
//       if(validTemplate){
//         const gmailUserName = await settingsModel.findOne({credentialsKey: "GMAIL_USER" });
//         const gmailPassword = await settingsModel.findOne({credentialsKey: "GMAIL_PASSWORD" });

//         const transporter = nodemailer.createTransport({
//           service: "Gmail",
//           auth: {
//             user: gmailUserName.credentialsValue,
//             pass: gmailPassword.credentialsValue
//           }
//         });

//         const socialMediaLinks = await settingsModel.find({credentialsKey: {$in: ["facebook", "whatsapp", "twitter", "instagram", "linkedin"]}});

//         const socialMediaMap = socialMediaLinks.reduce((acc, item) => {
//           acc[item.credentialsKey] = item.credentialsValue;
//           return acc;
//         }, {});

//         const message = {
//         from: gmailUserName.credentialsValue,
//         to: validOrder.email,
//         subject: validTemplate.subject,
//             text: `
// ${validTemplate.body}

// Follow Us On:
// Facebook:  ${socialMediaMap.facebook || "N/A"}
// Twitter:   ${socialMediaMap.twitter || "N/A"}
// Whatsapp:  ${socialMediaMap.whatsapp || "N/A"}
// Instagram: ${socialMediaMap.instagram || "N/A"}
// LinkedIn:  ${socialMediaMap.linkedin || "N/A"}
// `
//             };
//     transporter.sendMail(message);

//         const newEmail = new emailModel({
//           phoneNumber: validOrder.phoneNumber,
//           email: validOrder.email,
//           templateName: validTemplate.templateName
//         });
//         await newEmail.save();
//       } else {
//         const notification = new notificationModel({
//           title: `"Feedback Email" Template not Exist!!`,
//           subtitle: `"Feedback Email" was not exist in the Database. Please add this as soon as possible to send "Feedback Email" to the new Users.`
//         });
//         await notification.save();
//       }

//       const notification = new notificationModel({
//         title: `Order Completed!!`,
//         subtitle: `${validOrder.userName} | ${validOrder.phoneNumber} | ${validOrder.type} Order`,
//         orderDetails: {
//           phoneNumber: validOrder.phoneNumber,
//           alternatePhoneNumber: validOrder.alternatePhoneNumber,
//           email: validOrder.email,
//           userName: validOrder.userName,
//           requestId: validOrder.requestId,
//         },
//       });
//       await notification.save();
//     }

//     if (status) {
//       await serviceRequestsModel.updateMany(
//         { requestId: response.requestId },
//         { $set: { status } },
//         { new: true }
//       );
//       await rentalRequestsModel.updateMany(
//         { requestId: response.requestId },
//         { $set: { status } },
//         { new: true }
//       );
//       await refurbishedRequestsModel.updateMany(
//         { requestId: response.requestId },
//         { $set: { status } },
//         { new: true }
//       );
//     }

//     if (assignedTo) {
//       const existNotification = await notificationModel.findOne({employeeEmail: validEmployee.email, subtitle:  `${response.userName} | ${response.phoneNumber}`});
//       if(!existNotification){
//       const notification = new notificationModel({
//         employeeName: assignedTo,
//         employeeEmail: validEmployee.email,
//         title: `New Order Received!!`,
//         subtitle: `${response.userName} | ${response.phoneNumber}`,
//         orderDetails: {
//           phoneNumber: response.phoneNumber,
//           alternatePhoneNumber: response.alternatePhoneNumber,
//           email: response.email,
//           userName: response.userName,
//         },
//       });
//       await notification.save();
//     }
//     }

//     if(finalAmountPaid){
//     const validBill = await billingInfoModel.findOne({requestId: validOrder.requestId});
//     if(validBill){
//       await billingInfoModel.findOneAndUpdate({_id: validBill._id}, {$set: {finalAmountPaid}}, {new: true});
//     }
//   }

//       return res.status(200).send({ message: `Order updated successfully!` });

//   } catch (error) {
//     console.error("Error:", error.message);
//     res
//       .status(500)
//       .send({ error: "Couldn't Update Order now! Please try again later" });
//   }
// });

router.patch("/updateOrder/:id/:role", async (req, res) => {
  const { id } = req.params;
  let {
    status,
    assignedTo,
    assignedOn,
    technicianComments,
    closedOn,
    paidThrough,
    finalTransactionId,
    finalAmountPaid,
    notes,
    alternatePhoneNumber,
  } = req.body;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "order" && module.read === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    if (alternatePhoneNumber) {
      if (!alternatePhoneNumber.startsWith("+91")) {
        alternatePhoneNumber = `+91${alternatePhoneNumber}`;
      }
    }

    const validOrder = await orderModel.findOne({ _id: id });
    if (!validOrder) {
      return res.status(404).send({ error: "Order not found!" });
    }

    if (validOrder.status === "Completed") {
      return res
        .status(400)
        .send({ error: "Order was already completed you can't able to Edit!" });
    }

    if (assignedOn || assignedTo) {
      const validUser = await moduleAccessModel.findOne({
        roleOfEmployee: role,
      });
      if (
        !validUser ||
        !validUser.modules.some(
          (module) =>
            module.moduleName === "order_assigning" && module.read === true
        )
      ) {
        return res.status(403).send({ error: "You've no access to do this!" });
      }
    }

    if (role !== "Admin" && role !== "Order Assigner") {
      const customerLocation = await orderModel.findOne({
        _id: id,
        customerLocationReached: true,
      });
      if (!customerLocation) {
        return res
          .status(400)
          .send({ error: "You've not reached the customer location yet!" });
      }
    }

    if (status === "Completed") {
      const validBill = await billingInfoModel.findOne({
        requestId: validOrder.requestId,
      });
      if (!validBill) {
        return res.status(400).send({
          error: "You can't Complete the Order without Generating Bill!",
        });
      }
    }

    if (assignedOn) {
      if (!validOrder.assignedTo && !assignedTo) {
        return res.status(400).send({ error: "Please select a Employee!" });
      }

      const now = moment().startOf("day");
      var start = moment(assignedOn, "DD/MM/YYYY").startOf("day");
      if (start.isBefore(now)) {
        return res
          .status(400)
          .send({ error: "AssignedOn shouldn't be the Past Date!" });
      }
    }

    if (assignedOn && closedOn) {
      const closed = moment(closedOn, "DD/MM/YYYY").startOf("day");
      if (closed.isBefore(start)) {
        return res.status(400).send({
          error: "ClosedOn date shouldn't be earlier than the AssignedOn date",
        });
      }

      const now = moment().startOf("day");
      if (closed.isAfter(now)) {
        return res
          .status(400)
          .send({ error: "ClosedOn date shouldn't be the future date" });
      }
    }

    if (!assignedOn && closedOn) {
      const closed = moment(closedOn, "DD/MM/YYYY").startOf("day");
      const assigned = validOrder.assignedOn;
      const assignedDate = moment(assigned, "DD/MM/YYYY").startOf("day");
      if (closed.isBefore(assignedDate)) {
        return res.status(400).send({
          error: "ClosedOn date shouldn't be earlier than the AssignedOn date",
        });
      }

      const now = moment().startOf("day");
      if (closed.isAfter(now)) {
        return res
          .status(400)
          .send({ error: "ClosedOn date shouldn't be the future date" });
      }
    }

    if (assignedTo) {
      if (!validOrder.assignedOn && !assignedOn) {
        return res
          .status(400)
          .send({ error: "Please select Assigned On Date!" });
      }

      var validEmployee = await employeesModel.findOne({
        nameOfEmployee: assignedTo,
      });
      if (!validEmployee) {
        return res.status(404).send({ error: "Please select valid Employee!" });
      }
    }

    if (status === "Completed" && !technicianComments) {
      return res.status(400).send({
        error: "Technician comments are required when you complete the order!",
      });
    }

    let updateFields = {};
    if (role !== "Admin") {
      updateFields = {
        status,
        technicianComments,
        closedOn,
        paidThrough,
        finalTransactionId,
        finalAmountPaid,
        notes,
        alternatePhoneNumber,
      };
    } else {
      if (assignedTo) {
        updateFields.status = "In Process";
        updateFields.assignedTo = assignedTo;
        updateFields.assignedOn = assignedOn;
      }
      updateFields = {
        ...updateFields,
        status: status,
        technicianComments,
        closedOn,
        paidThrough,
        finalTransactionId,
        finalAmountPaid,
        notes,
        alternatePhoneNumber,
      };
    }

    const response = await orderModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (status === "Completed") {
      const validTemplate = await emailTemplateModel.findOne({
        templateName: "Feedback Email",
      });
      if (validTemplate) {
        const gmailUserName = await settingsModel.findOne({
          credentialsKey: "GMAIL_USER",
        });
        const gmailPassword = await settingsModel.findOne({
          credentialsKey: "GMAIL_PASSWORD",
        });

        const transporter = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: gmailUserName.credentialsValue,
            pass: gmailPassword.credentialsValue,
          },
        });

        const socialMediaLinks = await settingsModel.find({
          credentialsKey: {
            $in: ["facebook", "whatsapp", "twitter", "instagram", "linkedin"],
          },
        });

        const socialMediaMap = socialMediaLinks.reduce((acc, item) => {
          acc[item.credentialsKey] = item.credentialsValue;
          return acc;
        }, {});

        const message = {
          from: gmailUserName.credentialsValue,
          to: validOrder.email,
          subject: validTemplate.subject,
          text: `
${validTemplate.body}

Follow Us On:
Facebook:  ${socialMediaMap.facebook || "N/A"}
Twitter:   ${socialMediaMap.twitter || "N/A"}
Whatsapp:  ${socialMediaMap.whatsapp || "N/A"}
Instagram: ${socialMediaMap.instagram || "N/A"}
LinkedIn:  ${socialMediaMap.linkedin || "N/A"}
`,
        };
        transporter.sendMail(message);

        const newEmail = new emailModel({
          phoneNumber: validOrder.phoneNumber,
          email: validOrder.email,
          templateName: validTemplate.templateName,
        });
        await newEmail.save();
      } else {
        const notification = new notificationModel({
          title: `"Feedback Email" Template not Exist!!`,
          subtitle: `"Feedback Email" was not exist in the Database. Please add this as soon as possible to send "Feedback Email" to the new Users.`,
        });
        await notification.save();
      }

      const notification = new notificationModel({
        title: `Order Completed!!`,
        subtitle: `${validOrder.userName} | ${validOrder.phoneNumber} | ${validOrder.type} Order`,
        orderDetails: {
          phoneNumber: validOrder.phoneNumber,
          alternatePhoneNumber: validOrder.alternatePhoneNumber,
          email: validOrder.email,
          userName: validOrder.userName,
          requestId: validOrder.requestId,
        },
      });
      await notification.save();
    }

    if (status) {
      await serviceRequestsModel.updateMany(
        { requestId: response.requestId },
        { $set: { status } },
        { new: true }
      );
      await rentalRequestsModel.updateMany(
        { requestId: response.requestId },
        { $set: { status } },
        { new: true }
      );
      await refurbishedRequestsModel.updateMany(
        { requestId: response.requestId },
        { $set: { status } },
        { new: true }
      );
    }

    if (assignedTo) {
      const existNotification = await notificationModel.findOne({
        employeePhoneNumber: validEmployee.phoneNumber,
        subtitle: `${response.userName} | ${response.phoneNumber}`,
      });
      if (!existNotification) {
        const notification = new notificationModel({
          employeeName: assignedTo,
          employeePhoneNumber: validEmployee.phoneNumber,
          title: `New Order Received!!`,
          subtitle: `${response.userName} | ${response.phoneNumber}`,
          orderDetails: {
            phoneNumber: response.phoneNumber,
            alternatePhoneNumber: response.alternatePhoneNumber,
            email: response.email,
            userName: response.userName,
          },
        });
        await notification.save();
      }
    }

    if (finalAmountPaid) {
      const validBill = await billingInfoModel.findOne({
        requestId: validOrder.requestId,
      });
      if (validBill) {
        await billingInfoModel.findOneAndUpdate(
          { _id: validBill._id },
          { $set: { finalAmountPaid } },
          { new: true }
        );
      }
    }

    let paidAmount = finalAmountPaid || 0;
    let initial = validOrder.amount || 0;

    const totalAmountPaid = initial + paidAmount;
    await orderModel.findOneAndUpdate(
      { _id: id },
      { $set: { totalAmountPaid } },
      { new: true }
    );

    if (validOrder.type === "Repair") {
      await serviceRequestsModel.findOneAndUpdate(
        { requestId: validOrder.requestId },
        { $set: { totalAmountPaid } },
        { new: true }
      );
    } else if (validOrder.type === "Rental") {
      await rentalRequestsModel.findOneAndUpdate(
        { requestId: validOrder.requestId },
        { $set: { totalAmountPaid } },
        { new: true }
      );
    } else if (validOrder.type === "Refurbished") {
      await refurbishedRequestsModel.findOneAndUpdate(
        { requestId: validOrder.requestId },
        { $set: { totalAmountPaid } },
        { new: true }
      );
    }

    return res.status(200).send({ message: `Order updated successfully!` });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't Update Order now! Please try again later" });
  }
});

// router.patch("/updateOrder/:id/:role", async (req, res) => {
//   const { id } = req.params;
//   let {
//     status,
//     assignedTo,
//     assignedOn,
//     technicianComments,
//     closedOn,
//     paidThrough,
//     finalTransactionId,
//     finalAmountPaid,
//     notes,
//     alternatePhoneNumber,
//   } = req.body;
//   const role = req.params.role;
//   try {
//     const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
//     if (
//       !validUser ||
//       !validUser.modules.some(
//         (module) => module.moduleName === "order" && module.read === true
//       )
//     ) {
//       return res.status(403).send({ error: "You have no access to do this!" });
//     }

//     if (alternatePhoneNumber) {
//       if (!alternatePhoneNumber.startsWith("+91")) {
//         alternatePhoneNumber = `+91${alternatePhoneNumber}`;
//       }
//     }

//     const validOrder = await orderModel.findOne({ _id: id });
//     if (!validOrder) {
//       return res.status(404).send({ error: "Order not found!" });
//     }

//       if(validOrder.status === "Completed"){
//         return res.status(400).send({error: "Order was already completed you can't able to Edit!"});
//       }

//     if(assignedOn || assignedTo){
//       const validUser = await moduleAccessModel.findOne({roleOfEmployee: role});
//       if(!validUser || !validUser.modules.some((module) => module.moduleName === "order_assigning" && module.read === true)){
//         return res.status(403).send({error: "You've no access to do this!"});
//       }
//     }

//     if (role !== "Admin" && role !== "Order Assigner") {
//       const customerLocation = await orderModel.findOne({
//         _id: id,
//         customerLocationReached: true,
//       });
//       if (!customerLocation) {
//         return res
//           .status(400)
//           .send({ error: "You've not reached the customer location yet!" });
//       }
//     }

//     if(status === "Completed"){
//       const validBill = await billingInfoModel.findOne({requestId: validOrder.requestId});
//       if(!validBill){
//         return res.status(400).send({error: "You can't Complete the Order without Generating Bill!"})
//       }
//     }

//     if(assignedOn){
//       if(!validOrder.assignedTo && !assignedTo){
//         return res.status(400).send({error:"Please select a Employee!"});
//       }

//       const now = moment().startOf('day');
//       var start = moment(assignedOn, "DD/MM/YYYY").startOf('day');
//       if(start.isBefore(now)){
//         return res.status(400).send({error: "AssignedOn shouldn't be the Past Date!"});
//       }
//     }

//     if(assignedOn && closedOn){
//       const closed = moment(closedOn, "DD/MM/YYYY").startOf('day');
//       if(closed.isBefore(start)){
//         return res.status(400).send({error: "ClosedOn date shouldn't be earlier than the AssignedOn date"});
//       }

//       const now = moment().startOf('day');
//       if(closed.isAfter(now)){
//         return res.status(400).send({error: "ClosedOn date shouldn't be the future date"});
//       }
//     }

//     if(!assignedOn && closedOn){
//       const closed = moment(closedOn, "DD/MM/YYYY").startOf('day');
//       const assigned = validOrder.assignedOn;
//       const assignedDate = moment(assigned, "DD/MM/YYYY").startOf('day');
//       if(closed.isBefore(assignedDate)){
//         return res.status(400).send({error: "ClosedOn date shouldn't be earlier than the AssignedOn date"});
//       }

//       const now = moment().startOf('day');
//       if(closed.isAfter(now)){
//         return res.status(400).send({error: "ClosedOn date shouldn't be the future date"});
//       }
//     }

//     if (assignedTo) {
//       if(!validOrder.assignedOn && !assignedOn){
//         return res.status(400).send({error:"Please select Assigned On Date!"});
//       }

//       var validEmployee = await employeesModel.findOne({
//         nameOfEmployee: assignedTo,
//       });
//       if (!validEmployee) {
//         return res.status(404).send({ error: "Please select valid Employee!" });
//       }
//     }

//     if(status === "Completed" && !technicianComments){
//       return res.status(400).send({error: "Technician comments are required when you complete the order!"});
//     }

//     let updateFields = {};
//     if (role === "Technician") {
//       updateFields = {
//         status,
//         technicianComments,
//         closedOn,
//         paidThrough,
//         finalTransactionId,
//         finalAmountPaid,
//         notes,
//         alternatePhoneNumber,
//       };
//     } else {
//       if (assignedTo) {
//         updateFields.status = "In Process";
//         updateFields.assignedTo = assignedTo;
//         updateFields.assignedOn = assignedOn;
//       }
//       updateFields = {
//         ...updateFields,
//         status: status,
//         technicianComments,
//         closedOn,
//         paidThrough,
//         finalTransactionId,
//         finalAmountPaid,
//         notes,
//         alternatePhoneNumber,
//       };
//     }

//     const response = await orderModel.findByIdAndUpdate(
//       id,
//       { $set: updateFields },
//       { new: true }
//     );

//     if (status === "Completed") {
//       const validTemplate = await emailTemplateModel.findOne({templateName: "Feedback Email"});
//       if(validTemplate){
//         const gmailUserName = await settingsModel.findOne({credentialsKey: "GMAIL_USER" });
//         const gmailPassword = await settingsModel.findOne({credentialsKey: "GMAIL_PASSWORD" });

//         const transporter = nodemailer.createTransport({
//           service: "Gmail",
//           auth: {
//             user: gmailUserName.credentialsValue,
//             pass: gmailPassword.credentialsValue
//           }
//         });

//         const socialMediaLinks = await settingsModel.find({credentialsKey: {$in: ["facebook", "whatsapp", "twitter", "instagram", "linkedin"]}});

//         const socialMediaMap = socialMediaLinks.reduce((acc, item) => {
//           acc[item.credentialsKey] = item.credentialsValue;
//           return acc;
//         }, {});

//         const message = {
//         from: gmailUserName.credentialsValue,
//         to: validOrder.email,
//         subject: validTemplate.subject,
//             text: `
// ${validTemplate.body}

// Follow Us On:
// Facebook:  ${socialMediaMap.facebook || "N/A"}
// Twitter:   ${socialMediaMap.twitter || "N/A"}
// Whatsapp:  ${socialMediaMap.whatsapp || "N/A"}
// Instagram: ${socialMediaMap.instagram || "N/A"}
// LinkedIn:  ${socialMediaMap.linkedin || "N/A"}
// `
//             };
//     transporter.sendMail(message);

//         const newEmail = new emailModel({
//           phoneNumber: validOrder.phoneNumber,
//           email: validOrder.email,
//           templateName: validTemplate.templateName
//         });
//         await newEmail.save();
//       } else {
//         const notification = new notificationModel({
//           title: `"Feedback Email" Template not Exist!!`,
//           subtitle: `"Feedback Email" was not exist in the Database. Please add this as soon as possible to send "Feedback Email" to the new Users.`
//         });
//         await notification.save();
//       }

//       const notification = new notificationModel({
//         title: `Order Completed!!`,
//         subtitle: `${validOrder.userName} | ${validOrder.phoneNumber} | ${validOrder.type} Order`,
//         orderDetails: {
//           phoneNumber: validOrder.phoneNumber,
//           alternatePhoneNumber: validOrder.alternatePhoneNumber,
//           email: validOrder.email,
//           userName: validOrder.userName,
//           requestId: validOrder.requestId,
//         },
//       });
//       await notification.save();
//     }

//     if (status) {
//       await serviceRequestsModel.updateMany(
//         { requestId: response.requestId },
//         { $set: { status } },
//         { new: true }
//       );
//       await rentalRequestsModel.updateMany(
//         { requestId: response.requestId },
//         { $set: { status } },
//         { new: true }
//       );
//       await refurbishedRequestsModel.updateMany(
//         { requestId: response.requestId },
//         { $set: { status } },
//         { new: true }
//       );
//     }

//     if (assignedTo) {
//       const existNotification = await notificationModel.findOne({employeeEmail: validEmployee.email, subtitle:  `${response.userName} | ${response.phoneNumber}`});
//       if(!existNotification){
//       const notification = new notificationModel({
//         employeeName: assignedTo,
//         employeeEmail: validEmployee.email,
//         title: `New Order Received!!`,
//         subtitle: `${response.userName} | ${response.phoneNumber}`,
//         orderDetails: {
//           phoneNumber: response.phoneNumber,
//           alternatePhoneNumber: response.alternatePhoneNumber,
//           email: response.email,
//           userName: response.userName,
//         },
//       });
//       await notification.save();
//     }
//     }

//     if(finalAmountPaid){
//     const validBill = await billingInfoModel.findOne({requestId: validOrder.requestId});
//     if(validBill){
//       await billingInfoModel.findOneAndUpdate({_id: validBill._id}, {$set: {finalAmountPaid}}, {new: true});
//     }
//   }

//       return res.status(200).send({ message: `Order updated successfully!` });

//   } catch (error) {
//     console.error("Error:", error.message);
//     res
//       .status(500)
//       .send({ error: "Couldn't Update Order now! Please try again later" });
//   }
// });

router.delete("/deleteOrder/:id/:role", async (req, res) => {
  const { id } = req.params;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "order" && module.read === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const response = await orderModel.findByIdAndDelete(id);
    if (!response) {
      return res.status(404).send({ error: "Order not found!" });
    }
    const validBill = await billingInfoModel.findOne({
      requestId: response.requestId,
    });
    if (validBill) {
      await billingInfoModel.findOneAndDelete({
        requestId: response.requestId,
      });
    }
    return res.status(200).send({ message: `Order deleted successfully!` });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't Update Order now! Please try again later" });
  }
});

// // firebase
// router.post("/addCoupon/:role", upload.single("image"), async (req, res) => {
//   const {
//     limit,
//     code,
//     value,
//     title,
//     description,
//     startDate,
//     endDate,
//     applicable,
//   } = req.body;
//   const role = req.params.role;
//   const image = req.file;
//   try {
//     const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
//     if (
//       !validUser ||
//       !validUser.modules.some(
//         (module) => module.moduleName === "coupon_code" && module.write === true
//       )
//     ) {
//       return res.status(403).send({ error: "You have no access to do this!" });
//     }

//     if (
//       !title ||
//       !limit ||
//       !code ||
//       !value ||
//       !description ||
//       !startDate ||
//       !endDate ||
//       !applicable
//     ) {
//       return res.status(400).send({ error: "Please fill all fields!" });
//     }

//     const duplicateCoupon = await couponCodeModel.findOne({ code });
//     if (duplicateCoupon) {
//       return res.status(400).send({ error: "Coupon code already exists!" });
//     }

//     if(startDate === endDate){
//       return res.status(400).send({error: "Start and End date shouldn't be the Same!"});
//     }

//     if(startDate){
//       const now = moment().startOf("day");
//       const start = moment(startDate, "DD/MM/YYYY").startOf("day");

//       if (start.isBefore(now)) {
//         return res
//           .status(400)
//           .send({ error: "StartDate shouldn't be the Past Date!" });
//       }
//     }
//     if(endDate){
//       const now = moment().startOf("day");
//       const end = moment(endDate, "DD/MM/YYYY").endOf("day");

//       if (end.isBefore(now)) {
//         return res
//           .status(400)
//           .send({ error: "EndDate shouldn't be the Past Date!" });
//       }
//     }
//     let imageUrl;
//     if (image) {
//       const imageName = `${Date.now()}_${image.originalname}`;
//       const imageUpload = admin.storage().bucket().file(`images/${imageName}`);

//       const fileType = image.originalname.split(".").pop().toLowerCase();
//       if(fileType !== "jpg" && fileType !== "jpeg" && fileType !== "png" && fileType !== "svg" && fileType !== "webp"){
//         return res.status(400).send({error: "Invalid image type!"});
//       }
//       await new Promise((resolve, reject) => {
//         const stream = imageUpload.createWriteStream({
//           metadata: {
//             contentType: image.mimetype,
//           },
//         });

//         stream.on("error", (err) => {
//           console.error("Error uploading file:", err);
//           reject(err);
//         });

//         stream.on("finish", async () => {
//           await imageUpload.makePublic();
//           imageUrl = imageUpload.publicUrl();
//           console.log(imageUrl);
//           resolve();
//         });

//         stream.end(image.buffer);
//       });
//     }

//     if (applicable) {
//       const formatApplicable = applicable.split(",");
//       for (const category of formatApplicable) {
//         const validCategory = await categoryModel.findOne({
//           category: category.trim(),
//           status: "Active",
//         });
//         if (!validCategory) {
//           return res
//             .status(400)
//             .send({ error: "Please select valid categories!" });
//         }
//       }
//     }

//     const newCoupon = new couponCodeModel({
//       image: imageUrl,
//       title,
//       limit,
//       code,
//       value,
//       description,
//       startDate,
//       endDate,
//       applicable,
//       status: "Pending",
//     });
//     await newCoupon.save();

//     return res.status(200).send({
//       message: `${code} created successfully and will effect from ${startDate}`,
//     });
//   } catch (error) {
//     console.error("Error:", error.message);
//     res
//       .status(500)
//       .send({ error: "Couldn't Add CouponCode now! Please try again later" });
//   }
// });

// s3
router.post("/addCoupon/:role", upload.single("image"), async (req, res) => {
  let {
    limit,
    code,
    value,
    title,
    description,
    startDate,
    endDate,
    applicable,
  } = req.body;
  const role = req.params.role;
  const image = req.file;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "coupon_code" && module.write === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    if (
      !title ||
      !limit ||
      !code ||
      !value ||
      !description ||
      !startDate ||
      !endDate ||
      !applicable
    ) {
      return res.status(400).send({ error: "Please fill all fields!" });
    }

    code = code.toUpperCase();

    const duplicateCoupon = await couponCodeModel.findOne({ code });
    if (duplicateCoupon) {
      return res.status(400).send({ error: "Coupon code already exists!" });
    }

    if (startDate === endDate) {
      return res
        .status(400)
        .send({ error: "Start and End date shouldn't be the Same!" });
    }

    if (startDate) {
      const now = moment().startOf("day");
      const start = moment(startDate, "DD/MM/YYYY").startOf("day");

      if (start.isBefore(now)) {
        return res
          .status(400)
          .send({ error: "StartDate shouldn't be the Past Date!" });
      }
    }
    if (endDate) {
      const now = moment().startOf("day");
      const end = moment(endDate, "DD/MM/YYYY").endOf("day");

      if (end.isBefore(now)) {
        return res
          .status(400)
          .send({ error: "EndDate shouldn't be the Past Date!" });
      }
    }
    let imageUrl;
    if (image) {
      const imageName = `${Date.now()}_${image.originalname}`;

      const fileType = image.originalname.split(".").pop().toLowerCase();
      if (
        fileType !== "jpg" &&
        fileType !== "jpeg" &&
        fileType !== "png" &&
        fileType !== "svg" &&
        fileType !== "webp"
      ) {
        return res.status(400).send({ error: "Invalid image type!" });
      }
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `images/${imageName}`,
        Body: image.buffer,
        ContentType: image.mimetype,
        ACL: "public-read",
      };

      const uploadResult = await s3.upload(params).promise();
      imageUrl = uploadResult.Location;
    }

    if (applicable) {
      const formatApplicable = applicable.split(",");
      for (const category of formatApplicable) {
        const validCategory = await categoryModel.findOne({
          category: category.trim(),
          status: "Active",
        });
        if (!validCategory) {
          return res
            .status(400)
            .send({ error: "Please select valid categories!" });
        }
      }
    }

    const newCoupon = new couponCodeModel({
      image: imageUrl,
      title,
      limit,
      code,
      value,
      description,
      startDate,
      endDate,
      applicable,
      status: "Pending",
    });
    await newCoupon.save();

    return res.status(200).send({
      message: `${code} created successfully and will effect from ${startDate}`,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't Add CouponCode now! Please try again later" });
  }
});

router.get("/getCategory", async (req, res) => {
  try {
    const response = await categoryModel
      .find({ status: "Active" })
      .distinct("category");

    return res.status(200).send({ data: response });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

router.get("/viewCoupons/:role/:search?", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const searchString = req.params.search || "";
  const role = req.params.role;
  try {
    let moduleAccess;
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "coupon_code" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "coupon_code"
      );
    }
    const skip = (page - 1) * limit;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const escapedSearchString = searchString.replace(/\+/g, "\\+");
    const searchRegex = new RegExp(escapedSearchString, "i");

    const query = {
      $or: [
        { code: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { status: { $regex: searchRegex } },
        { title: { $regex: searchRegex } },
      ],
    };

    const response = await couponCodeModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort(sortOptions);

    const serialNumberStart = skip + 1;
    const serialNumbers = Array.from(
      { length: response.length },
      (_, index) => serialNumberStart + index
    );

    const coupons = response.map((order, index) => {
      return {
        ...order.toObject(),
        s_no: serialNumbers[index],
      };
    });

    const totalItems = await couponCodeModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const paginationInfo = {
      totalItems,
      totalPages,
      curentPage: page,
      startIndex: skip + 1,
      endIndex: skip + coupons.length,
      itemsPerPage: coupons.length,
    };

    if (coupons) {
      return res
        .status(200)
        .send({ data: coupons, pagination: paginationInfo, moduleAccess });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't View Orders now! Please try again later" });
  }
});

router.get("/viewCouponById/:id/:role", async (req, res) => {
  const { id, role } = req.params;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "coupon_code" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    }

    const response = await couponCodeModel.findById(id);

    if (response) {
      return res.status(200).send({ data: response });
    } else {
      return res.status(500).send({ error: "Coupon not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't View Coupon now! Please try again later" });
  }
});

// // firebase
// router.patch(
//   "/updateCoupon/:id/:role",
//   upload.single("image"),
//   async (req, res) => {
//     const { id } = req.params;
//     const {
//       status,
//       startDate,
//       endDate,
//       code,
//       limit,
//       value,
//       title,
//       description,
//       applicable,
//     } = req.body;
//     const role = req.params.role;
//     const image = req.file;
//     try {
//       const validUser = await moduleAccessModel.findOne({
//         roleOfEmployee: role,
//       });

//       if (
//         !validUser ||
//         !validUser.modules.some(
//           (module) =>
//             module.moduleName === "coupon_code" && module.read === true
//         )
//       ) {
//         return res
//           .status(403)
//           .send({ error: "You have no access to do this!" });
//       }

//       let imageUrl;
//       if (image) {
//         const imageName = `${Date.now()}_${image.originalname}`;
//         const imageUpload = admin
//           .storage()
//           .bucket()
//           .file(`images/${imageName}`);

//           const fileType = image.originalname.split(".").pop().toLowerCase();
//           if(fileType !== "jpg" && fileType !== "jpeg" && fileType !== "png" && fileType !== "svg" && fileType !== "webp"){
//             return res.status(400).send({error: "Invalid image type!"});
//           }
//         await new Promise((resolve, reject) => {
//           const stream = imageUpload.createWriteStream({
//             metadata: {
//               contentType: image.mimetype,
//             },
//           });

//           stream.on("error", (err) => {
//             console.error("Error uploading file:", err);
//             reject(err);
//           });

//           stream.on("finish", async () => {
//             await imageUpload.makePublic();
//             imageUrl = imageUpload.publicUrl();
//             console.log(imageUrl);
//             resolve();
//           });

//           stream.end(image.buffer);
//         });
//       }

//     if(startDate && startDate === endDate && endDate){
//       return res.status(400).send({error: "Start and End date shouldn't be the Same!"});
//     }

//       if(startDate){
//         const now = moment().startOf("day");
//         const start = moment(startDate, "DD/MM/YYYY").startOf("day");

//         if (start.isBefore(now)) {
//           return res
//             .status(400)
//             .send({ error: "StartDate shouldn't be the Past Date!" });
//         }
//       }
//       if(endDate){
//         const now = moment().startOf("day");
//         const end = moment(endDate, "DD/MM/YYYY").endOf("day");

//         if (end.isBefore(now)) {
//           return res
//             .status(400)
//             .send({ error: "EndDate shouldn't be the Past Date!" });
//         }
//       }

//       if (applicable) {
//         const formatApplicable = applicable.split(",");
//         for (const category of formatApplicable) {
//           const validCategory = await categoryModel.find({
//             category: category.trim(),
//             status: "Active",
//           });
//           if (!validCategory) {
//             return res
//               .status(400)
//               .send({ error: "Please select valid categories!" });
//           }
//         }
//       }

//       const response = await couponCodeModel.findByIdAndUpdate(
//         id,
//         {
//           $set: {
//             status,
//             startDate,
//             image: imageUrl,
//             endDate,
//             code,
//             limit,
//             value,
//             title,
//             description,
//             applicable,
//           },
//         },
//         { new: true }
//       );
//       if (response) {
//         return res
//           .status(200)
//           .send({ message: "Coupon updated successfully!" });
//       } else {
//         return res.status(404).send({ error: "Coupon not found!" });
//       }
//     } catch (error) {
//       console.error("Error:", error.message);
//       res
//         .status(500)
//         .send({ error: "Couldn't Update Coupon now! Please try again later" });
//     }
//   }
// );

// s3

router.patch(
  "/updateCoupon/:id/:role",
  upload.single("image"),
  async (req, res) => {
    const { id } = req.params;
    let { status, startDate, endDate, limit, title, description, applicable } =
      req.body;
    const role = req.params.role;
    const image = req.file;
    try {
      const validUser = await moduleAccessModel.findOne({
        roleOfEmployee: role,
      });

      if (
        !validUser ||
        !validUser.modules.some(
          (module) =>
            module.moduleName === "coupon_code" && module.read === true
        )
      ) {
        return res
          .status(403)
          .send({ error: "You have no access to do this!" });
      }

      if (status === "Active") {
        const validCoupon = await couponCodeModel.findOne({ _id: id });
        if (!validCoupon) {
          return res.status(404).send({ error: "Coupon not found!" });
        }

        if (endDate) {
          validCoupon.set(status, endDate);
          validCoupon.save();
        } else {
          if (validCoupon.status === "InActive") {
            return res.status(400).send({ error: "End date already crossed!" });
          }
        }
      }

      let imageUrl;
      if (image) {
        const imageName = `${Date.now()}_${image.originalname}`;

        const fileType = image.originalname.split(".").pop().toLowerCase();
        if (
          fileType !== "jpg" &&
          fileType !== "jpeg" &&
          fileType !== "png" &&
          fileType !== "svg" &&
          fileType !== "webp"
        ) {
          return res.status(400).send({ error: "Invalid image type!" });
        }
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `images/${imageName}`,
          Body: image.buffer,
          ContentType: image.mimetype,
          ACL: "public-read",
        };

        const uploadResult = await s3.upload(params).promise();
        imageUrl = uploadResult.Location;
      }

      if (startDate && startDate === endDate && endDate) {
        return res
          .status(400)
          .send({ error: "Start and End date shouldn't be the Same!" });
      }

      // if(startDate){
      //   const now = moment().startOf("day");
      //   const start = moment(startDate, "DD/MM/YYYY").startOf("day");

      //   if (start.isBefore(now)) {
      //     return res
      //       .status(400)
      //       .send({ error: "StartDate shouldn't be the Past Date!" });
      //   }
      // }
      if (endDate) {
        const now = moment().startOf("day");
        const end = moment(endDate, "DD/MM/YYYY").endOf("day");

        if (end.isBefore(now)) {
          return res
            .status(400)
            .send({ error: "EndDate shouldn't be the Past Date!" });
        }
      }

      if (applicable) {
        const formatApplicable = applicable.split(",");
        for (const category of formatApplicable) {
          const validCategory = await categoryModel.find({
            category: category.trim(),
            status: "Active",
          });
          if (!validCategory) {
            return res
              .status(400)
              .send({ error: "Please select valid categories!" });
          }
        }
      }

      const response = await couponCodeModel.findByIdAndUpdate(
        id,
        {
          $set: {
            status,
            startDate,
            image: imageUrl,
            endDate,
            limit,
            title,
            description,
            applicable,
          },
        },
        { new: true }
      );
      if (response) {
        return res
          .status(200)
          .send({ message: "Coupon updated successfully!" });
      } else {
        return res.status(404).send({ error: "Coupon not found!" });
      }
    } catch (error) {
      console.error("Error:", error.message);
      res
        .status(500)
        .send({ error: "Couldn't Update Coupon now! Please try again later" });
    }
  }
);

router.delete("/deleteCoupon/:id/:role", async (req, res) => {
  const { id } = req.params;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "coupon_code" && module.read === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const response = await couponCodeModel.findByIdAndDelete(id);
    if (response) {
      return res.status(200).send({ message: "Coupon deleted successfully!" });
    } else {
      return res.status(404).send({ error: "Coupon not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't Delete Coupon now! Please try again later" });
  }
});

router.get("/viewOrderDetails/:role", async (req, res) => {
  const { requestId } = req.query;
  const role = req.params.role;

  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "order" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    }

    const validOrder = await orderModel.findOne({ requestId });
    if (!validOrder) {
      return res.status(404).send({ error: "Order not found!" });
    }

    let orders = [];

    const addOrders = async (Model, query) => {
      const results = await Model.find(query);
      if (results.length > 0) {
        orders = orders.concat(results);
      }
    };

    await addOrders(rentalRequestsModel, { requestId });
    await addOrders(serviceRequestsModel, { requestId });
    await addOrders(refurbishedRequestsModel, { requestId });

    if (orders.length === 0) {
      return res.status(404).send({ error: "Order details not found!" });
    }

    const customerDetails = {
      requestId: validOrder.requestId,
      userName: validOrder.userName,
      email: validOrder.email,
      phoneNumber: validOrder.phoneNumber,
      amount: validOrder.amount,
      transactionId: validOrder.transactionId,
      alternatePhoneNumber: validOrder.alternatePhoneNumber,
      address: validOrder.address,
      status: validOrder.status,
    };

    return res.status(200).send({
      data: orders,
      customerDetails,
      moduleAccess: validUser.modules.find(
        (module) => module.moduleName === "order"
      ),
    });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view order now! Please try again later" });
  }
});

// router.get("/viewOrderDetailsRepair/:role", async (req, res) => {
//   const { requestId } = req.query;
//   const role = req.params.role;
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const skip = (page - 1) * limit;
//   const sortBy = req.query.sortBy || "createdAt";
//   const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
//   try {
//     const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
//     if (
//       !validUser ||
//       !validUser.modules.some(
//         (module) => module.moduleName === "order" && module.read === true
//       )
//     ) {
//       return res
//         .status(403)
//         .send({ error: "You have no access to view this Page!" });
//     }

//     const validOrder = await orderModel.findOne({ requestId });
//     if (!validOrder) {
//       return res.status(404).send({ error: "Order not found!" });
//     }

//     const sortOptions = {};
//     sortOptions[sortBy] = sortOrder;

//     const response = await serviceRequestsModel
//       .find({ requestId })
//       .skip(skip)
//       .sort(sortOptions)
//       .limit(limit);

//     if (!response) {
//       return res.status(200).send({ error: "No Orders Found!" });
//     }

//     const serialNumberStart = skip + 1;
//     const serialNumbers = Array.from(
//       { length: response.length },
//       (_, index) => serialNumberStart + index
//     );

//     const serviceOrders = response.map((service, index) => {
//       return {
//         ...service.toObject(),
//         s_no: serialNumbers[index],
//       };
//     });

//     const totalItems = await serviceRequestsModel.countDocuments({ requestId });
//     const totalPages = Math.ceil(totalItems / limit);
//     const currentPage = page;

//     const paginationInfo = {
//       totalItems,
//       totalPages,
//       currentPage,
//       startIndex: skip + 1,
//       endIndex: skip + response.length,
//       itemsPerPage: response.length,
//     };

//     const customerDetails = {
//       requestId: validOrder.requestId,
//       userName: validOrder.userName,
//       email: validOrder.email,
//       phoneNumber: validOrder.phoneNumber,
//       amount: validOrder.amount,
//       transactionId: validOrder.transactionId,
//       finalAmountPaid: validOrder.totalAmount,
//       finalTransactionId: validOrder.finalTransactionId,
//       alternatePhoneNumber: validOrder.alternatePhoneNumber,
//       address: validOrder.address,
//       status: validOrder.status,
//     };

//     return res
//       .status(200)
//       .send({
//         data: serviceOrders,
//         pagination: paginationInfo,
//         customerDetails,
//         moduleAccess: validUser.modules.find(
//           (module) => module.moduleName === "order"
//         ),
//       });
//   } catch (error) {
//     console.error("Error:", error.message);
//     res
//       .status(500)
//       .send({ error: "Couldn't view order now! Please try again later" });
//   }
// });

router.get("/viewOrderDetailsRepair/:role", async (req, res) => {
  const { requestId } = req.query;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "order" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    }

    const response = await serviceRequestsModel.find({ requestId });

    if (!response) {
      return res.status(200).send({ error: "No Orders Found!" });
    }

    return res.status(200).send({
      data: response,
      moduleAccess: validUser.modules.find(
        (module) => module.moduleName === "order"
      ),
    });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view order now! Please try again later" });
  }
});

// router.get("/viewOrderDetailsRental/:role", async (req, res) => {
//   const { requestId } = req.query;
//   const role = req.params.role;
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const skip = (page - 1) * limit;
//   const sortBy = req.query.sortBy || "createdAt";
//   const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
//   try {
//     const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
//     if (
//       !validUser ||
//       !validUser.modules.some(
//         (module) => module.moduleName === "order" && module.read === true
//       )
//     ) {
//       return res
//         .status(403)
//         .send({ error: "You have no access to view this Page!" });
//     }

//     // const validOrder = await orderModel.findOne({ requestId });
//     // if (!validOrder) {
//     //   return res.status(404).send({ error: "Order not found!" });
//     // }

//     const sortOptions = {};
//     sortOptions[sortBy] = sortOrder;

//     const response = await rentalRequestsModel
//       .find({ requestId })
//       .skip(skip)
//       .sort(sortOptions)
//       .limit(limit);

//     if (!response) {
//       return res.status(200).send({ error: "No Orders Found!" });
//     }

//     const serialNumberStart = skip + 1;
//     const serialNumbers = Array.from(
//       { length: response.length },
//       (_, index) => serialNumberStart + index
//     );

//     const rentalOrders = response.map((rental, index) => {
//       return {
//         ...rental.toObject(),
//         s_no: serialNumbers[index],
//       };
//     });

//     const totalItems = await rentalRequestsModel.countDocuments({ requestId });
//     const totalPages = Math.ceil(totalItems / limit);
//     const currentPage = page;

//     const paginationInfo = {
//       totalItems,
//       totalPages,
//       currentPage,
//       startIndex: skip + 1,
//       endIndex: skip + response.length,
//       itemsPerPage: response.length,
//     };

//     // const customerDetails = {
//     //   requestId: validOrder.requestId,
//     //   userName: validOrder.userName,
//     //   email: validOrder.email,
//     //   phoneNumber: validOrder.phoneNumber,
//     //   amount: validOrder.amount,
//     //   transactionId: validOrder.transactionId,
//     //   totalAmount: validOrder.totalAmount,
//     //   finalTransactionId: validOrder.finalTransactionId,
//     //   alternatePhoneNumber: validOrder.alternatePhoneNumber,
//     //   address: validOrder.address,
//     //   status: validOrder.status,
//     // };

//     return res
//       .status(200)
//       .send({
//         data: rentalOrders,
//         pagination: paginationInfo,
//         // customerDetails,
//         moduleAccess: validUser.modules.find(
//           (module) => module.moduleName === "order"
//         ),
//       });
//   } catch (error) {
//     console.error("Error:", error.message);
//     res
//       .status(500)
//       .send({ error: "Couldn't view order now! Please try again later" });
//   }
// });

router.get("/viewOrderDetailsRental/:role", async (req, res) => {
  const { requestId } = req.query;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "order" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    }

    const response = await rentalRequestsModel.find({ requestId });

    if (!response) {
      return res.status(200).send({ error: "No Orders Found!" });
    }

    return res.status(200).send({
      data: response,
      moduleAccess: validUser.modules.find(
        (module) => module.moduleName === "order"
      ),
    });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view order now! Please try again later" });
  }
});

// router.get("/viewOrderDetailsRefurbished/:role", async (req, res) => {
//   const { requestId } = req.query;
//   const role = req.params.role;
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const skip = (page - 1) * limit;
//   const sortBy = req.query.sortBy || "createdAt";
//   const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
//   try {
//     const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
//     if (
//       !validUser ||
//       !validUser.modules.some(
//         (module) => module.moduleName === "order" && module.read === true
//       )
//     ) {
//       return res
//         .status(403)
//         .send({ error: "You have no access to view this Page!" });
//     }

//     const validOrder = await orderModel.findOne({ requestId });
//     if (!validOrder) {
//       return res.status(404).send({ error: "Order not found!" });
//     }

//     const sortOptions = {};
//     sortOptions[sortBy] = sortOrder;

//     const response = await refurbishedRequestsModel
//       .find({ requestId })
//       .skip(skip)
//       .sort(sortOptions)
//       .limit(limit);

//     if (!response) {
//       return res.status(200).send({ error: "No Orders Found!" });
//     }

//     const serialNumberStart = skip + 1;
//     const serialNumbers = Array.from(
//       { length: response.length },
//       (_, index) => serialNumberStart + index
//     );

//     const refurbishedOrders = response.map((rental, index) => {
//       return {
//         ...rental.toObject(),
//         s_no: serialNumbers[index],
//       };
//     });

//     const totalItems = await refurbishedRequestsModel.countDocuments({
//       requestId,
//     });
//     const totalPages = Math.ceil(totalItems / limit);
//     const currentPage = page;

//     const paginationInfo = {
//       totalItems,
//       totalPages,
//       currentPage,
//       startIndex: skip + 1,
//       endIndex: skip + response.length,
//       itemsPerPage: response.length,
//     };

//     const customerDetails = {
//       requestId: validOrder.requestId,
//       userName: validOrder.userName,
//       email: validOrder.email,
//       phoneNumber: validOrder.phoneNumber,
//       amount: validOrder.amount,
//       transactionId: validOrder.transactionId,
//       totalAmount: validOrder.totalAmount,
//       finalTransactionId: validOrder.finalTransactionId,
//       alternatePhoneNumber: validOrder.alternatePhoneNumber,
//       address: validOrder.address,
//       status: validOrder.status,
//     };

//     return res
//       .status(200)
//       .send({
//         data: refurbishedOrders,
//         pagination: paginationInfo,
//         customerDetails,
//         moduleAccess: validUser.modules.find(
//           (module) => module.moduleName === "order"
//         ),
//       });
//   } catch (error) {
//     console.error("Error:", error.message);
//     res
//       .status(500)
//       .send({ error: "Couldn't view order now! Please try again later" });
//   }
// });

router.get("/viewOrderDetailsRefurbished/:role", async (req, res) => {
  const { requestId } = req.query;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "order" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    }

    const response = await refurbishedRequestsModel.find({ requestId });

    if (!response) {
      return res.status(200).send({ error: "No Orders Found!" });
    }

    return res.status(200).send({
      data: response,
      moduleAccess: validUser.modules.find(
        (module) => module.moduleName === "order"
      ),
    });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view order now! Please try again later" });
  }
});

// // firebase
// router.post(
//   "/addEmployee/:role",
//   upload.fields([{ name: "image" }, { name: "idProof" }]),
//   async (req, res) => {
//     let {
//       phoneNumber,
//       nameOfEmployee,
//       dateOfBirth,
//       roleOfEmployee,
//       email,
//       password,
//       employeeId,
//     } = req.body;
//     const { image, idProof } = req.files;
//     const role = req.params.role;

//     try {
//       const validUser = await moduleAccessModel.findOne({
//         roleOfEmployee: role,
//       });
//       if (
//         !validUser ||
//         !validUser.modules.some(
//           (module) => module.moduleName === "employee" && module.write === true
//         )
//       ) {
//         return res
//           .status(403)
//           .send({ error: "You have no access to do this!" });
//       }

//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       if(email){
//         if(!emailRegex.test(email)){
//           return res.status(400).send({error: "Invalid Email!"});
//         }
//       }

//       if (
//         !phoneNumber ||
//         !nameOfEmployee ||
//         !dateOfBirth ||
//         !roleOfEmployee ||
//         !email ||
//         !password
//       ) {
//         return res.status(400).send({ error: "Please fill all fields!" });
//       }

//       if (!phoneNumber.startsWith("+91")) {
//         phoneNumber = `+91${phoneNumber}`;
//       }

//       const existEmployee = await employeesModel.findOne({ phoneNumber });
//       if (existEmployee) {
//         return res.status(400).send({ error: "Phone Number already exists!" });
//       }

//       const existEmail = await employeesModel.findOne({ email });
//       if (existEmail) {
//         return res.status(400).send({ error: "Email already exists!" });
//       }

//       const validRole = await employeeRolesModel.findOne({
//         nameOfRole: roleOfEmployee,
//       });
//       if (!validRole) {
//         return res.status(400).send({ error: "Invalid Employee Role!" });
//       }

//       if (employeeId) {
//         const existEmployeeId = await employeesModel.findOne({ employeeId });
//         if (existEmployeeId) {
//           return res
//             .status(400)
//             .send({
//               error: "EmployeeID already exists! Please try another one",
//             });
//         }
//       }

//       const uploadImage = async (file, folder) => {
//         const fileName = `${Date.now()}_${file.originalname}`;
//         const fileUpload = admin
//           .storage()
//           .bucket()
//           .file(`${folder}/${fileName}`);

//         return new Promise((resolve, reject) => {
//           const stream = fileUpload.createWriteStream({
//             metadata: {
//               contentType: file.mimetype,
//             },
//           });

//           stream.on("error", (err) => {
//             console.error("Error uploading file:", err);
//             reject(err);
//           });

//           stream.on("finish", async () => {
//             await fileUpload.makePublic();
//             resolve(fileUpload.publicUrl());
//           });

//           stream.end(file.buffer);
//         });
//       };

//       let imageUrl, idProofUrl;
//       if (image) {
//         if(!isValidImageExtension(image[0].originalname)){
//           return res.status(400).send({error: "Invalid image type!"});
//         }
//         imageUrl = await uploadImage(image[0], "images");
//       }
//       if (idProof) {
//         if(!isValidImageExtension(idProof[0].originalname)){
//           return res.status(400).send({error: "Invalid image type in IdProof"});
//         }
//         idProofUrl = await uploadImage(idProof[0], "idProofs");
//       }

//       const newEmployee = new employeesModel({
//         employeeId,
//         phoneNumber,
//         nameOfEmployee,
//         dateOfBirth,
//         roleOfEmployee,
//         image: imageUrl,
//         idProof: idProofUrl,
//         email,
//         password,
//         status: "Active",
//       });
//       await newEmployee.save();

//       return res.status(200).send({ message: "Employee added successfully!" });
//     } catch (error) {
//       console.error("Error:", error.message);
//       res
//         .status(500)
//         .send({ error: "Couldn't Add Employee now! Please try again later" });
//     }
//   }
// );

// s3

router.post(
  "/addEmployee/:role",
  upload.fields([{ name: "image" }, { name: "idProof" }]),
  async (req, res) => {
    let {
      phoneNumber,
      nameOfEmployee,
      dateOfBirth,
      roleOfEmployee,
      email,
      password,
    } = req.body;
    const { image, idProof } = req.files;
    const role = req.params.role;

    try {
      const validUser = await moduleAccessModel.findOne({
        roleOfEmployee: role,
      });
      if (
        !validUser ||
        !validUser.modules.some(
          (module) => module.moduleName === "employee" && module.write === true
        )
      ) {
        return res
          .status(403)
          .send({ error: "You have no access to do this!" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email) {
        if (!emailRegex.test(email)) {
          return res.status(400).send({ error: "Invalid Email!" });
        }
      }

      if (
        !phoneNumber ||
        !nameOfEmployee ||
        !dateOfBirth ||
        !roleOfEmployee ||
        !password
      ) {
        return res.status(400).send({ error: "Please fill all fields!" });
      }

      if (!phoneNumber.startsWith("+91")) {
        phoneNumber = `+91${phoneNumber}`;
      }

      const existEmployee = await employeesModel.findOne({ phoneNumber });
      if (existEmployee) {
        return res.status(400).send({ error: "Phone Number already exists!" });
      }

      const existEmployee1 = await employeesModel.findOne({ nameOfEmployee });
      if (existEmployee1) {
        return res.status(400).send({ error: "Employee Name already exists!" });
      }

      if (email) {
        const existEmail = await employeesModel.findOne({ email });
        if (existEmail) {
          return res.status(400).send({ error: "Email already exists!" });
        }
      }

      const validRole = await employeeRolesModel.findOne({
        nameOfRole: roleOfEmployee,
      });
      if (!validRole) {
        return res.status(400).send({ error: "Invalid Employee Role!" });
      }

      const uploadImage = async (file, folder) => {
        const fileName = `${Date.now()}_${file.originalname}`;
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `${folder}/${fileName}`,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: "public-read",
        };

        return new Promise((resolve, reject) => {
          s3.upload(params, (err, data) => {
            if (err) {
              console.error("Error uploading file:", err);
              reject(err);
            } else {
              resolve(data.Location);
            }
          });
        });
      };

      let imageUrl, idProofUrl;
      if (image) {
        if (!isValidImageExtension(image[0].originalname)) {
          return res.status(400).send({ error: "Invalid image type!" });
        }
        imageUrl = await uploadImage(image[0], "images");
      }
      if (idProof) {
        if (!isValidImageExtension(idProof[0].originalname)) {
          return res
            .status(400)
            .send({ error: "Invalid image type in IdProof" });
        }
        idProofUrl = await uploadImage(idProof[0], "idProofs");
      }

      const now = moment().tz("Asia/Kolkata").format("DD/MM/YY");
      const year = now.split("/")[2];

      const prevEmployeeId = await employeesModel
        .findOne()
        .sort({ createdAt: -1 })
        .limit(1);
      let newEmployeeId;
      if (prevEmployeeId) {
        const idOfEmployee = prevEmployeeId.employeeId.substring(4);

        const previousEmployeeId = parseFloat(idOfEmployee, 10) + 1;
        const previousEmployeeIdFormatted = previousEmployeeId
          .toString()
          .padStart(2, "0");

        newEmployeeId = `RS${year}${previousEmployeeIdFormatted}`;
      } else [(newEmployeeId = `RS${year}01`)];

      const newEmployee = new employeesModel({
        employeeId: newEmployeeId,
        phoneNumber,
        nameOfEmployee,
        dateOfBirth,
        roleOfEmployee,
        image: imageUrl,
        idProof: idProofUrl,
        email: email || null,
        password,
        status: "Active",
      });
      await newEmployee.save();

      await notificationCountModel.findOneAndUpdate(
        { type: "orderCount" },
        {
          $push: {
            details: { employeePhoneNumber: newEmployee.phoneNumber, count: 0 },
          },
        },
        { new: true }
      );
      await notificationCountModel.findOneAndUpdate(
        { type: "quoteCount" },
        {
          $push: {
            details: { employeePhoneNumber: newEmployee.phoneNumber, count: 0 },
          },
        },
        { new: true }
      );
      await notificationCountModel.findOneAndUpdate(
        { type: "userCount" },
        {
          $push: {
            details: { employeePhoneNumber: newEmployee.phoneNumber, count: 0 },
          },
        },
        { new: true }
      );
      await notificationCountModel.findOneAndUpdate(
        { type: "supportCount" },
        {
          $push: {
            details: { employeePhoneNumber: newEmployee.phoneNumber, count: 0 },
          },
        },
        { new: true }
      );
      // await notificationCountModel.findOneAndUpdate({type: "transactionCount"}, {$push: {details: {employeePhoneNumber: newEmployee.phoneNumber, count: 0}}}, {new: true})
      await notificationCountModel.findOneAndUpdate(
        { type: "generalReviewCount" },
        {
          $push: {
            details: { employeePhoneNumber: newEmployee.phoneNumber, count: 0 },
          },
        },
        { new: true }
      );
      await notificationCountModel.findOneAndUpdate(
        { type: "productReviewCount" },
        {
          $push: {
            details: { employeePhoneNumber: newEmployee.phoneNumber, count: 0 },
          },
        },
        { new: true }
      );

      // const notificationTypes = [
      // { type: "orderCount", details: { employeePhoneNumber: newEmployee.phoneNumber, count: 0 } },
      //   { type: "quoteCount", details: { employeePhoneNumber: newEmployee.phoneNumber, count: 0 } },
      //   { type: "userCount", details: { employeePhoneNumber: newEmployee.phoneNumber, count: 0 } },
      //   { type: "supportCount", details: { employeePhoneNumber: newEmployee.phoneNumber, count: 0 } },
      //   { type: "transactionCount", details: { employeePhoneNumber: newEmployee.phoneNumber, count: 0 } },
      //   { type: "generalReviewCount", details: { employeePhoneNumber: newEmployee.phoneNumber, count: 0 } },
      //   { type: "productReviewCount", details: { employeePhoneNumber: newEmployee.phoneNumber, count: 0 } }
      // ];

      // await notificationCountModel.insertMany(notificationTypes);

      return res.status(200).send({ message: "Employee added successfully!" });
    } catch (error) {
      console.error("Error:", error.message);
      res
        .status(500)
        .send({ error: "Couldn't Add Employee now! Please try again later" });
    }
  }
);

// router.post(
//   "/addEmployee/:role",
//   upload.fields([{ name: "image" }, { name: "idProof" }]),
//   async (req, res) => {
//     let {
//       phoneNumber,
//       nameOfEmployee,
//       dateOfBirth,
//       roleOfEmployee,
//       email,
//       password,
//     } = req.body;
//     const { image, idProof } = req.files;
//     const role = req.params.role;

//     try {
//       const validUser = await moduleAccessModel.findOne({
//         roleOfEmployee: role,
//       });
//       if (
//         !validUser ||
//         !validUser.modules.some(
//           (module) => module.moduleName === "employee" && module.write === true
//         )
//       ) {
//         return res
//           .status(403)
//           .send({ error: "You have no access to do this!" });
//       }

//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       if (email) {
//         if (!emailRegex.test(email)) {
//           return res.status(400).send({ error: "Invalid Email!" });
//         }
//       }

//       if (
//         !phoneNumber ||
//         !nameOfEmployee ||
//         !dateOfBirth ||
//         !roleOfEmployee ||
//         !password
//       ) {
//         return res.status(400).send({ error: "Please fill all fields!" });
//       }

//       if (!phoneNumber.startsWith("+91")) {
//         phoneNumber = `+91${phoneNumber}`;
//       }

//       const existEmployee = await employeesModel.findOne({ phoneNumber });
//       if (existEmployee) {
//         return res.status(400).send({ error: "Phone Number already exists!" });
//       }

//       const existEmployee1 = await employeesModel.findOne({ nameOfEmployee });
//       if (existEmployee1) {
//         return res.status(400).send({ error: "Employee Name already exists!" });
//       }

//       if (email) {
//         const existEmail = await employeesModel.findOne({ email });
//         if (existEmail) {
//           return res.status(400).send({ error: "Email already exists!" });
//         }
//       }

//       const validRole = await employeeRolesModel.findOne({
//         nameOfRole: roleOfEmployee,
//       });
//       if (!validRole) {
//         return res.status(400).send({ error: "Invalid Employee Role!" });
//       }

//       const uploadImage = async (file, folder) => {
//         const fileName = `${Date.now()}_${file.originalname}`;
//         const params = {
//           Bucket: process.env.AWS_S3_BUCKET,
//           Key: `${folder}/${fileName}`,
//           Body: file.buffer,
//           ContentType: file.mimetype,
//           ACL: "public-read",
//         };

//         return new Promise((resolve, reject) => {
//           s3.upload(params, (err, data) => {
//             if (err) {
//               console.error("Error uploading file:", err);
//               reject(err);
//             } else {
//               resolve(data.Location);
//             }
//           });
//         });
//       };

//       let imageUrl, idProofUrl;
//       if (image) {
//         if (!isValidImageExtension(image[0].originalname)) {
//           return res.status(400).send({ error: "Invalid image type!" });
//         }
//         imageUrl = await uploadImage(image[0], "images");
//       }
//       if (idProof) {
//         if (!isValidImageExtension(idProof[0].originalname)) {
//           return res
//             .status(400)
//             .send({ error: "Invalid image type in IdProof" });
//         }
//         idProofUrl = await uploadImage(idProof[0], "idProofs");
//       }

//       const now = moment().tz("Asia/Kolkata").format("DD/MM/YY");
//       const year = now.split("/")[2];

//       const prevEmployeeId = await employeesModel
//         .findOne()
//         .sort({ createdAt: -1 })
//         .limit(1);
//       let newEmployeeId;
//       if (prevEmployeeId) {
//         const idOfEmployee = prevEmployeeId.employeeId.substring(4);

//         const previousEmployeeId = parseFloat(idOfEmployee, 10) + 1;
//         const previousEmployeeIdFormatted = previousEmployeeId
//           .toString()
//           .padStart(2, "0");

//         newEmployeeId = `RS${year}${previousEmployeeIdFormatted}`;
//       } else [(newEmployeeId = `RS${year}01`)];

//       const newEmployee = new employeesModel({
//         employeeId: newEmployeeId,
//         phoneNumber,
//         nameOfEmployee,
//         dateOfBirth,
//         roleOfEmployee,
//         image: imageUrl,
//         idProof: idProofUrl,
//         email: email || null,
//         password,
//         status: "Active",
//       });
//       await newEmployee.save();

//       const newNotificationCount = new notificationCountModel({
//         type: "orderCount",
//         employeePhoneNumber: phoneNumber,
//         count: 0
//       });
//       await newNotificationCount.save();

//       return res.status(200).send({ message: "Employee added successfully!" });
//     } catch (error) {
//       console.error("Error:", error.message);
//       res
//         .status(500)
//         .send({ error: "Couldn't Add Employee now! Please try again later" });
//     }
//   }
// );

router.get("/viewEmployees/:role/:search?", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sortBy = req.query.sortBy || "nameOfEmployee";
  const sortOrder = req.query.sortOrder === "asc" ? -1 : 1;
  const searchString = req.params.search || "";
  const role = req.params.role;
  const email = req.query.email;
  try {
    let moduleAccess;
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "employee" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "employee"
      );
    }

    const skip = (page - 1) * limit;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const escapedSearchString = searchString.replace(/\+/g, "\\+");
    const searchRegex = new RegExp(escapedSearchString, "i");

    const query = {
      $or: [
        { phoneNumber: { $regex: searchRegex } },
        { employeeId: { $regex: searchRegex } },
        { nameOfEmployee: { $regex: searchRegex } },
        { roleOfEmployee: { $regex: searchRegex } },
        { status: { $regex: searchRegex } },
      ],
    };

    const response = await employeesModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort(sortOptions);

    const serialNumberStart = skip + 1;
    const serialNumbers = Array.from(
      { length: response.length },
      (_, index) => serialNumberStart + index
    );

    let employees, paginationInfo, totalItems, totalPages;
    if (role !== "Admin" && email) {
      employees = await employeesModel.findOne({ email });

      paginationInfo = {
        totalItems: 1,
        totalPages: 1,
        currentPage: page,
        startIndex: 1,
        endIndex: 1,
        itemsPerPage: 1,
      };
    } else {
      employees = response.map((employee, index) => {
        return {
          ...employee.toObject(),
          s_no: serialNumbers[index],
        };
      });

      totalItems = await employeesModel.countDocuments(query);
      totalPages = Math.ceil(totalItems / limit);

      paginationInfo = {
        totalItems,
        totalPages,
        currentPage: page,
        startIndex: skip + 1,
        endIndex: skip + employees.length,
        itemsPerPage: employees.length,
      };
    }

    return res
      .status(200)
      .send({ data: employees, pagination: paginationInfo, moduleAccess });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't View Employees now! Please try again later" });
  }
});

router.get("/viewEmployeeById/:id/:role", async (req, res) => {
  const { id } = req.params;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "employee" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    }

    const response = await employeesModel.findById(id);
    if (response) {
      return res.status(200).send({ data: response });
    } else {
      return res.status(404).send({ error: "Employee not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view employee now! Please try again later" });
  }
});

// // firebase
// router.patch(
//   "/updateEmployee/:id/:role",
//   upload.fields([{ name: "image" }, { name: "idProof" }]),
//   async (req, res) => {
//     const { id, role } = req.params;
//     let {
//       phoneNumber,
//       nameOfEmployee,
//       dateOfBirth,
//       roleOfEmployee,
//       email,
//       password,
//     } = req.body;
//     const { image, idProof } = req.files;

//     try {
//       const validUser = await moduleAccessModel.findOne({
//         roleOfEmployee: role,
//       });
//       if (
//         !validUser ||
//         !validUser.modules.some(
//           (module) =>
//             module.moduleName === "employee" && module.fullAccess === true
//         )
//       ) {
//         return res
//           .status(403)
//           .send({ error: "You have no access to do this!" });
//       }

//       if(role !== "Admin"){
//         if(nameOfEmployee || roleOfEmployee || email){
//           return res.status(403).send({error: "You have no access to do this!"});
//         }
//       }

//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       if(email){
//         if(!emailRegex.test(email)){
//           return res.status(400).send({error: "Invalid Email!"});
//         }
//       }

//       if (phoneNumber && !phoneNumber.startsWith("+91")) {
//         phoneNumber = `+91${phoneNumber}`;
//       }

//       const existEmployee = await employeesModel.findOne({ _id: id });
//       if (!existEmployee) {
//         return res.status(404).send({ error: "Employee not found!" });
//       }

//       if (roleOfEmployee) {
//         const validRole = await employeeRolesModel.findOne({
//           nameOfRole: roleOfEmployee,
//         });
//         if (!validRole) {
//           return res.status(400).send({ error: "Invalid Employee Role!" });
//         }
//       }

//       if (email && email !== existEmployee.email) {
//         const existEmail = await employeesModel.findOne({ email });
//         if (existEmail) {
//           return res.status(400).send({ error: "Email already exists!" });
//         }
//       }

//       const uploadFile = async (file, folder) => {
//         const fileName = `${Date.now()}_${file.originalname}`;
//         const fileUpload = admin
//           .storage()
//           .bucket()
//           .file(`${folder}/${fileName}`);

//         return new Promise((resolve, reject) => {
//           const stream = fileUpload.createWriteStream({
//             metadata: {
//               contentType: file.mimetype,
//             },
//           });

//           stream.on("error", (err) => {
//             console.error("Error uploading file:", err);
//             reject(err);
//           });

//           stream.on("finish", async () => {
//             await fileUpload.makePublic();
//             resolve(fileUpload.publicUrl());
//           });

//           stream.end(file.buffer);
//         });
//       };

//       let imageUrl, idProofUrl;
//       if (image) {
//         if(!isValidImageExtension(image[0].originalname)){
//           return res.status(400).send({error: "Invalid image type!"});
//         }
//         imageUrl = await uploadFile(image[0], "images");
//       }
//       if (idProof) {
//         if(!isValidImageExtension(idProof[0].originalname)){
//           return res.status(400).send({error: "Invalid image type in IdProof!"});
//         }
//         idProofUrl = await uploadFile(idProof[0], "idProofs");
//       }

//       const updatedEmployee = {
//         phoneNumber,
//         nameOfEmployee,
//         dateOfBirth,
//         roleOfEmployee,
//         email,
//         password,
//       };

//       if (imageUrl) updatedEmployee.image = imageUrl;
//       if (idProofUrl) updatedEmployee.idProof = idProofUrl;

//       const response = await employeesModel.findByIdAndUpdate(
//         id,
//         { $set: updatedEmployee },
//         { new: true }
//       );

//       return res
//         .status(200)
//         .send({ message: "Employee updated successfully!" });
//     } catch (error) {
//       console.error("Error:", error.message);
//       res
//         .status(500)
//         .send({
//           error: "Couldn't update employee now! Please try again later",
//         });
//     }
//   }
// );

// s3
router.patch(
  "/updateEmployee1/:id/:role",
  upload.fields([{ name: "image" }, { name: "idProof" }]),
  async (req, res) => {
    const { id, role } = req.params;
    let {
      phoneNumber,
      nameOfEmployee,
      dateOfBirth,
      roleOfEmployee,
      email,
      password,
    } = req.body;
    const { image, idProof } = req.files;

    try {
      const validUser = await moduleAccessModel.findOne({
        roleOfEmployee: role,
      });
      if (
        !validUser ||
        !validUser.modules.some(
          (module) =>
            module.moduleName === "employee" && module.fullAccess === true
        )
      ) {
        return res
          .status(403)
          .send({ error: "You have no access to do this!" });
      }

      if (role !== "Admin") {
        if (nameOfEmployee || roleOfEmployee || email || password) {
          return res
            .status(403)
            .send({ error: "You have no access to do this!" });
        }
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email) {
        if (!emailRegex.test(email)) {
          return res.status(400).send({ error: "Invalid Email!" });
        }
      }

      if (phoneNumber && !phoneNumber.startsWith("+91")) {
        phoneNumber = `+91${phoneNumber}`;
      }

      const existEmployee = await employeesModel.findOne({ _id: id });
      if (!existEmployee) {
        return res.status(404).send({ error: "Employee not found!" });
      }

      if (roleOfEmployee) {
        const validRole = await employeeRolesModel.findOne({
          nameOfRole: roleOfEmployee,
        });
        if (!validRole) {
          return res.status(400).send({ error: "Invalid Employee Role!" });
        }
      }

      if (email && email !== existEmployee.email) {
        const existEmail = await employeesModel.findOne({ email });
        if (existEmail) {
          return res.status(400).send({ error: "Email already exists!" });
        }
      }

      const uploadFile = async (file, folder) => {
        const fileName = `${Date.now()}_${file.originalname}`;
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `${folder}/${fileName}`,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: "public-read",
        };

        return new Promise((resolve, reject) => {
          s3.upload(params, (err, data) => {
            if (err) {
              console.error("Error uploading file:", err);
              reject(err);
            } else {
              resolve(data.Location);
            }
          });
        });
      };

      let imageUrl, idProofUrl;
      if (image) {
        if (!isValidImageExtension(image[0].originalname)) {
          return res.status(400).send({ error: "Invalid image type!" });
        }
        imageUrl = await uploadFile(image[0], "images");
      }
      if (idProof) {
        if (!isValidImageExtension(idProof[0].originalname)) {
          return res
            .status(400)
            .send({ error: "Invalid image type in IdProof!" });
        }
        idProofUrl = await uploadFile(idProof[0], "idProofs");
      }

      let updatedEmployee = {};

      if (imageUrl) updatedEmployee.image = imageUrl;
      if (idProofUrl) updatedEmployee.idProof = idProofUrl;
      if (phoneNumber) updatedEmployee.phoneNumber = phoneNumber;
      if (nameOfEmployee) {
        const existName = await employeesModel.findOne({ nameOfEmployee });
        if (existName) {
          return res
            .status(400)
            .send({ error: "Employee Name already exists!" });
        }
        updatedEmployee.nameOfEmployee = nameOfEmployee;
      }
      if (dateOfBirth) updatedEmployee.dateOfBirth = dateOfBirth;
      if (roleOfEmployee) updatedEmployee.roleOfEmployee = roleOfEmployee;
      if (email) {
        if (existEmployee.email === "admin01@gmail.com") {
          return res
            .status(400)
            .send({ error: "You can't update Email for this Admin!" });
        } else {
          updatedEmployee.email = email;
        }
      }
      if (password) {
        if (existEmployee.email === "admin01@gmail.com") {
          return res
            .status(400)
            .send({ error: "You can't update Password for this Admin!" });
        } else {
          updatedEmployee.password = password;
        }
      }

      await employeesModel.findByIdAndUpdate(
        id,
        { $set: updatedEmployee },
        { new: true }
      );

      return res
        .status(200)
        .send({ message: "Employee updated successfully!" });
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).send({
        error: "Couldn't update employee now! Please try again later",
      });
    }
  }
);

router.patch(
  "/updateEmployee/:id/:role",
  upload.fields([{ name: "image" }, { name: "idProof" }]),
  async (req, res) => {
    const { id, role } = req.params;
    let {
      phoneNumber,
      nameOfEmployee,
      dateOfBirth,
      roleOfEmployee,
      email,
      password,
    } = req.body;
    const { image, idProof } = req.files;

    try {
      const validUser = await moduleAccessModel.findOne({
        roleOfEmployee: role,
      });
      if (
        !validUser ||
        !validUser.modules.some(
          (module) =>
            module.moduleName === "employee" && module.fullAccess === true
        )
      ) {
        return res
          .status(403)
          .send({ error: "You have no access to do this!" });
      }

      if (role !== "Admin") {
        if (nameOfEmployee || roleOfEmployee || email || password) {
          return res
            .status(403)
            .send({ error: "You have no access to do this!" });
        }
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email) {
        if (!emailRegex.test(email)) {
          return res.status(400).send({ error: "Invalid Email!" });
        }
      }

      if (phoneNumber && !phoneNumber.startsWith("+91")) {
        phoneNumber = `+91${phoneNumber}`;
      }

      const existEmployee = await employeesModel.findOne({ _id: id });
      if (!existEmployee) {
        return res.status(404).send({ error: "Employee not found!" });
      }

      if (roleOfEmployee) {
        const validRole = await employeeRolesModel.findOne({
          nameOfRole: roleOfEmployee,
        });
        if (!validRole) {
          return res.status(400).send({ error: "Invalid Employee Role!" });
        }
      }

      if (email && email !== existEmployee.email) {
        const existEmail = await employeesModel.findOne({ email });
        if (existEmail) {
          return res.status(400).send({ error: "Email already exists!" });
        }
      }

      const uploadFile = async (file, folder) => {
        const fileName = `${Date.now()}_${file.originalname}`;
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `${folder}/${fileName}`,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: "public-read",
        };

        return new Promise((resolve, reject) => {
          s3.upload(params, (err, data) => {
            if (err) {
              console.error("Error uploading file:", err);
              reject(err);
            } else {
              resolve(data.Location);
            }
          });
        });
      };

      let imageUrl, idProofUrl;
      if (image) {
        if (!isValidImageExtension(image[0].originalname)) {
          return res.status(400).send({ error: "Invalid image type!" });
        }
        imageUrl = await uploadFile(image[0], "images");
      }
      if (idProof) {
        if (!isValidImageExtension(idProof[0].originalname)) {
          return res
            .status(400)
            .send({ error: "Invalid image type in IdProof!" });
        }
        idProofUrl = await uploadFile(idProof[0], "idProofs");
      }

      let updatedEmployee = {};

      if (imageUrl) updatedEmployee.image = imageUrl;
      if (idProofUrl) updatedEmployee.idProof = idProofUrl;
      if (phoneNumber) {
        updatedEmployee.phoneNumber = phoneNumber
       
        await notificationCountModel.findOneAndUpdate({type: "orderCount", 'details.employeePhoneNumber':existEmployee.phoneNumber}, {$set: {'details.$.employeePhoneNumber':phoneNumber}}, {new: true});
        await notificationCountModel.findOneAndUpdate({type: "quoteCount", 'details.employeePhoneNumber':existEmployee.phoneNumber}, {$set: {'details.$.employeePhoneNumber':phoneNumber}}, {new: true});
        await notificationCountModel.findOneAndUpdate({type: "userCount", 'details.employeePhoneNumber':existEmployee.phoneNumber}, {$set: {'details.$.employeePhoneNumber':phoneNumber}}, {new: true});
        await notificationCountModel.findOneAndUpdate({type: "supportCount", 'details.employeePhoneNumber':existEmployee.phoneNumber}, {$set: {'details.$.employeePhoneNumber':phoneNumber}}, {new: true});
        await notificationCountModel.findOneAndUpdate({type: "transactionCount", 'details.employeePhoneNumber':existEmployee.phoneNumber}, {$set: {'details.$.employeePhoneNumber':phoneNumber}}, {new: true});
        await notificationCountModel.findOneAndUpdate({type: "generalReviewCount", 'details.employeePhoneNumber':existEmployee.phoneNumber}, {$set: {'details.$.employeePhoneNumber':phoneNumber}}, {new: true});
        await notificationCountModel.findOneAndUpdate({type: "productReviewCount", 'details.employeePhoneNumber':existEmployee.phoneNumber}, {$set: {'details.$.employeePhoneNumber':phoneNumber}}, {new: true});
      };
      
      if (nameOfEmployee) {
        const existName = await employeesModel.findOne({ nameOfEmployee });
        if (existName) {
          return res
            .status(400)
            .send({ error: "Employee Name already exists!" });
        }
        updatedEmployee.nameOfEmployee = nameOfEmployee;
      }
      if (dateOfBirth) updatedEmployee.dateOfBirth = dateOfBirth;
      if (roleOfEmployee) updatedEmployee.roleOfEmployee = roleOfEmployee;
      if (email) {
        if (existEmployee.email === "admin01@gmail.com") {
          return res
            .status(400)
            .send({ error: "You can't update Email for this Admin!" });
        } else {
          updatedEmployee.email = email;
        }
      }
      if (password) {
        if (existEmployee.email === "admin01@gmail.com") {
          return res
            .status(400)
            .send({ error: "You can't update Password for this Admin!" });
        } else {
          updatedEmployee.password = password;
        }
      }

      await employeesModel.findByIdAndUpdate(
        id,
        { $set: updatedEmployee },
        { new: true }
      );

      return res
        .status(200)
        .send({ message: "Employee updated successfully!" });
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).send({
        error: "Couldn't update employee now! Please try again later",
      });
    }
  }
);

router.delete("/deleteEmployee/:id/:role", async (req, res) => {
  const { id } = req.params;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "employee" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const validEmployee = await employeesModel.findOne({ _id: id });
    if (!validEmployee) {
      return res.status(404).send({ error: "Employee not found!" });
    }

    if (validEmployee.email === "admin01@gmail.com") {
      return res.status(400).send({ error: "You can't delete this Admin!" });
    }

    const response = await employeesModel.findByIdAndDelete(id);
    if (response) {
      return res
        .status(200)
        .send({ message: "Employee deleted successfully!" });
    } else {
      return res.status(404).send({ error: "Employee not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't Delete Employee now! Please try again later" });
  }
});

router.post("/addEmployeeRole/:role", async (req, res) => {
  const { nameOfRole } = req.body;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "employee_role" && module.write === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    if (!nameOfRole) {
      return res.status(400).send({ error: "Please enter the name of Role!" });
    }

    const existRole = await employeeRolesModel.findOne({ nameOfRole });
    if (existRole) {
      return res.status(400).send({ error: "Role already exists!" });
    }

    const newEmployeeRole = new employeeRolesModel({
      nameOfRole,
    });
    await newEmployeeRole.save();

    const moduleAccess = new moduleAccessModel({
      roleOfEmployee: nameOfRole,
      modules: [
        {
          name: "Categories",
          moduleName: "category",
          read: false,
          write: false,
          fullAccess: false,
        },
        {
          name: "Coupons",
          moduleName: "coupon_code",
          read: false,
          write: false,
          fullAccess: false,
        },
        {
          name: "Employees List",
          moduleName: "employee",
          read: false,
          write: false,
          fullAccess: false,
        },
        {
          name: "Employee Roles",
          moduleName: "employee_role",
          read: false,
          write: false,
          fullAccess: false,
        },
        {
          name: "Repair & Service",
          moduleName: "device",
          read: false,
          write: false,
          fullAccess: false,
        },
        // { name: "Role Based Access", moduleName: "module_access", read: false, write: false, fullAccess: false },
        {
          name: "Orders",
          moduleName: "order",
          read: false,
          write: false,
          fullAccess: false,
        },
        ,
        {
          name: "Order Assigning",
          moduleName: "order_assigning",
          read: false,
          write: false,
          fullAccess: false,
        },
        {
          name: "Products Reviews",
          moduleName: "reviews_products",
          read: false,
          write: false,
          fullAccess: false,
        },
        {
          name: "Quotations",
          moduleName: "quotation_requests",
          read: false,
          write: false,
          fullAccess: false,
        },
        {
          name: "Refurbished Laptops",
          moduleName: "refurbished_laptop",
          read: false,
          write: false,
          fullAccess: false,
        },
        {
          name: "Rental Laptops",
          moduleName: "rental_laptop",
          read: false,
          write: false,
          fullAccess: false,
        },
        {
          name: "General Reviews",
          moduleName: "review",
          read: false,
          write: false,
          fullAccess: false,
        },
        {
          name: "General Settings",
          moduleName: "general_settings",
          read: false,
          write: false,
          fullAccess: false,
        },
        {
          name: "Credential Settings",
          moduleName: "credentials_settings",
          read: false,
          write: false,
          fullAccess: false,
        },
        {
          name: "Service Area",
          moduleName: "service_area",
          read: false,
          write: false,
          fullAccess: false,
        },
        {
          name: "Gallery",
          moduleName: "gallery",
          read: false,
          write: false,
          fullAccess: false,
        },
        {
          name: "Price Comparison",
          moduleName: "price_comparison",
          read: false,
          write: false,
          fullAccess: false,
        },
        {
          name: "Support",
          moduleName: "support",
          read: false,
          write: false,
          fullAccess: false,
        },
        {
          name: "Transaction",
          moduleName: "transaction",
          read: false,
          write: false,
          fullAccess: false,
        },
        {
          name: "User List",
          moduleName: "user",
          read: false,
          write: false,
          fullAccess: false,
        },
        {
          name: "Most Booked Services",
          moduleName: "mostBookedService",
          read: false,
          write: false,
          fullAccess: false,
        },
        {
          name: "Employee Reports",
          moduleName: "employee_reports",
          read: false,
          write: false,
          fullAccess: false,
        },
        {
          name: "Order Reports",
          moduleName: "order_reports",
          read: false,
          write: false,
          fullAccess: false,
        },
        {
          name: "User Reports",
          moduleName: "user_reports",
          read: false,
          write: false,
          fullAccess: false,
        },
        // {
        //   name: "Rental Product Reports",
        //   moduleName: "rental_reports",
        //   read: false,
        //   write: false,
        //   fullAccess: false,
        // },
        // {
        //   name: "Refurbished Product Reports",
        //   moduleName: "refurbished_reports",
        //   read: false,
        //   write: false,
        //   fullAccess: false,
        // },
        // {
        //   name: "Email",
        //   moduleName: "email",
        //   read: false,
        //   write: false,
        //   fullAccess: false,
        // },
        {
          name: "Email Templates",
          moduleName: "email_templates",
          read: false,
          write: false,
          fullAccess: false,
        },
        {
          name: "Price Chart",
          moduleName: "price_chart",
          read: false,
          write: false,
          fullAccess: false,
        },
        {
          name: "FAQ",
          moduleName: "faq",
          read: false,
          write: false,
          fullAccess: false,
        },
        {
          name: "About Us",
          moduleName: "about_us",
          read: false,
          write: false,
          fullAccess: false,
        },
        {
          name: "Custom Laptop Requests",
          moduleName: "custom_requests",
          read: false,
          write: false,
          fullAccess: false,
        },
      ],
    });
    await moduleAccess.save();

    return res
      .status(200)
      .send({ message: `New Role '${nameOfRole}' added successfully!` });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't Add Role now! Please try again later" });
  }
});

router.get("/viewEmployeeRoles/:role/:search?", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sortBy = req.query.sortBy || "nameOfRole";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const searchString = req.params.search || "";
  const role = req.params.role;
  try {
    let moduleAccess;
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "employee_role" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "employee_role"
      );
    }
    const skip = (page - 1) * limit;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const escapedSearchString = searchString.replace(/\+/g, "\\+");
    const searchRegex = new RegExp(escapedSearchString, "i");

    const query = { nameOfRole: { $regex: searchRegex } };

    const response = await employeeRolesModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort(sortOptions);

    const serialNumberStart = skip + 1;
    const serialNumbers = Array.from(
      { length: response.length },
      (_, index) => serialNumberStart + index
    );

    const employeesList = await Promise.all(
      response.map(async (role, index) => {
        const employees = await employeesModel.find({
          roleOfEmployee: role.nameOfRole,
        });
        const employeesName = employees
          .map((name) => name.nameOfEmployee)
          .sort();
        return {
          ...role.toObject(),
          s_no: serialNumbers[index],
          employeesName,
          totalEmployees: employeesName.length,
        };
      })
    );

    const totalItems = await employeeRolesModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const paginationInfo = {
      totalItems,
      totalPages,
      currentPage: page,
      startIndex: skip + 1,
      endIndex: skip + employeesList.length,
      itemsPerPage: employeesList.length,
    };

    return res
      .status(200)
      .send({ data: employeesList, pagination: paginationInfo, moduleAccess });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't View Roles now! Please try again later" });
  }
});

router.get("/viewEmployeeRoleById/:id/:role", async (req, res) => {
  const { id } = req.params;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "employee_role" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    }

    const response = await employeeRolesModel.findById(id);
    if (response) {
      return res.status(200).send({ data: response });
    } else {
      return res.status(404).send({ error: "Employee role not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't view employee role now! Please try again later",
    });
  }
});

router.patch("/updateEmployeeRole/:id/:role", async (req, res) => {
  const { id } = req.params;
  let { status } = req.body;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "employee_role" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    if (!status || !id) {
      return res.status(400).send({ error: "Please fill all fields!" });
    }

    const response = await employeeRolesModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );
    await response.save();

    return res.status(200).send({ message: `Role is set to ${status}!` });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't Update Role now! Please try again later" });
  }
});

router.post("/addModuleAccess/:role", async (req, res) => {
  const { roleOfEmployee, moduleName } = req.body;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "module_access" && module.write === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    let moduleAccess = await moduleAccessModel.findOne({ roleOfEmployee });
    if (moduleAccess) {
      moduleAccess.modules.push({
        moduleName,
        read: false,
        write: false,
        fullAccess: false,
      });
    } else {
      moduleAccess = new moduleAccessModel({
        roleOfEmployee,
        modules: [{ moduleName, read: false, write: false, fullAccess: false }],
      });
    }
    await moduleAccess.save();

    return res.status(200).send({ message: "Module created successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't Add Module now! Please try again later" });
  }
});

router.get("/viewModuleAccess/:roleOfEmployee/:role", async (req, res) => {
  const { roleOfEmployee } = req.params;
  const role = req.params.role;
  try {
    if (role !== "Admin") {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    }

    const moduleAccess = {
      moduleName: "module_access",
      read: true,
      write: true,
      fullAccess: true,
    };

    const response = await moduleAccessModel.findOne({ roleOfEmployee });

    if (response) {
      return res.status(200).send({ data: response, moduleAccess });
    } else {
      return res.status(404).send({ error: "No Access Found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't View Module Access now! Please try again later",
    });
  }
});

// router.patch(
//   "/updateModuleAccess/:roleOfEmployee/:moduleId/:role",
//   async (req, res) => {
//     const { roleOfEmployee, moduleId } = req.params;
//     const { read, write, fullAccess } = req.body;
//     const role = req.params.role;
//     // const {employeeRole} = req.query.employeeRole;
//     try {
//       if (role !== "Admin") {
//         return res
//           .status(403)
//           .send({ error: "You have no access to view this Page!" });
//       }

//       if (!roleOfEmployee || !moduleId) {
//         return res.status(400).send({ error: "Please fill all fields!" });
//       }

//       let updates = {};

//       if (read !== undefined) {
//         if (typeof read !== "boolean") {
//           return res
//             .status(400)
//             .send({ error: "The read value should be Boolean" });
//         }
//         updates["modules.$.read"] = read;
//       }

//       if (write !== undefined) {
//         if (typeof write !== "boolean") {
//           return res
//             .status(400)
//             .send({ error: "The write value should be Boolean" });
//         }
//         updates["modules.$.write"] = write;
//       }

//       if (fullAccess !== undefined) {
//         if (typeof fullAccess !== "boolean") {
//           return res
//             .status(400)
//             .send({ error: "The fullAccess value should be Boolean" });
//         }
//         updates["modules.$.fullAccess"] = fullAccess;
//       }

//       if (read === false) {
//         updates["modules.$.fullAccess"] = false;
//         updates["modules.$.read"] = false;
//         updates["modules.$.write"] = false;
//       }

//       if (write === true) {
//         updates["modules.$.read"] = true;
//         updates["modules.$.write"] = true;
//       }

//       if (fullAccess === true) {
//         updates["modules.$.fullAccess"] = true;
//         updates["modules.$.read"] = true;
//         updates["modules.$.write"] = true;
//       }

//       const validModule = await moduleAccessModel.findOne(
//         { roleOfEmployee: roleOfEmployee, "modules._id": moduleId },
//         { "modules.$": 1 }
//       );
//       if (validModule) {
//         await moduleAccessModel.updateOne(
//           { roleOfEmployee: roleOfEmployee, "modules._id": moduleId },
//           {
//             $set: updates,
//           }
//         );
//         return res
//           .status(200)
//           .send({ message: "Modules updated successfully!" });
//       } else {
//         return res.status(404).send({ error: "Module not found!" });
//       }
//     } catch (error) {
//       console.error("Error:", error.message);
//       res.status(500).send({
//         error: "Couldn't Update Module Access now! Please try again later",
//       });
//     }
//   }
// );

router.patch("/updateModuleAccess/:roleOfEmployee/:role", async (req, res) => {
  const { roleOfEmployee } = req.params;
  const role = req.params.role;
  const { modules } = req.body;
  try {
    if (role !== "Admin") {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const existUser = await moduleAccessModel.findOne({ roleOfEmployee });
    if (!existUser) {
      return res.status(404).send({ error: "Module not found!" });
    }

    modules.forEach(({ moduleName, read, write, fullAccess }) => {
      const validModule = existUser.modules.find(
        (module) => module.moduleName === moduleName
      );
      if (validModule) {
        validModule.read = read !== undefined ? read : validModule.read;
        validModule.write = write !== undefined ? write : validModule.write;
        validModule.fullAccess =
          fullAccess !== undefined ? fullAccess : validModule.fullAccess;
      }
    });
    await existUser.save();

    return res
      .status(200)
      .send({ message: "Module access updated successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't Update Module Access now! Please try again later",
    });
  }
});

router.get("/viewRoles/:role", async (req, res) => {
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "employee_role" && module.read === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const response = await moduleAccessModel.distinct("roleOfEmployee");

    if (response && response.length > 0) {
      return res.status(200).send({ data: response });
    } else {
      return res.status(404).send({ error: "No Roles Found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't View Employee Roles now! Please try again later",
    });
  }
});

router.get("/viewNotifications1/:role/:phoneNumber", async (req, res) => {
  const { role, phoneNumber } = req.params;
  try {
    let response;
    if (role !== "Admin") {
      if (phoneNumber) {
        if (!phoneNumber.startsWith("+91")) {
          phoneNumber = `+91${phoneNumber}`;
        }

        response = await notificationModel
          .find({ employeePhoneNumber: phoneNumber })
          .sort({ createdAt: -1 });
      } else {
        return res.status(400).send({ error: "Phone Number not provided!" });
      }
    } else {
      response = await notificationModel
        .find({ employeePhoneNumber: { $exists: false } })
        .sort({ createdAt: -1 });
    }

    return res.status(200).send({ data: response });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't View Notifications now! Please try again later",
    });
  }
});

router.get("/viewNotifications/:role/:phoneNumber", async (req, res) => {
  const { role, phoneNumber } = req.params;
  try {
    let response;
    if (role === "Technician") {
      if (phoneNumber) {
        if (!phoneNumber.startsWith("+91")) {
          phoneNumber = `+91${phoneNumber}`;
        }

        response = await notificationModel
          .find({ employeePhoneNumber: phoneNumber })
          .sort({ createdAt: -1 });
      } else {
        return res.status(400).send({ error: "Phone Number not provided!" });
      }
    } else {
      response = await notificationModel
        .find({ employeePhoneNumber: { $exists: false } })
        .sort({ createdAt: -1 });
    }

    return res.status(200).send({ data: response });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't View Notifications now! Please try again later",
    });
  }
});

// router.delete("/clearNotifications/:role", async (req, res) => {
//   const role = req.params.role;
//   const email = req.query.email;
//   try {
//     if (role !== "Admin") {
//       if (email) {
//         notifications = await notificationModel.deleteMany({
//           employeeEmail: email,
//         });
//       } else {
//         return res.status(400).send({ error: "Email not provided!" });
//       }
//     } else {
//       notifications = await notificationModel.deleteMany({
//         employeeEmail: { $exists: false },
//       });
//     }

//     if (notifications.deletedCount > 0) {
//       return res
//         .status(200)
//         .send({ message: "Notifications cleared successfully!" });
//     } else {
//       return res.status(404).send({ error: "Notifications not found!" });
//     }
//   } catch (error) {
//     console.error("Error:", error.message);
//     res.status(500).send({ error: "Internal Server Error" });
//   }
// });

router.delete("/clearNotifications/:role/:phoneNumber", async (req, res) => {
  const { role, phoneNumber } = req.params;
  try {
    if (role === "Technician") {
      if (phoneNumber) {
        notifications = await notificationModel.deleteMany({
          employeePhoneNumber: phoneNumber,
        });
      } else {
        return res.status(400).send({ error: "Phonenumber not provided!" });
      }
    } else {
      notifications = await notificationModel.deleteMany({
        employeePhoneNumber: { $exists: false },
      });
    }

    if (notifications.deletedCount > 0) {
      return res
        .status(200)
        .send({ message: "Notifications cleared successfully!" });
    } else {
      return res.status(404).send({ error: "Notifications not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

router.get("/trackEmployee/:role", async (req, res) => {
  const { employeeName } = req.query;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "employee" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    }
    const response = await orderModel
      .findOne({ assignedTo: employeeName })
      .sort({ updatedAt: -1 });

    if (!response) {
      return res
        .status(404)
        .send({ error: "No Orders Assigned for Employee!" });
    }

    return res.status(200).send({
      data: {
        workingOnOrderNo: response.requestId,
        orderStatus: response.status,
        customerLocationReached: response.customerLocationReached
          ? response.customerLocationReached
          : null,
      },
    });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't Track Employee now! Please try again later" });
  }
});

router.get("/viewLogo", async (req, res) => {
  try {
    const logo = await settingsModel.findOne({ type: "logo" });
    if (logo) {
      return res.status(200).send({ data: logo });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't View Logo now! Please try again later" });
  }
});

// // firebase
// router.post("/addGallery/:role", upload.array("images"), async (req, res) => {
//   let { location, address, landline, mobile } = req.body;
//   const images = req.files;
//   const role = req.params.role;
//   try {
//     const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
//     if (
//       !validUser ||
//       !validUser.modules.some(
//         (module) => module.moduleName === "gallery" && module.write === true
//       )
//     ) {
//       return res.status(403).send({ error: "You have no access to do this!" });
//     }

//     const existGallery = await galleryModel.findOne({ location, address });
//     if (existGallery) {
//       return res.status(400).send({ error: "Store Location already exists!" });
//     }

//     if(mobile){
//       if(!mobile.startsWith("+91")){
//         mobile = `+91${mobile}`
//       }
//     }

//     let imageUrls = [];

//     for (const image of images) {
//       if(!isValidImageExtension(image.originalname)){
//         return res.status(400).send({error: "Invalid image type!"});
//       }
//       const imageName = `${Date.now()}_${image.originalname}`;
//       const imageUpload = admin.storage().bucket().file(`images/${imageName}`);

//       await new Promise((resolve, reject) => {
//         const stream = imageUpload.createWriteStream({
//           metadata: {
//             contentType: image.mimetype,
//           },
//         });

//         stream.on("error", (err) => {
//           console.error("Error uploading file", err);
//           reject(err);
//         });

//         stream.on("finish", async () => {
//           await imageUpload.makePublic();
//           const imageUrl = imageUpload.publicUrl();
//           imageUrls.push(imageUrl);
//           resolve();
//         });

//         stream.end(image.buffer);
//       });
//     }

//     const newGallery = new galleryModel({
//       location,
//       address,
//       landline,
//       mobile,
//       images: imageUrls.map((url) => ({ image: url })),
//     });

//     await newGallery.save();

//     return res
//       .status(200)
//       .send({ message: "New Location Created Successfully!" });
//   } catch (error) {
//     console.error("Error:", error.message);
//     res
//       .status(500)
//       .send({ error: "Couldn't Add Gallery now! Please try again later" });
//   }
// });

// s3
router.post("/addGallery/:role", upload.array("images"), async (req, res) => {
  let { location, address, landline, mobile } = req.body;
  const images = req.files;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "gallery" && module.write === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const existGallery = await galleryModel.findOne({ location, address });
    if (existGallery) {
      return res.status(400).send({ error: "Store Location already exists!" });
    }

    if (mobile) {
      if (!mobile.startsWith("+91")) {
        mobile = `+91${mobile}`;
      }
    }

    let imageUrls = [];

    for (const image of images) {
      if (!isValidImageExtension(image.originalname)) {
        return res.status(400).send({ error: "Invalid image type!" });
      }
      const imageName = `${Date.now()}_${image.originalname}`;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `images/${imageName}`,
        Body: image.buffer,
        ContentType: image.mimetype,
        ACL: "public-read",
      };

      const uploadResult = await s3.upload(params).promise();
      imageUrls.push(uploadResult.Location);
    }

    const newGallery = new galleryModel({
      location,
      address,
      landline,
      mobile,
      images: imageUrls.map((url) => ({ image: url })),
    });

    await newGallery.save();

    return res
      .status(200)
      .send({ message: "New Location Created Successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't Add Gallery now! Please try again later" });
  }
});

router.get("/viewGallery/:role", async (req, res) => {
  const role = req.params.role;
  try {
    let moduleAccess;
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "gallery" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "gallery"
      );
    }

    const response = await galleryModel.find();

    if (response && response.length > 0) {
      return res.status(200).send({ data: response, moduleAccess });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't View Gallery now! Please try again later" });
  }
});

// // firebase
// router.patch(
//   "/updateGallery/:role/:galleryId/:imageId?",
//   upload.single("image"),
//   async (req, res) => {
//     const { galleryId, imageId } = req.params;
//     let { location, address, landline, mobile } = req.body;
//     const image = req.file;
//     const role = req.params.role;
//     try {
//       const validUser = await moduleAccessModel.findOne({
//         roleOfEmployee: role,
//       });
//       if (
//         !validUser ||
//         !validUser.modules.some(
//           (module) =>
//             module.moduleName === "gallery" && module.fullAccess === true
//         )
//       ) {
//         return res
//           .status(403)
//           .send({ error: "You have no access to do this!" });
//       }

//       if(mobile){
//         if(!mobile.startsWith("+91")){
//           mobile = `+91${mobile}`
//         }
//       }

//       const validGallery = await galleryModel.findById({ _id: galleryId });
//       if (!validGallery) {
//         return res.status(404).send({ error: "Gallery not found!" });
//       }

//       if (location) validGallery.location = location;
//       if (address) validGallery.address = address;
//       if (landline) validGallery.landline = landline;
//       if (mobile) validGallery.mobile = mobile;

//       if (image) {
//         const validImageIndex = validGallery.images.findIndex(
//           (img) => img._id.toString() === imageId
//         );
//         if (validImageIndex === -1) {
//           return res.status(404).send({ error: "Image not found!" });
//         }

//         const imageName = `${Date.now()}_${image.originalname}`;
//         const imageUpload = admin
//           .storage()
//           .bucket()
//           .file(`images/${imageName}`);

//           const fileType = image.originalname.split(".").pop().toLowerCase();
//           if(fileType !== "jpg" && fileType !== "jpeg" && fileType !== "png" && fileType !== "svg" && fileType !== "webp"){
//             return res.status(400).send({error: "Invalid image type!"});
//           }

//         await new Promise((resolve, reject) => {
//           const stream = imageUpload.createWriteStream({
//             metadata: {
//               contentType: image.mimetype,
//             },
//           });

//           stream.on("error", (err) => {
//             console.error("Error uploading file:", err);
//             reject(err);
//           });

//           stream.on("finish", async () => {
//             await imageUpload.makePublic();
//             const newImageUrl = imageUpload.publicUrl();
//             validGallery.images[validImageIndex].image = newImageUrl;
//             resolve();
//           });

//           stream.end(image.buffer);
//         });
//       }

//       await validGallery.save();

//       return res.status(200).send({ message: "Gallery updated successfully!" });
//     } catch (error) {
//       console.error("Error:", error.message);
//       res
//         .status(500)
//         .send({ error: "Couldn't Update Gallery now! Please try again later" });
//     }
//   }
// );

// s3
router.patch(
  "/updateGallery/:role/:galleryId/:imageId?",
  upload.single("image"),
  async (req, res) => {
    const { galleryId, imageId } = req.params;
    let { location, address, landline, mobile } = req.body;
    const image = req.file;
    const role = req.params.role;
    try {
      const validUser = await moduleAccessModel.findOne({
        roleOfEmployee: role,
      });
      if (
        !validUser ||
        !validUser.modules.some(
          (module) =>
            module.moduleName === "gallery" && module.fullAccess === true
        )
      ) {
        return res
          .status(403)
          .send({ error: "You have no access to do this!" });
      }

      if (mobile) {
        if (!mobile.startsWith("+91")) {
          mobile = `+91${mobile}`;
        }
      }

      const validGallery = await galleryModel.findById({ _id: galleryId });
      if (!validGallery) {
        return res.status(404).send({ error: "Gallery not found!" });
      }

      if (location) validGallery.location = location;
      if (address) validGallery.address = address;
      if (landline) validGallery.landline = landline;
      if (mobile) validGallery.mobile = mobile;

      if (image) {
        const validImageIndex = validGallery.images.findIndex(
          (img) => img._id.toString() === imageId
        );
        if (validImageIndex === -1) {
          return res.status(404).send({ error: "Image not found!" });
        }

        const imageName = `${Date.now()}_${image.originalname}`;

        const fileType = image.originalname.split(".").pop().toLowerCase();
        if (
          fileType !== "jpg" &&
          fileType !== "jpeg" &&
          fileType !== "png" &&
          fileType !== "svg" &&
          fileType !== "webp"
        ) {
          return res.status(400).send({ error: "Invalid image type!" });
        }

        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `images/${imageName}`,
          Body: image.buffer,
          ContentType: image.mimetype,
          ACL: "public-read",
        };

        const uploadResult = await s3.upload(params).promise();

        validGallery.images[validImageIndex].image = uploadResult.Location;
      }

      await validGallery.save();

      return res.status(200).send({ message: "Gallery updated successfully!" });
    } catch (error) {
      console.error("Error:", error.message);
      res
        .status(500)
        .send({ error: "Couldn't Update Gallery now! Please try again later" });
    }
  }
);

router.delete("/deleteGallery/:galleryId/:role", async (req, res) => {
  const { galleryId, role } = req.params;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "gallery" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const response = await galleryModel.findOneAndDelete({ _id: galleryId });

    if (response) {
      return res.status(200).send({ message: "Gallery deleted successfully!" });
    } else {
      return res.status(400).send({ error: "Store Location not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't Delete Gallery now! Please try again later" });
  }
});

// // firebase
// router.post(
//   "/addGalleryImage/:galleryId/:role",
//   upload.single("image"),
//   async (req, res) => {
//     const { galleryId, role } = req.params;
//     const image = req.file;
//     try {
//       const validUser = await moduleAccessModel.findOne({
//         roleOfEmployee: role,
//       });
//       if (
//         !validUser ||
//         !validUser.modules.some(
//           (module) => module.moduleName === "gallery" && module.write === true
//         )
//       ) {
//         return res
//           .status(403)
//           .send({ error: "You have no access to do this!" });
//       }

//       const validGallery = await galleryModel.findById(galleryId);
//       if (!validGallery) {
//         return res.status(404).send({ error: "Gallery not found!" });
//       }

//       let newImageUrl;
//       if(image){
//         const imageName = `${Date.now()}_${image.originalname}`;
//         const imageUpload = admin.storage().bucket().file(`images/${imageName}`);

//         const fileType = image.originalname.split(".").pop().toLowerCase();
//         if(fileType !== "jpg" && fileType !== "jpeg" && fileType !== "png" && fileType !== "svg" && fileType !== "webp"){
//           return res.status(400).send({error: "Invalid image type!"});
//         }
//         await new Promise((resolve, reject) => {
//           const stream = imageUpload.createWriteStream({
//             metadata: {
//               contentType: image.mimetype,
//             },
//           });

//           stream.on("error", (err) => {
//             console.error("Error uploading file:", err);
//             reject(err);
//           });

//           stream.on("finish", async () => {
//             await imageUpload.makePublic();
//             newImageUrl = imageUpload.publicUrl();
//             console.log(newImageUrl);
//             resolve();
//           });
//           stream.end(image.buffer);
//         });
//       }

//       validGallery.images.push({ image: newImageUrl });
//       await validGallery.save();

//       return res.status(200).send({ message: "Gallery updated successfully!" });
//     } catch (error) {
//       console.error("Error:", error.message);
//       res
//         .status(500)
//         .send({ error: "Couldn't Update Gallery now! Please try again later" });
//     }
//   }
// );

// s3
router.post(
  "/addGalleryImage/:galleryId/:role",
  upload.single("image"),
  async (req, res) => {
    const { galleryId, role } = req.params;
    const image = req.file;
    try {
      const validUser = await moduleAccessModel.findOne({
        roleOfEmployee: role,
      });
      if (
        !validUser ||
        !validUser.modules.some(
          (module) => module.moduleName === "gallery" && module.write === true
        )
      ) {
        return res
          .status(403)
          .send({ error: "You have no access to do this!" });
      }

      const validGallery = await galleryModel.findById(galleryId);
      if (!validGallery) {
        return res.status(404).send({ error: "Gallery not found!" });
      }

      let newImageUrl;
      if (image) {
        const imageName = `${Date.now()}_${image.originalname}`;

        const fileType = image.originalname.split(".").pop().toLowerCase();
        if (
          fileType !== "jpg" &&
          fileType !== "jpeg" &&
          fileType !== "png" &&
          fileType !== "svg" &&
          fileType !== "webp"
        ) {
          return res.status(400).send({ error: "Invalid image type!" });
        }
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `images/${imageName}`,
          Body: image.buffer,
          ContentType: image.mimetype,
          ACL: "public-read",
        };

        const uploadResult = await s3.upload(params).promise();
        newImageUrl = uploadResult.Location;
      }

      validGallery.images.push({ image: newImageUrl });
      await validGallery.save();

      return res.status(200).send({ message: "Gallery updated successfully!" });
    } catch (error) {
      console.error("Error:", error.message);
      res
        .status(500)
        .send({ error: "Couldn't Update Gallery now! Please try again later" });
    }
  }
);

router.delete(
  "/removeGalleryImage/:role/:galleryId/:imageId",
  async (req, res) => {
    const { role, galleryId, imageId } = req.params;
    try {
      const validUser = await moduleAccessModel.findOne({
        roleOfEmployee: role,
      });
      if (
        !validUser ||
        !validUser.modules.some(
          (module) =>
            module.moduleName === "gallery" && module.fullAccess === true
        )
      ) {
        return res
          .status(403)
          .send({ error: "You have no access to do this!" });
      }

      const validGallery = await galleryModel.findOne({ _id: galleryId });
      if (!validGallery) {
        return res.status(404).send({ error: "Gallery not found!" });
      }

      const validImageIndex = validGallery.images.findIndex(
        (img) => img._id.toString() === imageId
      );
      if (validImageIndex === -1) {
        return res.status(404).send({ error: "Image not found!" });
      }

      validGallery.images.splice(validImageIndex, 1);
      await validGallery.save();

      return res.status(200).send({ message: "Image removed successfully!" });
    } catch (error) {
      console.error("Error:", error.message);
      res
        .status(500)
        .send({ error: "Couldn't Delete Image now! Please try again later" });
    }
  }
);

router.get("/verifyAccess/:role/:phoneNumber?", async (req, res) => {
  let { role, phoneNumber } = req.params;
  try {
    let newOrderCount;
    if (!phoneNumber.startsWith("+91")) {
      phoneNumber = `+91${phoneNumber}`;
    }
    if (role === "Technician") {
      const validEmployee = await employeesModel.findOne({ phoneNumber });
      if (!validEmployee) {
        return res.status(404).send({ error: "Employee not found!" });
      }
      const orderCountss = await notificationCountModel.findOne({
        type: "orderCount",
        "details.employeePhoneNumber": phoneNumber,
      });
      const orderCount = orderCountss.details.find(
        (emp) => emp.employeePhoneNumber === phoneNumber
      );

      const currentOrderCount =
        (await orderModel.countDocuments({
          assignedTo: validEmployee.nameOfEmployee,
        })) || 0;

      const newOrderCountings = currentOrderCount - orderCount.count;
      if (newOrderCountings === currentOrderCount) {
        newOrderCount = 0;
      } else {
        newOrderCount = newOrderCountings;
      }
    } else {
      const orderCountss = await notificationCountModel.findOne({
        type: "orderCount",
        "details.employeePhoneNumber": phoneNumber,
      });
      const currentOrderCount = (await orderModel.countDocuments()) || 0;
      const orderCount = orderCountss.details.find(
        (emp) => emp.employeePhoneNumber === phoneNumber
      );

      const newOrderCountings = currentOrderCount - orderCount.count;
      if (newOrderCountings === currentOrderCount) {
        newOrderCount = 0;
      } else {
        newOrderCount = newOrderCountings;
      }
    }

    var newQuoteCount;
    const quoteCountss = await notificationCountModel.findOne({
      type: "quoteCount",
      "details.employeePhoneNumber": phoneNumber,
    });
    const currentQuoteCount = (await quotationModel.countDocuments()) || 0;
    const quoteCount = quoteCountss.details.find(
      (emp) => emp.employeePhoneNumber === phoneNumber
    );
    const newQuoteCountings = currentQuoteCount - quoteCount.count;
    if (newQuoteCountings === currentQuoteCount) {
      newQuoteCount = 0;
    } else {
      newQuoteCount = newQuoteCountings;
    }

    var newUserCount;
    const userCountss = await notificationCountModel.findOne({
      type: "userCount",
      "details.employeePhoneNumber": phoneNumber,
    });
    const currentUserCount = (await usersModel.countDocuments()) || 0;
    const userCount = userCountss.details.find(
      (emp) => emp.employeePhoneNumber === phoneNumber
    );
    const newUserCountings = currentUserCount - userCount.count;
    if (newUserCountings === currentUserCount) {
      newUserCount = 0;
    } else {
      newUserCount = newUserCountings;
    }

    var newGeneralReviewCount;
    const generalReviewCountss = await notificationCountModel.findOne({
      type: "generalReviewCount",
      "details.employeePhoneNumber": phoneNumber,
    });
    const currentGeneralReviewCount = (await reviewModel.countDocuments()) || 0;
    const generalReviewCount = generalReviewCountss.details.find(
      (emp) => emp.employeePhoneNumber === phoneNumber
    );
    const newGeneralReviewCountings =
      currentGeneralReviewCount - generalReviewCount.count;
    if (newGeneralReviewCountings === currentGeneralReviewCount) {
      newGeneralReviewCount = 0;
    } else {
      newGeneralReviewCount = newGeneralReviewCountings;
    }

    var newProductReviewCount;
    const productReviewCountss = await notificationCountModel.findOne({
      type: "productReviewCount",
      "details.employeePhoneNumber": phoneNumber,
    });
    const currentProductReviewCount =
      (await productReviewModel.countDocuments()) || 0;
    const productReviewCount = productReviewCountss.details.find(
      (emp) => emp.employeePhoneNumber === phoneNumber
    );
    const newProductReviewCountings =
      currentProductReviewCount - productReviewCount.count;
    if (newProductReviewCountings === currentProductReviewCount) {
      newProductReviewCount = 0;
    } else {
      newProductReviewCount = newProductReviewCountings;
    }

    const reviewCounts = newGeneralReviewCount + newProductReviewCount;

    var newSupportCount;
    const supportCountss = await notificationCountModel.findOne({
      type: "supportCount",
      "details.employeePhoneNumber": phoneNumber,
    });
    const currentSupportCount = (await supportFormModel.countDocuments()) || 0;
    const supportCount = supportCountss.details.find(
      (emp) => emp.employeePhoneNumber === phoneNumber
    );
    const newSupportCountings = currentSupportCount - supportCount.count;
    if (newSupportCountings === currentSupportCount) {
      newSupportCount = 0;
    } else {
      newSupportCount = newSupportCountings;
    }

    // var newTransactionCount;
    // const transactionCountss = await notificationCountModel.findOne({type: "transactionCount", "details.employeePhoneNumber": phoneNumber});
    // const currentTransactionCount = await transactionModel.countDocuments() || 0;
    // const transactionCount = transactionCountss.details.find((emp) => emp.employeePhoneNumber === phoneNumber);
    // const newTransactionCountings = currentTransactionCount - transactionCount.count;
    // if(newTransactionCountings === currentTransactionCount){
    //   newTransactionCount = 0
    // } else {
    //   newTransactionCount = newTransactionCountings
    // }

    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });

    if (validUser) {
      const validUserModules = validUser.modules.map((module) => {
        if (module.moduleName === "order") {
          return {
            moduleName: module.moduleName,
            read: module.read,
            count: newOrderCount,
          };
        }
        if (module.moduleName === "quotation_requests") {
          return {
            moduleName: module.moduleName,
            read: module.read,
            count: newQuoteCount,
          };
        }
        if (module.moduleName === "user") {
          return {
            moduleName: module.moduleName,
            read: module.read,
            count: newUserCount,
          };
        }
        if (module.moduleName === "support") {
          return {
            moduleName: module.moduleName,
            read: module.read,
            count: newSupportCount,
          };
        }
        if (module.moduleName === "transaction") {
          return {
            moduleName: module.moduleName,
            read: module.read,
            // count: newTransactionCount
          };
        }
        if (module.moduleName === "review") {
          return {
            moduleName: module.moduleName,
            read: module.read,
            count: newGeneralReviewCount,
          };
        }
        if (module.moduleName === "reviews_products") {
          return {
            moduleName: module.moduleName,
            read: module.read,
            count: newProductReviewCount,
          };
        }
        return {
          moduleName: module.moduleName,
          read: module.read,
        };
      });

      const reviews = validUser.modules.find(
        (module) => module.moduleName === "review" && module.read === true
      );
      const productReviews = validUser.modules.find(
        (module) =>
          module.moduleName === "reviews_products" && module.read === true
      );

      let review = false;
      if (
        (reviews && reviews.read) ||
        (productReviews && productReviews.read)
      ) {
        review = true;
      }

      const issues = validUser.modules.find(
        (module) => module.moduleName === "device" && module.read === true
      );
      const rentals = validUser.modules.find(
        (module) =>
          module.moduleName === "rental_laptop" && module.read === true
      );
      const refurbisheds = validUser.modules.find(
        (module) =>
          module.moduleName === "refurbished_laptop" && module.read === true
      );

      let subCategory = false;
      if (
        (issues && issues.read) ||
        (rentals && rentals.read) ||
        (refurbisheds && refurbisheds.read)
      ) {
        subCategory = true;
      }

      const general = validUser.modules.find(
        (module) =>
          module.moduleName === "general_settings" && module.read === true
      );
      const credentials = validUser.modules.find(
        (module) =>
          module.moduleName === "credentials_settings" && module.read === true
      );
      const serviceArea = validUser.modules.find(
        (module) => module.moduleName === "service_area" && module.read === true
      );
      const mostBookedService = validUser.modules.find(
        (module) =>
          module.moduleName === "mostBookedService" && module.read === true
      );

      let settings = false;
      if (
        (general && general.read) ||
        (credentials && credentials.read) ||
        (mostBookedService && mostBookedService.read) ||
        (serviceArea && serviceArea.read)
      ) {
        settings = true;
      }

      const employeeReports = validUser.modules.find(
        (module) =>
          module.moduleName === "employee_reports" && module.read === true
      );
      const orderReports = validUser.modules.find(
        (module) =>
          module.moduleName === "order_reports" && module.read === true
      );
      const categoryReports = validUser.modules.find(
        (module) =>
          module.moduleName === "category_reports" && module.read === true
      );
      const rentalProducts = validUser.modules.find(
        (module) =>
          module.moduleName === "rental_reports" && module.read === true
      );
      const refurbishedProducts = validUser.modules.find(
        (module) =>
          module.moduleName === "refurbished_reports" && module.read === true
      );

      let reports = false;
      if (
        (employeeReports && employeeReports.read) ||
        (orderReports && orderReports.read) ||
        (categoryReports && categoryReports.read) ||
        (rentalProducts && rentalProducts.read) ||
        (refurbishedProducts && refurbishedProducts.read)
      ) {
        reports = true;
      }

      if (role === "Admin") {
        validUserModules.push(
          {
            moduleName: "module_access",
            read: true,
          },
          {
            moduleName: "employee_reports",
            read: true,
          },
          {
            moduleName: "order_reports",
            read: true,
          },
          {
            moduleName: "category_reports",
            read: true,
          },
          {
            moduleName: "rental_reports",
            read: true,
          },
          {
            moduleName: "refurbished_reports",
            read: true,
          }
        );
      }

      validUserModules.push({
        moduleName: "reviews",
        read: review,
        count: reviewCounts,
      });

      validUserModules.push({
        moduleName: "dashboard",
        read: true,
      });

      validUserModules.push({
        moduleName: "subcategory",
        read: subCategory,
      });

      validUserModules.push({
        moduleName: "settings",
        read: settings,
      });

      validUserModules.push({
        moduleName: "reports",
        read: reports,
      });

      return res.status(200).send({ data: validUserModules });
    } else {
      return res.status(400).send({ message: "User not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

router.post(
  "/addBulkRentalLaptop/:role",
  upload1.fields([{ name: "excelFile", maxCount: 1 }]),
  async (req, res) => {
    const role = req.params.role;
    try {
      const validUser = await moduleAccessModel.findOne({
        roleOfEmployee: role,
      });

      if (
        !validUser ||
        !validUser.modules.some(
          (module) =>
            module.moduleName === "rental_laptop" && module.write === true
        )
      ) {
        return res
          .status(403)
          .send({ error: "You have no access to do this!" });
      }

      if (req.files.excelFile) {
        const file = req.files.excelFile[0];
        const fileType = file.originalname.split(".").pop().toLowerCase();
        if (fileType !== "xlsx" && fileType !== "xls") {
          return res.status(400).send({ error: "Invalid file type!" });
        }

        const workbook = xlsx.read(file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet);

        const headers = xlsx.utils.sheet_to_json(sheet, { header: 1 })[0];

        const requiredHeaders = [
          "amountFor6Months",
          "brand",
          "model",
          "processor",
          "ram",
          "screenSize",
          "storage",
          "color",
          "operatingSystem",
          "description",
          "addInCarousel",
        ];

        if (rows.length === 0) {
          return res.status(400).send({ error: "No Data Found in Excel!" });
        }

        const missingHeaders = requiredHeaders.filter(
          (header) => !headers.includes(header)
        );
        console.log(missingHeaders.length);

        if (missingHeaders.length > 0) {
          return res
            .status(400)
            .send({ error: `Incorrect excel file uploaded!` });
        }

        const rentalLaptops = rows.map((row) => ({
          amountFor6Months: row.amountFor6Months,
          brand: row.brand,
          model: row.model,
          processor: row.processor,
          ram: row.ram,
          screenSize: row.screenSize,
          storage: row.storage,
          color: row.color,
          operatingSystem: row.operatingSystem,
          description: row.description,
          addInCarousel: row.addInCarousel,
          type: "Rental",
          status: "Active",
        }));

        await rentLaptopModel.insertMany(rentalLaptops);

        return res
          .status(200)
          .send({ message: "Laptops added in Rental Section successfully!" });
      } else {
        const {
          amountFor6Months,
          brand,
          model,
          processor,
          ram,
          screenSize,
          storage,
          color,
          operatingSystem,
          description,
          addInCarousel,
        } = req.body;

        if (
          !brand ||
          !model ||
          !processor ||
          !ram ||
          !screenSize ||
          !storage ||
          !color ||
          !operatingSystem ||
          !description
        ) {
          return res.status(400).send({ error: "Please fill all fields!" });
        }

        const newRentalLaptop = new rentLaptopModel({
          amountFor6Months: amountFor6Months || null,
          brand,
          model,
          processor,
          ram,
          screenSize,
          storage,
          color,
          operatingSystem,
          description,
          addInCarousel: false,
          status: "Active",
        });

        await newRentalLaptop.save();

        return res
          .status(200)
          .send({ message: "Laptop added in Rental Section successfully!" });
      }
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).send({
        error: "Couldn't add laptop now! Please try again later",
      });
    }
  }
);

router.post(
  "/addBulkRefurbishedLaptop/:role",
  upload1.fields([{ name: "excelFile", maxCount: 1 }]),
  async (req, res) => {
    const role = req.params.role;
    try {
      const validUser = await moduleAccessModel.findOne({
        roleOfEmployee: role,
      });

      if (
        !validUser ||
        !validUser.modules.some(
          (module) =>
            module.moduleName === "refurbished_laptop" && module.write === true
        )
      ) {
        return res
          .status(403)
          .send({ error: "You have no access to do this!" });
      }

      if (req.files.excelFile) {
        const file = req.files.excelFile[0];
        const fileType = file.originalname.split(".").pop().toLowerCase();
        if (fileType !== "xlsx" && fileType !== "xls") {
          return res.status(400).send({ error: "Invalid file type!" });
        }

        const workbook = xlsx.read(file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet);

        const headers = xlsx.utils.sheet_to_json(sheet, { header: 1 })[0];

        const requiredHeaders = [
          "brand",
          "model",
          "processor",
          "ram",
          "screenSize",
          "storage",
          "color",
          "operatingSystem",
          "description",
          "addInCarousel",
        ];

        if (rows.length === 0) {
          return res.status(400).send({ error: "No Data Found in Excel!" });
        }

        const missingHeaders = requiredHeaders.filter(
          (header) => !headers.includes(header)
        );

        if (missingHeaders.length > 0) {
          return res
            .status(400)
            .send({ error: "Incorrect excel file uploaded!" });
        }

        const refurbishedLaptops = rows.map((row) => ({
          amount: row.amount || null,
          brand: row.brand,
          model: row.model,
          processor: row.processor,
          ram: row.ram,
          screenSize: row.screenSize,
          storage: row.storage,
          color: row.color,
          operatingSystem: row.operatingSystem,
          description: row.description,
          addInCarousel: row.addInCarousel,
          type: "Refurbished",
          status: "Active",
        }));

        await refurbishedLaptopModel.insertMany(refurbishedLaptops);

        return res.status(200).send({
          message: "Laptops added in Refurbished Section successfully!",
        });
      } else {
        const {
          amount,
          brand,
          model,
          processor,
          ram,
          screenSize,
          storage,
          color,
          operatingSystem,
          description,
          addInCarousel,
        } = req.body;

        if (
          !brand ||
          !model ||
          !processor ||
          !ram ||
          !screenSize ||
          !storage ||
          !color ||
          !operatingSystem ||
          !description
        ) {
          return res.status(400).send({ error: "Please fill all fields!" });
        }

        const newRefurbishedLaptop = new rentLaptopModel({
          amount: amount || null,
          brand,
          model,
          processor,
          ram,
          screenSize,
          storage,
          color,
          operatingSystem,
          description,
          addInCarousel: false,
          status: "Active",
        });

        await newRefurbishedLaptop.save();

        return res.status(200).send({
          message: "Laptop added in Refurbished Section successfully!",
        });
      }
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).send({
        error: "Couldn't add laptop now! Please try again later",
      });
    }
  }
);

router.post("/addMostBookedService/:role", async (req, res) => {
  const { role } = req.params;
  const { serviceName, applicableSystems } = req.body;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "mostBookedService" && module.write === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    if (!serviceName) {
      return res.status(400).send({ error: "Please fill all fields!" });
    }

    const existService = await mostBookedServiceModel.findOne({ serviceName });
    if (existService) {
      return res.status(400).send({ error: "Service already exists!" });
    }

    if (applicableSystems && !Array.isArray(applicableSystems)) {
      return res
        .status(400)
        .send({ error: "Applicable systems should be an array!" });
    }

    const newService = new mostBookedServiceModel({
      serviceName,
      applicableSystems: applicableSystems || [],
    });
    await newService.save();

    return res
      .status(200)
      .send({ message: "New Service Created Successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't Add Service now! Please try again later" });
  }
});

router.get("/viewMostBookedService/:role/:search?", async (req, res) => {
  const role = req.params.role;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const searchString = req.params.search || "";
  try {
    let moduleAccess;
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "mostBookedService" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "mostBookedService"
      );
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const searchRegex = new RegExp(searchString, "i");
    const query = {
      $or: [{ serviceName: { $regex: searchRegex } }],
    };

    const response = await mostBookedServiceModel
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const totalItems = await mostBookedServiceModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = page;

    const paginationInfo = {
      totalItems,
      totalPages,
      currentPage,
      startIndex: skip + 1,
      endIndex: skip + response.length,
      itemsPerPage: response.length,
    };

    const serialNumberStart = skip + 1;
    const serialNumbers = Array.from(
      { length: response.length },
      (_, index) => serialNumberStart + index
    );

    const services = response.map((service, index) => {
      return {
        ...service.toObject(),
        s_no: serialNumbers[index],
      };
    });

    return res
      .status(200)
      .send({ data: services, pagination: paginationInfo, moduleAccess });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view services now! Please try again later" });
  }
});

router.patch("/updateMostBookedService/:id/:role", async (req, res) => {
  const { id, role } = req.params;
  const { serviceName, applicableSystems } = req.body;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "mostBookedService" &&
          module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    if (applicableSystems && !Array.isArray(applicableSystems)) {
      return res
        .status(400)
        .send({ error: "Applicable systems should be an array!" });
    }

    let updatedData = {};
    if (serviceName) {
      const existService = await mostBookedServiceModel.findOne({
        serviceName,
      });
      if (existService) {
        return res.status(400).send({ error: "Service name already exists!" });
      }
      updatedData.serviceName = serviceName;
    }
    if (applicableSystems) updatedData.applicableSystems = applicableSystems;

    const response = await mostBookedServiceModel.findOneAndUpdate(
      { _id: id },
      { $set: updatedData },
      { new: true }
    );
    if (response) {
      return res.status(200).send({ message: "Service updated successfully!" });
    } else {
      return res.status(404).send({ error: "Service not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't update service now! Please try again later" });
  }
});

router.delete("/deleteMostBookedService/:id/:role", async (req, res) => {
  const { id, role } = req.params;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "mostBookedService" &&
          module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const response = await mostBookedServiceModel.findOneAndDelete({ _id: id });
    if (response) {
      return res.status(200).send({ message: "Service deleted successfully!" });
    } else {
      return res.status(404).send({ error: "Service not found!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't delete service now! Please try again later" });
  }
});

// router.get("/barChart", async (req, res) => {
//   try {
//     // const { dayFilter } = req.query;

//     // let startDate;
//     // if (dayFilter === "lastWeek") {
//     //   startDate = moment().subtract(7, "days").toDate();
//     // } else if (dayFilter === "lastMonth") {
//     //   startDate = moment().subtract(1, "months").toDate();
//     // } else if (dayFilter === "lastYear") {
//     //   startDate = moment().subtract(1, "years").toDate();
//     // }

//     const pipeline = [];

//     // if (startDate) {
//     //   pipeline.push({
//     //     $match: {
//     //       createdAt: { $gte: startDate }
//     //     }
//     //   });
//     // }

//     pipeline.push({
//       $group: {
//         _id: { $substr: ["$createdAt", 0, 10] },
//         total: { $sum: 1 },
//         pending: {
//           $sum: {
//             $cond: [{ $eq: ["$status", "Pending"] }, 1, 0]
//           }
//         },
//         inProcess: {
//           $sum: {
//             $cond: [{ $eq: ["$status", "In Process"] }, 1, 0]
//           }
//         },
//         completed: {
//           $sum: {
//             $cond: [{ $eq: ["$status", "Completed"] }, 1, 0]
//           }
//         }
//       }
//     });

//     pipeline.push({
//       $sort: { _id: 1 }
//     });

//     const aggregatedData = await orderModel.aggregate(pipeline);

//     const response = aggregatedData.map((data) => ({
//       date: data._id,
//       total: data.total,
//       pending: data.pending,
//       inProcess: data.inProcess,
//       completed: data.completed
//     }));

//     return res.status(200).send({ data: response });

//   } catch (error) {
//     console.error("Error:", error.message);
//     res.status(500).send({ error: "Couldn't view barchart now! Please try again later" });
//   }
// });

router.get("/barChart", async (req, res) => {
  try {
    const { filter = "dayWise" } = req.query;
    const pipeline = [];

    let groupBy;
    if (filter === "dayWise") {
      groupBy = { $substr: ["$createdAt", 0, 10] };
    } else if (filter === "monthWise") {
      groupBy = { $substr: ["$createdAt", 0, 7] };
    } else if (filter === "yearWise") {
      groupBy = { $substr: ["$createdAt", 0, 4] };
    } else {
      return res.status(400).send({ error: "Invalid filter type!" });
    }

    pipeline.push({
      $group: {
        _id: groupBy,
        total: { $sum: 1 },
        pending: {
          $sum: {
            $cond: [{ $eq: ["$status", "Pending"] }, 1, 0],
          },
        },
        inProcess: {
          $sum: {
            $cond: [{ $eq: ["$status", "In Process"] }, 1, 0],
          },
        },
        completed: {
          $sum: {
            $cond: [{ $eq: ["$status", "Completed"] }, 1, 0],
          },
        },
        inTransit: {
          $sum: {
            $cond: [{ $eq: ["$status", "In Transit"] }, 1, 0],
          },
        },
        cancelled: {
          $sum: {
            $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0],
          },
        },
      },
    });

    pipeline.push({
      $sort: { _id: 1 },
    });

    const aggregatedData = await orderModel.aggregate(pipeline);

    const response = aggregatedData.map((data) => ({
      date: data._id,
      total: data.total,
      pending: data.pending,
      inProcess: data.inProcess,
      completed: data.completed,
      inTransit: data.inTransit,
      cancelled: data.cancelled,
    }));

    return res.status(200).send({ data: response });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view barchart now! Please try again later" });
  }
});

router.post("/clearUser/:phoneNumber", async (req, res) => {
  let { phoneNumber } = req.params;
  try {
    if (!phoneNumber.startsWith("+91")) {
      phoneNumber = `+91${phoneNumber}`;
    }

    const deleteResults = {};

    deleteResults.user = await usersModel.findOneAndDelete({ phoneNumber });
    deleteResults.transaction = await transactionModel.deleteMany({
      phoneNumber,
    });
    deleteResults.support = await supportFormModel.deleteMany({ phoneNumber });
    deleteResults.service_requests = await serviceRequestsModel.deleteMany({
      phoneNumber,
    });
    deleteResults.rental_requests = await rentalRequestsModel.deleteMany({
      phoneNumber,
    });
    deleteResults.refurbished_requests =
      await refurbishedRequestsModel.deleteMany({ phoneNumber });
    deleteResults.reviews = await reviewModel.deleteMany({ phoneNumber });
    deleteResults.review_products = await productReviewModel.deleteMany({
      phoneNumber,
    });
    deleteResults.quotation_requests = await quotationModel.deleteMany({
      phoneNumber,
    });
    deleteResults.orders = await orderModel.deleteMany({ phoneNumber });
    deleteResults.employees = await employeesModel.deleteMany({ phoneNumber });
    deleteResults.carts = await cartModel.deleteMany({ phoneNumber });
    deleteResults.coupons = await couponCodeModel.updateMany(
      { "redemeedUsers.phoneNumber": phoneNumber },
      { $pull: { redemeedUsers: { phoneNumber } } }
    );
    deleteResults.rentalReviews = await rentLaptopModel.updateMany(
      { "reviews.phoneNumber": phoneNumber },
      { $pull: { reviews: { phoneNumber } } }
    );
    deleteResults.refurbishedReviews = await refurbishedLaptopModel.updateMany(
      { "reviews.phoneNumber": phoneNumber },
      { $pull: { reviews: { phoneNumber } } }
    );
    deleteResults.notificationCounts = await notificationCountModel.updateMany(
      { type: "orderCount"},
      { $pull: {details: {employeePhoneNumber: phoneNumber } }}
    );
    deleteResults.notificationCounts = await notificationCountModel.updateMany(
      { type: "quoteCount"},
      { $pull: {details: {employeePhoneNumber: phoneNumber } }}
    );
    deleteResults.notificationCounts = await notificationCountModel.updateMany(
      { type: "userCount"},
      { $pull: {details: {employeePhoneNumber: phoneNumber } }}
    );
    deleteResults.notificationCounts = await notificationCountModel.updateMany(
      { type: "supportCount"},
      { $pull: {details: {employeePhoneNumber: phoneNumber } }}
    );
    deleteResults.notificationCounts = await notificationCountModel.updateMany(
      { type: "generalReviewCount"},
      { $pull: {details: {employeePhoneNumber: phoneNumber } }}
    );
    deleteResults.notificationCounts = await notificationCountModel.updateMany(
      { type: "productReviewCount"},
      { $pull: {details: {employeePhoneNumber: phoneNumber } }}
    );

    const notDeleted = Object.entries(deleteResults)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    if (notDeleted && notDeleted.length > 0) {
      return res.status(400).send({
        error: `Couldn't delete the following details: ${notDeleted.join(
          ", "
        )}`,
      });
    }

    return res
      .status(200)
      .send({ message: "User details removed successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't clear user details now! Please try again later",
    });
  }
});

router.get("/viewEmailTemplates/:role/:search?", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const searchString = req.params.search || "";
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    let moduleAccess;
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "email_templates" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "email_templates"
      );
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const searchRegex = new RegExp(searchString, "i");

    let query = {
      $or: [
        { templateName: { $regex: searchRegex } },
        { subject: { $regex: searchRegex } },
      ],
    };

    const response = await emailTemplateModel
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const serialNumberStart = skip + 1;
    const serialNumbers = Array.from(
      { length: response.length },
      (_, index) => serialNumberStart + index
    );

    const emailTemplates = response.map((template, index) => {
      return {
        ...template.toObject(),
        s_no: serialNumbers[index],
      };
    });

    const totalItems = await emailTemplateModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = page;

    const paginationInfo = {
      totalItems,
      totalPages,
      currentPage,
      startIndex: skip + 1,
      endIndex: skip + response.length,
      itemsPerPage: response.length,
    };

    return res
      .status(200)
      .send({ data: emailTemplates, pagination: paginationInfo, moduleAccess });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't view email templates now! Please try again later",
    });
  }
});

router.post("/addEmailTemplate/:role", async (req, res) => {
  const { templateName, subject, body } = req.body;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "email_templates" && module.write === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    if (!templateName || !subject || !body) {
      return res.status(400).send({ error: "Please fill all fields!" });
    }

    const existTemplate = await emailTemplateModel.findOne({ templateName });
    if (existTemplate) {
      return res.status(400).send({ error: "Template already exists!" });
    }

    const newTemplate = new emailTemplateModel({
      templateName,
      subject,
      body,
    });
    await newTemplate.save();

    return res
      .status(200)
      .send({ message: "New Email Template Created Successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't add email template now! Please try again later",
    });
  }
});

router.patch("/updateEmailTemplate/:id/:role", async (req, res) => {
  const { templateName, subject, body } = req.body;
  const { id, role } = req.params;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "email_templates" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const validTemplate = await emailTemplateModel.findOne({ _id: id });
    if (!validTemplate) {
      return res.status(404).send({ error: "Template not found!" });
    }

    await emailTemplateModel.findOneAndUpdate(
      { _id: id },
      { $set: { templateName, subject, body } },
      { new: true }
    );

    return res
      .status(200)
      .send({ message: "Email Template Updated Successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't update template now! Please try again later",
    });
  }
});

router.delete("/deleteEmailTemplate/:id/:role", async (req, res) => {
  const { id, role } = req.params;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "email_templates" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const validTemplate = await emailTemplateModel.findOne({ _id: id });
    if (!validTemplate) {
      return res.status(404).send({ error: "Template not found!" });
    }

    await emailTemplateModel.findOneAndDelete({ _id: id });

    return res
      .status(200)
      .send({ message: "Email Template Deleted Successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't delete template now! Please try again later",
    });
  }
});

router.get("/viewSentEmails/:role/:search?", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const searchString = req.params.search || "";
  const role = req.params.role;
  try {
    if (role !== "Admin") {
      return res
        .status(403)
        .send({ error: "You have no access view this Page!" });
    }

    const skip = (page - 1) * limit;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const escapedSearchString = searchString.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
    const searchRegex = new RegExp(escapedSearchString, "i");
    let query = {
      $or: [
        { phoneNumber: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { templateName: { $regex: searchRegex } },
      ],
    };

    const response = await emailModel
      .find(query)
      .skip(skip)
      .sort(sortOptions)
      .limit(limit);

    const serialNumberStart = skip + 1;
    const serialNumbers = Array.from(
      { length: response.length },
      (_, index) => serialNumberStart + index
    );

    const emailData = response.map((chart, index) => {
      return {
        ...chart.toObject(),
        s_no: serialNumbers[index],
      };
    });

    const totalItems = await emailModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = page;

    const paginationInfo = {
      totalItems,
      totalPages,
      currentPage,
      startIndex: skip + 1,
      endIndex: skip + response.length,
      itemsPerPage: response.length,
    };

    return res
      .status(200)
      .send({ data: emailData, pagination: paginationInfo });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view emails now! Please try again later" });
  }
});

// router.post("/sendEmail/:role", async (req, res) => {
//   let { phoneNumber, email, templateName } = req.body;
//   const role = req.params.role;
//   try {
//     if (role !== "Admin") {
//       return res.status(403).send({ error: "You have no access to do this!" });
//     }
//     if (!phoneNumber.startsWith("+91")) {
//       phoneNumber = `+91${phoneNumber}`;
//     }

//     const validTemplate = await emailTemplateModel.findOne({ templateName });
//     if (!validTemplate) {
//       return res.status(404).send({ error: "Template not found!" });
//     }

//     const gmailUserName = await settingsModel.findOne({
//       credentialsKey: "GMAIL_USER",
//     });
//     const gmailPassword = await settingsModel.findOne({
//       credentialsKey: "GMAIL_PASSWORD",
//     });

//     const transporter = nodemailer.createTransport({
//       service: "Gmail",
//       auth: {
//         user: gmailUserName.credentialsValue,
//         pass: gmailPassword.credentialsValue,
//       },
//     });

//     const socialMediaLinks = await settingsModel.find({
//       credentialsKey: {
//         $in: ["facebook", "whatsapp", "twitter", "instagram", "linkedin"],
//       },
//     });

//     const socialMediaMap = socialMediaLinks.reduce((acc, item) => {
//       acc[item.credentialsKey] = item.credentialsValue;
//       return acc;
//     }, {});

//     const message = {
//       from: gmailUserName.credentialsValue,
//       to: email,
//       subject: validTemplate.subject,
//       text: `
// ${validTemplate.body}

// Follow Us On:
// Facebook:  ${socialMediaMap.facebook || "N/A"}
// Twitter:   ${socialMediaMap.twitter || "N/A"}
// Whatsapp:  ${socialMediaMap.whatsapp || "N/A"}
// Instagram: ${socialMediaMap.instagram || "N/A"}
// LinkedIn:  ${socialMediaMap.linkedin || "N/A"}
//       `,
//     };

//     transporter.sendMail(message);

//     const newEmail = new emailModel({
//       phoneNumber,
//       email,
//       templateName,
//     });

//     await newEmail.save();

//     return res.status(200).send({ message: "Email sent successfully!" });
//   } catch (error) {
//     console.error("Error:", error.message);
//     res
//       .status(500)
//       .send({ error: "Couldn't send email now! Please try again later" });
//   }
// });

router.post("/sendEmail/:role", async (req, res) => {
  let { phoneNumber, email, templateName } = req.body;
  const role = req.params.role;
  try {
    if (role !== "Admin") {
      return res.status(403).send({ error: "You have no access to do this!" });
    }
    if (phoneNumber) {
      if (!phoneNumber.startsWith("+91")) {
        phoneNumber = `+91${phoneNumber}`;
      }
    }

    const validTemplate = await emailTemplateModel.findOne({ templateName });
    if (!validTemplate) {
      return res.status(404).send({ error: "Template not found!" });
    }

    const gmailUserName = await settingsModel.findOne({
      credentialsKey: "GMAIL_USER",
    });
    const gmailPassword = await settingsModel.findOne({
      credentialsKey: "GMAIL_PASSWORD",
    });

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: gmailUserName.credentialsValue,
        pass: gmailPassword.credentialsValue,
      },
    });

    const socialMediaLinks = await settingsModel.find({
      credentialsKey: {
        $in: ["facebook", "whatsapp", "twitter", "instagram", "linkedin"],
      },
    });

    const socialMediaMap = socialMediaLinks.reduce((acc, item) => {
      acc[item.credentialsKey] = item.credentialsValue;
      return acc;
    }, {});

    const messageTemplate = `
${validTemplate.body}

Follow Us On:
Facebook:  ${socialMediaMap.facebook || "N/A"}
Twitter:   ${socialMediaMap.twitter || "N/A"}
Whatsapp:  ${socialMediaMap.whatsapp || "N/A"}
Instagram: ${socialMediaMap.instagram || "N/A"}
LinkedIn:  ${socialMediaMap.linkedin || "N/A"}
      `;

    if (email === "all") {
      const users = await usersModel.find();
      for (const user of users) {
        const userEmail = user.email;
        const message = {
          from: gmailUserName.credentialsValue,
          to: userEmail,
          subject: validTemplate.subject,
          text: messageTemplate,
        };

        transporter.sendMail(message);

        const newEmail = new emailModel({
          phoneNumber: user.phoneNumber,
          email: userEmail,
          templateName,
          type: "group",
        });

        await newEmail.save();
      }
    } else {
      const message = {
        from: gmailUserName.credentialsValue,
        to: email,
        subject: validTemplate.subject,
        text: messageTemplate,
      };

      transporter.sendMail(message);

      const newEmail = new emailModel({
        phoneNumber,
        email,
        templateName,
        type: "individual",
      });

      await newEmail.save();
    }

    return res.status(200).send({ message: "Email sent successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't send email now! Please try again later" });
  }
});

router.delete("/deleteEmail/:id/:role", async (req, res) => {
  const { id, role } = req.params;
  try {
    if (role !== "Admin") {
      return res.status(403).send({ error: "You have no access to do this!" });
    }
    const response = await emailModel.findOneAndDelete({ _id: id });
    if (!response) {
      return res.status(404).send({ error: "Email not found!" });
    }

    return res.status(200).send({ message: "Email deleted successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't delete email now! Please try again later" });
  }
});

router.get("/viewTemplateDetails/:role/:templateName", async (req, res) => {
  const { templateName, role } = req.params;
  try {
    if (role !== "Admin") {
      return res
        .status(403)
        .send({ error: "You have no access to view this!" });
    }

    const validTemplate = await emailTemplateModel.findOne({ templateName });
    if (!validTemplate) {
      return res.status(404).send({ error: "Template not found!" });
    }

    return res.status(200).send({ data: validTemplate });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view email now! Please try again later" });
  }
});

router.get("/viewTemplates/:role", async (req, res) => {
  const role = req.params.role;
  try {
    if (role !== "Admin") {
      return res.status(403).send({ error: "You have no access view this!" });
    }
    const response = await emailTemplateModel
      .distinct("templateName")
      .sort({ templateName: 1 });
    if (response && response.length > 0) {
      return res.status(200).send({ data: response });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view templates now! Please try again later" });
  }
});

// router.get("/viewPriceChart/:role/:search?", async(req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const sortBy = req.query.sortBy || "createdAt";
//   const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
//   const searchString = req.params.search || "";
//   const role = req.params.role;
//   try {
//     const validUser = await moduleAccessModel.findOne({roleOfEmployee: role});
//     let moduleAccess;
//     if(!validUser || !validUser.modules.some(module => module.moduleName === "price_chart" && module.read === true)){
//       return res.status(403).send({error: "You have no access to view this page!"})
//     } else {
//       moduleAccess = validUser.modules.find(module => module.moduleName === "price_chart");
//     }
//       const skip = (page - 1) * limit;

//       const sortOptions = {};
//       sortOptions[sortBy] = sortOrder;

//       const searchRegex = new RegExp(searchString, 'i');
//       let query = {
//         $or: [
//           {component: {$regex: searchRegex}},
//           {'details.description': {$regex: searchRegex}},
//         ]
//       }

//       const response = await priceChartModel.find(query).skip(skip).sort(sortOptions).limit(limit);

//       const serialNumberStart = skip + 1;
//       const serialNumbers = Array.from(
//         {length: response.length},
//       (_, index) => serialNumberStart + index
//       );

//       const priceChart = response.map((chart, index) => {
//         return {
//           ...chart.toObject(),
//           s_no: serialNumbers[index]
//         }
//       });

//       const totalItems = await priceChartModel.countDocuments(query);
//       const totalPages = Math.ceil(totalItems/limit);
//       const currentPage = page;

//       const paginationInfo = {
//         totalItems,
//         totalPages,
//         currentPage,
//         startIndex: skip + 1,
//         endIndex: skip + response.length,
//         itemsPerPage: response.length
//       }

//       return res.status(200).send({data: priceChart, pagination: paginationInfo, moduleAccess});
//     }catch(error){
//       console.error("Error:", error.message);
//       res.status(500).send({error: "Couldn't view price chart now! Please try again later"});
//     }
// });

router.get("/viewPriceChart/:role/:search?", async (req, res) => {
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const searchString = req.params.search || "";
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    let moduleAccess;
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "price_chart" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "price_chart"
      );
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const searchRegex = new RegExp(searchString, "i");
    let query = {
      $or: [
        { description: { $regex: searchRegex } },
        { component: { $regex: searchRegex } },
      ],
    };

    const response = await priceChartModel.find(query).sort(sortOptions);

    const groupedResponse = response.reduce((acc, item) => {
      const component = item.component;
      if (!acc[component]) {
        acc[component] = [];
      }

      acc[component].push({
        _id: item._id,
        component: item.component,
        description: item.description,
        serviceCharge: item.serviceCharge,
        labourCharge: item.labourCharge,
      });
      return acc;
    }, {});

    return res.status(200).send({ data: groupedResponse, moduleAccess });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view price chart now! Please try again later" });
  }
});

router.get("/viewProductComponents/:role/:search?", async (req, res) => {
  const searchString = req.params.search || "";
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "price_chart" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this page!" });
    }

    const searchRegex = new RegExp(searchString, "i");
    let query = {
      $or: [{ component: { $regex: searchRegex } }],
    };

    const response = await priceChartModel
      .distinct("component", query)
      .sort({ component: 1 });
    return res.status(200).send({ data: response });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

router.post("/addNewProductPrice/:role", async (req, res) => {
  const { component, description, serviceCharge, labourCharge } = req.body;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "price_chart" && module.write === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    if (!component || !description || !serviceCharge || !labourCharge) {
      return res.status(400).send({ error: "Please fill all fields!" });
    }

    const existComponent = await priceChartModel.findOne({
      component,
      description,
      serviceCharge,
      labourCharge,
    });
    if (existComponent) {
      return res.status(400).send({ error: "Product already exists!" });
    }

    const newProduct = new priceChartModel({
      component,
      description,
      serviceCharge,
      labourCharge,
    });
    await newProduct.save();

    return res.status(200).send({ message: "New Product Added Successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't add new product now! Please try again later" });
  }
});

router.patch("/updateProductPrice/:id/:role", async (req, res) => {
  const { id, role } = req.params;
  const { component, description, serviceCharge, labourCharge } = req.body;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "price_chart" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const validProduct = await priceChartModel.findOneAndUpdate(
      { _id: id },
      { $set: { component, description, serviceCharge, labourCharge } },
      { new: true }
    );
    if (!validProduct) {
      return res.status(404).send({ error: "Product not found!" });
    }

    return res.status(200).send({ message: "Product updated successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't update product now! Please try again later" });
  }
});

router.delete("/deleteProductPrice/:id/:role", async (req, res) => {
  const { id, role } = req.params;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "price_chart" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const validProduct = await priceChartModel.findOneAndDelete({ _id: id });
    if (!validProduct) {
      return res.status(404).send({ error: "Product not found!" });
    }

    return res.status(200).send({ message: "Product deleted successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't delete product now! Please try again later" });
  }
});

// router.get("/viewFaq/:role/:search?", async(req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const searchString = req.params.search || "";
//   const sortBy = req.query.sortBy || "createdAt";
//   const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
//   const role = req.params.role;
//   try {
//     const validUser = await moduleAccessModel.findOne({roleOfEmployee: role});
//     let moduleAccess;
//     if(!validUser || !validUser.modules.some(module => module.moduleName === "faq" && module.read === true)){
//       return res.status(403).send({error: "You have no access to view this page!"})
//     } else {
//       moduleAccess = validUser.modules.find(module => module.moduleName === "faq");
//     }

//     const skip = (page - 1) * limit;
//     const sortOptions = {};
//     sortOptions[sortBy] = sortOrder;

//     const searchRegex = new RegExp(searchString, 'i');
//     let query = {
//       $or: [
//         {question: {$regex: searchRegex}},
//         {answer: {$regex: searchRegex}},
//         {subtitle: {$regex: searchRegex}},
//       ]
//     };

//     const response = await faqModel.find(query).skip(skip).limit(limit).sort(sortOptions);

//     const serialNumberStart = skip + 1;
//     const serialNumbers = Array.from(
//       {length: response.length},
//       (_, index) => serialNumberStart + index
//     );

//     const faq = response.map((faq, index) => {
//       return {
//         ...faq.toObject(),
//         s_no: serialNumbers[index]
//       }
//     });

//     const totalItems = await faqModel.countDocuments(query);
//     const totalPages = Math.ceil(totalItems/limit);
//     const currentPage = page;

//     const paginationInfo = {
//       totalItems,
//       totalPages,
//       currentPage,
//       startIndex: skip + 1,
//       endIndex: skip + response.length,
//       itemsPerPage: response.length
//     };

//     return res.status(200).send({data: faq, pagination: paginationInfo, moduleAccess});
//   }catch(error){
//     console.error("Error:", error.message);
//     res.status(500).send({error: "Couldn't view FAQ now! Please try again later"});
//   }
// });

router.get("/viewFaq/:role/:search?", async (req, res) => {
  const searchString = req.params.search || "";
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    let moduleAccess;
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "faq" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "faq"
      );
    }

    const searchRegex = new RegExp(searchString, "i");
    let query = {
      $or: [
        { question: { $regex: searchRegex } },
        { answer: { $regex: searchRegex } },
        { subtitle: { $regex: searchRegex } },
      ],
    };

    const response = await faqModel.find(query);

    const groupedResponse = response.reduce((acc, item) => {
      const subtitle = item.subtitle;
      if (!acc[subtitle]) {
        acc[subtitle] = [];
      }

      acc[subtitle].push({
        _id: item._id,
        subtitle: item.subtitle,
        question: item.question,
        answer: item.answer,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
      return acc;
    }, {});

    return res.status(200).send({ data: groupedResponse, moduleAccess });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view FAQ now! Please try again later" });
  }
});

router.get("/viewFaqSubtitles/:role/:search?", async (req, res) => {
  const searchString = req.params.search || "";
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "faq" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this page!" });
    }

    const searchRegex = new RegExp(searchString, "i");
    let query = {
      $or: [{ subtitle: { $regex: searchRegex } }],
    };

    const response = await faqModel
      .distinct("subtitle", query)
      .sort({ subtitle: 1 });
    return res.status(200).send({ data: response });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

router.post("/addFaq/:role", async (req, res) => {
  const { subtitle, question, answer } = req.body;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "faq" && module.write === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    if (!subtitle || !question || !answer) {
      return res.status(400).send({ error: "Please fill all fields!" });
    }

    const existFaq = await faqModel.findOne({ subtitle, question, answer });
    if (existFaq) {
      return res.status(400).send({ error: "FAQ already exists!" });
    }

    const newFaq = new faqModel({
      subtitle,
      question,
      answer,
    });
    await newFaq.save();

    return res.status(200).send({ message: "FAQ added successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't add FAQ now! Please try again later" });
  }
});

router.patch("/updateFaq/:id/:role", async (req, res) => {
  const { id, role } = req.params;
  const { subtitle, question, answer } = req.body;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "faq" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const existFaq = await faqModel.findOneAndUpdate(
      { _id: id },
      { $set: { subtitle, question, answer } },
      { new: true }
    );
    if (!existFaq) {
      return res.status(404).send({ error: "FAQ not found!" });
    }

    return res.status(200).send({ message: "FAQ updated successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't update FAQ now! Please try again later" });
  }
});

router.delete("/deleteFaq/:id/:role", async (req, res) => {
  const { id, role } = req.params;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "faq" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const existFaq = await faqModel.findOneAndDelete({ _id: id });
    if (!existFaq) {
      return res.status(404).send({ error: "FAQ not found!" });
    }

    return res.status(200).send({ message: "FAQ deleted successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't delete FAQ now! Please try again later" });
  }
});

router.get("/aboutUs/:role", async (req, res) => {
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    let moduleAccess;
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "about_us" && module.read === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "about_us"
      );
    }
    const response = await aboutUsModel.find();

    return res.status(200).send({ data: response, moduleAccess });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// // firebase
// router.patch("/updateAboutUs/:role", upload.fields([{ name: 'image', maxCount: 1 }, { name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }, { name: 'image3', maxCount: 1 }]), async (req, res) => {
//   const { type, id, position, title, text } = req.body;
//   const role = req.params.role;
//   try {
//       const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
//       if (!validUser || !validUser.modules.some(module => module.moduleName === "about_us" && module.fullAccess === true)) {
//           return res.status(403).send({ error: "You have no access to do this!" });
//       }

//       if(req.files['image']){
//         const image = req.files['image'][0];
//         if(type === "section1"){
//           const validImage = image.originalname.split(".").pop().toLowerCase();
//           if(validImage !== "jpg" && validImage !== "jpeg" && validImage !== "png" && validImage !== "svg" && validImage !== "webp" && validImage !== "gif" && validImage !== "mp4" &&validImage !== "mov" && validImage !== "mkv" && validImage !== "webm" && validImage !== "avi"){
//             return res.status(400).send({error: "Invalid file type!"})
//           }
//         } else {
//           const validImage = image.originalname.split(".").pop().toLowerCase();
//           if(validImage !== "jpg" && validImage !== "jpeg" && validImage !== "png" && validImage !== "svg" && validImage !== "webp"){
//             return res.status(400).send({error: "Invalid file type!"})
//           }
//         }
//       }

//       if(req.files['image1']){
//         const image = req.files['image1'][0];
//           const validImage = image.originalname.split(".").pop().toLowerCase();
//           if(validImage !== "jpg" && validImage !== "jpeg" && validImage !== "png" && validImage !== "svg" && validImage !== "webp"){
//             return res.status(400).send({error: "Invalid file type!"})
//           }
//       }
//       if(req.files['image2']){
//         const image = req.files['image2'][0];

//           const validImage = image.originalname.split(".").pop().toLowerCase();
//           if(validImage !== "jpg" && validImage !== "jpeg" && validImage !== "png" && validImage !== "svg" && validImage !== "webp"){
//             return res.status(400).send({error: "Invalid file type!"})
//           }
//       }
//       if(req.files['image3']){
//         const image = req.files['image3'][0];
//           const validImage = image.originalname.split(".").pop().toLowerCase();
//           if(validImage !== "jpg" && validImage !== "jpeg" && validImage !== "png" && validImage !== "svg" && validImage !== "webp"){
//             return res.status(400).send({error: "Invalid file type!"})
//           }
//       }

//       let imageUrl = null;
//       if (req.files['image']) {
//         const image = req.files['image'][0];
//       const imageName = `${Date.now()}_${image.originalname}`;
//       const imageUpload = admin.storage().bucket().file(`images/${imageName}`);

//       await new Promise((resolve, reject) => {
//         const stream = imageUpload.createWriteStream({
//           metadata: {
//             contentType: image.mimetype,
//           }
//         });

//         stream.on("error", (err)=> {
//           console.error("Error uploading file:", err);
//           reject(err);
//         });

//         stream.on("finish", async() => {
//           await imageUpload.makePublic();
//           imageUrl = imageUpload.publicUrl();
//           console.log(imageUrl);
//           resolve();
//         });

//         stream.end(image.buffer);
//       });
//     }

//       if (type === "section1") {
//         if(id || position || req.files['image1'] || req.files['image2'] || req.files['image3'] ){
//           return res.status(400).send({error: "Invalid Credentials Received!"});
//         }
//           const validSection = await aboutUsModel.findOne({ type: "section1" });
//           if (!validSection) {
//               return res.status(404).send({ error: "Section not found!" });
//           }
//           await aboutUsModel.findOneAndUpdate({ type: "section1" }, { $set: { title, text, image: imageUrl || validSection.image } }, { new: true });
//       }

//       if (type === "section2") {
//         if(position || req.files['image1'] || req.files['image2'] || req.files['image3'] ){
//           return res.status(400).send({error: "Invalid Credentials Received!"});
//         }

//           const validSection = await aboutUsModel.findOne({ type: "section2", 'section2._id': id });
//           if (!validSection) {
//               return res.status(404).send({ error: "Section not found!" });
//           }
//           await aboutUsModel.findOneAndUpdate({ type: "section2", 'section2._id': id}, { $set: { 'section2.$.title': title, 'section2.$.text': text, 'section2.$.image': imageUrl || validSection.image } }, { new: true });
//       }

//       if (type === "section3") {
//         if(id || position || req.files['image']){
//           return res.status(400).send({error: "Invalid Credentials Received!"});
//         }

//           const imageFields = ['image1', 'image2', 'image3'];
//           if(imageFields){
//           const imageUrls = await Promise.all(imageFields.map(async (imageField) => {
//               if (req.files[imageField]) {
//                   const image = req.files[imageField][0];
//                   const imageName = `${Date.now()}_${image.originalname}`;
//                   const imageUpload = admin.storage().bucket().file(`images/${imageName}`);

//                   return new Promise((resolve, reject) => {
//                       const stream = imageUpload.createWriteStream({
//                           metadata: {
//                               contentType: image.mimetype
//                           }
//                       });

//                       stream.on("error", (err) => {
//                           console.error("Error uploading file:", err);
//                           reject(err);
//                       });

//                       stream.on("finish", async () => {
//                           await imageUpload.makePublic();
//                           resolve(imageUpload.publicUrl());
//                       });

//                       stream.end(image.buffer);
//                   });
//               } else {
//                   return null;
//               }
//           }));

//           const validSection = await aboutUsModel.findOne({ type: "section3" });
//           if (!validSection) {
//               return res.status(404).send({ error: "Section not found!" });
//           }

//           validSection.images.forEach((imageObj, index) => {
//               if (imageUrls[index]) {
//                   imageObj.image = imageUrls[index];
//               }
//           });

//           await aboutUsModel.findOneAndUpdate(
//             { type: "section3" },
//             { $set: { images: validSection.images, title, text } },
//             { new: true }
//         );
//         }else {
//           await aboutUsModel.findOneAndUpdate({type: "section3"}, {$set: {title, text}}, {new: true});
//         }
//       }

//       if (type === "section4") {
//         if(req.files['image1'] || req.files['image2'] || req.files['image3'] ){
//           return res.status(400).send({error: "Invalid Credentials Received!"});
//         }

//           const validSection = await aboutUsModel.findOne({ type: "section4", 'section4._id': id });
//           if (!validSection) {
//               return res.status(404).send({ error: "Section not found!" });
//           }
//           await aboutUsModel.findOneAndUpdate(
//               { type: "section4", 'section4._id': id },
//               { $set: { 'section4.$.title': title, 'section4.$.position': position, 'section4.$.text': text, 'section4.$.image': imageUrl || validSection.image } },
//               { new: true }
//           );
//       }

//       return res.status(200).send({ message: "Section updated successfully!", body: req.body, params: req.params });

//   } catch (error) {
//       console.error("Error:", error.message);
//       res.status(500).send({ error: "Couldn't update now! Please try again later", body: req.body, params: req.params });
//   }
// });

// s3
router.patch(
  "/updateAboutUs/:role",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
  ]),
  async (req, res) => {
    const { type, id, position, title, text } = req.body;
    const role = req.params.role;
    try {
      const validUser = await moduleAccessModel.findOne({
        roleOfEmployee: role,
      });
      if (
        !validUser ||
        !validUser.modules.some(
          (module) =>
            module.moduleName === "about_us" && module.fullAccess === true
        )
      ) {
        return res
          .status(403)
          .send({ error: "You have no access to do this!" });
      }

      const uploadImage = async (file) => {
        const imageName = `${Date.now()}_${file.originalname}`;
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `images/${imageName}`,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: "public-read",
        };
        const uploadResult = await s3.upload(params).promise();
        return uploadResult.Location;
      };

      if (type !== "section1" && type !== "section2" && type !== "section3") {
        return res.status(400).send({ error: "Invalid Section!" });
      }

      if (req.files["image"]) {
        const image = req.files["image"][0];
        if (type === "section1") {
          const validImage = image.originalname.split(".").pop().toLowerCase();
          if (
            validImage !== "jpg" &&
            validImage !== "jpeg" &&
            validImage !== "png" &&
            validImage !== "svg" &&
            validImage !== "webp" &&
            validImage !== "gif" &&
            validImage !== "mp4" &&
            validImage !== "mov" &&
            validImage !== "mkv" &&
            validImage !== "avi"
          ) {
            return res.status(400).send({ error: "Invalid file type!" });
          }
        } else {
          const validImage = image.originalname.split(".").pop().toLowerCase();
          if (
            validImage !== "jpg" &&
            validImage !== "jpeg" &&
            validImage !== "png" &&
            validImage !== "svg" &&
            validImage !== "webp"
          ) {
            return res.status(400).send({ error: "Invalid file type!" });
          }
        }
      }

      if (req.files["image1"]) {
        const image = req.files["image1"][0];
        const validImage = image.originalname.split(".").pop().toLowerCase();
        if (
          validImage !== "jpg" &&
          validImage !== "jpeg" &&
          validImage !== "png" &&
          validImage !== "svg" &&
          validImage !== "webp"
        ) {
          return res.status(400).send({ error: "Invalid file type!" });
        }
      }
      if (req.files["image2"]) {
        const image = req.files["image2"][0];

        const validImage = image.originalname.split(".").pop().toLowerCase();
        if (
          validImage !== "jpg" &&
          validImage !== "jpeg" &&
          validImage !== "png" &&
          validImage !== "svg" &&
          validImage !== "webp"
        ) {
          return res.status(400).send({ error: "Invalid file type!" });
        }
      }
      if (req.files["image3"]) {
        const image = req.files["image3"][0];
        const validImage = image.originalname.split(".").pop().toLowerCase();
        if (
          validImage !== "jpg" &&
          validImage !== "jpeg" &&
          validImage !== "png" &&
          validImage !== "svg" &&
          validImage !== "webp"
        ) {
          return res.status(400).send({ error: "Invalid file type!" });
        }
      }

      let imageUrl = null;
      if (req.files["image"]) {
        const image = req.files["image"][0];
        const imageName = `${Date.now()}_${image.originalname}`;
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `images/${imageName}`,
          Body: image.buffer,
          ContentType: image.mimetype,
          ACL: "public-read",
        };

        const uploadResult = await s3.upload(params).promise();
        imageUrl = uploadResult.Location;
      }

      if (type === "section1") {
        if (
          id ||
          position ||
          req.files["image1"] ||
          req.files["image2"] ||
          req.files["image3"]
        ) {
          return res
            .status(400)
            .send({ error: "Invalid Credentials Received!" });
        }
        const validSection = await aboutUsModel.findOne({ type: "section1" });
        if (!validSection) {
          return res.status(404).send({ error: "Section not found!" });
        }
        await aboutUsModel.findOneAndUpdate(
          { type: "section1" },
          { $set: { title, text, image: imageUrl || validSection.image } },
          { new: true }
        );
      }

      if (type === "section2") {
        if (
          position ||
          req.files["image1"] ||
          req.files["image2"] ||
          req.files["image3"]
        ) {
          return res
            .status(400)
            .send({ error: "Invalid Credentials Received!" });
        }

        const validSection = await aboutUsModel.findOne({
          type: "section2",
          "section2._id": id,
        });
        if (!validSection) {
          return res.status(404).send({ error: "Section not found!" });
        }
        await aboutUsModel.findOneAndUpdate(
          { type: "section2", "section2._id": id },
          {
            $set: {
              "section2.$.title": title,
              "section2.$.text": text,
              "section2.$.image": imageUrl || validSection.image,
            },
          },
          { new: true }
        );
      }

      if (type === "section3") {
        if (id || position || req.files["image"]) {
          return res
            .status(400)
            .send({ error: "Invalid Credentials Received!" });
        }

        const imageFields = ["image1", "image2", "image3"];
        if (imageFields) {
          const imageUrls = await Promise.all(
            imageFields.map(async (imageField) => {
              if (req.files[imageField]) {
                return await uploadImage(req.files[imageField][0]);
              } else {
                return null;
              }
            })
          );

          const validSection = await aboutUsModel.findOne({ type: "section3" });
          if (!validSection) {
            return res.status(404).send({ error: "Section not found!" });
          }

          validSection.images.forEach((imageObj, index) => {
            if (imageUrls[index]) {
              imageObj.image = imageUrls[index];
            }
          });

          await aboutUsModel.findOneAndUpdate(
            { type: "section3" },
            { $set: { images: validSection.images, title, text } },
            { new: true }
          );
        } else {
          await aboutUsModel.findOneAndUpdate(
            { type: "section3" },
            { $set: { title, text } },
            { new: true }
          );
        }
      }

      // if (type === "section4") {
      //   if(req.files['image1'] || req.files['image2'] || req.files['image3'] ){
      //     return res.status(400).send({error: "Invalid Credentials Received!"});
      //   }

      //     const validSection = await aboutUsModel.findOne({ type: "section4", 'section4._id': id });
      //     if (!validSection) {
      //         return res.status(404).send({ error: "Section not found!" });
      //     }
      //     await aboutUsModel.findOneAndUpdate(
      //         { type: "section4", 'section4._id': id },
      //         { $set: { 'section4.$.title': title, 'section4.$.position': position, 'section4.$.text': text, 'section4.$.image': imageUrl || validSection.image } },
      //         { new: true }
      //     );
      // }

      return res.status(200).send({ message: "Section updated successfully!" });
    } catch (error) {
      console.error("Error:", error.message);
      res
        .status(500)
        .send({ error: "Couldn't update now! Please try again later" });
    }
  }
);

router.get("/viewPriceComparison/:role/:search?", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const searchString = req.params.search || "";
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    let moduleAccess;
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "price_comparison" && module.read === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "price_comparison"
      );
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const searchRegex = new RegExp(searchString, "i");
    let query = {
      $or: {
        nameOfFeature: { $regex: searchRegex },
      },
    };

    const response = await priceComparisonModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort(sortOptions);

    const serialNumberStart = skip + 1;
    const serialNumbers = Array.from(
      { length: response.length },
      (_, index) => serialNumberStart + index
    );

    const priceComparison = response.map((price, index) => {
      return {
        ...price.toObject(),
        s_no: serialNumbers[index],
      };
    });

    const totalItems = await priceComparisonModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = page;

    const paginationInfo = {
      totalItems,
      totalPages,
      currentPage,
      startIndex: skip + 1,
      endIndex: skip + response.length,
      itemsPerPage: response.length,
    };

    return res.status(200).send({
      data: priceComparison,
      pagination: paginationInfo,
      moduleAccess,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't View Price Comparison Data now! Please try again later",
    });
  }
});

router.post("/addPriceComparison/:role", async (req, res) => {
  const { nameOfFeature, serviceCenter, localShop, ourServices } = req.body;
  const role = req.params.role;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "price_comparison" && module.write === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    if (
      !nameOfFeature ||
      serviceCenter === undefined ||
      localShop === undefined ||
      ourServices === undefined
    ) {
      return res.status(400).send({ error: "Please fill all fields!" });
    }

    if (
      typeof serviceCenter !== "boolean" ||
      typeof localShop !== "boolean" ||
      typeof ourServices !== "boolean"
    ) {
      return res
        .status(400)
        .send({ error: "Data type should be Boolean!", body: req.body });
    }

    const existFeature = await priceComparisonModel.findOne({ nameOfFeature });
    if (existFeature) {
      return res.status(400).send({ error: "Feature already exists!" });
    }

    const newFeature = new priceComparisonModel({
      nameOfFeature,
      serviceCenter,
      localShop,
      ourServices,
    });
    await newFeature.save();

    return res.status(200).send({ message: "New Feature Added Successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't add data now! Please try again later" });
  }
});

router.patch("/updatePriceComparison/:id/:role", async (req, res) => {
  const { id, role } = req.params;
  const { nameOfFeature, serviceCenter, localShop, ourServices } = req.body;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "price_comparison" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const validFeature = await priceComparisonModel.findOne({ _id: id });
    if (!validFeature) {
      return res.status(404).send({ error: "Feature not found!" });
    }

    if (
      (serviceCenter && typeof serviceCenter !== "boolean") ||
      (localShop && typeof localShop !== "boolean") ||
      (ourServices && typeof ourServices !== "boolean")
    ) {
      return res.status(400).send({ error: "Data type should be Boolean!" });
    }

    await priceComparisonModel.findOneAndUpdate(
      { _id: id },
      { $set: { nameOfFeature, serviceCenter, localShop, ourServices } },
      { new: true }
    );
    return res.status(200).send({ message: "Feature updated Successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't update feature now! Please try again later" });
  }
});

router.delete("/deletePriceComparison/:id/:role", async (req, res) => {
  const { id, role } = req.params;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "price_comparison" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const validFeature = await priceComparisonModel.findOne({ _id: id });
    if (!validFeature) {
      return res.status(404).send({ error: "Feature not found!" });
    }

    await priceComparisonModel.findOneAndDelete({ _id: id });
    return res.status(200).send({ message: "Feature removed Successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't remove feature now! Please try again later" });
  }
});

router.get("/viewUserDetails/:id/:role", async (req, res) => {
  const { id, role } = req.params;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "order" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const userDetails = await orderModel.findOne({ _id: id });
    if (!userDetails) {
      return res.status(404).send({ error: "Order not found!" });
    }

    const validBill = await billingInfoModel.findOne({
      requestId: userDetails.requestId,
    });
    let billDetails;
    let billId;
    let labourCharges;
    let serviceCharges;
    let totalCharges;
    let toBePaid;
    let GST;
    let totalChargesBeforeGST;
    if (validBill) {
      billDetails = validBill.details;
      billId = validBill._id;
      labourCharges = validBill.labourCharges;
      serviceCharges = validBill.serviceCharges;
      totalCharges = validBill.totalCharges;
      toBePaid = validBill.toBePaid;
      GST = validBill.GST;
      totalChargesBeforeGST = validBill.totalChargesBeforeGST;
    } else {
      billDetails = [];
      billId = "";
      labourCharges = null;
      serviceCharges = null;
      totalCharges = null;
      toBePaid = null;
      GST = null;
      totalChargesBeforeGST = null;
    }

    return res.status(200).send({
      data: {
        userDetails,
        billDetails,
        billId,
        orderId: userDetails._id,
        labourCharges,
        serviceCharges,
        totalChargesBeforeGST,
        GST,
        toBePaid,
      },
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't view user details now! Please try again later",
    });
  }
});

router.get("/viewComponents/:role/:search?", async (req, res) => {
  const { role } = req.params;
  const searchString = req.params.search || "";
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "order" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const searchRegex = new RegExp(searchString, "i");
    let query = { description: { $regex: searchRegex } };

    const components = await priceChartModel.distinct("description", query);

    return res.status(200).send({ data: components });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view components now! Please try again later" });
  }
});

router.get("/viewComponentDetails/:id/:role", async (req, res) => {
  const { id, role } = req.params;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "order" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const component = await priceChartModel.findById(id);

    if (!component) {
      return res.status(404).send({ error: "Invalid Component!" });
    }

    return res.status(200).send({ data: component });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't view component details now! Please try again later",
    });
  }
});

router.post("/generateBill/:id/:role", async (req, res) => {
  const { id, role } = req.params;
  const {
    descriptionName,
    component,
    description,
    labourCharge,
    serviceCharge,
  } = req.body;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "order" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const validOrder = await orderModel.findOne({ _id: id });
    if (!validOrder) {
      return res.status(404).send({ error: "Order not found!" });
    }

    if (validOrder.status === "Completed") {
      return res.status(400).send({ error: "Bill was already Completed!" });
    }

    if (descriptionName) {
      const validProduct = await priceChartModel.findOne({
        description: descriptionName,
      });
      if (!validProduct) {
        return res
          .status(400)
          .send({ error: `Invalid product: ${descriptionName}` });
      }

      const existBill = await billingInfoModel.findOne({
        requestId: validOrder.requestId,
      });
      if (existBill) {
        await billingInfoModel.findOneAndUpdate(
          { requestId: validOrder.requestId },
          {
            $addToSet: {
              details: {
                description: descriptionName,
                component: validProduct.component,
                serviceCharge: Math.round(validProduct.serviceCharge),
                labourCharge: Math.round(validProduct.labourCharge),
              },
            },
          },
          { new: true }
        );
      } else {
        const amount = validOrder.amount || 0;
        const GST = validOrder.GST || 0;

        const logo = await settingsModel.findOne({ type: "logo" });
        const newBill = new billingInfoModel({
          requestId: validOrder.requestId,
          phoneNumber: validOrder.phoneNumber,
          alternatePhoneNumber: validOrder.alternatePhoneNumber,
          userName: validOrder.userName,
          email: validOrder.email,
          address: validOrder.address,
          orderCreatedOn: validOrder.createdAt.split(" ")[0],
          orderCompletedOn: validOrder.closedOn,
          initialAmount: Math.round(amount),
          initialAmountGST: Math.round(GST),
          labourCharges: null,
          serviceCharges: null,
          totalCharges: null,
          toBePaid: null,
          totalAmountPaid: Math.round(amount),
          typeOfService: validOrder.type,
          details: {
            description: descriptionName,
            component: validProduct.component,
            serviceCharge: Math.round(validProduct.serviceCharge),
            labourCharge: Math.round(validProduct.labourCharge),
          },
          logo: logo.image,
        });
        await newBill.save();
        await orderModel.findOneAndUpdate(
          { _id: id },
          { $set: { billGenerated: "yes" } },
          { new: true }
        );
      }
    }

    if (component && description && labourCharge && serviceCharge) {
      const existBill = await billingInfoModel.findOne({
        requestId: validOrder.requestId,
      });
      if (existBill) {
        await billingInfoModel.findOneAndUpdate(
          { requestId: validOrder.requestId },
          {
            $addToSet: {
              details: {
                description,
                component,
                serviceCharge: Math.round(serviceCharge),
                labourCharge: Math.round(labourCharge),
              },
            },
          },
          { new: true }
        );
      } else {
        const logo = await settingsModel.findOne({ type: "logo" });
        const amount = validOrder.amount || 0;
        const GST = validOrder.GST || 0;

        const newBill = new billingInfoModel({
          requestId: validOrder.requestId,
          phoneNumber: validOrder.phoneNumber,
          alternatePhoneNumber: validOrder.alternatePhoneNumber,
          userName: validOrder.userName,
          email: validOrder.email,
          address: validOrder.address,
          orderCreatedOn: validOrder.createdAt.split(" ")[0],
          orderCompletedOn: validOrder.closedOn,
          initialAmount: Math.round(amount),
          initialAmountGST: Math.round(GST),
          labourCharges: null,
          serviceCharges: null,
          totalCharges: null,
          toBePaid: null,
          totalAmountPaid: Math.round(amount),
          typeOfService: validOrder.type,
          details: {
            description,
            component,
            serviceCharge: Math.round(serviceCharge),
            labourCharge: Math.round(labourCharge),
          },
          logo: logo.image,
        });
        await newBill.save();
        await orderModel.findOneAndUpdate(
          { _id: id },
          { $set: { billGenerated: "yes" } },
          { new: true }
        );
      }
    }

    const billId = validOrder.requestId;
    const validBill = await billingInfoModel.findOne({ requestId: billId });

    const labour = validBill.details.reduce((acc, charge) => {
      return acc + charge.labourCharge;
    }, 0);

    const service = validBill.details.reduce((acc, charge) => {
      return acc + charge.serviceCharge;
    }, 0);

    const totalCharges = (labour + service).toFixed(2);
    const initialAmountGST = validBill.initialAmountGST || 0;
    console.log(initialAmountGST);
    const initialAmount = (validBill.initialAmount || 0) - initialAmountGST;
    console.log(initialAmount);

    const totalChargesBeforeGST = (totalCharges - initialAmount).toFixed(2);

    const GST = (totalChargesBeforeGST * 0.18).toFixed(2);

    const toBePaid = parseFloat(totalChargesBeforeGST) + parseFloat(GST);

    await billingInfoModel.findOneAndUpdate(
      { _id: validBill._id },
      {
        $set: {
          labourCharges: Math.round(labour),
          serviceCharges: Math.round(service),
          totalChargesBeforeGST: Math.round(totalChargesBeforeGST),
          GST: Math.round(GST),
          toBePaid: Math.round(toBePaid),
        },
      },
      { new: true }
    );

    await orderModel.findOneAndUpdate(
      { _id: id },
      { $set: { billGenerated: "yes" } },
      { new: true }
    );
    return res.status(200).send({ message: "Bill generated successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't generate bill now! Please try again later" });
  }
});

router.delete(
  "/removeAddedComponents/:billId/:componentId?/:role",
  async (req, res) => {
    const { billId, componentId, role } = req.params;
    try {
      const validUser = await moduleAccessModel.findOne({
        roleOfEmployee: role,
      });
      if (
        !validUser ||
        !validUser.modules.some(
          (module) =>
            module.moduleName === "order" && module.fullAccess === true
        )
      ) {
        return res
          .status(403)
          .send({ error: "You have no access to do this!" });
      }

      const validBill = await billingInfoModel.findOne({ _id: billId });
      if (!validBill) {
        return res.status(404).send({ error: "Bill not found!" });
      }

      const validOrder = await orderModel.findOne({
        requestId: validBill.requestId,
      });
      if (role !== "Admin") {
        if (validOrder.status === "Completed") {
          return res.status(400).send({ error: "Bill was already Completed!" });
        }
      }

      if (billId && componentId) {
        const validComponent = await billingInfoModel.updateOne(
          { _id: billId },
          { $pull: { details: { _id: componentId } } }
        );
        if (!validComponent.modifiedCount === 0) {
          return res.status(404).send({ error: "Component not found!" });
        }

        const validBilling = await billingInfoModel.findOne({
          _id: validBill._id,
        });

        const labour = validBilling.details.reduce((acc, charge) => {
          return acc + charge.labourCharge;
        }, 0);

        const service = validBilling.details.reduce((acc, charge) => {
          return acc + charge.serviceCharge;
        }, 0);

        const totalCharges = labour + service;
        const initialAmount = validBilling.initialAmount || 0;
        const toBePaid = totalCharges - initialAmount;

        await billingInfoModel.findOneAndUpdate(
          { _id: validBilling._id },
          {
            $set: {
              labourCharges: labour,
              serviceCharges: service,
              totalCharges,
              toBePaid,
            },
          },
          { new: true }
        );

        return res
          .status(200)
          .send({ message: "Component removed successfully!" });
      }

      if (billId && !componentId) {
        await billingInfoModel.findOneAndUpdate(
          { _id: billId },
          { $set: { details: [] } }
        );

        const validBilling = await billingInfoModel.findOne({
          _id: validBill._id,
        });

        const labour = validBilling.details.reduce((acc, charge) => {
          return acc + charge.labourCharge;
        }, 0);

        const service = validBilling.details.reduce((acc, charge) => {
          return acc + charge.serviceCharge;
        }, 0);

        const totalCharges = labour + service;
        const initialAmount = validBilling.initialAmount || 0;
        const toBePaid = totalCharges - initialAmount;

        await billingInfoModel.findOneAndUpdate(
          { _id: validBilling._id },
          {
            $set: {
              labourCharges: labour,
              serviceCharges: service,
              totalCharges,
              toBePaid,
            },
          },
          { new: true }
        );

        return res
          .status(200)
          .send({ message: "Components removed successfully!" });
      }
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).send({
        error: "Couldn't remove component now! Please try again later",
      });
    }
  }
);

router.get("/viewBill/:requestId/:role", async (req, res) => {
  const { requestId, role } = req.params;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "order" && module.fullAccess === true
      )
    ) {
      return res
        .status(403)
        .send({ error: "You have no access to view this Page!" });
    }

    const validBill = await billingInfoModel.findOne({ requestId });
    if (!validBill) {
      return res.status(404).send({ error: "Bill not found!" });
    }

    const validOrder = await orderModel.findOne({
      requestId: validBill.requestId,
    });
    if (!validOrder) {
      return res.status(404).send({ error: "Order not found!" });
    }

    return res.status(200).send({
      data: validBill,
      orderCreatedOn: validOrder.createdAt,
      orderStatus: validOrder.status,
      orderId: validOrder._id,
      totalAmountPaid: validOrder.totalAmountPaid,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view bill now! Please try again later" });
  }
});

router.patch("/updateBill/:billId/:componentId?/:role", async (req, res) => {
  const { billId, componentId, role } = req.params;
  const {
    description,
    component,
    serviceCharge,
    labourCharge,
    transactionId,
    paidThrough,
    totalAmountPaid,
  } = req.body;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "order" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const validBill = await billingInfoModel.findOne({ _id: billId });
    if (!validBill) {
      return res.status(404).send({ error: "Bill not found!" });
    }

    const validOrder = await orderModel.findOne({
      requestId: validBill.requestId,
    });

    if (validOrder.status === "Completed") {
      return res.status(400).send({ error: "Order was already Completed!" });
    }

    if (componentId) {
      const validComponent = await billingInfoModel.findOne({
        _id: billId,
        "details._id": componentId,
      });
      if (!validComponent) {
        return res.status(404).send({ error: "Invalid Component!" });
      }
      await billingInfoModel.findOneAndUpdate(
        { _id: billId, "details._id": componentId },
        {
          $set: {
            paidThrough,
            transactionId,
            totalAmountPaid: Math.round(totalAmountPaid),
            "details.$.description": description || validComponent.description,
            "details.$.component": component || validComponent.component,
            "details.$.labourCharge":
              labourCharge !== undefined
                ? Math.round(labourCharge)
                : validComponent.labourCharges,
            "details.$.serviceCharge":
              serviceCharge !== undefined
                ? Math.round(serviceCharge)
                : validComponent.serviceCharges,
          },
        },
        { new: true }
      );
    }

    await billingInfoModel.findOneAndUpdate(
      { _id: billId },
      {
        $set: {
          paidThrough,
          transactionId,
          totalAmountPaid: Math.round(totalAmountPaid),
        },
      },
      { new: true }
    );

    const updatedBill = await billingInfoModel.findOne({ _id: billId });
    const labour = updatedBill.details.reduce((acc, charge) => {
      return acc + charge.labourCharge;
    }, 0);

    const service = updatedBill.details.reduce((acc, charge) => {
      return acc + charge.serviceCharge;
    }, 0);

    const totalCharges = (labour + service).toFixed(2);
    const initialAmountGST = validBill.initialAmountGST || 0;
    const initialAmount = (validBill.initialAmount || 0) - initialAmountGST;
    const totalChargesBeforeGST = (totalCharges - initialAmount).toFixed(2);

    const GST = (totalChargesBeforeGST * 0.18).toFixed(2);

    const toBePaid = parseFloat(totalChargesBeforeGST) + parseFloat(GST);

    await billingInfoModel.findOneAndUpdate(
      { _id: validBill._id },
      {
        $set: {
          labourCharges: Math.round(labour),
          serviceCharges: Math.round(service),
          totalChargesBeforeGST: Math.round(totalChargesBeforeGST),
          GST: Math.round(GST),
          toBePaid: Math.round(toBePaid),
        },
      },
      { new: true }
    );

    return res.status(200).send({ message: "Bill updated successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't update bill now! Please try again later",
      error: error.message,
    });
  }
});

router.post("/calculateCharges/:id/:role", async (req, res) => {
  const { id, role } = req.params;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "order" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You have no access to do this!" });
    }

    const validBill = await billingInfoModel.findOne({ _id: id });
    if (!validBill) {
      return res.status(404).send({ error: "Bill not found!" });
    }

    const labour = validBill.details.reduce((acc, charge) => {
      return acc + charge.labourCharge;
    }, 0);

    const service = validBill.details.reduce((acc, charge) => {
      return acc + charge.serviceCharge;
    }, 0);

    const totalCharges = labour + service;
    const initialAmount = validBill.initialAmount || 0;
    const toBePaid = totalCharges - initialAmount;

    await billingInfoModel.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          labourCharges: labour,
          serviceCharges: service,
          totalCharges: totalCharges,
          toBePaid: toBePaid,
        },
      },
      { new: true }
    );
    return res
      .status(200)
      .send({ message: { labour, service, totalCharges, toBePaid } });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't confirm the bill now! Please try again later" });
  }
});

router.get("/viewCustomLaptopRequests/:role/:search?", async (req, res) => {
  const { role } = req.params;
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const searchString = req.params.search || "";
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    let moduleAccess;
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "custom_requests" && module.read === true
      )
    ) {
      return res
        .status(400)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "custom_requests"
      );
    }

    const skip = (page - 1) * limit;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const escapedSearchString = searchString.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
    const searchRegex = new RegExp(escapedSearchString, "i");

    let query = {
      $or: [
        { phoneNumber: { $regex: searchRegex } },
        { userName: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { processor: { $regex: searchRegex } },
        { operatingSystem: { $regex: searchRegex } },
        { ram: { $regex: searchRegex } },
        { screenSize: { $regex: searchRegex } },
        { type: { $regex: searchRegex } },
        { message: { $regex: searchRegex } },
      ],
    };

    const response = await customConfigurationsModel
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const serialNumbers = skip + 1;
    const serialNumberStart = Array.from(
      { length: response.length },
      (_, index) => serialNumbers + index
    );

    const customRequests = response.map((request, index) => {
      return {
        ...request.toObject(),
        s_no: serialNumberStart[index],
      };
    });

    const totalItems = await customConfigurationsModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = page;

    const paginationInfo = {
      totalItems,
      totalPages,
      currentPage,
      startIndex: skip + 1,
      endIndex: skip + response.length,
      itemsPerPage: response.length,
    };

    return res
      .status(200)
      .send({ data: customRequests, pagination: paginationInfo, moduleAccess });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't view Custom Laptop Requests now! Please try again later",
    });
  }
});

router.get("/viewCustomLaptopRequest/:supportId/:role", async (req, res) => {
  const { supportId, role } = req.params;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    let moduleAccess;
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "support" && module.read === true
      )
    ) {
      return res
        .status(400)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "support"
      );
    }

    const response = await customConfigurationsModel.findOne({ supportId });

    return res.status(200).send({ data: response });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      error: "Couldn't view Custom Laptop Requests now! Please try again later",
    });
  }
});

router.patch("/updateCustomLaptopRequest/:id/:role", async (req, res) => {
  const { id, role } = req.params;
  const { status, note } = req.body;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "custom_requests" && module.fullAccess === true
      )
    ) {
      return res.status(400).send({ error: "You have no access to do this!" });
    }

    if (!status || !note) {
      return res.status(400).send({ error: "Please fill all fields!" });
    }
    const existRequest = await customConfigurationsModel.findOneAndUpdate(
      { _id: id },
      { $set: { status, note } },
      { new: true }
    );

    if (!existRequest) {
      return res.status(404).send({ error: "Request not found!" });
    }

    return res.status(200).send({ message: "Request updated successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't update request now! Please try again later" });
  }
});

router.delete("/deleteCustomLaptopReques/:id/:role", async (req, res) => {
  const { id, role } = req.params;
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !validUser ||
      !validUser.modules.some(
        (module) =>
          module.moduleName === "custom_requests" && module.fullAccess === true
      )
    ) {
      return res.status(400).send({ error: "You have no access to do this!" });
    }

    const existRequest = await customConfigurationsModel.findOneAndDelete({
      _id: id,
    });
    if (!existRequest) {
      return res.status(404).send({ error: "Request not found!" });
    }

    return res.status(200).send({ message: "Request deleted successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't delete request now! Please try again later" });
  }
});

router.post("/resetCounts", async (req, res) => {
  let { phoneNumber, type } = req.body;
  try {
    if (!phoneNumber.startsWith("+91")) {
      phoneNumber = `+91${phoneNumber}`;
    }

    if (type === "user") {
      const validData = await notificationCountModel.findOne({
        type: "userCount",
      });
      if (!validData) {
        return res.status(404).send({ error: "Data not found!" });
      }
      const currentUserCount = await usersModel.countDocuments();
      console.log("currentUserCount:", currentUserCount);

      await notificationCountModel.findOneAndUpdate(
        { type: "userCount", "details.employeePhoneNumber": phoneNumber },
        { $set: { "details.$.count": currentUserCount } },
        { new: true }
      );
      return res.status(200).send({ message: "Count resetted!" });
    } else if (type === "quotation_requests") {
      const validData = await notificationCountModel.findOne({
        type: "quoteCount",
      });
      if (!validData) {
        return res.status(404).send({ error: "Data not found!" });
      }
      const currentQuoteCount = await quotationModel.countDocuments();
      console.log("currentQuoteCount:", currentQuoteCount);

      await notificationCountModel.findOneAndUpdate(
        { type: "quoteCount", "details.employeePhoneNumber": phoneNumber },
        { $set: { "details.$.count": currentQuoteCount } },
        { new: true }
      );
      return res.status(200).send({ message: "Count resetted!" });
    } else if (type === "order") {
      const validData = await notificationCountModel.findOne({
        type: "orderCount",
      });
      if (!validData) {
        return res.status(404).send({ error: "Data not found!" });
      }
      const currentOrderCount = await orderModel.countDocuments();
      console.log("currentOrderCount:", currentOrderCount);

      await notificationCountModel.findOneAndUpdate(
        { type: "orderCount", "details.employeePhoneNumber": phoneNumber },
        { $set: { "details.$.count": currentOrderCount } },
        { new: true }
      );
      return res.status(200).send({ message: "Count resetted!" });
    } else if (type === "review") {
      const validData = await notificationCountModel.findOne({
        type: "generalReviewCount",
      });
      if (!validData) {
        return res.status(404).send({ error: "Data not found!" });
      }
      const currentGeneralReviewCount = await reviewModel.countDocuments();
      console.log("currentGeneralReviewCount:", currentGeneralReviewCount);

      await notificationCountModel.findOneAndUpdate(
        {
          type: "generalReviewCount",
          "details.employeePhoneNumber": phoneNumber,
        },
        { $set: { "details.$.count": currentGeneralReviewCount } },
        { new: true }
      );
      return res.status(200).send({ message: "Count resetted!" });
    } else if (type === "reviews_products") {
      const validData = await notificationCountModel.findOne({
        type: "productReviewCount",
      });
      if (!validData) {
        return res.status(404).send({ error: "Data not found!" });
      }
      const currentProductReviewCount =
        await productReviewModel.countDocuments();
      console.log("currentProductReviewCount:", currentProductReviewCount);

      await notificationCountModel.findOneAndUpdate(
        {
          type: "productReviewCount",
          "details.employeePhoneNumber": phoneNumber,
        },
        { $set: { "details.$.count": currentProductReviewCount } },
        { new: true }
      );
      return res.status(200).send({ message: "Count resetted!" });
    } else if (type === "support") {
      const validData = await notificationCountModel.findOne({
        type: "supportCount",
      });
      if (!validData) {
        return res.status(404).send({ error: "Data not found!" });
      }
      const currentSupportCount = await supportFormModel.countDocuments();
      console.log("currentSupportCount:", currentSupportCount);

      await notificationCountModel.findOneAndUpdate(
        { type: "supportCount", "details.employeePhoneNumber": phoneNumber },
        { $set: { "details.$.count": currentSupportCount } },
        { new: true }
      );
      return res.status(200).send({ message: "Count resetted!" });
    } else {
      return res.status(200).send({ message: "Count resetted!" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't reset counts now! Please try again later" });
  }
});

router.post("/addServiceArea/:role", async (req, res) => {
  const role = req.params.role;
  const { pincode } = req.body;
  try {
    const existUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !existUser ||
      !existUser.modules.some(
        (module) =>
          module.moduleName === "service_area" && module.write === true
      )
    ) {
      return res.status(403).send({ error: "You've no access to do this!" });
    }

    if (!pincode) {
      return res.status(400).send({ error: "Please fill all fields!" });
    }

    const existPincode = await serviceAreaModel.findOne({ pincode });
    if (existPincode) {
      return res
        .status(400)
        .send({ error: `This area ${pincode} already exists!` });
    }

    const newPincode = new serviceAreaModel({
      pincode,
      provideService: "yes",
    });
    await newPincode.save();

    return res
      .status(200)
      .send({ message: "Service area added successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't add service area now! Please try again later" });
  }
});

router.get("/viewServiceAreas/:role/:search?", async (req, res) => {
  const role = req.params.role;
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const sortBy = req.query.sortBy || "pincode";
  const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
  const searchString = req.params.search || "";
  try {
    const validUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    let moduleAccess;
    if (
      !validUser ||
      !validUser.modules.some(
        (module) => module.moduleName === "service_area" && module.read === true
      )
    ) {
      return res
        .status(400)
        .send({ error: "You have no access to view this Page!" });
    } else {
      moduleAccess = validUser.modules.find(
        (module) => module.moduleName === "service_area"
      );
    }

    const skip = (page - 1) * limit;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const escapedSearchString = searchString.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
    const searchRegex = new RegExp(escapedSearchString, "i");

    let query = {
      $or: [{ pincode: { $regex: searchRegex } }],
    };

    const response = await serviceAreaModel
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const serialNumbers = skip + 1;
    const serialNumberStart = Array.from(
      { length: response.length },
      (_, index) => serialNumbers + index
    );

    const serviceAreas = response.map((request, index) => {
      return {
        ...request.toObject(),
        s_no: serialNumberStart[index],
      };
    });

    const totalItems = await serviceAreaModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = page;

    const paginationInfo = {
      totalItems,
      totalPages,
      currentPage,
      startIndex: skip + 1,
      endIndex: skip + response.length,
      itemsPerPage: response.length,
    };

    return res
      .status(200)
      .send({ data: serviceAreas, pagination: paginationInfo, moduleAccess });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({
        error: "Couldn't view service areas now! Please try again later",
      });
  }
});

router.patch("/updateServiceArea/:id/:role", async (req, res) => {
  const { id, role } = req.params;
  const { provideService } = req.body;
  try {
    const existUser = await moduleAccessModel.findOne({ roleOfEmployee: role });
    if (
      !existUser ||
      !existUser.modules.some(
        (module) =>
          module.moduleName === "service_area" && module.fullAccess === true
      )
    ) {
      return res.status(403).send({ error: "You've no access to do this!" });
    }

    if (!provideService) {
      return res.status(400).send({ error: "Please fill all fields!" });
    }

    const validServiceArea = await serviceAreaModel.findOne({ _id: id });
    if (!validServiceArea) {
      return res.status(404).send({ error: "Service area not found!" });
    }

    await serviceAreaModel.findOneAndUpdate(
      { _id: id },
      { $set: { provideService } },
      { new: true }
    );

    return res
      .status(200)
      .send({ message: "Service area updated successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({
        error: "Couldn't update service area now! Please try again later",
      });
  }
});

module.exports = router;
