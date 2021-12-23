const UserModel = require("../models/userModel.js")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const aws = require("aws-sdk");
const mongoose = require("mongoose")

const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}

const isValidrequestBody = function (requestBody) {
    return Object.keys(requestBody).length !== 0

}
function telephoneCheck(str) {
    if (/^(1\s|1|)?((\(\d{3}\))|\d{3})(\-|\s)?(\d{3})(\-|\s)?(\d{4})$/.test(str)) {
        return true
    }
    return false
}

//POST /register
const registerUser = async function (req, res) {
    try {

        const requestBody = req.body.data
        const JSONbody = JSON.parse(requestBody)

        if (!isValidrequestBody(JSONbody)) {
            res.status(400).send({ status: false, message: 'value in request body is required' })
            return
        }

        //extract param
        const { fname, lname, email, password, phone, address } = JSONbody

        if (!isValid(fname)) {
            return res.status(400).send({ status: false, message: 'first name is not valid' })

        }

        if (!isValid(lname)) {
            return res.status(400).send({ status: false, message: 'last name is not valid' })

        }

        if (!isValid(email)) {
            res.status(400).send({ status: false, message: 'email is required' })
            return
        }

        if (!isValid(password)) {
            res.status(400).send({ status: false, message: 'password is required' })
            return
        }

        if (!((password.length > 7) && (password.length < 16))) {

            return res.status(400).send({ status: false, message: `Password length should be between 8 and 15.` })

        }
        if (!telephoneCheck(phone.trim())) {
            return res.status(400).send({ status: false, msg: "The phone no. is not valid" })
        }
        if (!isValid(address)) {
            return res.status(400).send({ status: false, msg: "Address is mandatory" })
        }
        if (!isValid(address.shipping)) {
            return res.status(400).send({ status: false, msg: "Shipping address is missing mandatory fields" })

        }
        if (!isValid(address.shipping.street && address.shipping.city && address.shipping.pincode)) {
            return res.status(400).send({ status: false, msg: "Some shipping address details or detail are/is missing" })
        }
        if (!isValid(address.billing)) {
            return res.status(400).send({ status: false, msg: "Billing address is missing mandatory fields" })
        }
        if (!isValid(address.billing.street && address.billing.city && address.billing.pincode)) {
            return res.status(400).send({ status: false, msg: "Some billing address details or detail are/is missing" })
        }
        const isNumberorEmailAlreadyUsed = await UserModel.findOne({ phone }, { email });
        if (isNumberorEmailAlreadyUsed) {
            res.status(400).send({ status: false, message: `${phone} number or ${email} mail is already registered` })
            return
        }
        if (!isValid(email)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide valid email' })
            return
        }

        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email.trim()))) {
            res.status(400).send({ status: false, message: `Email should be a valid email address` })
            return
        }

        //AWS-S3
        aws.config.update({
            accessKeyId: "AKIAY3L35MCRRMC6253G",  // id
            secretAccessKey: "88NOFLHQrap/1G2LqUy9YkFbFRe/GNERsCyKvTZA",  // like your secret password
            region: "ap-south-1" // Mumbai region
        });


        // this function uploads file to AWS and gives back the url for the file
        let uploadFile = async (file) => {
            return new Promise(function (resolve, reject) { // exactly 

                // Create S3 service object
                let s3 = new aws.S3({ apiVersion: "2006-03-01" });
                var uploadParams = {
                    ACL: "public-read", // this file is publically readable
                    Bucket: "classroom-training-bucket", // HERE
                    Key: "pk_newFolder/profileimages" + file.originalname, // HERE    "pk_newFolder/harry-potter.png" pk_newFolder/harry-potter.png
                    Body: file.buffer,
                };

                // Callback - function provided as the second parameter ( most oftenly)
                s3.upload(uploadParams, function (err, data) {
                    if (err) {
                        return reject({ "error": err });
                    }
                    console.log(data)
                    console.log(`File uploaded successfully. ${data.Location}`);
                    return resolve(data.Location); //HERE 
                });
            });
        };

        let files = req.files;
        if (files && files.length > 0) {
            //upload to s3 and return true..incase of error in uploading this will goto catch block( as rejected promise)
            let uploadedFileURL = await uploadFile(files[0]); // expect this function to take file as input and give url of uploaded file as output 
            //   res.status(201).send({ status: true, data: uploadedFileURL });
            const EncrypPassword = await bcrypt.hash(password, 10)
            // console.log(EncrypPassword)
            profileImage = uploadedFileURL
            const userData = { fname, lname, email, phone, profileImage, password: EncrypPassword, address }
            let saveduser = await UserModel.create(userData)
            res.status(201).send({ status: true, message: 'user created succesfully', data: saveduser })
        }
        else {
            res.status(400).send({ status: false, msg: "No file to write" });
        }


    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message })

    }
}

//POST /login
const login = async function (req, res) {
    try {

        const requestBody = req.body
        if (!isValidrequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'value in request body is required' })
            return
        }

        let email = req.body.email
        let password = req.body.password

        if (!isValid(email)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide valid email' })
            return
        }
        //  email = email.trim();

        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
            res.status(400).send({ status: false, message: `Email should be a valid email address` })
            return
        }

        if (!isValid(password)) {
            res.status(400).send({ status: false, message: 'password must be present' })
            return
        }

        if (email && password) {
            let User = await UserModel.findOne({ email: email })
            if (!User) {
                return res.status(400).send({ status: false, msg: "email does not exist" })
            }
            let decryppasss = await bcrypt.compare(password, User.password);

            if (decryppasss) {
                const Token = jwt.sign({
                    userId: User._id,
                    iat: Math.floor(Date.now() / 1000), //issue date
                    exp: Math.floor(Date.now() / 1000) + 30 * 60
                }, "Group8") //exp date 30*60=30min
                // res.header('x-api-key', Token)

                res.status(200).send({ status: true, msg: "success", data: { userId: User._id, token: Token } })
            } else {
                res.status(400).send({ status: false, Msg: "Invalid password" })
            }
        }
    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}

const GetUsers = async function (req, res) {
    try {
        //console.log(req.user)
        if (req.user.userId != req.params.userId) {
            return res.status(401).send({ status: false, msg: "userId does not match" })
        }
        let userId = req.params.userId
        console.log(userId)
        let findUserId = await UserModel.findOne({ _id: userId })
        if (findUserId) {
            res.status(200).send({ status: true, msg: "User Profile details", data: findUserId })
        }

    } catch (err) {
        res.staus(500).send({ status: false, msg: err.message })
    }
}

const UpdateUser = async function (req, res) {
    try {

        if (req.user.userId != req.params.userId) {
            return res.status(401).send({ status: false, msg: "userId does not match" })
        }
        let userId = req.params.userId
        if (!isValidrequestBody(JSON.parse(req.body.data))) {
            return res.status(400).send({ status: false, msg: "there is nothing to update" })
        }
        const { fname, lname, email, password, phone, address } = JSON.parse(req.body.data)

        if (password) {
            if (!isValid(password)) {
                res.status(400).send({ status: false, msg: "password string is missing" })
            }
            var epass = await bcrypt.hash(password, 10)
        }
        if (fname) {
            if (!isValid(fname)) {
                return res.status(400).send({ status: false, msg: "provide a fname to update" })
            }
        }
        if (email) {
            if (!isValid(email)) {
                return res.status(400).send({ status: false, msg: "provide a email to update" })
            }


        }
        if (lname) {
            if (!isValid(lname)) {
                return res.status(400).send({ status: false, msg: "provide the lname that you want to update" })
            }
        }
        if (phone) {
            if (!telephoneCheck(phone)) {
                return res.status(400).send({ status: false, msg: "Enter a valid phone number that you want to update" })
            }
        }
        if (address) {
            if (!isValidrequestBody(address)) {
                res.status(400).send({ status: false, msg: "provide valid address you want to update" })
            }


            if (address.shipping) {
                if (!isValid(address.shipping.street && address.shipping.city && address.shipping.pincode)) {
                    res.status(400).send({ status: false, msg: "provide the shipping address that you want to update" })
                }
            }
            if (address.billing) {
                if (!isValid(address.billing.street && address.billing.city && address.billing.pincode)) {
                    res.status(400).send({ status: false, msg: "provide the billing address that you want to update" })
                }
            }

        }


        // const isNumberorEmailAlreadyUsed = await UserModel.findOne({ phone: phone }, { email: email });
        // if (isNumberorEmailAlreadyUsed) {
        //     res.status(400).send({ status: false, message: `${phone} number or ${email} mail is already registered` })
        //     return
        // }

        aws.config.update({
            accessKeyId: "AKIAY3L35MCRRMC6253G",  // id
            secretAccessKey: "88NOFLHQrap/1G2LqUy9YkFbFRe/GNERsCyKvTZA",  // like your secret password
            region: "ap-south-1" // Mumbai region
        });


        // this function uploads file to AWS and gives back the url for the file
        let uploadFile = async (file) => {
            return new Promise(function (resolve, reject) { // exactly 

                // Create S3 service object
                let s3 = new aws.S3({ apiVersion: "2006-03-01" });
                var uploadParams = {
                    ACL: "public-read", // this file is publically readable
                    Bucket: "classroom-training-bucket", // HERE
                    Key: "pk_newFolder/profileimages" + file.originalname, // HERE    "pk_newFolder/harry-potter.png" pk_newFolder/harry-potter.png
                    Body: file.buffer,
                };

                // Callback - function provided as the second parameter ( most oftenly)
                s3.upload(uploadParams, function (err, data) {
                    if (err) {
                        return reject({ "error": err });
                    }
                    console.log(data)
                    console.log(`File uploaded successfully. ${data.Location}`);
                    return resolve(data.Location); //HERE 
                });
            });
        };

        let files = req.files;
        //  if(!files){

        //     let UpdateUserDetails = await UserModel.findOneAndUpdate({_id: userId}, {fname: fname, 
        //         lname: lname,email: email,profileImage: profileImage,
        //          password: encryppass,phone: phone, address: address}, {new: true})
        //     res.status(200).send({status: true, msg: "User profile updated", data: UpdateUserDetails})
        //  }

        if (files && files.length > 0) {
            //upload to s3 and return true..incase of error in uploading this will goto catch block( as rejected promise)
            let uploadedFileURL = await uploadFile(files[0]); // expect this function to take file as input and give url of uploaded file as output 
            //   res.status(201).send({ status: true, data: uploadedFileURL });
            //    const EncrypPassword = await bcrypt.hash(password, 10)
            // console.log(EncrypPassword)
            var profileImage = uploadedFileURL
            //    const userData = { fname, lname, email,phone,profileImage, password: EncrypPassword, address }
            //    let saveduser = await UserModel.create(userData)
            //    res.status(201).send({ status: true, message: 'user created succesfully', data: saveduser })
        }


        let UpdateUserDetails = await UserModel.findOneAndUpdate({ _id: userId }, {
            fname: fname,
            lname: lname, email: email, profileImage: profileImage,
            password: epass, phone: phone, address: address
        }, { new: true })
        res.status(200).send({ status: true, msg: "User profile updated", data: UpdateUserDetails })
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}


module.exports.registerUser = registerUser
module.exports.login = login
module.exports.GetUsers = GetUsers
module.exports.UpdateUser = UpdateUser