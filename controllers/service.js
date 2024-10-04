const express = require("express");
const multer = require("multer");
var admin = require("firebase-admin");
const serviceAccount = require("../firebase.json");
const rentLaptopModel = require("../models/rentLaptops");
const refurbishedLaptopModel = require("../models/refurbishedLaptops");
const issueModel = require("../models/issues");
const transactionModel = require("../models/transactions");
const usersModel = require("../models/users");
const serviceRequestsModel = require("../models/service_requests");
const rentalRequestsModel = require("../models/rental_requests");
const refurbishedRequestsModel = require("../models/refurbished_requests");
const reviewModel = require("../models/reviews");
const productReviewModel = require("../models/productReviews");
const categoryModel = require("../models/category");
const settingsModel = require("../models/settings");
const quotationModel = require("../models/quotations");
const router = express.Router();
const moment = require("moment-timezone");
const orderModel = require("../models/orders");
const nodemailer = require("nodemailer");
const couponCodeModel = require("../models/couponCode");
const chatBotModel = require("../models/chatBot");
const notificationModel = require("../models/notification");
const galleryModel = require("../models/gallery");
const supportFormModel = require("../models/supportForm");
const deviceModel = require("../models/devices");
const cartModel = require("../models/cart");
const mostBookedServiceModel = require("../models/mostBookedService");
const priceChartModel = require("../models/priceChart");
const faqModel = require("../models/faq");
const aboutUsModel = require("../models/aboutUs");
const priceComparisonModel = require("../models/priceComparison");
const emailTemplateModel = require("../models/emailTemplate");
const emailModel = require("../models/email");
const AWS = require('aws-sdk');
const customConfigurationsModel = require("../models/customConfigurations");
const upload = multer();
const { ObjectId } = require('mongodb');
const serviceAreaModel = require("../models/serviceArea");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "meetinground-464c9.appspot.com",
  });
}

function getRandomGenerationId(length = 10) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const allowedFileExtensions = [".jpg", ".jpeg", ".png", ".svg", ".webp", ".mp4", ".avi", ".mov", ".mkv"];

const isValidFileExtension = (filename) => {
  const extension = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return allowedFileExtensions.includes(extension);
};

router.get("/viewRentalLaptops/:search?", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const searchString = req.params.search || "";
  const {
    brand,
    operatingSystem,
    ram,
    storage,
    screenSize,
    rating,
    processor,
  } = req.query;
  try {

    const activeCategory = await categoryModel.findOne({category: "Rental", status: "Active"});
    if(!activeCategory){
      return res.status(400).send({error: "Sorry this page is not Active!"})
    }

    const skip = (page - 1) * limit;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const searchRegex = new RegExp(searchString, "i");
    const query = {
      status: "Active",
      $or: [
        { _id: ObjectId.isValid(searchString) ? new ObjectId(searchString) : null },
        { brand: { $regex: searchRegex } },
        { model: { $regex: searchRegex } },
        { processor: { $regex: searchRegex } },
        { ram: { $regex: searchRegex } },
        { screenSize: { $regex: searchRegex } },
        { storage: { $regex: searchRegex } },
        { color: { $regex: searchRegex } },
        { operatingSystem: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
      ].filter(Boolean) ,
    };

    if (brand) {
      const brandArray = brand.split(",").map((b) => b.trim());
      query.brand = { $in: brandArray };
    }
    if (processor) {
      const processorArray = processor.split(",").map((b) => b.trim());
      query.processor = { $in: processorArray };
    }
    if (ram) {
      const ramArray = ram.split(",").map((b) => b.trim());
      query.ram = { $in: ramArray };
    }
    if (screenSize) {
      const screenSizeArray = screenSize.split(",").map((b) => b.trim());
      query.screenSize = { $in: screenSizeArray };
    }
    if (storage) {
      const storageArray = storage.split(",").map((b) => b.trim());
      query.storage = { $in: storageArray };
    }
    if (rating) {
      const ratingArray = rating.split(",").map((b) => parseInt(b.trim()));
      query["reviews.rating"] = { $in: ratingArray };
    }
    if (operatingSystem) {
      const operatingSystemArray = operatingSystem
        .split(",")
        .map((b) => b.trim());
      query.operatingSystem = { $in: operatingSystemArray };
    }

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
      const rev = laptops.reviews || [];

      const reviews = rev.filter((rev) => rev.status === "Approved");

      const totalRating = reviews.reduce((acc, rev) => acc + parseInt(rev.rating), 0);
      const averageRating = reviews.length > 0 ? (totalRating/reviews.length) : "0"

      const ratingCounts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};

      reviews.forEach((rev) => {
        const rating = parseInt(rev.rating);
        if(ratingCounts[rating] !== undefined){
          ratingCounts[rating] += 1;
        }
      });

      const totalRatings = reviews.length;
      const ratingPercentages = {
        1: totalRatings > 0 ? (ratingCounts[1] / totalRatings) * 100 : 0,
        2: totalRatings > 0 ? (ratingCounts[2] / totalRatings) * 100 : 0,
        3: totalRatings > 0 ? (ratingCounts[3] / totalRatings) * 100 : 0,
        4: totalRatings > 0 ? (ratingCounts[4] / totalRatings) * 100 : 0,
        5: totalRatings > 0 ? (ratingCounts[5] / totalRatings) * 100 : 0,
      }
      return{
        ...laptops.toObject(),
        s_no: serialNumbers[index],
        reviews,
        averageRating: parseInt(averageRating),
        totalRatings,
        ratingCounts,
        ratingPercentages,
      }
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
    
    let availbleOptionsForFilter = [];

    const availableBrands = await rentLaptopModel.distinct("brand");
    const availableOperatingSystems = await rentLaptopModel.distinct(
      "operatingSystem"
    );
    const availableRams = await rentLaptopModel.distinct("ram");
    const availableStorages = await rentLaptopModel.distinct("storage");
    const availableScreenSizes = await rentLaptopModel.distinct("screenSize");
    const availableProcessors = await rentLaptopModel.distinct("processor");
    availbleOptionsForFilter.push({
      availableBrands,
      availableOperatingSystems,
      availableRams,
      availableStorages,
      availableScreenSizes,
      availableRatings: ["1", "2", "3", "4", "5"],
      availableProcessors,
    });

    const youMayLikeProducts = await rentLaptopModel.find({
      addInCarousel: true,
    });
    let carousel;
    if (youMayLikeProducts && youMayLikeProducts.length > 0) {
      carousel = youMayLikeProducts;
    } else {
      carousel = null;
    }

    const rentalBanner = await settingsModel.find({type: "rentalBanner"});

    const rentals = await faqModel.find({subtitle: "Rental"});
    let rentalFaq = [];
    if(rentals.length > 0){
      rentalFaq = rentals
    }

    if (rentalLaptops && rentalLaptops.length === 0) {
      return res
        .status(200)
        .send({  data: [],
          pagination: paginationInfo,
          availbleOptionsForFilter,
          carousel,
          rentalBanner,
          rentalFaq });
    }
    
    return res.status(200).send({
      data: rentalLaptops,
      pagination: paginationInfo,
      availbleOptionsForFilter,
      carousel,
      rentalBanner,
      rentalFaq
    });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view laptops now! Please try again later" });
  }
});

router.get("/viewRefurbishedLaptops/:search?", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const searchString = req.params.search || "";
  const {
    brand,
    operatingSystem,
    ram,
    storage,
    screenSize,
    rating,
    processor,
  } = req.query;
  try {
    const activeCategory = await categoryModel.findOne({category: "Refurbished", status: "Active"});
    if(!activeCategory){
      return res.status(400).send({error: "Sorry this page is not Active!"})
    }

    const skip = (page - 1) * limit;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const searchRegex = new RegExp(searchString, "i");
    const query = {
      status: "Active",
      $or: [
        {_id: ObjectId.isValid(searchString) ? new ObjectId(searchString) : null},
        { brand: { $regex: searchRegex } },
        { model: { $regex: searchRegex } },
        { processor: { $regex: searchRegex } },
        { ram: { $regex: searchRegex } },
        { screenSize: { $regex: searchRegex } },
        { storage: { $regex: searchRegex } },
        { color: { $regex: searchRegex } },
        { operatingSystem: { $regex: searchRegex } },
      ].filter(Boolean),
    };

    if (brand) {
      const brandArray = brand.split(",").map((b) => b.trim());
      query.brand = { $in: brandArray };
    }
    if (processor) {
      const processorArray = processor.split(",").map((b) => b.trim());
      query.processor = { $in: processorArray };
    }
    if (ram) {
      const ramArray = ram.split(",").map((b) => b.trim());
      query.ram = { $in: ramArray };
    }
    if (screenSize) {
      const screenSizeArray = screenSize.split(",").map((b) => b.trim());
      query.screenSize = { $in: screenSizeArray };
    }
    if (storage) {
      const storageArray = storage.split(",").map((b) => b.trim());
      query.storage = { $in: storageArray };
    }
    if (rating) {
      const ratingArray = rating.split(",").map((b) => parseInt(b.trim()));
      query["reviews.rating"] = { $in: ratingArray };
    }
    if (operatingSystem) {
      const operatingSystemArray = operatingSystem
        .split(",")
        .map((b) => b.trim());
      query.operatingSystem = { $in: operatingSystemArray };
    }

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
      const rev = laptops.reviews || [];

      const reviews = rev.filter((rev) => rev.status === "Approved");
      const totalRating = reviews.reduce((acc, rev) => acc + parseInt(rev.rating), 0);
      const averageRating = reviews.length > 0 ? (totalRating/reviews.length).toFixed(1) : "0"

      const ratingCounts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};

      reviews.forEach((rev) => {
        const rating = parseInt(rev.rating);
        if(ratingCounts[rating] !== undefined){
          ratingCounts[rating] += 1;
        }
      });

      const totalRatings = reviews.length;
      const ratingCountPercentages = {
        1: totalRatings > 0 ? (ratingCounts[1] / totalRatings) * 100 : 0,
        2: totalRatings > 0 ? (ratingCounts[2] / totalRatings) * 100 : 0,
        3: totalRatings > 0 ? (ratingCounts[3] / totalRatings) * 100 : 0,
        4: totalRatings > 0 ? (ratingCounts[4] / totalRatings) * 100 : 0,
        5: totalRatings > 0 ? (ratingCounts[5] / totalRatings) * 100 : 0
      }

      return {
        ...laptops.toObject(),
        s_no: serialNumbers[index],
        reviews,
        averageRating: parseInt(averageRating),
        totalRatings,
        ratingCounts,
        ratingCountPercentages
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

    let availbleOptionsForFilter = [];
    const availableBrands = await refurbishedLaptopModel.distinct("brand");
    const availableOperatingSystems = await refurbishedLaptopModel.distinct(
      "operatingSystem"
    );
    const availableRams = await refurbishedLaptopModel.distinct("ram");
    const availableStorages = await refurbishedLaptopModel.distinct("storage");
    const availableScreenSizes = await refurbishedLaptopModel.distinct(
      "screenSize"
    );
    const availableProcessors = await refurbishedLaptopModel.distinct(
      "processor"
    );
    availbleOptionsForFilter.push({
      availableBrands,
      availableOperatingSystems,
      availableRams,
      availableStorages,
      availableScreenSizes,
      availableRatings: ["1", "2", "3", "4", "5"],
      availableProcessors,
    });

    const youMayLikeProducts = await refurbishedLaptopModel.find({
      addInCarousel: true,
    });
    let carousel;
    if (youMayLikeProducts && youMayLikeProducts.length > 0) {
      carousel = youMayLikeProducts;
    } else {
      carousel = null;
    }

    const refurbishedBanner = await settingsModel.find({type: "refurbishedBanner"});

    let refurbishedFaq = [];
    const refurbished = await faqModel.find({subtitle: "Refurbished"});
    if(refurbished.length > 0){
      refurbishedFaq = refurbished
    }

    if (refurbishedLaptops && refurbishedLaptops.length === 0) {
      return res.status(200).send({  data: [],
        pagination: paginationInfo,
        availbleOptionsForFilter,
        carousel,
        refurbishedBanner,
        refurbishedFaq});
    }

    return res
      .status(200)
      .send({
        data: refurbishedLaptops,
        pagination: paginationInfo,
        availbleOptionsForFilter,
        carousel,
        refurbishedBanner,
        refurbishedFaq
      });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't view laptops now! Please try again later" });
  }
});

router.get("/viewDevices", async(req, res) => {
  try{
    const activeCategory = await categoryModel.findOne({category: "Repair & Service", status: "Active"});
    if(!activeCategory){
      return res.status(400).send({error: "Sorry this page is not Active!"})
    }

    const response = await deviceModel.find();

    const serviceIssues = await deviceModel.findOne({deviceName: "Quick Services"});
    let quickServiceIssues = [];
    if(serviceIssues){
      quickServiceIssues.push(serviceIssues)
    }

    const reviews = await reviewModel.find({status: "Approved"}).sort({createdAt: -1}).limit(5);

    let repairFaq = [];
    const repairs = await faqModel.find({subtitle: "Repair & Services"});
    if(repairs.length > 0){
      repairFaq.push(repairs)
    };

      return res.status(200).send({data: response, reviews, quickServiceIssues, repairFaq});
  }catch(error){
    console.error("Error:", error.message);
    res.status(500).send({error: "Couldn't view devices now! Please try again later"});
  }
});


// router.get("/homePage/:phoneNumber?", async (req, res) => {
//   let {phoneNumber} = req.params;
//   try {
//     const response = await mostBookedServiceModel.find();

//     const validCategory = await categoryModel.findOne({category: "Repair & Service", status: "Active"});
//     let mostBookedServices = [];
//     if(validCategory){
//       mostBookedServices = response.map(service => service.serviceName);
//     }

//     const response1 = await settingsModel.find({ type: "logo" });
//     const logo = response1
//       .filter((image) => image.image)
//       .map((image) => image.image);

//     const category = await categoryModel.find({showInHomePage: "yes"});

//     const reviews = await reviewModel
//       .find({ status: "Approved", showInHomePage: "yes" })
//       .sort({ createdAt: -1 })
//       .limit(5);

//     const response3 = await settingsModel.find({ type: "generalBanner" });
//     const banner = response3
//       .filter((banner) => banner.image)
//       .map((banner) => banner.image);

//     const laptopBrands = await settingsModel.find({ type: "laptopBrands" });

//     let coupons;
//     if(phoneNumber){
//       if(!phoneNumber.startsWith("+91")){
//         phoneNumber = `+91${phoneNumber}`
//       }
//       coupons = await couponCodeModel.find({status: "Active", redemeedUsers: {$not: {$elemMatch: {phoneNumber}}}})
//     } else {
//       coupons = await couponCodeModel.find({ status: "Active" });
//     }

//     const socialLinks = await settingsModel.find({ type: "socialLinks" });

//     const video = await settingsModel.find({ type: "video" });

//     const theme = await settingsModel.find({type: "theme"});

//     const razorPayKey = await settingsModel.findOne({credentialsKey: "RAZORPAY_KEY"});
//     const razorPaySecretKey = await settingsModel.findOne({credentialsKey: "RAZORPAY_SECRET_KEY"});

//     let cartLength = 0;
//     if(phoneNumber){      
//     if(!phoneNumber.startsWith("+91")){
//       phoneNumber = `+91${phoneNumber}`
//     }
//       const cart = await cartModel.findOne({phoneNumber, status: "Pending"});
//       if(cart){
//         cartLength = cart.products.length;
//       }
//     }

//     const serviceIssues = await deviceModel.findOne({deviceName: "Quick Services"});
//     let quickServiceIssues = [];
//     if(serviceIssues){
//         quickServiceIssues.push(serviceIssues.issues)
//     };

//     const initialAmount = await settingsModel.findOne({type: "initialAmount"});

//     return res.status(200).send({
//       data: {
//         logo,
//         category,
//         mostBookedServices,
//         reviews,
//         banner,
//         laptopBrands,
//         socialLinks,
//         coupons,
//         video,
//         cartLength,
//         theme,
//         quickServiceIssues,
//         initialAmount: initialAmount.credentialsValue,
//         razorPayKey: razorPayKey.credentialsValue,
//         razorPaySecretKey: razorPaySecretKey.credentialsValue
//       },
//     });
//   } catch (error) {
//     console.error("Error:", error.message);
//     res.status(500).send({ error: "Internal Server Error" });
//   }
// });

router.get("/homePage/:phoneNumber?", async (req, res) => {
  let {phoneNumber} = req.params;
  try {
    const response = await mostBookedServiceModel.find();

    const validCategory = await categoryModel.findOne({category: "Repair & Service", status: "Active"});
    let mostBookedServices = [];
    if(validCategory){
      mostBookedServices = response;
    }

    const response1 = await settingsModel.find({ type: "logo" });
    const logo = response1
      .filter((image) => image.image)
      .map((image) => image.image);

    const category = await categoryModel.find({showInHomePage: "yes"});

    const reviews = await reviewModel
      .find({ status: "Approved", showInHomePage: "yes" })
      .sort({ createdAt: -1 })
      .limit(5);

    const response3 = await settingsModel.find({ type: "generalBanner" });
    const banner = response3
      .filter((banner) => banner.image)
      .map((banner) => banner.image);

    const laptopBrands = await settingsModel.find({ type: "laptopBrands" });

    let coupons;
    if(phoneNumber){
      if(!phoneNumber.startsWith("+91")){
        phoneNumber = `+91${phoneNumber}`
      }
      coupons = await couponCodeModel.find({status: "Active", redemeedUsers: {$not: {$elemMatch: {phoneNumber}}}})
    } else {
      coupons = await couponCodeModel.find({ status: "Active" });
    }

    const socialLinks = await settingsModel.find({ type: "socialLinks", status: "yes" });

    const video = await settingsModel.find({ type: "video" });

    const theme = await settingsModel.find({type: "theme"});

    const razorPayKey = await settingsModel.findOne({credentialsKey: "RAZORPAY_KEY"});
    const razorPaySecretKey = await settingsModel.findOne({credentialsKey: "RAZORPAY_SECRET_KEY"});

    let cartLength = 0;
    if(phoneNumber){      
    if(!phoneNumber.startsWith("+91")){
      phoneNumber = `+91${phoneNumber}`
    }
      const cart = await cartModel.findOne({phoneNumber, status: "Pending"});
      if(cart){
        cartLength = cart.products.length;
      }
    }

    const serviceIssues = await deviceModel.findOne({deviceName: "Quick Services"});
    let quickServiceIssues = [];
    if(serviceIssues){
        quickServiceIssues.push(serviceIssues.issues)
    };

    const initialAmount = await settingsModel.findOne({type: "initialAmount"});

    const mostBookedServiceBanner = await settingsModel.find({type: "modelBanner"});

    return res.status(200).send({
      data: {
        logo,
        category,
        mostBookedServices,
        reviews,
        banner,
        mostBookedServiceBanner,
        laptopBrands,
        socialLinks,
        coupons,
        video,
        cartLength,
        theme,
        quickServiceIssues,
        initialAmount: initialAmount.credentialsValue,
        razorPayKey: razorPayKey.credentialsValue,
        razorPaySecretKey: razorPaySecretKey.credentialsValue
      },
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

router.post("/productReview", upload.array("images"), async (req, res) => {
  let { phoneNumber, productId, productType, rating, review } = req.body;
  const images = req.files;
  try {
    if (!phoneNumber || !productId || !productType || !rating || !review) {
      return res.status(400).send({ error: "Please fill all fields!" });
    }

    if(!phoneNumber.startsWith("+91")){
      phoneNumber = `+91${phoneNumber}`;
    }

    const now = moment().tz("Asia/Kolkata");
    const currentDate = now.format("DD/MM/YYYY");

    const existReview = await productReviewModel.findOne({
      phoneNumber,
      productId,
    });
    if (existReview) {
      return res
        .status(400)
        .send({ error: "You've already Post your Review!" });
    }
    const existingUser = await usersModel.findOne({ phoneNumber });
    if (!existingUser) {
      return res.status(404).send({ error: "User not found!" });
    }

    const userName = existingUser.userName ? existingUser.userName : null;
    const profileImage = existingUser.profileImage
      ? existingUser.profileImage
      : "https://storage.googleapis.com/meetinground-464c9.appspot.com/images%2F1720499308802_user%20(11).png";

      let imageUrls = [];
      if(images){
      for(const image of images){
        if(!isValidFileExtension(image.originalname)){
          return res.status(400).send({error: "Invalid file type!"});
        }
        const imageName = `${Date.now()}_${image.originalname}`;
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `images/${imageName}`,
          Body: image.buffer,
          ContentType: image.mimetype,
          ACL: 'public-read'
        };

        const uploadResult = await s3.upload(params).promise();
        imageUrls.push(uploadResult.Location)
      }
    }

    const reviews = {
      phoneNumber,
      userName,
      profileImage,
      rating,
      review,
      date: currentDate,
      images: imageUrls,
      status: "Pending",
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
      profileImage,
      rating,
      review,
      images: imageUrls,
      status: "Pending",
    });
    await newReview.save();

    const notifications = await notificationModel({
      title: "Product Review Received!!",
      subtitle: `${userName} | ${rating} | ${review}`,
      orderDetails: {
        productId: newReview.productId,
        productType: newReview.productType,
        phoneNumber: newReview.phoneNumber,
        userName: newReview.userName,
        profileImage: newReview.profileImage,
        rating: newReview.rating,
        review: newReview.review,
      },
    });
    await notifications.save();

    return res.status(200).send({ message: "Thanks for your Review!" });
  } catch (error) {
    console.error("Error:", error.message);
    console.log({
      error: "Couldn't Post your Review now! Please try again later",
    });
  }
});

router.post("/repairCart", async (req, res) => {
  let { phoneNumber, device, issue, issueDetails, brand, model, operatingSystem } = req.body;
  try {
    if (!phoneNumber.startsWith("+91")) {
      phoneNumber = `+91${phoneNumber}`;
    }

    const existUser = await usersModel.findOne({ phoneNumber });
    if (!existUser) {
      return res.status(404).send({ error: "User not found!" });
    }

    let response;
    const unClosedCart = await cartModel.findOne({phoneNumber, status: "Pending"});
    if(unClosedCart){
      response = await cartModel.findOneAndUpdate({phoneNumber, status: "Pending"}, {$push: {products: {type: "Repair", image: "https://storage.googleapis.com/meetinground-464c9.appspot.com/images%2F1721279195184_computer-repair.jpg", device, issue, issueDetails, brand, model, operatingSystem , createdAt: moment(Date.now()).tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss"), updatedAt: moment(Date.now()).tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss") }}}, {new: true});
    } else {
      response = new cartModel({
        phoneNumber,
        products: {
          type: "Repair",
          device,
          issue,issueDetails, brand, model, operatingSystem,
          image: "https://storage.googleapis.com/meetinground-464c9.appspot.com/images%2F1721279195184_computer-repair.jpg", createdAt: moment(Date.now()).tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss"), updatedAt: moment(Date.now()).tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss")
        },
        status: "Pending"
      });
    }
    await response.save();

    if (response) {
      return res.status(200).send({ message: "Your request added to cart!" });
    } else {
      return res
        .status(400)
        .send({
          error:
            "Couldn't add your request to cart now! Please try again later",
        });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({ error: error.message });
  }
});

router.post("/rentalCart", async (req, res) => {
  let { phoneNumber, laptopId, rentalPeriod, purposeOfRental, quantity } = req.body;
  try {
    if (!phoneNumber.startsWith("+91")) {
      phoneNumber = `+91${phoneNumber}`;
    }

    const existUser = await usersModel.findOne({ phoneNumber });
    if (!existUser) {
      return res.status(404).send({ error: "User not found!" });
    }

    const validLaptop = await rentLaptopModel.findOne({ _id: laptopId });
    if (!validLaptop) {
      return res.status(404).send({ error: "Invalid Laptop!" });
    }

    console.log("valid", validLaptop);
    console.log(validLaptop.description);


    let response;
    const unClosedCart = await cartModel.findOne({phoneNumber, status: "Pending"});
    if(unClosedCart){
      response = await cartModel.findOneAndUpdate({phoneNumber, status: "Pending"}, {$push: {products: {laptopId,
        brand: validLaptop.brand,
        model: validLaptop.model,
        image: validLaptop.image || "https://storage.googleapis.com/meetinground-464c9.appspot.com/images%2F1721714933768_Dell-XPS-13-Plus-2-2.webp",
        rentalPeriod, purposeOfRental,
        reviews: validLaptop.reviews,
        quantity: quantity || 1,
        processor: validLaptop.processor,
        ram: validLaptop.ram,
        screenSize: validLaptop.screenSize,
        storage: validLaptop.storage,
        operatingSystem: validLaptop.operatingSystem,
        description: validLaptop.description,
        images: validLaptop.images,
        image: validLaptop.image,
        type: "Rental", createdAt: moment(Date.now()).tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss"), updatedAt: moment(Date.now()).tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss")}}}, {new: true});
    } else {
      response = new cartModel({
        phoneNumber,
        products: {
          laptopId,
          rentalPeriod, purposeOfRental,
      brand: validLaptop.brand,
      model: validLaptop.model,
      image: validLaptop.image || "https://storage.googleapis.com/meetinground-464c9.appspot.com/images%2F1721714933768_Dell-XPS-13-Plus-2-2.webp",
      reviews: validLaptop.reviews,
      quantity: quantity || 1,
      processor: validLaptop.processor,
      ram: validLaptop.ram,
      screenSize: validLaptop.screenSize,
      storage: validLaptop.storage,
      operatingSystem: validLaptop.operatingSystem,
      description: validLaptop.description,
      images: validLaptop.images,
      image: validLaptop.image,
      type: "Rental", createdAt: moment(Date.now()).tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss"), updatedAt: moment(Date.now()).tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss")
        },
        status: "Pending"
      });
    }
    console.log(response);
    await response.save();

    if (response) {
      return res.status(200).send({ message: "Your request added to cart!" });
    } else {
      return res
        .status(400)
        .send({
          error:
            "Couldn't add your request to cart now! Please try again later",
        });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({ error: error.message });
  }
});

router.post("/refurbishedCart", async (req, res) => {
  let { phoneNumber, laptopId, quantity } = req.body;
  try {
    if (!phoneNumber.startsWith("+91")) {
      phoneNumber = `+91${phoneNumber}`;
    }

    const existUser = await usersModel.findOne({ phoneNumber });
    if (!existUser) {
      return res.status(404).send({ error: "User not found!" });
    }

    const validLaptop = await refurbishedLaptopModel.findOne({ _id: laptopId });
    if (!validLaptop) {
      return res.status(404).send({ error: "Invalid Laptop!" });
    }

    let response;
    const unClosedCart = await cartModel.findOne({phoneNumber, status: "Pending"});
    if(unClosedCart){
      response = await cartModel.findOneAndUpdate({phoneNumber, status: "Pending"}, {$push: {products: {laptopId,
        brand: validLaptop.brand,
        model: validLaptop.model,
        amount: validLaptop.amount,
        image: validLaptop.image || "https://storage.googleapis.com/meetinground-464c9.appspot.com/images%2F1721714956933_laptop-carousel1-010323.webp",
        reviews: validLaptop.reviews,
        quantity: quantity || 1,
        processor: validLaptop.processor,
        ram: validLaptop.ram,
        screenSize: validLaptop.screenSize,
        storage: validLaptop.storage,
        operatingSystem: validLaptop.operatingSystem,
        description: validLaptop.description,
        images: validLaptop.images,
        type: "Refurbished", createdAt: moment(Date.now()).tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss"), updatedAt: moment(Date.now()).tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss")}}}, {new: true});
    } else {
      response = new cartModel({
        phoneNumber,
        products: {
          laptopId,
      brand: validLaptop.brand,
      model: validLaptop.model,
      amount: validLaptop.amount,
      image: validLaptop.image || "https://storage.googleapis.com/meetinground-464c9.appspot.com/images%2F1721714956933_laptop-carousel1-010323.webp",
      reviews: validLaptop.reviews,
      quantity: quantity || 1,
      processor: validLaptop.processor,
      ram: validLaptop.ram,
      screenSize: validLaptop.screenSize,
      storage: validLaptop.storage,
      operatingSystem: validLaptop.operatingSystem,
      description: validLaptop.description,
      images: validLaptop.images,      
      type: "Refurbished", createdAt: moment(Date.now()).tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss"), updatedAt: moment(Date.now()).tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss")
        },
        status: "Pending"
      });
    }
    await response.save();

    if (response) {
      return res.status(200).send({ message: "Your request added to cart!" });
    } else {
      return res
        .status(400)
        .send({
          error:
            "Couldn't add your request to cart now! Please try again later",
        });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({ error: error.message });
  }
});

router.post("/addCart", async (req, res) => {
  let { phoneNumber, products } = req.body;

  try {
    if (!phoneNumber.startsWith("+91")) {
      phoneNumber = `+91${phoneNumber}`;
    }

    const existUser = await usersModel.findOne({ phoneNumber });
    if (!existUser) {
      return res.status(400).send({ error: "User not logged in! Please login to proceed further" });
    }

    let existCart = await cartModel.findOne({ phoneNumber, status: "Pending" });

    if (existCart) {
      for (const cart of products) {
        let updateProduct = {};

        if (cart.type === "Repair") {
          updateProduct = {
            type: cart.type,
            image: "https://storage.googleapis.com/meetinground-464c9.appspot.com/images%2F1721279195184_computer-repair.jpg",
            device: cart.device,
            issue: cart.issue,
            issueDetails: cart.issueDetails || null,
            brand: cart.brand,
            model: cart.model,
            operatingSystem: cart.operatingSystem,
            createdAt: moment().tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss"),
            updatedAt: moment().tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss")
          };
        } else if (cart.type === "Rental") {
          const validLaptop = await rentLaptopModel.findById(cart.laptopId);
          if (!validLaptop) {
            return res.status(404).send({ error: "Invalid Laptop!" });
          }
          updateProduct = {
            laptopId: validLaptop._id,
            brand: validLaptop.brand,
            model: validLaptop.model,
            image: validLaptop.image || "https://storage.googleapis.com/meetinground-464c9.appspot.com/images%2F1721714933768_Dell-XPS-13-Plus-2-2.webp",
            rentalPeriod: cart.rentalPeriod || null,
            purposeOfRental: cart.purposeOfRental || null,
            reviews: validLaptop.reviews,
            quantity: cart.quantity,
            type: "Rental",
            createdAt: moment().tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss"),
            updatedAt: moment().tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss")
          };
        } else if (cart.type === "Refurbished") {
          const validLaptop = await refurbishedLaptopModel.findById(cart.laptopId);
          if (!validLaptop) {
            return res.status(404).send({ error: "Invalid Laptop!" });
          }
          updateProduct = {
            laptopId: validLaptop._id,
            brand: validLaptop.brand,
            model: validLaptop.model,
            amount: validLaptop.amount,
            image: validLaptop.image || "https://storage.googleapis.com/meetinground-464c9.appspot.com/images%2F1721714956933_laptop-carousel1-010323.webp",
            reviews: validLaptop.reviews,
            quantity: cart.quantity,
            type: "Refurbished",
            createdAt: moment().tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss"),
            updatedAt: moment().tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss")
          };
        }

        await cartModel.findOneAndUpdate(
          { phoneNumber, status: "Pending" },
          { $push: { products: updateProduct } },
          { new: true }
        );
      }
    } else {  
      const newProducts = await Promise.all(products.map(async cart => {
        let product = {
          type: cart.type,
          brand: cart.brand,
          createdAt: moment().tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss"),
          updatedAt: moment().tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss")
        };

        if (cart.type === "Repair") {
          product = {
            ...product,
            image: "https://storage.googleapis.com/meetinground-464c9.appspot.com/images%2F1721279195184_computer-repair.jpg",
            device: cart.device,
            issue: cart.issue,
            issueDetails: cart.issueDetails || null,
            model: cart.model,
            operatingSystem: cart.operatingSystem,
          };
        } else if (cart.type === "Rental") {
          const validLaptop = await rentLaptopModel.findById(cart.laptopId);
          if (!validLaptop) {
            throw new Error("Invalid Laptop!");
          }
          product = {
            ...product,
            laptopId: cart.laptopId,
            model: validLaptop.model,
            image: validLaptop.image || "https://storage.googleapis.com/meetinground-464c9.appspot.com/images%2F1721714933768_Dell-XPS-13-Plus-2-2.webp",
            rentalPeriod: cart.rentalPeriod || null,
            purposeOfRental: cart.purposeOfRental || null,
            quantity: cart.quantity,
            reviews: validLaptop.reviews
          };
        } else if (cart.type === "Refurbished") {
          const validLaptop = await refurbishedLaptopModel.findById(cart.laptopId);
          if (!validLaptop) {
            throw new Error("Invalid Laptop!");
          }
          product = {
            ...product,
            laptopId: cart.laptopId,
            model: validLaptop.model,
            amount: validLaptop.amount,
            image: validLaptop.image || "https://storage.googleapis.com/meetinground-464c9.appspot.com/images%2F1721714956933_laptop-carousel1-010323.webp",
            quantity: cart.quantity,
            reviews: validLaptop.reviews
          };
        }

        return product;
      }));

      const newCart = new cartModel({
        phoneNumber,
        products: newProducts,
        status: "Pending"
      });

      await newCart.save();
    }

    return res.status(200).send({ message: "Cart added successfully!"});
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

router.post("/addQuote1/:cartId", async (req, res) => {
  let {
    phoneNumber,
    alternatePhoneNumber,
    email,
    userName,
    address,
    transactionId,
    amount,
    GST,
    coupon,
    initialAmountPaidThrough
  } = req.body;
  const { cartId } = req.params;
  
  try {
    if (!phoneNumber || !address || !userName || !email || !cartId ) {
      return res.status(400).send({ error: "Please fill all fields!" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(email){
      if(!emailRegex.test(email)){
        return res.status(400).send({error: "Invalid Email!"});
      }
    }

    if (!phoneNumber.startsWith("+91")) {
      phoneNumber = `+91${phoneNumber}`;
    }

    if(alternatePhoneNumber){
      if(!alternatePhoneNumber.startsWith("+91")){
        alternatePhoneNumber = `+91${alternatePhoneNumber}`
      }
    };

    const existUser = await usersModel.findOne({ phoneNumber });
    if (!existUser) {
      return res.status(404).send({ error: "User not logged in! Please login to continue further" });
    }

    const validCart = await cartModel.findOne({ _id: cartId, status: "Pending" });
    if (!validCart) {
      return res.status(400).send({ error: "Cart not found!" });
    };

    if(coupon){
      var validCoupon = await couponCodeModel.findOne({
        code: coupon,
        status: "Active",
      });
      
      if (!validCoupon) {
        return res.status(400).send({ error: "Invalid Coupon Code!" });
      } else {
        const expiredCoupon =
          validCoupon.redemeedUsers.length >= validCoupon.limit;
        if (expiredCoupon) {
          return res.status(400).send({ error: "Expired Coupon Code!" });
        }
  
        const usedCoupon = await couponCodeModel.findOne({
          code: coupon,
          "redemeedUsers.phoneNumber": phoneNumber,
        });
        if (usedCoupon) {
          return res
            .status(400)
            .send({ error: "You've already used this Coupon!" });
        }
      }
      console.log({"coupon:": validCoupon});
    } 
    
    const products = validCart.products;
    
    let initialAmount = amount || null;
    let initialGST = GST || null;
    if(initialAmountPaidThrough === "COD"){
      initialAmount = null,
      initialGST = null
    }

    for (const cart of products) {
      if (cart.type === "Repair") {
        const randomId = getRandomGenerationId();
        const newOrder = new orderModel({
          phoneNumber,
          alternatePhoneNumber,
          email,
          userName,
          address,
          transactionId: transactionId || null,
          amount: initialAmount,
          GST: initialGST,
          coupon: coupon || null,
          notes: null,
          type: "Repair",
      requestId:`${randomId}REP`,
      initialAmountPaidThrough: initialAmountPaidThrough || null,
          status: "Pending",
          assignedTo: null,
          assignedOn: null,
          technicianComments: null,
          closedOn: null,
          paidThrough: null,
          finalTransactionId: null,
          totalAmount: null,
          billGenerated: "no",
          totalAmountPaid: amount || 0
        });
        await newOrder.save();

        const newRequest = new serviceRequestsModel({
          requestId: newOrder.requestId,
            phoneNumber: newOrder.phoneNumber,
            alternatePhoneNumber: newOrder.alternatePhoneNumber,
            email: newOrder.email,
            userName: newOrder.userName,
            image: "https://storage.googleapis.com/meetinground-464c9.appspot.com/images%2F1721279195184_computer-repair.jpg",
            issue: cart.issue,
            issueDetails: cart.issueDetails ? cart.issueDetails : null,
            address: newOrder.address,
            status: "Pending",
            transactionId: newOrder.transactionId,
            amount: newOrder.amount,
            initialAmountPaidThrough: newOrder.initialAmountPaidThrough,
          GST:  newOrder.GST,
            type: "Repair",            
          totalAmountPaid: amount || 0
        });
        await newRequest.save();

        const notification = new notificationModel({
          title: "Repair Order Received!!",
          subtitle: `${newOrder.userName} | ${newOrder.phoneNumber}`,
          orderDetails: {
            phoneNumber: newOrder.phoneNumber,
            alternatePhoneNumber: newOrder.alternatePhoneNumber,
            userName: newOrder.userName,
            requestId: newOrder.requestId,
            email: newOrder.email,
            typeOfOrder: newOrder.type
          }
        });
        await notification.save();
        // notifications.push(notification);

        var repairRequestId = newOrder.requestId;
        var repairPhoneNumber = newOrder.phoneNumber;
        var repairTransactionId = newOrder.transactionId;
        var repairInitialAmountPaidThrough = newOrder.initialAmountPaidThrough;
        var repairAmount = newOrder.amount;

      } else if (cart.type === "Rental") {
        const validLaptop = await rentLaptopModel.findOne({
          _id: cart.laptopId,
        });
        if (!validLaptop) {
          return res.status(404).send({ error: "Rental product not found!" });
        }
        const randomId = getRandomGenerationId();
        const newQuotation = new quotationModel({
          phoneNumber,
          alternatePhoneNumber,
          email,
          userName,
          address,         
          notes: null,
          type: "Rental",
      requestId:`${randomId}REN`,
      initialAmountPaidThrough: "COD",
          status: "Pending",
          laptopId: validLaptop._id
        });
        await newQuotation.save();

        const newRequest = new rentalRequestsModel({
          requestId: newQuotation.requestId,
          laptopId: validLaptop._id,
          amountFor6Months: validLaptop.amountFor6Months,
          brand: validLaptop.brand,
          model: validLaptop.model,
          image: validLaptop.image,
          description: validLaptop.description,
          phoneNumber: newQuotation.phoneNumber,
          alternatePhoneNumber: newQuotation.alternatePhoneNumber,
          userName: newQuotation.userName,
          email: newQuotation.email,
          rentalPeriod: cart.note || null,
          purposeOfRental: cart.purposeOfRental || null,
          address: address || newQuotation.address,
          quantity: cart.quantity,
          status: "Pending",
          type: "Rental",    
          quotationConfirmation: "Pending",                             
          totalAmountPaid: 0,
          initialAmountPaidThrough: "COD"
        });
        await newRequest.save();
        
          const validTemplate = await emailTemplateModel.findOne({templateName: "Quotation Confirmation Email"});
          if(validTemplate){
            const gmailUserName = await settingsModel.findOne({credentialsKey: "GMAIL_USER" });
            const gmailPassword = await settingsModel.findOne({credentialsKey: "GMAIL_PASSWORD" });
      
            const transporter = nodemailer.createTransport({
              service: "Gmail",
              auth: {
                user: gmailUserName.credentialsValue,
                pass: gmailPassword.credentialsValue
              }
            });

            const socialMediaLinks = await settingsModel.find({credentialsKey: {$in: ["facebook", "whatsapp", "twitter", "instagram", "linkedin"]}});

            const socialMediaMap = socialMediaLinks.reduce((acc, item) => {
              acc[item.credentialsKey] = item.credentialsValue;
              return acc;
            }, {});
        
            const message = {
            from: gmailUserName.credentialsValue,
            to: email,
            subject: validTemplate.subject,
            text: `
${validTemplate.body}

Follow Us On:
Facebook:  ${socialMediaMap.facebook || "N/A"}
Twitter:   ${socialMediaMap.twitter || "N/A"}
Whatsapp:  ${socialMediaMap.whatsapp || "N/A"}
Instagram: ${socialMediaMap.instagram || "N/A"}
LinkedIn:  ${socialMediaMap.linkedin || "N/A"}
`
            };
      
            transporter.sendMail(message);
      
            const newEmail = new emailModel({
              phoneNumber,
              email,
              templateName: validTemplate.templateName,
              type: "individual"
            });
            await newEmail.save();
          } else {
            const notification = new notificationModel({
              title: `"Quotation Confirmation Email" Template not Exist!!`,
              subtitle: `"Quotation Confirmation Email" was not exist in the Database. Please add this as soon as possible to send "Quotation Confirmation Email" to the Users.`
            });
            await notification.save();
          }
      } else if (cart.type === "Refurbished") {
        const validLaptop = await refurbishedLaptopModel.findOne({
          _id: cart.laptopId,
        });
        if (!validLaptop) {
          return res.status(404).send({ error: "Refurbished product not found!" });
        }
        const randomId = getRandomGenerationId();
        const newOrder = new orderModel({
          phoneNumber,
          alternatePhoneNumber,
          email,
          userName,
          address,         
          notes: null,
          type: "Refurbished",
      requestId:`${randomId}REF`,
      initialAmountPaidThrough: "COD",
      status: "Pending",
      assignedTo: null,
      assignedOn: null,
      technicianComments: null,
      closedOn: null,
      paidThrough: null,
      finalTransactionId: null,
      totalAmount: null,
      billGenerated: "no",
      totalAmountPaid: 0
    });
    await newOrder.save();
    
    const newRequest = new refurbishedRequestsModel({
      requestId: newOrder.requestId,
      laptopId: cart.laptopId,
      brand: validLaptop.brand,
      image: validLaptop.image,
      model: validLaptop.model,
      amount: validLaptop.amount,
      description: validLaptop.description,
      phoneNumber: newOrder.phoneNumber,
      alternatePhoneNumber: newOrder.alternatePhoneNumber,
      userName: newOrder.userName,
      email: newOrder.email,
      address: address || newOrder.address,
      quantity: cart.quantity,
      status: "Pending",
      type: "Refurbished",                       
      totalAmountPaid: 0,
      initialAmountPaidThrough: "COD",
        });
        await newRequest.save();

        const notification = new notificationModel({
          title: "Refurbished Order Received!!",
          subtitle: `${newOrder.userName} | ${newOrder.phoneNumber}`,
          orderDetails: {
            phoneNumber: newOrder.phoneNumber,
            alternatePhoneNumber: newOrder.alternatePhoneNumber,
            userName: newOrder.userName,
            requestId: newOrder.requestId,
            email: newOrder.email,
            typeOfOrder: newOrder.type,
            quantity: newRequest.quantity
          }
        });
        await notification.save();
      } 
    }

    if(coupon){
      var validCoupon = await couponCodeModel.findOne({
        code: coupon,
        status: "Active",
      });
      
      if (!validCoupon) {
        return res.status(400).send({ error: "Invalid Coupon Code!" });
      } else {
        const expiredCoupon =
          validCoupon.redemeedUsers.length >= validCoupon.limit;
        if (expiredCoupon) {
          return res.status(400).send({ error: "Expired Coupon Code!" });
        }
  
        const usedCoupon = await couponCodeModel.findOne({
          code: coupon,
          "redemeedUsers.phoneNumber": phoneNumber,
        });
        if (usedCoupon) {
          return res
            .status(400)
            .send({ error: "You've already used this Coupon!" });
        }
        await couponCodeModel.findOneAndUpdate(
          { _id: validCoupon._id },
          { $addToSet: { redemeedUsers: { phoneNumber } } },
          { new: true }
        );
      }
      console.log({"coupon:": validCoupon});
    } 
    

    const updateFields = {};
    if (!existUser.userName) updateFields.userName = userName;
    if (!existUser.email) updateFields.email = email;

    if (address) {
      const bookingAddressObj = { address: address, primaryAddress: true };
      if (!existUser.address) {
        updateFields.address = [address];
      } else if (
        !existUser.address.some(
          (addre) => addre.address === bookingAddressObj.address
        )
      ) {
        updateFields.address = [
          ...existUser.address,
          bookingAddressObj,
        ];
      }

      const check = existUser.address.find(addre => addre.primaryAddress === true);
      if(check){
        check.primaryAddress = false;
        // check.save();
      }
    }

    // if (Object.keys(updateFields).length > 0) {
    //   await usersModel.findOneAndUpdate(
    //     { phoneNumber },
    //     { $set: updateFields },
    //     { new: true }
    //   );
    // }

    if (Object.keys(updateFields).length > 0) {
      existUser.set(updateFields);
      await existUser.save();
    }

    if(transactionId && amount){
      const newTransaction = await transactionModel({
        phoneNumber:repairPhoneNumber,
        transactionId:repairTransactionId,
        amount:repairAmount,
        modeOfPayment:repairInitialAmountPaidThrough,
        couponCode: validCoupon?.code || null,
        couponValue: validCoupon?.value || null,
        requestId: repairRequestId,
        status: "Pending",
        type: "Repair"
      });
      
      await newTransaction.save();
    }
      const validTemplate = await emailTemplateModel.findOne({templateName: "Order Confirmation Email"});
      if(validTemplate){
        const gmailUserName = await settingsModel.findOne({credentialsKey: "GMAIL_USER" });
        const gmailPassword = await settingsModel.findOne({credentialsKey: "GMAIL_PASSWORD" });
  
        const transporter = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: gmailUserName.credentialsValue,
            pass: gmailPassword.credentialsValue
          }
        });

        const socialMediaLinks = await settingsModel.find({credentialsKey: {$in: ["linkedin", "whatsapp", "facebook", "twitter", "instagram"]}});

        const socialMediaMap = socialMediaLinks.reduce((acc, item) => {
          acc[item.credentialsKey] = item.credentialsValue;
          return acc;
        }, {});
    
        const message = {
        from: gmailUserName.credentialsValue,
        to: email,
        subject: validTemplate.subject,
        text: `
${validTemplate.body}

Follow Us On:
Facebook:  ${socialMediaMap.facebook || "N/A"}
Twitter:   ${socialMediaMap.twitter || "N/A"}
Whatsapp:  ${socialMediaMap.whatsapp || "N/A"}
Instagram: ${socialMediaMap.instagram || "N/A"}
LinkedIn:  ${socialMediaMap.linkedin || "N/A"}
        `
        };
  
        transporter.sendMail(message);
  
        const newEmail = new emailModel({
          phoneNumber,
          email,
          templateName: validTemplate.templateName,
              type: "individual"
        });
        await newEmail.save();
      } else {
        const notification = new notificationModel({
          title: `"Order Confirmation Email" Template not Exist!!`,
          subtitle: `"Order Confirmation Email" was not exist in the Database. Please add this as soon as possible to send "Order Confirmation Email" to the Users.`
        });
        await notification.save();
      }

    await cartModel.findOneAndUpdate({_id: cartId}, {$set: {status: "Completed"}}, {new: true});
    return res.status(200).send({
      message: "Your request was received successfully! Our team will contact you shortly."
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({ error: error.message, coupon});
  }
});

router.post("/addQuote/:cartId", async (req, res) => {
  let {
    phoneNumber,
    alternatePhoneNumber,
    email,
    userName,
    address,
    transactionId,
    amount,
    GST,
    coupon,
    initialAmountPaidThrough
  } = req.body;
  const { cartId } = req.params;
  
  try {
    if (!phoneNumber || !address || !userName || !email || !cartId ) {
      return res.status(400).send({ error: "Please fill all fields!" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(email){
      if(!emailRegex.test(email)){
        return res.status(400).send({error: "Invalid Email!"});
      }
    }

    if (!phoneNumber.startsWith("+91")) {
      phoneNumber = `+91${phoneNumber}`;
    }

    if(alternatePhoneNumber){
      if(!alternatePhoneNumber.startsWith("+91")){
        alternatePhoneNumber = `+91${alternatePhoneNumber}`
      }
    };

    const existUser = await usersModel.findOne({ phoneNumber });
    if (!existUser) {
      return res.status(404).send({ error: "User not logged in! Please login to continue further" });
    }

    const validCart = await cartModel.findOne({ _id: cartId, status: "Pending" });
    if (!validCart) {
      return res.status(400).send({ error: "Cart not found!" });
    };

    if(coupon){
      var validCoupon = await couponCodeModel.findOne({
        code: coupon,
        status: "Active",
      });
      
      if (!validCoupon) {
        return res.status(400).send({ error: "Invalid Coupon Code!" });
      } else {
        const expiredCoupon =
          validCoupon.redemeedUsers.length >= validCoupon.limit;
        if (expiredCoupon) {
          return res.status(400).send({ error: "Expired Coupon Code!" });
        }
  
        const usedCoupon = await couponCodeModel.findOne({
          code: coupon,
          "redemeedUsers.phoneNumber": phoneNumber,
        });
        if (usedCoupon) {
          return res
            .status(400)
            .send({ error: "You've already used this Coupon!" });
        }
      }
      console.log({"coupon:": validCoupon});
    } 
    
    const products = validCart.products;
    
    let initialAmount = amount || null;
    let initialGST = GST || null;
    if(initialAmountPaidThrough === "COD"){
      initialAmount = null,
      initialGST = null
    }

    for (const cart of products) {
      if (cart.type === "Repair") {
        const randomId = getRandomGenerationId();
        const newOrder = new orderModel({
          phoneNumber,
          alternatePhoneNumber,
          email,
          userName,
          address,
          transactionId: transactionId || null,
          amount: initialAmount,
          GST: initialGST,
          coupon: coupon || null,
          notes: null,
          type: "Repair",
      requestId:`${randomId}REP`,
      initialAmountPaidThrough: initialAmountPaidThrough || null,
          status: "Pending",
          assignedTo: null,
          assignedOn: null,
          technicianComments: null,
          closedOn: null,
          paidThrough: null,
          finalTransactionId: null,
          totalAmount: null,
          billGenerated: "no",
          totalAmountPaid: amount || 0
        });
        await newOrder.save();

        const newRequest = new serviceRequestsModel({
          requestId: newOrder.requestId,
            phoneNumber: newOrder.phoneNumber,
            alternatePhoneNumber: newOrder.alternatePhoneNumber,
            email: newOrder.email,
            userName: newOrder.userName,
            image: "https://storage.googleapis.com/meetinground-464c9.appspot.com/images%2F1721279195184_computer-repair.jpg",
            issue: cart.issue,
            issueDetails: cart.issueDetails ? cart.issueDetails : null,
            address: newOrder.address,
            status: "Pending",
            transactionId: newOrder.transactionId,
            amount: newOrder.amount,
            initialAmountPaidThrough: newOrder.initialAmountPaidThrough,
          GST:  newOrder.GST,
            type: "Repair",            
          totalAmountPaid: amount || 0
        });
        await newRequest.save();

        const notification = new notificationModel({
          title: "Repair Order Received!!",
          subtitle: `${newOrder.userName} | ${newOrder.phoneNumber}`,
          orderDetails: {
            phoneNumber: newOrder.phoneNumber,
            alternatePhoneNumber: newOrder.alternatePhoneNumber,
            userName: newOrder.userName,
            requestId: newOrder.requestId,
            email: newOrder.email,
            typeOfOrder: newOrder.type
          }
        });
        await notification.save();
        // notifications.push(notification);

        var repairRequestId = newOrder.requestId;
        var repairPhoneNumber = newOrder.phoneNumber;
        var repairTransactionId = newOrder.transactionId;
        var repairInitialAmountPaidThrough = newOrder.initialAmountPaidThrough;
        var repairAmount = newOrder.amount;

      } else if (cart.type === "Rental") {
        const validLaptop = await rentLaptopModel.findOne({
          _id: cart.laptopId,
        });
        if (!validLaptop) {
          return res.status(404).send({ error: "Rental product not found!" });
        }
        const randomId = getRandomGenerationId();
        const newQuotation = new quotationModel({
          phoneNumber,
          alternatePhoneNumber,
          email,
          userName,
          address,         
          notes: null,
          type: "Rental",
      requestId:`${randomId}REN`,
      initialAmountPaidThrough: "COD",
          status: "Pending",
          laptopId: validLaptop._id,
          quantity: cart.quantity
        });
        await newQuotation.save();

        const newRequest = new rentalRequestsModel({
          requestId: newQuotation.requestId,
          laptopId: validLaptop._id,
          amountFor6Months: validLaptop.amountFor6Months,
          brand: validLaptop.brand,
          model: validLaptop.model,
          image: validLaptop.image,
          description: validLaptop.description,
          phoneNumber: newQuotation.phoneNumber,
          alternatePhoneNumber: newQuotation.alternatePhoneNumber,
          userName: newQuotation.userName,
          email: newQuotation.email,
          rentalPeriod: cart.note || null,
          purposeOfRental: cart.purposeOfRental || null,
          address: address || newQuotation.address,
          quantity: cart.quantity,
          status: "Pending",
          type: "Rental",    
          quotationConfirmation: "Pending",                             
          totalAmountPaid: 0,
          initialAmountPaidThrough: "COD"
        });
        await newRequest.save();
        
          const validTemplate = await emailTemplateModel.findOne({templateName: "Quotation Confirmation Email"});
          if(validTemplate){
            const gmailUserName = await settingsModel.findOne({credentialsKey: "GMAIL_USER" });
            const gmailPassword = await settingsModel.findOne({credentialsKey: "GMAIL_PASSWORD" });
      
            const transporter = nodemailer.createTransport({
              service: "Gmail",
              auth: {
                user: gmailUserName.credentialsValue,
                pass: gmailPassword.credentialsValue
              }
            });

            const socialMediaLinks = await settingsModel.find({credentialsKey: {$in: ["facebook", "whatsapp", "twitter", "instagram", "linkedin"]}});

            const socialMediaMap = socialMediaLinks.reduce((acc, item) => {
              acc[item.credentialsKey] = item.credentialsValue;
              return acc;
            }, {});
        
            const message = {
            from: gmailUserName.credentialsValue,
            to: email,
            subject: validTemplate.subject,
            text: `
${validTemplate.body}

Follow Us On:
Facebook:  ${socialMediaMap.facebook || "N/A"}
Twitter:   ${socialMediaMap.twitter || "N/A"}
Whatsapp:  ${socialMediaMap.whatsapp || "N/A"}
Instagram: ${socialMediaMap.instagram || "N/A"}
LinkedIn:  ${socialMediaMap.linkedin || "N/A"}
`
            };
      
            transporter.sendMail(message);
      
            const newEmail = new emailModel({
              phoneNumber,
              email,
              templateName: validTemplate.templateName,
              type: "individual"
            });
            await newEmail.save();
          } else {
            const notification = new notificationModel({
              title: `"Quotation Confirmation Email" Template not Exist!!`,
              subtitle: `"Quotation Confirmation Email" was not exist in the Database. Please add this as soon as possible to send "Quotation Confirmation Email" to the Users.`
            });
            await notification.save();
          }
      } else if (cart.type === "Refurbished") {
        const validLaptop = await refurbishedLaptopModel.findOne({
          _id: cart.laptopId,
        });
        if (!validLaptop) {
          return res.status(404).send({ error: "Refurbished product not found!" });
        }
        const randomId = getRandomGenerationId();
        const newOrder = new orderModel({
          phoneNumber,
          alternatePhoneNumber,
          email,
          userName,
          address,         
          notes: null,
          type: "Refurbished",
      requestId:`${randomId}REF`,
      initialAmountPaidThrough: "COD",
      status: "Pending",
      assignedTo: null,
      assignedOn: null,
      technicianComments: null,
      closedOn: null,
      paidThrough: null,
      finalTransactionId: null,
      totalAmount: null,
      billGenerated: "no",
      totalAmountPaid: 0
    });
    await newOrder.save();
    
    const newRequest = new refurbishedRequestsModel({
      requestId: newOrder.requestId,
      laptopId: cart.laptopId,
      brand: validLaptop.brand,
      image: validLaptop.image,
      model: validLaptop.model,
      amount: validLaptop.amount,
      description: validLaptop.description,
      phoneNumber: newOrder.phoneNumber,
      alternatePhoneNumber: newOrder.alternatePhoneNumber,
      userName: newOrder.userName,
      email: newOrder.email,
      address: address || newOrder.address,
      quantity: cart.quantity,
      status: "Pending",
      type: "Refurbished",                       
      totalAmountPaid: 0,
      initialAmountPaidThrough: "COD",
        });
        await newRequest.save();

        const notification = new notificationModel({
          title: "Refurbished Order Received!!",
          subtitle: `${newOrder.userName} | ${newOrder.phoneNumber}`,
          orderDetails: {
            phoneNumber: newOrder.phoneNumber,
            alternatePhoneNumber: newOrder.alternatePhoneNumber,
            userName: newOrder.userName,
            requestId: newOrder.requestId,
            email: newOrder.email,
            typeOfOrder: newOrder.type,
            quantity: newRequest.quantity
          }
        });
        await notification.save();
      } 
    }

    if(coupon){
      var validCoupon = await couponCodeModel.findOne({
        code: coupon,
        status: "Active",
      });
      
      if (!validCoupon) {
        return res.status(400).send({ error: "Invalid Coupon Code!" });
      } else {
        const expiredCoupon =
          validCoupon.redemeedUsers.length >= validCoupon.limit;
        if (expiredCoupon) {
          return res.status(400).send({ error: "Expired Coupon Code!" });
        }
  
        const usedCoupon = await couponCodeModel.findOne({
          code: coupon,
          "redemeedUsers.phoneNumber": phoneNumber,
        });
        if (usedCoupon) {
          return res
            .status(400)
            .send({ error: "You've already used this Coupon!" });
        }
        await couponCodeModel.findOneAndUpdate(
          { _id: validCoupon._id },
          { $addToSet: { redemeedUsers: { phoneNumber } } },
          { new: true }
        );
      }
      console.log({"coupon:": validCoupon});
    } 
    

    const updateFields = {};
    if (!existUser.userName) updateFields.userName = userName;
    if (!existUser.email) updateFields.email = email;

    if (address) {
     address = address.split(" - ")[0];
      const bookingAddressObj = { address: address, primaryAddress: true };
      if (!existUser.address) {
        updateFields.address = [address];
      } else if (
        !existUser.address.some(
          (addre) => addre.address === bookingAddressObj.address
        )
      ) {
        updateFields.address = [
          ...existUser.address,
          bookingAddressObj,
        ];
      }

      const check = existUser.address.find(addre => addre.primaryAddress === true);
      if(check){
        check.primaryAddress = false;
        // check.save();
      }
    }

    // if (Object.keys(updateFields).length > 0) {
    //   await usersModel.findOneAndUpdate(
    //     { phoneNumber },
    //     { $set: updateFields },
    //     { new: true }
    //   );
    // }

    if (Object.keys(updateFields).length > 0) {
      existUser.set(updateFields);
      await existUser.save();
    }

    if(transactionId && amount){
      const newTransaction = await transactionModel({
        phoneNumber:repairPhoneNumber,
        transactionId:repairTransactionId,
        amount:repairAmount,
        modeOfPayment:repairInitialAmountPaidThrough,
        couponCode: validCoupon?.code || null,
        couponValue: validCoupon?.value || null,
        requestId: repairRequestId,
        status: "Pending",
        type: "Repair"
      });
      
      await newTransaction.save();
    }
      const validTemplate = await emailTemplateModel.findOne({templateName: "Order Confirmation Email"});
      if(validTemplate){
        const gmailUserName = await settingsModel.findOne({credentialsKey: "GMAIL_USER" });
        const gmailPassword = await settingsModel.findOne({credentialsKey: "GMAIL_PASSWORD" });
  
        const transporter = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: gmailUserName.credentialsValue,
            pass: gmailPassword.credentialsValue
          }
        });

        const socialMediaLinks = await settingsModel.find({credentialsKey: {$in: ["linkedin", "whatsapp", "facebook", "twitter", "instagram"]}});

        const socialMediaMap = socialMediaLinks.reduce((acc, item) => {
          acc[item.credentialsKey] = item.credentialsValue;
          return acc;
        }, {});
    
        const message = {
        from: gmailUserName.credentialsValue,
        to: email,
        subject: validTemplate.subject,
        text: `
${validTemplate.body}

Follow Us On:
Facebook:  ${socialMediaMap.facebook || "N/A"}
Twitter:   ${socialMediaMap.twitter || "N/A"}
Whatsapp:  ${socialMediaMap.whatsapp || "N/A"}
Instagram: ${socialMediaMap.instagram || "N/A"}
LinkedIn:  ${socialMediaMap.linkedin || "N/A"}
        `
        };
  
        transporter.sendMail(message);
  
        const newEmail = new emailModel({
          phoneNumber,
          email,
          templateName: validTemplate.templateName,
              type: "individual"
        });
        await newEmail.save();
      } else {
        const notification = new notificationModel({
          title: `"Order Confirmation Email" Template not Exist!!`,
          subtitle: `"Order Confirmation Email" was not exist in the Database. Please add this as soon as possible to send "Order Confirmation Email" to the Users.`
        });
        await notification.save();
      }

    await cartModel.findOneAndUpdate({_id: cartId}, {$set: {status: "Completed"}}, {new: true});
    return res.status(200).send({
      message: "Your request was received successfully! Our team will contact you shortly."
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({ error: error.message, coupon});
  }
});

// router.post("/verifyCoupon", async (req, res) => {
//   let { phoneNumber, coupon, type } = req.body;
//   try {
//     if (!phoneNumber.startsWith("+91")) {
//       phoneNumber = `+91${phoneNumber}`;
//     }

//     const existingUser = await usersModel.findOne({ phoneNumber });
//     if (!existingUser) {
//       return res
//         .status(404)
//         .send({ error: "User not logged in! Please login to proceed further" });
//     }

//     var validCoupon = await couponCodeModel.findOne({
//       code: coupon,
//       status: "Active",
//     });

//     if(type){
//       var validCoupon = await couponCodeModel.findOne({
//         code: coupon,
//         status: "Active",
//       });
//       const coupons = validCoupon.applicable.split(",").find(couponType => couponType.trim() === type);
//       if(!coupons){
//         return res.status(400).send({error: `Sorry! This coupon is not applicable for ${type}`})
//       }
//     }

//     if (!validCoupon) {
//       return res.status(400).send({ error: "Invalid Coupon Code!" });
//     } else {
//       const expiredCoupon =
//         validCoupon.redemeedUsers.length >= validCoupon.limit;
//       if (expiredCoupon) {
//         return res.status(400).send({ error: "Expired Coupon Code!" });
//       }

//       const usedCoupon = await couponCodeModel.findOne({
//         code: coupon,
//         "redemeedUsers.phoneNumber": phoneNumber,
//       });
//       if (usedCoupon) {
//         return res
//           .status(400)
//           .send({ error: "You've already used this Coupon!" });
//       }
//     }

//     const validCart = await cartModel.findOne({phoneNumber, status: "Pending"});
//     if(!validCart){
//       return res.status(400).send({error: "Your cart is empty!"})
//     } 

//     const amount = validCart.products.filter(pro => pro.type === "Repair");
//     const totalAmount = (amount.length * 199);



//     const payableAmount = totalAmount - validCoupon.value;

//     return res
//       .status(200)
//       .send({ message: "Coupon verified successfully!", payableAmount });
//   } catch (error) {
//     console.error("Error:", error.message);
//     res
//       .status(500)
//       .send({ error: "Couldn't Verify Coupon now! Please try again later" });
//   }
// });

router.post("/verifyCoupon", async (req, res) => {
  let { phoneNumber, coupon, type } = req.body;
  try {
    if (!phoneNumber.startsWith("+91")) {
      phoneNumber = `+91${phoneNumber}`;
    }

    const existingUser = await usersModel.findOne({ phoneNumber });
    if (!existingUser) {
      return res
        .status(404)
        .send({ error: "User not logged in! Please login to proceed further" });
    }

    var validCoupon = await couponCodeModel.findOne({
      code: coupon,
      status: "Active",
    });

    if(type){
      var validCoupon = await couponCodeModel.findOne({
        code: coupon,
        status: "Active",
      });
      const coupons = validCoupon.applicable.split(",").find(couponType => couponType.trim() === type);
      if(!coupons){
        return res.status(400).send({error: `Sorry! This coupon is not applicable for ${type}`})
      }
    }

    if (!validCoupon) {
      return res.status(400).send({ error: "Invalid Coupon Code!" });
    } else {
      const expiredCoupon =
        validCoupon.redemeedUsers.length >= validCoupon.limit;
      if (expiredCoupon) {
        return res.status(400).send({ error: "Expired Coupon Code!" });
      }

      const usedCoupon = await couponCodeModel.findOne({
        code: coupon,
        "redemeedUsers.phoneNumber": phoneNumber,
      });
      if (usedCoupon) {
        return res
          .status(400)
          .send({ error: "You've already used this Coupon!" });
      }
    }

    const validCart = await cartModel.findOne({phoneNumber, status: "Pending"});
    if(!validCart){
      return res.status(400).send({error: "Your cart is empty!"})
    } 

    const amount = validCart.products.filter(pro => pro.type === "Repair");

    const initialAmount = await settingsModel.findOne({type: "initialAmount"});
    
    const totalAmountBeforeGST = (amount.length * initialAmount.credentialsValue) - validCoupon.value;
    
    const GST = totalAmountBeforeGST * 0.18;
    const payableAmount = totalAmountBeforeGST + GST;

    return res
      .status(200)
      .send({ message: "Coupon verified successfully!", totalAmountBeforeGST,GST,  payableAmount });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't Verify Coupon now! Please try again later" });
  }
});

// router.get("/mainSearch/:search", async (req, res) => {
//   const searchString = req.params.search || "";
//   try {
//     const escapedSearchString = searchString.replace(/\+/g, "\\+");
//     const searchRegex = new RegExp(escapedSearchString, "i");
    
//     const services = ["Laptop Repair & Service", "MacBook Repair", "Laptop for Rental", "Refurbished Laptops", "Desktop Repair"]
//     // if(!searchString){
//     //   return res.status(200).send({data: services, rentalCarousel: [], refurbishedCarousel: [] })
//     // }

//     const filteredServices = services.filter(serv => searchRegex.test(serv));

//     const query = {
//       status: "Active",
//       $or: [
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

//     let response = [...filteredServices];

//     const validCategoryRental = await categoryModel.findOne({category: "Rental", status: "Active"});
//     if(validCategoryRental){
      
//       const rental = await rentLaptopModel.find(query);
//       response.push(...rental);
//     }
    
//     const validCategoryRefurbished = await categoryModel.findOne({category: "Refurbished", status: "Active"});
//     if(validCategoryRefurbished){
//       const refurbished = await refurbishedLaptopModel.find(query);
//       response.push(...refurbished);
//     }

//     const rentalCarousel = await rentLaptopModel.find({ addInCarousel: true });
//     const refurbishedCarousel = await refurbishedLaptopModel.find({ addInCarousel: true });


//       return res.status(200).send({ data: response, rentalCarousel, refurbishedCarousel });
    
//   } catch (error) {
//     console.error("Error:", error.message);
//     res.status(500).send({ error: "Internal Server Error" });
//   }
// });

router.get("/mainSearch/:search", async (req, res) => {
  const searchString = req.params.search || "";
  try {
    const escapedSearchString = searchString.replace(/\+/g, "\\+");
    const searchRegex = new RegExp(escapedSearchString, "i");
    
    const services = ["Laptop Repair & Service", "MacBook Repair", "Laptop for Rental", "Refurbished Laptops", "Desktop Repair"]
    if(!searchString){
      return res.status(200).send({data: services, rentalCarousel: [], refurbishedCarousel: [] })
    }

    const filteredServices = services.filter(serv => searchRegex.test(serv));

    const query = {
      status: "Active",
      $or: [
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

    let response = [...filteredServices];
    // let response = [];

    const validCategoryRental = await categoryModel.findOne({category: "Rental", status: "Active"});
    if(validCategoryRental){      
      const rental = await rentLaptopModel.find(query);
      rental.forEach((laptop) => {
        laptop.reviews = laptop.reviews.filter((review) =>  review.status === "Approved")
      })
      response.push(...rental);
    }
    
    const validCategoryRefurbished = await categoryModel.findOne({category: "Refurbished", status: "Active"});
    if(validCategoryRefurbished){
      const refurbished = await refurbishedLaptopModel.find(query);
      refurbished.forEach((laptop) => {
        laptop.reviews = laptop.reviews.filter((review) => review.status === "Approved");
      })
      response.push(...refurbished);
    }

    const rentalCarousel = await rentLaptopModel.find({ addInCarousel: true });
    const youMayLikeRental = rentalCarousel.map((laptop) => {
      const reviews = laptop.reviews.filter((review) => review.status === "Approved");
      return {
        ...laptop._doc,
        reviews
      }
    })
    const refurbishedCarousel = await refurbishedLaptopModel.find({ addInCarousel: true });
    const youMayLikeRefurbished = refurbishedCarousel.map((laptop) => {
      const reviews = laptop.reviews.filter((review) => review.status === "Approved");
      return {
        ...laptop._doc,
        reviews
      }
    })


      return res.status(200).send({ data: response, rentalCarousel: youMayLikeRental, refurbishedCarousel: youMayLikeRefurbished });
    
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// router.post("/chatBot", async (req, res) => {
//   let { phoneNumber, userName, email, query, requestId } = req.body;

//   try {
//     if (phoneNumber && !phoneNumber.startsWith("+91")) {
//       phoneNumber = `+91${phoneNumber}`;
//     }

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if(email){
//       if(!emailRegex.test(email)){
//         return res.status(400).send({error: "Invalid Email!"});
//       }
//     }

//     if (phoneNumber && !userName && !query && !requestId) {
//       const existUser = await usersModel.findOne({ phoneNumber });
//       if (!existUser) {
//         return res.status(200).send({
//           message: "Please write your query here. Our team will contact you shortly!",
//           statusCode: "404",
//         });
//       } else {
//         const existService = await serviceRequestsModel.find({ phoneNumber });
//         const rentalService = await rentalRequestsModel.find({ phoneNumber });
//         if (existService.length === 0 && rentalService.length === 0) {
//           return res.status(200).send({
//             message: "Please write your query here. Our team will contact you shortly!",
//             statusCode: "404",
//           });
//         } else {
//           return res.status(200).send({
//             message: "Do you have any issues in your previous Orders?",
//             statusCode: "200",
//           });
//         }
//       }
//     }

//     if (phoneNumber && requestId) {
//       let validStatus;

//       const rental = await rentalRequestsModel.findOne({ requestId });
//       if (rental) {
//         validStatus = rental;
//       } else {
//         const service = await serviceRequestsModel.findOne({ requestId });
//         if (service) {
//           validStatus = service;
//         }
//       }

//       if (!validStatus || !validStatus.status) {
//         return res.status(200).send({
//           message: "We can't read your message now! Please enter your concern and we'll contact you shortly",
//         });
//       }

//       return res.status(200).send({
//         message: `Dear User, Status for your requestID is '${validStatus.status}'`,
//       });
//     }

//     if (phoneNumber && userName && email && query) {
//       const existUser = await usersModel.findOne({ phoneNumber });
//       const response = new supportFormModel({
//         phoneNumber,
//         userName,
//         email,
//         message: query,
//         adminComments: null,
//         doneBy: null, 
//         status: "Pending",
//         type: "ChatBOT"
//       });
//       await response.save();

//       const notifications = new notificationModel({
//         title: "New Support Received!!",
//         subtitle: "Request from ChatBOT",
//         orderDetails: {
//           phoneNumber: response.phoneNumber,
//           userName: response.userName,
//           email: response.email,
//           query: response.message,
//           userStatus: response.status,
//         },
//       });
//       await notifications.save();

//       return res.status(200).send({
//         message: "Your query received successfully! Our team will contact you shortly",
//       });
//     }

//     return res.status(400).send({ message: "Incomplete data provided." });
//   } catch (error) {
//     console.error("Error:", error.message);
//     return res.status(500).send({ error: "Internal Server Error" });
//   }
// });

router.post("/chatBot", async (req, res) => {
  let { phoneNumber, userName, email, query, requestId } = req.body;

  try {
    if (phoneNumber && !phoneNumber.startsWith("+91")) {
      phoneNumber = `+91${phoneNumber}`;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(email){
      if(!emailRegex.test(email)){
        return res.status(400).send({error: "Invalid Email!"});
      }
    }

    if (phoneNumber && !userName && !query && !requestId) {
      const existUser = await usersModel.findOne({ phoneNumber });
      if (!existUser) {
        return res.status(200).send({
          message: "Please write your query here. Our team will contact you shortly!",
          statusCode: "404",
        });
      } else {
        const existService = await orderModel.find({ phoneNumber });
        if (existService.length === 0) {
          return res.status(200).send({
            message: "Please write your query here. Our team will contact you shortly!",
            statusCode: "404",
          });
        } else {
          return res.status(200).send({
            message: "Do you have any issues in your previous Orders?",
            statusCode: "200",
          });
        }
      }
    }

    if (phoneNumber && requestId) {
      let validStatus;

      const order = await orderModel.findOne({ requestId });
      if (order) {
        validStatus = order.status;
      } else {
        return res.status(200).send({
          message: "We can't read your message now! Please enter your concern and we'll contact you shortly",
        });
      }

      return res.status(200).send({
        message: `Dear User, Status for your requestID is '${validStatus}'`,
      });
    }

    if (phoneNumber && userName && email && query) {
      const now = moment().tz('Asia/Kolkata').format("DD/MM/YY");
      const year = now.split("/")[2];
      const month = now.split("/")[1];
      
      const prevSupportId = await supportFormModel.findOne().sort({createdAt: -1}).limit(1);
      const idOfSupport = prevSupportId.supportId.substring(7);
      
      const previousSupportId = parseFloat(idOfSupport, 10) + 1;
      const previousSupportIdFormatted = previousSupportId.toString().padStart(2, "0");
      
      const newSupportId = `SUP${year}${month}${previousSupportIdFormatted}`

      const response = new supportFormModel({
        supportId: newSupportId,
        phoneNumber,
        userName,
        email,
        message: query,
        adminComments: null,
        doneBy: null, 
        status: "Pending",
        type: "ChatBOT"
      });
      await response.save();

      const notifications = new notificationModel({
        title: "New Support Received!!",
        subtitle: "Request from ChatBOT",
        orderDetails: {
          phoneNumber: response.phoneNumber,
          userName: response.userName,
          email: response.email,
          query: response.message,
          userStatus: response.status,
        },
      });
      await notifications.save();

        const validTemplate = await emailTemplateModel.findOne({
          templateName: "Support Email",
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
            to: response.email,
            subject: validTemplate.subject,
            text: `
  ${validTemplate.body}

  SupportID: #${response.supportId}

  Best Regards,
  Refix Systems
  
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
            phoneNumber: response.phoneNumber,
            email: response.email,
            templateName: validTemplate.templateName,            
              type: "individual"
          });
          await newEmail.save();
        } else {
          const notification = new notificationModel({
            title: `"Support Email" Template not Exist!!`,
            subtitle: `"Support Email" was not exist in the Database. Please add this as soon as possible to send "Support Email" to the new Users.`,
          });
          await notification.save();
        }

      return res.status(200).send({
        message: "Your query received successfully! Our team will contact you shortly",
      });
    }

    return res.status(400).send({ message: "Incomplete data provided." });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).send({ error: "Internal Server Error" });
  }
});

router.get("/viewGallery", async (req, res) => {
  try {
    const response = await galleryModel.find();

    if (response && response.length > 0) {
      return res.status(200).send({ data: response });
    } else {
      return res.status(400).send({ error: "Internal Server Error" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't View Gallery now! Please try again later" });
  }
});

router.get("/viewPriceChart/:search?", async(req, res) => {
  const searchString = req.params.search || "";
  try {    
    const searchRegex = new RegExp(searchString, 'i');

    let query = {
      $or: [
          {description: {$regex: searchRegex}},
          {component: {$regex: searchRegex}},
      ]
    }
    const response = await priceChartModel.find(query).sort({createdAt: -1});

    const response1 = response.reduce((acc, item) => {
      const {component, description, serviceCharge, labourCharge}= item;

      if(!acc[component]){
        acc[component] = {
          component,
          details: []
        }
      };

      acc[component].details.push({
        description,
        serviceCharge,
        labourCharge
      });

      return acc;
    }, {});

    const formattedResponse = Object.values(response1);

    return res.status(200).send({data: formattedResponse});

   }catch(error){
      console.error("Error:", error.message);
      res.status(500).send({error: "Couldn't view price chart now! Please try again later"});
    }
});

router.get("/viewFaq", async(req, res) => {
    try{
    const response = await faqModel.find();

    const response1 = response.reduce((acc, faq) => {
      const {subtitle, question, answer } = faq;
      if(!acc[subtitle]){
        acc[subtitle] = {
          subtitle,
        questions: []
        }
      };

      acc[subtitle].questions.push({
        question,
        answer
      });

      return acc;
    }, {});

    const formattedResponse = Object.values(response1);

    return res.status(200).send({data: formattedResponse});
    }catch(error){
      console.error("Error:", error.message);
      res.status(500).send({error: "Couldn't view FAQ now! Please try again later"});
    }
});

router.get("/viewFaqServices", async(req, res) => {
  const type = req.query.type;
  const limit = req.query.limit || 3;
  const page = req.query.page || 1;
  try{
    const skip = (page - 1) * limit;
    let faq;
    let totalItems;
    if(type === "repair"){
      faq = await faqModel.find({subtitle: "Repair & Services" }).limit(limit).skip(skip);
      totalItems = await faqModel.countDocuments({subtitle: "Repair & Services" })
    } else if(type === "rental"){
      faq = await faqModel.find({subtitle: "Rental" }).limit(limit).skip(skip);
      totalItems = await faqModel.countDocuments({subtitle: "Rental" })
    }else if(type === "refurbished"){
      faq = await faqModel.find({subtitle: "Refurbished" }).limit(limit).skip(skip)
      totalItems = await faqModel.countDocuments({subtitle: "Refurbished" });
    };

    const paginationInfo = {
      totalItems,
      totalPages: Math.ceil(totalItems/limit),
      currentPage: parseInt(page),
      itemsPerPage: faq.length
    };

    return res.status(200).send({data: faq, pagination: paginationInfo})
  }catch(error){
    console.error("Error:", error.message);
    res.status(500).send({error: "Couldn't view FAQ now! Please try again later"});
  }
})

router.get("/aboutUs", async(req, res) => {
  try{
    const response = await aboutUsModel.find();
    
    return res.status(200).send({data: response});
  }catch(error){
    console.error("Error:", error.message);
    res.status(500).send({error: "Internal Server Error"});
  }
}); 

router.get("/priceComparison", async(req, res) => {
  try{
    const response = await priceComparisonModel.find();
    
    return res.status(200).send({data: response});
  }catch(error){
    console.error("Error:", error.message);
    res.status(500).send({error: "Couldn't view this page now! Please try again later"});
  }
}); 

router.post("/customLaptopRequest", async(req, res) => {
  let {phoneNumber, processor, operatingSystem, ram, screenSize, type, quantity, message} = req.body;
  try{
    if(!phoneNumber.startsWith("+91")){
      phoneNumber = `+91${phoneNumber}`
    };

    const existUser = await usersModel.findOne({phoneNumber});
    if(!existUser){
      return res.status(404).send({error: "User not found! Please create an account yourself to continue further"})
    };

    const now = moment().tz('Asia/Kolkata').format("DD/MM/YY");
    const year = now.split("/")[2];
    const month = now.split("/")[1];
    
    const prevSupportId = await supportFormModel.findOne().sort({createdAt: -1}).limit(1);
    const idOfSupport = prevSupportId.supportId.substring(7);
    
    const previousSupportId = parseFloat(idOfSupport, 10) + 1;
    const previousSupportIdFormatted = previousSupportId.toString().padStart(2, "0");
    
    const newSupportId = `SUP${year}${month}${previousSupportIdFormatted}`

    const newRequest = new customConfigurationsModel({
      supportId: newSupportId, phoneNumber, userName: existUser.userName || null, email: existUser.email, processor, operatingSystem, ram, screenSize, quantity, type, status: "Pending", message, note: null
    });
    await newRequest.save();

    const newSupport = await supportFormModel({
      supportId: newSupportId,phoneNumber:newRequest.phoneNumber, userName:newRequest.userName, email:newRequest.email, message:newRequest.message, adminComments: null, doneBy: null, status: "Pending", type: "Custom Laptop Request"
    });
    await newSupport.save();

    await notificationModel.create({
      title: 'New Support Received!!',
      subtitle: "Custom Laptop Request",
      orderDetails: {
        phoneNumber:newRequest.phoneNumber, userName:newRequest.userName, message:newRequest.message,
      },
    });

    const validTemplate = await emailTemplateModel.findOne({
      templateName: "Support Email",
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
        to: newSupport.email,
        subject: validTemplate.subject,
        text: `
${validTemplate.body}

SupportID: #${newSupport.supportId}

Best Regards,
Refix Systems

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
        phoneNumber: newSupport.phoneNumber,
        email: newSupport.email,
        templateName: validTemplate.templateName,        
              type: "individual"
      });
      await newEmail.save();
    } else {
      const notification = new notificationModel({
        title: `"Support Email" Template not Exist!!`,
        subtitle: `"Support Email" was not exist in the Database. Please add this as soon as possible to send "Support Email" to the new Users.`,
      });
      await notification.save();
    }

    return res.status(200).send({message: "Your request received successfully! Our team will contact you shortly"});

  }catch(error){
    console.error("Error:", error.message);
    res.status(500).send({error: "Couldn't submit your Customised Configurations now! Please try again later"});
  }
});

// router.get("/viewProductReviews/:id", async(req, res) => {
//   const {id} = req.params;
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const type = req.query.type;
//   try{
//     if(!type){
//       return res.status(400).send({error: "You've not select the type of Product!"});
//     }
//     let validProduct;
//     if(type === "Rental"){
//     validProduct = await rentLaptopModel.findOne({_id: id});
//     if(!validProduct){
//       return res.status(404).send({error: "Laptop not found!"});
//     };
//   } else if(type === "Refurbished"){
//     validProduct = await refurbishedLaptopModel.findOne({_id: id});
//     if(!validProduct){
//       return res.status(404).send({error: "Laptop not found!"});
//     };
//   };

//     const startIndex = (page - 1) * limit;
//     const endIndex = page * limit;
//     const reviews = validProduct.reviews.filter((rev) => rev.status === "Approved").slice(startIndex, endIndex);
// const totalRating = reviews.reduce((acc, item) => acc + parseInt(item.rating), 0);
//     const averageRating = reviews.length > 0 ? (totalRating/reviews.length) : 0;

//     const ratingCounts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
//     reviews.forEach((rev) => {
//       const rating = parseInt(rev.rating);
//       if(ratingCounts[rating] !== undefined){
//         ratingCounts[rating] += 1;
//       }
//     });

//     const totalRatings = reviews.length;

//     const ratingCountPercentages = {
//       1: totalRatings > 0 ? (ratingCounts[1] / totalRatings) * 100 : 0,
//       2: totalRatings > 0 ? (ratingCounts[2] / totalRatings) * 100 : 0,
//       3: totalRatings > 0 ? (ratingCounts[3] / totalRatings) * 100 : 0,
//       4: totalRatings > 0 ? (ratingCounts[4] / totalRatings) * 100 : 0,
//       5: totalRatings > 0 ? (ratingCounts[5] / totalRatings) * 100 : 0,
//     }

//     const totalItems = validProduct.reviews.length;
//     const totalPages = Math.ceil(totalItems/limit);
//     const currentPage = page;
  
//     const paginationInfo = {
//       totalItems,
//       totalPages,
//       currentPage,
//       startIndex: ((page - 1) * limit) + 1,
//       endIndex: reviews.length,
//     }

//     return res.status(200).send({data: reviews, averageRating, pagination: paginationInfo, 
//       ratingCounts,
//       ratingCountPercentages})

//   }catch(error){
//     console.error("Error:", error.message);
//     res.status(500).send({error: "Couldn't view reviews now! Please try again later"});
//   }
// });

router.get("/viewProductReviews/:id", async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  try {
    const reviews = await productReviewModel.find({ productId: id }).sort({ createdAt: -1 });
    
    const totalItems = reviews.length;
    const totalPages = Math.ceil(totalItems / limit);
    
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalRatingSum = 0;

    reviews.forEach((rev) => {
      const rating = parseInt(rev.rating);
      if (rating >= 1 && rating <= 5) {
        ratingCounts[rating]++;
        totalRatingSum += rating; 
      }
    });

    const averageRating = (totalItems > 0) ? parseInt(totalRatingSum / totalItems) : 0;

    const ratingCountPercentages = {};
    for (let rating in ratingCounts) {
      ratingCountPercentages[rating] = (totalItems > 0) ? parseInt((ratingCounts[rating] / totalItems) * 100) : 0;
    }
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalItems);
    const paginatedReviews = reviews.slice(startIndex, endIndex);

    const paginationInfo = {
      totalItems,
      totalPages,
      currentPage: page,
      startIndex: startIndex + 1,
      endIndex,
    };

    return res.status(200).send({
      data: paginatedReviews,
      pagination: paginationInfo,
      averageRating,
      ratingCounts,
      ratingCountPercentages
    });

  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({ error: "Couldn't view reviews now! Please try again later" });
  }
});

router.post("/verifyServiceArea", async(req, res) => {
  const {pincode} = req.body;
  try{
    if(!pincode){
      return res.status(400).send({error: "Please fill all fields!"});
    };

    const serviceArea = await serviceAreaModel.findOne({pincode, provideService: "yes"});
    if(!serviceArea){
      return res.status(400).send({error: "Apologies, but our services are currently unavailable in your area!"})
    }
    return res.status(200).send({message: "Service provided in this Area!"});

  }catch(error){
    console.error("Error:", error.message);
    res.status(500).send({error: "Couldn't verify service area now! Please try again later"});
  }
});

module.exports = router;
