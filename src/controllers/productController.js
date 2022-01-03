const ProductModel = require("../models/productModel")
const aws = require("aws-sdk")
const mongoose = require("mongoose")
// const { findOneAndUpdate } = require("../models/productModel")




const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}

const isValidrequestBody = function (requestBody) {
    return Object.keys(requestBody).length !== 0

}
const validObject = function (value) {
    return mongoose.Types.ObjectId.isValid(value)
}


 const validSize = function (value) {
        return ["S", "XS","M","X", "L","XXL", "XL"].indexOf(value) !== -1
    }


const CreateProduct = async function (req, res) {
    try {
        const requestBody = req.body.data
        const JSONbody = JSON.parse(requestBody)
        console.log(JSONbody)
        const { title, description, price, isFreeShipping, style, availableSizes, installments } = JSONbody
        if (!isValidrequestBody(JSONbody)) {
            return res.status(400).send({ status: false, msg: "Provide product details you want to update" })
        }
        if (!isValid(title)) {
            return res.status(400).send({ status: false, message: 'title is not valid' })

        }
        if(!validSize(availableSizes)){
            return res.status(400).send({status: false, msg: "Size does not match"})
        }
        if (!isValid(description)) {
            return res.status(400).send({ status: false, message: 'description is not valid' })

        }
        if (typeof price != "number") {
            return res.status(400).send({ status: false, message: 'Enter a valid price' })

        }
        
        let findTitle = await ProductModel.find({title: title.toLowerCase()})
        if(findTitle.length !=0){
            res.status(400).send({status: false, msg: "title already exists"})
        }
        
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
                    Key: "pk_newFolder/productimages" + file.originalname, // HERE    "pk_newFolder/harry-potter.png" pk_newFolder/harry-potter.png
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
            var uploadedFileURL = await uploadFile(files[0]); // expect this function to take file as input and give url of uploaded file as output 
            //   res.status(201).send({ status: true, data: uploadedFileURL });
            const ProductData = {
                title: title, description: description, price: price, currencyId: "₹", currencyFormat: "INR",
                isFreeShipping: isFreeShipping, productImage: uploadedFileURL, style: style, availableSizes: availableSizes, installments: installments
            }
            let saveduser = await ProductModel.create(ProductData)
            res.status(201).send({ status: true, message: "Product successfully created", data: saveduser })


        } else {
            res.status(400).send({ status: false, msg: "Please upload a product image" });
        }
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}

module.exports.CreateProduct = CreateProduct

const GetProducts = async function (req, res) {
    try {
        let Size = req.query.Size
        let name = req.query.name
        let priceSort = req.query.priceSort
        let priceGreaterThan = req.query.priceGreaterThan
        let priceLessThan = req.query.priceLessThan
        let priceObj = {}
        if(priceGreaterThan){
            priceObj["$gt"] = priceGreaterThan
        }
        if(priceLessThan){
            priceObj["$lt"] = priceLessThan
        }
        if(priceLessThan || priceGreaterThan){
        let priceSearch = await ProductModel.find({price: priceObj, isDeleted: false}).sort({price: priceSort})
        console.log(priceSearch)
        if(priceSearch.length !=0){
            return res.status(200).send({status: true, msg: "Success", data:{priceSearch}})
        }else{
            return res.status(400).send({status: false, msg:"No matches in this price range found"})
        }
        }
        if (Size) {
            let findSize = await ProductModel.find({ availableSizes: Size, isDeleted: false}).sort({price: priceSort})
            
            if (findSize.length != 0) {
                return res.status(200).send({ status: true, msg: "Success", data: {findSize}})
            } else {
                return res.status(400).send({ status: false, msg: `No products of size ${Size} found` })
            }
        }
        if (name) {
            let findName = await ProductModel.find({ title: { $regex: name, $options: 'i' },isDeleted: false}).sort({price: priceSort})
            // console.log(findName)
            if (findName.length != 0) {
                return res.status(200).send({ status: true, msg: "Success", data: { findName } })
            } else {
                return res.status(400).send({ status: false, msg: `No product of name ${name} found` })
            }
        }
        
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}
module.exports.GetProducts = GetProducts

const GetWithProductId = async function (req, res) {
    try {
        let pid = req.params.productId
        if (!validObject(pid)) {
            return res.status(403).send({ status: false, msg: `the product id ${pid} is not valid` })
        }
        let findProduct = await ProductModel.find({ _id: pid, isDeleted: false })
        if (findProduct.length != 0) {
            return res.status(200).send({ status: true, msg: "Success", data: { findProduct } })
        } else {
            return res.status(400).send({ status: false, msg: `No product found with productId ${pid}` })
        }




    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}
module.exports.GetWithProductId = GetWithProductId

const updateProduct = async function(req,res){
    try{
        let pid = req.params.productId
        let reqbody = req.body.data
        let useBody = JSON.parse(reqbody)
        const { title, description, price, isFreeShipping, style, availableSizes, installments } = useBody
        if (!validObject(pid)) {
            return res.status(403).send({ status: false, msg: `the product id ${pid} is not valid` })
        }


        let checkProduct = await ProductModel.find({_id: pid, isDeleted: false})
        if(checkProduct.length != 0){
            if(title){
            let uniqueTitle = await ProductModel.findOne({title: title})
            if(uniqueTitle){
                return res.status(400).send({status: false, msg: "This title already exists"})
            }
            }
            // res.status(200).send({status: true, msg: "Success", data:{updateProduct}})
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
                        Key: "pk_newFolder/productimages" + file.originalname, // HERE    "pk_newFolder/harry-potter.png" pk_newFolder/harry-potter.png
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
                var uploadedFileURL = await uploadFile(files[0]); // expect this function to take file as input and give url of uploaded file as output 
                //   res.status(201).send({ status: true, data: uploadedFileURL });
                }
                const ProductData = {
                    title: title, description: description, price: price, currencyId: "₹", currencyFormat: "INR",
                    isFreeShipping: isFreeShipping, productImage: uploadedFileURL, 
                    style: style, availableSizes: availableSizes, installments: installments}
             let updateProduct = await ProductModel.findOneAndUpdate({_id: pid},
                ProductData, {new: true})
            res.status(200).send({status: true, msg: 'Success', data:{updateProduct}})
                
        }else{
            return res.status(400).send({status: false, msg:"Product has been deletd or not found"})
        }


    }catch(err){
        res.status(500).send({status: false, msg: err.message})
    }
}
module.exports.updateProduct = updateProduct

const deleteProduct = async function(req,res){
    try{
        let dParam = req.params.productId
        if(!validObject(dParam)){
           return  res.status(400).send({status: false, msg: "The given ProductId is invalid"})
        }
        let fAndUp = await ProductModel.findOneAndUpdate({_id: dParam, isDeleted: false},
             {isDeleted: true,deletedAt: Date.now()}, {new: true})
        if(!fAndUp){
            return res.status(404).send({status: false, msg: "Product does not exist"})
        }else{
           return res.status(200).send({status: true, msg: "Success", data:{fAndUp}})
        }


    }catch(err){
        res.status(500).send({status: false, msg: err.message})
    }
}
module.exports.deleteProduct = deleteProduct
