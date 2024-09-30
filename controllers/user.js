const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();
var admin = require("firebase-admin");
const serviceAccount = require("../firebase.json");
const reviewModel = require("../models/reviews");
const usersModel = require("../models/users");
const { default: axios } = require("axios");
const bcrypt = require("bcryptjs");
const serviceRequestsModel = require("../models/service_requests");
const rentalRequestsModel = require("../models/rental_requests");
const refurbishedRequestsModel = require("../models/refurbished_requests");
const supportFormModel = require("../models/supportForm");
const notificationModel = require("../models/notification");
const quotationModel = require("../models/quotations");
const cartModel = require("../models/cart");
const rentLaptopModel = require("../models/rentLaptops");
const refurbishedLaptopModel = require("../models/refurbishedLaptops");
const productReviewModel = require("../models/productReviews");
const orderModel = require("../models/orders");
const nodemailer = require("nodemailer");
const emailTemplateModel = require("../models/emailTemplate");
const emailModel = require("../models/email");
const moment = require("moment-timezone");
const settingsModel = require("../models/settings");
const AWS = require('aws-sdk');
const billingInfoModel = require("../models/billingInformation");
const couponCodeModel = require("../models/couponCode");
const customConfigurationsModel = require("../models/customConfigurations");
const transactionModel = require("../models/transactions");
const otpVerificationModel = require("../models/otpVerification");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "meetinground-464c9.appspot.com",
  });
}

async function getToken() {
  try {
    const country = await settingsModel.findOne({credentialsKey: "MESSAGE_CENTRAL_COUNTRY"});
    const cid = await settingsModel.findOne({credentialsKey: "MESSAGE_CENTRAL_CID"});
    const key = await settingsModel.findOne({credentialsKey: "MESSAGE_CENTRAL_KEY"});
    const url = `https://cpaas.messagecentral.com/auth/v1/authentication/token?country=${country.credentialsValue}&customerId=${cid.credentialsValue}&key=${key.credentialsValue}&scope=NEW`;
    const response = await axios.get(url);
    return response.data.token;
  } catch (error) {
    console.error("Error fetching token:", error.message);
    throw error;
  }
};

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

router.post("/signUp", async(req, res) => {
  let {phoneNumber, email, dob, password, confirmPassword} = req.body;
  try{
    if(!phoneNumber.startsWith("+91")){
      phoneNumber = `+91${phoneNumber}`
    };

    if(!phoneNumber || !email || !dob || !password || !confirmPassword){
      return res.status(400).send({error: "Please fill all fields!"});
    }

    const existUser = await usersModel.findOne({phoneNumber});
    if(existUser){
      return res.status(400).send({error: "User already exists!"});
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(email){
      if(!emailRegex.test(email)){
        return res.status(400).send({error: "Invalid Email!"});
      }

      const existEmail = await usersModel.findOne({email});
      if(existEmail){
        return res.status(400).send({error: "Email already exists!"});
      }
    }

    const startDatee = moment(dob).add(18, 'years').format("YYYY-MM-DD");
    const now = moment().format("YYYY-MM-DD");
    if(startDatee >= now){
      return res.status(400).send({error: "Your age should be 18!"})
    }

    if(password !== confirmPassword){
      return res.status(400).send({error: "Password and ConfirmPassword does not match!"})
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new usersModel({
      phoneNumber,
      email,
      dob,
      password: hashedPassword,
    });
    await newUser.save();

    const validTemplate = await emailTemplateModel.findOne({templateName: "Welcome Email"});
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
        title: `"Welcome Email" Template not Exist!!`,
        subtitle: `"Welcome Email" was not exist in the Database. Please add this as soon as possible to send "Welcome Email" to the new Users.`
      });
      await notification.save();
    }

    const notification = new notificationModel({
      title: `New User Registered!`,
      subtitle: `There is one New User registered now!`,
      orderDetails: {
        phoneNumber,
        email,
        dob
      }
    });
    await notification.save();

    return res.status(200).send({message: "User created successfully!"});

  }catch(error){
    console.error("Error:", error.message);
    res.status(500).send({error: "Couldn't create account now! Please try again later"});
  }
});

router.post("/login", async (req, res) => {
  let {phoneNumber} = req.body;
  try {
    if(!phoneNumber.startsWith("+91")){
      phoneNumber = `+91${phoneNumber}`
    };

    const existUser = await usersModel.findOne({phoneNumber});
    if(!existUser){
      return res.status(404).send({error: "User not found! Please create an account yourself"});
    }

    const token = await getToken();

    const countryCode = await settingsModel.findOne({credentialsKey: "MESSAGE_CENTRAL_COUNTRYCODE"});
    const cid = await settingsModel.findOne({credentialsKey: "MESSAGE_CENTRAL_CID"});
    const url = `https://cpaas.messagecentral.com/verification/v2/verification/send?countryCode=${countryCode.credentialsValue}&customerId=${cid.credentialsValue}&flowType=SMS&mobileNumber=${req.body.phoneNumber}`;

    const headers = {
      authToken: token,
    };

    const response = await axios.post(url, null, { headers });
    res.status(200).send({ data: response.data });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

router.post("/verifyResetPasswordOtp", async(req, res) => {
  let {phoneNumber, verificationId, code} = req.body;
  try{

    if(!phoneNumber || !verificationId || !code){
      return res.status(400).send({error: "Please fill all fields!"});
    }

    const token = await getToken();
    
    const url = `https://cpaas.messagecentral.com/verification/v2/verification/validateOtp`;
    
    const headers = {
      authToken: token
    };
    
    const cid = await settingsModel.findOne({credentialsKey: "MESSAGE_CENTRAL_CID"});
    const params = {
      customerId: cid.credentialsValue,
      mobileNumber: phoneNumber,
      verificationId: verificationId,
      code: code
    };

    const response = await axios.get(url, {headers, params});
    return res.status(200).send({data: response.data});
  }catch(error){
    console.error("Error:", error.message);
    res.status(500).send({error: "Couldn't Verify User now! Please try again later"});
  }
});

router.post("/verifyOtp", async (req, res) => {
  let { phoneNumber, verificationId, code, loginMethod, password } = req.body;
  try {
    if(!phoneNumber.startsWith("+91")){
      phoneNumber = `+91${phoneNumber}`;
    };

    const existingUser = await usersModel.findOne({ phoneNumber });
  
    if(!existingUser){
      return res.status(404).send({error: "User not found! Please create an account yourself"});
    }

    if(loginMethod === "otp"){

      const token = await getToken();

      const url = `https://cpaas.messagecentral.com/verification/v2/verification/validateOtp`;
  
      const headers = {
        authToken: token,
      };

      const values = await settingsModel.findOne({credentialsKey: "MESSAGE_CENTRAL_CID"});
      if(!values){
        return res.status(500).send({error: "Internal Server Error"});
      }
  
      const params = {
        customerId: values.credentialsValue,
        mobileNumber: phoneNumber,
        verificationId: verificationId,
        code: code,
      };
  
      const response = await axios.get(url, { params, headers }); 
  
      const userDetails = {...existingUser._doc};
  
        return res
          .status(200)
          .send({ data: response.data, userDetails, existingUser });
    } else if(loginMethod === "password") {
      const validUser = await bcrypt.compare(password, existingUser.password);
      if (validUser) {
        const response = {
          responseCode: 200,
          message: "SUCCESS",
          data: {
            verificationStatus: 'VERIFICATION_COMPLETED',
            responseCode: 200,
          }
        }
        return res.status(200).send({ data: response, userDetails: existingUser});
      } else {
        return res.status(401).send({ error: "Invalid password!" });
      }
    }

  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({ error: error.message });
  }
});

router.patch("/resetPassword", async(req, res) => {
  let {phoneNumber, password, confirmPassword} = req.body;
  try{
    if(!phoneNumber.startsWith("+91")){
      phoneNumber = `+91${phoneNumber}`
    };

    const existUser = await usersModel.findOne({phoneNumber});
    if(!existUser){
      return res.status(404).send({error: "User not found!"});
    };

    if(password !== confirmPassword){
      return res.status(400).send({error: "Password and ConfirmPassword should match!"});
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await usersModel.findOneAndUpdate({phoneNumber}, {$set: {password: hashedPassword}}, {new: true});

    return res.status(200).send({message: "Password successfully changed"});

  }catch(error){
    console.error("Error:", error.message);
    res.status(500).send({error: "Couldn't reset password now! Please try again later"});
  }
});

router.get("/viewUserProfile/:phoneNumber", async(req, res) => {
  let {phoneNumber} = req.params;
  try{
    if(!phoneNumber.startsWith("+91")){
      phoneNumber = `+91${phoneNumber}`
    };

    const response = await usersModel.findOne({phoneNumber});
    if(response){
      return res.status(200).send({data: response});
    } else {
      return res.status(404).send({error: "User not found!"});
    }

  }catch(error){
    console.error("Error:", error.message);
    res.status(500).send({error: "Couldn't view profile now! Please try again later"});
  }
});

// // firebase
// router.patch("/updateUserProfile", upload.single('image'), async (req, res) => {
//   let { phoneNumber, userName, email } = req.body;
//   const image = req.file;
//   try {
//     if (!phoneNumber.startsWith("+91")) {
//       phoneNumber = `+91${phoneNumber}`;
//     }

//     const existingUser = await usersModel.findOne({ phoneNumber });
//     if (!existingUser) {
//       return res.status(404).send({ error: "User not found!" });
//     }

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (email) {
//       if (!emailRegex.test(email)) {
//         return res.status(400).send({ error: "Invalid email format!" });
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

//         await productReviewModel.updateMany({phoneNumber}, {$set: {profileImage: imageUrl}}, {new: true});     
//         await reviewModel.updateMany({phoneNumber}, {$set: {profileImage: imageUrl}}, {new: true})

//         await rentLaptopModel.updateMany({'reviews.phoneNumber': phoneNumber}, {$set: {'reviews.$.profileImage': imageUrl}}, {new: true});
//         await refurbishedLaptopModel.updateMany({'reviews.phoneNumber': phoneNumber}, {$set: {'reviews.$.profileImage': imageUrl}}, {new: true});
      
//     }

//     const updateFields = {};
//     if (userName) updateFields.userName = userName;
//     if (email) updateFields.email = email;
//     if (image) updateFields.profileImage = imageUrl;
   

//     if (Object.keys(updateFields).length > 0) {
//       await usersModel.findOneAndUpdate(
//         { phoneNumber },
//         { $set: updateFields },
//         { new: true }
//       );
//     }

//     return res.status(200).send({ message: "Profile updated successfully!" });
//   } catch (error) {
//     console.error("Error:", error.message);
//     res.status(500).send({ error: "Couldn't update user now! Please try again later" });
//   }
// });

router.post("/sendVerificationEmail", async(req, res) => {
  let {phoneNumber, email} = req.body;
  try{
    if(!phoneNumber.startsWith("+91")){
      phoneNumber = `+91${phoneNumber}`
    };

    const emailUsername = await settingsModel.findOne({credentialsKey: "GMAIL_USER"});
    const emailPassword = await settingsModel.findOne({credentialsKey: "GMAIL_PASSWORD"});
    const socialMediaLinks = await settingsModel.find({
      credentialsKey: {
        $in: ["facebook", "whatsapp", "twitter", "instagram", "linkedin"],
      },
    });

    const socialMediaMap = socialMediaLinks.reduce((acc, item) => {
      acc[item.credentialsKey] = item.credentialsValue;
      return acc;
    }, {});

    const OTP = Math.floor(1000 + Math.random() * 9000);
    
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: emailUsername.credentialsValue,
        pass: emailPassword.credentialsValue
      }
    });
    
    const otpVerificationEmail = await otpVerificationModel({
      phoneNumber,
      code: OTP,
      email,
      expiresAt: Date.now() + (300 * 1000)
    });
    await otpVerificationEmail.save();
    
    const message = {
      from: emailUsername.credentialsValue,
      to: email,
      subject: "Email verification!",
            text: `
Your verification Code is ${otpVerificationEmail.code}. This code will expires within 5minutes!

Follow Us On:
Facebook:  ${socialMediaMap.facebook || "N/A"}
Twitter:   ${socialMediaMap.twitter || "N/A"}
Whatsapp:  ${socialMediaMap.whatsapp || "N/A"}
Instagram: ${socialMediaMap.instagram || "N/A"}
LinkedIn:  ${socialMediaMap.linkedin || "N/A"}
`
            };
      transporter.sendMail(message);

      return res.status(200).send({message: `Verification OTP sent to ${email}`, phoneNumber, email});

  }catch(error){
    console.error("Error:", error.message);
    res.status(500).send({error: "Couldn't send verification email now! Please try again later"});
  }
});

router.post("/verifyEmail", async(req, res) => {
  let {phoneNumber, email, code} = req.body;
  try{
    if(!phoneNumber.startsWith("+91")){
      phoneNumber = `+91${phoneNumber}`
    };

    const verifyOTP = await otpVerificationModel.findOne({phoneNumber, code, email});
    if(!verifyOTP){
      return res.status(404).send({error: "You've entered an invalid OTP!"});
    } else {
      const expiresAt = verifyOTP
      if(expiresAt < Date.now()){
        await otpVerificationModel.deleteMany({phoneNumber, code, email});
        return res.status(400).send({error: "You've entered an Expired OTP!"});
      } else {
        await otpVerificationModel.deleteMany({phoneNumber, code, email});
        return res.status(200).send({message: "Email verified successfully!", phoneNumber, email});
      }
    }

  }catch(error){
    console.error("Error:", error.message);
    res.status(500).send({error: "Couldn't verify email now! Please try again later"});
  }
});

// s3
router.patch("/updateUserProfile", upload.single('image'), async (req, res) => {
  let { phoneNumber, newPhoneNumber, userName, email } = req.body;
  const image = req.file;
  try {
    if (!phoneNumber.startsWith("+91")) {
      phoneNumber = `+91${phoneNumber}`;
    }

    const existingUser = await usersModel.findOne({ phoneNumber });
    if (!existingUser) {
      return res.status(404).send({ error: "User not found!" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email) {
      if (!emailRegex.test(email)) {
        return res.status(400).send({ error: "Invalid email format!" });
      }

      const existEmail = await usersModel.findOne({email});
      if(existEmail){
        return res.status(400).send({error: "Email already exists!"});
      }
    }

    let imageUrl;
    if (image) {
      const imageName = `${Date.now()}_${image.originalname}`;
      const fileType = image.originalname.split(".").pop().toLowerCase();

      if(fileType !== "jpg" && fileType !== "jpeg" && fileType !== "png" && fileType !== "svg" && fileType !== "webp"){
        return res.status(400).send({error: "Invalid image type!"});
      }
      
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `images/${imageName}`,
        Body: image.buffer,
        ContentType: image.mimetype,
        ACL: 'public-read'
      };

      const uploadResult = await s3.upload(params).promise();
      imageUrl = uploadResult.Location;

        await productReviewModel.updateMany({phoneNumber}, {$set: {profileImage: imageUrl}}, {new: true});     
        await reviewModel.updateMany({phoneNumber}, {$set: {profileImage: imageUrl}}, {new: true})

        await rentLaptopModel.updateMany({'reviews.phoneNumber': phoneNumber}, {$set: {'reviews.$.profileImage': imageUrl}}, {new: true});
        await refurbishedLaptopModel.updateMany({'reviews.phoneNumber': phoneNumber}, {$set: {'reviews.$.profileImage': imageUrl}}, {new: true});
      
    }

    if(newPhoneNumber){
      if (!newPhoneNumber.startsWith("+91")) {
        newPhoneNumber = `+91${newPhoneNumber}`;
      };

     const existPhoneNumber = await usersModel.findOne({phoneNumber: newPhoneNumber});
      if(existPhoneNumber){
        return res.status(400).send({error: "Phone number already exists!"});
      }
      
      await usersModel.findOneAndUpdate({phoneNumber}, {$set: {phoneNumber: newPhoneNumber}}, {new: true});
      await billingInfoModel.updateMany({phoneNumber}, {$set: {phoneNumber: newPhoneNumber}}, {new: true});
      await cartModel.updateMany({phoneNumber}, {$set: {phoneNumber: newPhoneNumber}}, {new: true});
      await couponCodeModel.updateMany({phoneNumber}, {$set: {'redeemedUsers.$.phoneNumber': newPhoneNumber}}, {new: true});
      await customConfigurationsModel.updateMany({phoneNumber}, {$set: {phoneNumber: newPhoneNumber}}, {new: true});
      await emailModel.updateMany({phoneNumber}, {$set: {phoneNumber: newPhoneNumber}}, {new: true});
      await notificationModel.updateMany({phoneNumber}, {$set: {'orderDetails.$.phoneNumber': newPhoneNumber}}, {new: true});
      await orderModel.updateMany({phoneNumber}, {$set: {phoneNumber: newPhoneNumber}}, {new: true});
      await refurbishedRequestsModel.updateMany({phoneNumber}, {$set: {phoneNumber: newPhoneNumber}}, {new: true});
      await rentalRequestsModel.updateMany({phoneNumber}, {$set: {phoneNumber: newPhoneNumber}}, {new: true});
      await quotationModel.updateMany({phoneNumber}, {$set: {phoneNumber: newPhoneNumber}}, {new: true});
      await reviewModel.updateMany({phoneNumber}, {$set: {phoneNumber: newPhoneNumber}}, {new: true});
      await productReviewModel.updateMany({phoneNumber}, {$set: {phoneNumber: newPhoneNumber}}, {new: true});
      await serviceRequestsModel.updateMany({phoneNumber}, {$set: {phoneNumber: newPhoneNumber}}, {new: true});
      await supportFormModel.updateMany({phoneNumber}, {$set: {phoneNumber: newPhoneNumber}}, {new: true});
      await transactionModel.updateMany({phoneNumber}, {$set: {phoneNumber: newPhoneNumber}}, {new: true});
    }

    const updateFields = {};
    if (userName) updateFields.userName = userName;
    if (email) updateFields.email = email;
    if (image) updateFields.profileImage = imageUrl;
   

    if (Object.keys(updateFields).length > 0) {
      await usersModel.findOneAndUpdate(
        { phoneNumber },
        { $set: updateFields },
        { new: true }
      );
    };


    let userDetails;
    if(newPhoneNumber){
      userDetails = await usersModel.findOne({phoneNumber: newPhoneNumber})
    } else {
      userDetails = await usersModel.findOne({phoneNumber})
    }

    return res.status(200).send({ message: "Profile updated successfully!", userDetails, body: req.body});
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({ error: "Couldn't update user now! Please try again later" });
  }
});
// router.patch("/updateUserProfile", upload.single('image'), async (req, res) => {
//   let { phoneNumber, userName, email } = req.body;
//   const image = req.file;
//   try {
//     if (!phoneNumber.startsWith("+91")) {
//       phoneNumber = `+91${phoneNumber}`;
//     }

//     const existingUser = await usersModel.findOne({ phoneNumber });
//     if (!existingUser) {
//       return res.status(404).send({ error: "User not found!" });
//     }

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (email) {
//       if (!emailRegex.test(email)) {
//         return res.status(400).send({ error: "Invalid email format!" });
//       }
//     }

//     let imageUrl;
//     if (image) {
//       const imageName = `${Date.now()}_${image.originalname}`;
//       const fileType = image.originalname.split(".").pop().toLowerCase();

//       if(fileType !== "jpg" && fileType !== "jpeg" && fileType !== "png" && fileType !== "svg" && fileType !== "webp"){
//         return res.status(400).send({error: "Invalid image type!"});
//       }
      
//       const params = {
//         Bucket: process.env.AWS_S3_BUCKET,
//         Key: `images/${imageName}`,
//         Body: image.buffer,
//         ContentType: image.mimetype,
//         ACL: 'public-read'
//       };

//       const uploadResult = await s3.upload(params).promise();
//       imageUrl = uploadResult.Location;

//         await productReviewModel.updateMany({phoneNumber}, {$set: {profileImage: imageUrl}}, {new: true});     
//         await reviewModel.updateMany({phoneNumber}, {$set: {profileImage: imageUrl}}, {new: true})

//         await rentLaptopModel.updateMany({'reviews.phoneNumber': phoneNumber}, {$set: {'reviews.$.profileImage': imageUrl}}, {new: true});
//         await refurbishedLaptopModel.updateMany({'reviews.phoneNumber': phoneNumber}, {$set: {'reviews.$.profileImage': imageUrl}}, {new: true});
      
//     }

//     const updateFields = {};
//     if (userName) updateFields.userName = userName;
//     if (email) updateFields.email = email;
//     if (image) updateFields.profileImage = imageUrl;
   

//     if (Object.keys(updateFields).length > 0) {
//       await usersModel.findOneAndUpdate(
//         { phoneNumber },
//         { $set: updateFields },
//         { new: true }
//       );
//     }

//     return res.status(200).send({ message: "Profile updated successfully!" });
//   } catch (error) {
//     console.error("Error:", error.message);
//     res.status(500).send({ error: "Couldn't update user now! Please try again later" });
//   }
// });

router.delete("/deleteUserImage/:phoneNumber", async(req, res) => {
  let {phoneNumber} = req.params;
  try{
    if(!phoneNumber.startsWith("+91")){
      phoneNumber = `+91${phoneNumber}`
    };

    const response = await usersModel.findOneAndUpdate({phoneNumber}, {$unset: {profileImage: ""}}, {new: true});
    await productReviewModel.updateMany({phoneNumber}, {$set: {profileImage: "https://storage.googleapis.com/meetinground-464c9.appspot.com/images%2F1720499308802_user%20(11).png"}}, {new: true});     
    await reviewModel.updateMany({phoneNumber}, {$set: {profileImage: "https://storage.googleapis.com/meetinground-464c9.appspot.com/images%2F1720499308802_user%20(11).png"}}, {new: true})

    await rentLaptopModel.updateMany({'reviews.phoneNumber': phoneNumber}, {$set: {'reviews.$.profileImage': "https://storage.googleapis.com/meetinground-464c9.appspot.com/images%2F1720499308802_user%20(11).png"}}, {new: true});
    await refurbishedLaptopModel.updateMany({'reviews.phoneNumber': phoneNumber}, {$set: {'reviews.$.profileImage': "https://storage.googleapis.com/meetinground-464c9.appspot.com/images%2F1720499308802_user%20(11).png"}}, {new: true});
    
    if(response){
      return res.status(200).send({message: "Profile Image Removed Successfully!"});
    } else {
      return res.status(400).send({error: "User not found!"});
    }

  }catch(error){
    console.error("Error:", error.message);
    res.status(500).send({error: "Couldn't delete image now! Please try again later"});
  }
});

router.patch("/updateUserAddress/:phoneNumber", async(req, res) => {
  let {phoneNumber} = req.params;
  const {addressId, address, primaryAddress} = req.body;
  try{
      if(!phoneNumber.startsWith("+91")){
        phoneNumber = `+91${phoneNumber}`
      };

      const validUser = await usersModel.findOne({phoneNumber});
      if(!validUser){
        return res.status(404).send({error: "User not found!"});
      }

     if(addressId){
        const validAddress = validUser.address.find(addre => addre._id.toString() === addressId);
        if(!validAddress){
          return res.status(404).send({error: "Address not found!"});
        } 

    if(primaryAddress === true){
      const check = validUser.address.find(addre => addre.primaryAddress === true);
      if(check){
        check.primaryAddress = false;
        await check.save();
      }
    }

    if(address){
      validAddress.address = address;
    };
    
    validAddress.primaryAddress = primaryAddress || false;
    validUser.save();
      } else {
        const existAddress = validUser.address.find(addre => addre.address === address);
        if(existAddress){
          return res.status(400).send({error: "Address already exists!"});
        } 

        const check = validUser.address.find(addre => addre.primaryAddress === true);
          if(check){
            check.primaryAddress = false;
            await check.save();
          }

        validAddress = validUser.address.push({address: address, primaryAddress: true})
        if(!validAddress){
          return res.status(404).send({error: "Address not found!"});
        } 

    validAddress.address = address;
    validUser.save();
     }
        return res.status(200).send({message: "Address updated successfully!"});
  }catch(error){
    console.error("Error:", error.message);
    res.status(500).send({error: "Couldn't update address now! Please try again later"});
  }
});

router.delete("/deleteUserAddress/:phoneNumber", async(req, res) => {
    let {phoneNumber} = req.params;
    const {addressId} = req.body;
  try{
    if(!phoneNumber.startsWith("+91")){
      phoneNumber = `+91${phoneNumber}`
    }

    const validUser = await usersModel.findOne({phoneNumber});
    if(!validUser){
      return res.status(404).send({error: "User not found!"});
    }

      const validAddress = validUser.address.find(addre => addre._id.toString() === addressId);
      if(!validAddress){
        return res.status(400).send({error: "Address not found!"});
      }

      if(validUser.address.length === 1){
        return res.status(400).send({error: "Address can't be deleted!"});
      }
      validUser.address = validUser.address.filter(addre => addre._id.toString() !== addressId);
      await validUser.save();

      const primary = validUser.address.forEach(addre => addre.primaryAddress === true);
       if(!primary && validUser.address.length > 0) {
  
          validUser.address[validUser.address.length - 1].primaryAddress = true;
        };  
        await validUser.save();
return res.status(200).send({message: "Address removed successfully!"});
  }catch(error){
    console.error("Error:", error.message);
    res.status(500).send({error: "Couldn't delete address now! Please try again later"});
  }
});

router.post("/review", upload.array('images'), async (req, res) => {
  let { phoneNumber, rating, review } = req.body;
  const images = req.files;
  try {
   if(!phoneNumber.startsWith("+91")){
    phoneNumber = `+91${phoneNumber}`;
   }

    if(!phoneNumber || !rating || !review){
      return res.status(400).send({error: "Please fill all fields!"});
    }

    const existingUser = await usersModel.findOne({ phoneNumber });
    if (!existingUser) {
      return res.status(404).send({ error: "User not found!" });
    }

    const userName = existingUser.userName ? existingUser.userName : null;
    const profileImage = existingUser.profileImage ? existingUser.profileImage : "https://storage.googleapis.com/meetinground-464c9.appspot.com/images%2F1720499308802_user%20(11).png";

    let imageUrls = [];
    if(images){
      for(const image of images){
        if(!isValidFileExtension(image.originalname)){
          return res.status(400).send({error: "Invalid file type!"});
        }
        const imageName = `${Date.now()}_${image.originalname}`;

        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Body: image.buffer,
          Key: `images/${imageName}`,
          ContentType: image.mimetype,
          ACL: 'public-read'
        };

        const imageUploadResult = await s3.upload(params).promise();
        imageUrls.push(imageUploadResult.Location);
      }
    }

    const newReview = new reviewModel({
      phoneNumber,
      userName,
      profileImage,
      rating,
      review,
      images: imageUrls,
      showInHomePage: "no",
      status: "Pending"
    });
    await newReview.save();

    
    await notificationModel.create({
      title: 'General Review Received!!',
      subtitle: `${userName} | ${rating} | ${review}`,
      orderDetails: {
        phoneNumber: newReview.phoneNumber,
        userName: newReview.userName,
        rating: newReview.rating,
        review: newReview.review,
      },
    });
    

    return res.status(200).send({ message: "Thanks for your Review!" });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .send({ error: "Couldn't add Review now! Please try again later" });
  }
});

router.get("/viewReviews/:search?", async(req, res) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const searchString = req.params.search || "";
    try{
      const skip = (page - 1) * limit;
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder;

      const escapedSearchString = searchString.replace(/\+/g, "\\+");
      const searchRegex = new RegExp(escapedSearchString, "i");
      const query = {
        status: "Approved",
        $or: [
          {phoneNumber: {$regex: searchRegex}},
          {review: {$regex: searchRegex}},
        ]
      }

      let response;
      let paginationInfo;
      if(page && limit){
        response = await reviewModel.find(query).skip(skip).sort(sortOptions).limit(limit);
        const totalItems = await reviewModel.countDocuments(query);
        const totalPages = Math.ceil(totalItems/limit);
        
        paginationInfo = {
          totalItems,
          totalPages,
          currentPage: page,
          itemsPerPage: response.length
        }
  
      } else {
        response = await reviewModel.find(query).sort(sortOptions);
        paginationInfo = null;
      }


    
      if(response && response.length == 0){
        return res.status(404).send({error: "No Reviews Found!"});
      }
      return res.status(200).send({data: response, pagination: paginationInfo});
    }catch(error){
      console.error("Error:", error.message);
      res.status(500).send({error: "Couldn't view Reviews now! Please try again later"});
    }
});

// router.get("/myActivities/:phoneNumber", async(req, res) => {
//   let {phoneNumber} = req.params;
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const skip = (page - 1) * limit;
//   const sortBy = req.query.sortBy || "createdAt";
//   const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
//   try{
//     if(!phoneNumber.startsWith('+91')){
//       phoneNumber = `+91${phoneNumber}`;
//     }

//     const existingUser = await usersModel.findOne({phoneNumber});
//     if(!existingUser){
//       return res.status(404).send({error: "User not found!"});
//     };

//     const sortOptions = {};
//     sortOptions[sortBy] = sortOrder;
//     const activities = await orderModel.find({phoneNumber}).skip(skip).limit(limit).sort(sortOptions);
    
//   const orders = await Promise.all(activities.map(async(order) => {
//     const billInfo = await billingInfoModel.findOne({requestId: order.requestId});
//     let orderDetails = null;
//     let productId = null;
//     let productDetails = null;
//     let youMayLikeProducts = null;
//     if(order.type === "Repair"){
//       orderDetails = await serviceRequestsModel.findOne({requestId: order.requestId});
//     } 
//     if(order.type === "Rental"){
//       orderDetails = await rentalRequestsModel.findOne({requestId: order.requestId});
//       productId = orderDetails.laptopId
//       productDetails = await rentLaptopModel.findOne({_id: orderDetails.laptopId});
//       youMayLikeProducts = await rentLaptopModel.find({addInCarousel: true});

//       youMayLikeProducts = youMayLikeProducts.map((product) => {
//         const reviews = product.reviews.filter((review) => review.status === "Approved");
//         return {
//           ...product._doc,
//           reviews
//         }
//       })
//     } 
//     if(order.type === "Refurbished"){
//       orderDetails = await refurbishedRequestsModel.findOne({requestId: order.requestId});
//       productId = orderDetails.laptopId
//       productDetails = await refurbishedLaptopModel.findOne({_id: orderDetails.laptopId});
//       youMayLikeProducts = await refurbishedLaptopModel.find({addInCarousel: true});

//       youMayLikeProducts = youMayLikeProducts.map((product) => {
//         const reviews = product.reviews.filter((review) => review.status === "Approved");
//         return {
//           ...product._doc,
//           reviews
//         }
//       })
//     }

//     if(productDetails && productDetails.reviews){
//       productDetails.reviews = productDetails.reviews.filter((review) => review.status === "Approved")
//     }

//     return{
//       ...orderDetails._doc,
//       productDetails,
//       billInfo,
//       productId,
//       youMayLikeProducts
//     }
//   }));

//     const totalItems = await orderModel.countDocuments({phoneNumber});
//     const totalPages = Math.ceil(totalItems/limit);
//     const currentPage = page;

//     const paginationInfo = {
//       totalItems,
//       totalPages,
//       currentPage
//     }

//       return res.status(200).send({data: orders, pagination:paginationInfo})

//   }catch(error){
//     console.error("Error:", error.message);
//     res.status(500).send({error: "Couldn't View Your Activities now! Please try again later"});
//   }
// });

router.get("/myActivities/:phoneNumber", async (req, res) => {
  let { phoneNumber } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

  try {
    if (!phoneNumber.startsWith("+91")) {
      phoneNumber = `+91${phoneNumber}`;
    }

    const existingUser = await usersModel.findOne({ phoneNumber });
    if (!existingUser) {
      return res.status(404).send({ error: "User not found!" });
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;
    const activities = await orderModel.find({ phoneNumber }).skip(skip).limit(limit).sort(sortOptions);

    let rentalCarousel = await rentLaptopModel.find({ addInCarousel: true });
    rentalCarousel = rentalCarousel.map((product) => {
      const reviews = product.reviews.filter((review) => review.status === "Approved");
      return {
        ...product._doc,
        reviews
      };
    });

    let refurbishedCarousel = await refurbishedLaptopModel.find({ addInCarousel: true });
    refurbishedCarousel = refurbishedCarousel.map((product) => {
      const reviews = product.reviews.filter((review) => review.status === "Approved");
      return {
        ...product._doc,
        reviews
      };
    });

    const orders = await Promise.all(
      activities.map(async (order) => {
        const billInfos = await billingInfoModel.findOne({ requestId: order.requestId });
        let orderDetails = null;
        let productId = null;
        let productDetails = null;

        if (order.type === "Repair") {
          orderDetails = await serviceRequestsModel.findOne({ requestId: order.requestId });
        }
        if (order.type === "Rental") {
          orderDetails = await rentalRequestsModel.findOne({ requestId: order.requestId, quotationConfirmation: "Confirmed" });
          if (orderDetails) {
            productId = orderDetails.laptopId;
            productDetails = await rentLaptopModel.findOne({ _id: orderDetails.laptopId });
          }
        }
        if (order.type === "Refurbished") {
          orderDetails = await refurbishedRequestsModel.findOne({ requestId: order.requestId });
          if (orderDetails) {
            productId = orderDetails.laptopId;
            productDetails = await refurbishedLaptopModel.findOne({ _id: orderDetails.laptopId });
          }
        }

        if (productDetails && productDetails.reviews) {
          productDetails.reviews = productDetails.reviews.filter((review) => review.status === "Approved");
        }

        const logo = await settingsModel.findOne({type: "logo"});
        const banner = await settingsModel.findOne({type: "modelBanner"});

        let billInfo = null;
        if(billInfos !== null){
        billInfo = {...billInfos._doc, logoTest: logo.image, bannerTest: banner.image}
      } 
        return orderDetails
          ? {
              ...orderDetails._doc,
              productDetails,
              billInfo,
              productId,
            }
          : null;
      })
    );

    const filteredOrders = orders.filter((order) => order !== null); 

    const totalItems = await orderModel.countDocuments({ phoneNumber });
    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = page;

    const paginationInfo = {
      totalItems,
      totalPages,
      currentPage,
    };

    return res.status(200).send({
      data: filteredOrders,
      pagination: paginationInfo,
      rentalCarousel,
      refurbishedCarousel,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({ error: "Couldn't View Your Activities now! Please try again later" });
  }
});

router.post("/support", async(req, res) => {
  let {phoneNumber, userName, email, message} = req.body;
  try{
    if(!phoneNumber || !userName || !email || !message ){
      return res.status(400).send({error: "Please fill all fields!"});
    }

    if(!phoneNumber.startsWith("+91")){
      phoneNumber = `+91${phoneNumber}`
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)){
      return res.status(400).send({error: "Invalid Email"});
    }

    const duplicateSupport = await supportFormModel.findOne({phoneNumber, message});
    if(duplicateSupport){
      return res.status(400).send({error: "Your request already submitted!"});
    }

    const now = moment().tz('Asia/Kolkata').format("DD/MM/YY");
    const year = now.split("/")[2];
    const month = now.split("/")[1];
    
    const prevSupportId = await supportFormModel.findOne().sort({createdAt: -1}).limit(1);
    const idOfSupport = prevSupportId.supportId.substring(7);
    
    const previousSupportId = parseFloat(idOfSupport, 10) + 1;
    const previousSupportIdFormatted = previousSupportId.toString().padStart(2, "0");
    
    const newSupportId = `SUP${year}${month}${previousSupportIdFormatted}`

    const newSupport = await supportFormModel({
      supportId: newSupportId, phoneNumber, userName, email, message, adminComments: null, doneBy: null, status: "Pending", type: "Contact US"
    });
    await newSupport.save();

    
    await notificationModel.create({
      title: 'New Support Received!!',
      subtitle: "Contact Us Request",
      orderDetails: {
        userName,
        phoneNumber,
        message
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

    return res.status(200).send({message: "Your request received successfully! We'll contact you Shortly!"});
  }catch(error){
    console.error("Error:", error.message);
    res.status(500).send({error: "Couldn't send request now! Please try again later"});
  }
});

router.get("/viewMyQuotes/:phoneNumber/:search?", async(req, res) => {
  let {phoneNumber} = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    try{
      if(!phoneNumber.startsWith("+91")){
        phoneNumber = `+91${phoneNumber}`
      }

      const validUser = await usersModel.findOne({phoneNumber});
      if(!validUser){
        return res.status(404).send({error: "User not found!"});
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder;


      const myQuotes = await quotationModel.find({phoneNumber, status: "Pending"}).skip(skip).limit(limit).sort(sortOptions);

      // if(myQuotes && myQuotes.length > 0){
      //   return res.status(404).send({error: "No Quotations Found!"});
      // }

      const youMayLikeProducts = await rentLaptopModel.find({addInCarousel: true})

      const youMay = youMayLikeProducts.map((laptop) => {
        const reviews = laptop.reviews.filter((review) => review.status === "Approved");
        return {
          ...laptop._doc,
          reviews
        }
      })

      let quotations = [];
      for(const product of myQuotes){
        const validLaptop = await rentLaptopModel.findOne({_id: product.laptopId});

        const reviews = validLaptop.reviews.filter((review) => review.status === "Approved");


        quotations.push({
          ...product.toObject(),
          productDetails: {
            ...validLaptop.toObject(),
            reviews: reviews
          },
        })
      }

      const totalItems = await quotationModel.countDocuments({phoneNumber});
      const totalPages = Math.ceil(totalItems/limit);
      const currentPage = page;

      const paginationInfo = {
        totalItems,
        totalPages,
        currentPage
      }

        return res.status(200).send({data: quotations, pagination: paginationInfo, youMayLikeProducts: youMay})

    }catch(error){
      console.error("Error:", error.message);
      res.status(500).send({error: "Couldn't View Your Quotations now! Please try again later"});
    }
});

// router.get("/myCart/:phoneNumber", async(req, res) => {
//   let {phoneNumber} = req.params;
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const sortBy = req.query.sortBy || "createdAt";
//   const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
//   try{
//     if(!phoneNumber.startsWith("+91")){
//       phoneNumber = `+91${phoneNumber}`
//     };

//     const sortOptions = {};
//     sortOptions[sortBy] = sortOrder;


//     const existUser = await usersModel.findOne({phoneNumber});
//     if(!existUser){
//       return res.status(404).send({error: "User not found!"});
//     }

//     const response = await cartModel.findOne({phoneNumber, status: "Pending"});
//     // const response1 = response.products.filter(product => product.type.includes(searchString) || product.device.includes(searchString) || product.issue.includes(searchString) || product.issueDetails.includes(searchString) || product.brand.includes(searchString) || product.model.includes(searchString) || product.operatingSystem.includes(searchString));
//     if(!response){
//       return res.status(400).send({error: "Your cart is empty!"});
//     }
//     const response1 = response.products;

//     const address = await usersModel.findOne({phoneNumber});

//     const value = response.products.filter(pro => pro.type === "Repair");
//     const initialAmount = await settingsModel.findOne({type: "initialAmount"});
//     const totalAmount = (value.length * initialAmount.credentialsValue)


//     const totalItems = response1.length;
//     const totalPages = Math.ceil(totalItems/limit);
//     const currentPage = page;

//     const paginatedProducts = response1.sort((a, b) => a[sortBy] > b[sortBy] ? sortOrder: -sortOrder).slice((page - 1) * limit, page * limit );

//     const youMayLikeProducts = await rentLaptopModel.find({
//       addInCarousel: true,
//     });
//     let rentalCarousel;
//     if (youMayLikeProducts && youMayLikeProducts.length > 0) {
//       rentalCarousel = youMayLikeProducts;
//     } else {
//       rentalCarousel = null;
//     }

//     const youMayLikeProducts1 = await refurbishedLaptopModel.find({
//       addInCarousel: true,
//     });
//     let refurbishedCarousel;
//     if (youMayLikeProducts1 && youMayLikeProducts1.length > 0) {
//       refurbishedCarousel = youMayLikeProducts1;
//     } else {
//       refurbishedCarousel = null;
//     }
    
//     const paginationInfo = {
//       totalItems,
//       totalPages,
//       currentPage
//     }

//     if(paginatedProducts && paginatedProducts.length > 0){
//       return res.status(200).send({data: paginatedProducts , pagination: paginationInfo, cartId: response._id, totalAmount, address: address.address, userName: existUser.userName || null, email: existUser.email, rentalCarousel, refurbishedCarousel});
//     } else {
//       return res.status(404).send({error: "Your cart is empty!"});
//     }

//   }catch(error){
//     console.error("Error:", error.message);
//     res.status(500).send({error: "Couldn't view my cart now! Please try again later"});
//   }
// });

router.get("/myCart/:phoneNumber", async(req, res) => {
  let {phoneNumber} = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  try{
    if(!phoneNumber.startsWith("+91")){
      phoneNumber = `+91${phoneNumber}`
    };

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;


    const existUser = await usersModel.findOne({phoneNumber});
    if(!existUser){
      return res.status(404).send({error: "User not found!"});
    }

    const response = await cartModel.findOne({phoneNumber, status: "Pending"});
    // const response1 = response.products.filter(product => product.type.includes(searchString) || product.device.includes(searchString) || product.issue.includes(searchString) || product.issueDetails.includes(searchString) || product.brand.includes(searchString) || product.model.includes(searchString) || product.operatingSystem.includes(searchString));
    if(!response){
      return res.status(400).send({error: "Your cart is empty!"});
    }
    const response1 = response.products;

    const address = await usersModel.findOne({phoneNumber});

    const value = response.products.filter(pro => pro.type === "Repair");
    const initialAmount = await settingsModel.findOne({type: "initialAmount"});
    const GST = Math.round((value.length * initialAmount.credentialsValue) * 0.18);
    const totalAmountBeforeGST = Math.round((value.length * initialAmount.credentialsValue));
    const totalAmount = Math.round((value.length * initialAmount.credentialsValue) + GST);

    const totalItems = response1.length;
    const totalPages = Math.ceil(totalItems/limit);
    const currentPage = page;

    const paginatedProducts = response1.sort((a, b) => a[sortBy] > b[sortBy] ? sortOrder: -sortOrder).slice((page - 1) * limit, page * limit );

    const youMayLikeProducts = await rentLaptopModel.find({
      addInCarousel: true,
    });
    let rentalCarousel;
    if (youMayLikeProducts && youMayLikeProducts.length > 0) {
      rentalCarousel = youMayLikeProducts;
    } else {
      rentalCarousel = null;
    }

    const youMayLikeProducts1 = await refurbishedLaptopModel.find({
      addInCarousel: true,
    });
    let refurbishedCarousel;
    if (youMayLikeProducts1 && youMayLikeProducts1.length > 0) {
      refurbishedCarousel = youMayLikeProducts1;
    } else {
      refurbishedCarousel = null;
    }
    
    const paginationInfo = {
      totalItems,
      totalPages,
      currentPage
    }

    if(paginatedProducts && paginatedProducts.length > 0){
      return res.status(200).send({data: paginatedProducts , pagination: paginationInfo, cartId: response._id, totalAmountBeforeGST, GST, totalAmount, address: address.address, userName: existUser.userName || null, email: existUser.email, rentalCarousel, refurbishedCarousel});
    } else {
      return res.status(404).send({error: "Your cart is empty!"});
    }

  }catch(error){
    console.error("Error:", error.message);
    res.status(500).send({error: "Couldn't view my cart now! Please try again later"});
  }
});

router.patch("/updateCart/:cartId/:productId", async(req, res) => {
  const {cartId, productId} = req.params;
  const {quantity} = req.body;
  try{

    const existCart = await cartModel.findOne({_id: cartId, status: "Pending"});
    if(!existCart){
      return res.status(404).send({error: "Cart not found!"});
    };

    const existProduct = await cartModel.findOne({_id: cartId, 'products._id': productId});
    if(!existProduct){
      return res.status(404).send({error: "Product not found!"})
    };

    await cartModel.findOneAndUpdate({_id: cartId, 'products._id': productId}, {$set: {'products.$.quantity': quantity}}, {new: true});

    return res.status(200).send({message: "Product updated successfully!"});


  }catch(error){
    console.error("Error", error.message);
    res.status(500).send({error: "Couldn't update cart now! Please try again later"});
  }
});

router.delete("/removeCart/:cartId/:productId?", async(req, res) => {
  const {cartId, productId} = req.params;
  try{
    const validCart = await cartModel.findOne({_id: cartId});
    if(!validCart){
      return res.status(404).send({error: "Cart not found!"});
    }

    if(!productId){
      const response = await cartModel.findOneAndDelete({_id: cartId});
      if(response){
        return res.status(200).send({message: "Cart removed successfully!"});
      } else {
        return res.status(404).send({error: "Cart not found!"});
      }
    } else {
      const validProduct = await cartModel.findOne({_id: cartId, 'products._id': productId});
      if(!validProduct){
        return res.status(404).send({error: "Product not found!"});
      }
      const response = await cartModel.findOneAndUpdate({_id: cartId}, {$pull: {products: {_id: productId}}}, {new: true});
      if(response){
        return res.status(200).send({message: "Product removed from Cart!"});
      } else {
        return res.status(404).send({error: "Product not found in cart!"});
      }
    }

  }catch(error){
    console.error("Error:", error.message);
    res.status(500).send({error: "Internal Server Error"});
  }
});

module.exports = router;

