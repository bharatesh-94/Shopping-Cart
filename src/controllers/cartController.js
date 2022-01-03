const cartModel = require("../models/cartModel")
const productModel = require("../models/productModel")
const userModel = require("../models/userModel")
const mongoose = require("mongoose")
const { findOneAndUpdate } = require("../models/userModel")

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

const createCart = async function (req, res) {
    try {
        if (req.user.userId != req.params.userId) {
            return res.status(401).send({ status: false, msg: "Invalid userId provided" })
        }
        let userId = req.params.userId
        let reqBody = req.body
        const { items } = reqBody

        if (!isValidrequestBody(reqBody)) {
            return res.status(400).send({ status: false, msg: "Please provide details to proceed" })
        }

        if (!validObject(userId)) {
            return res.status(400).send({ status: false, msg: "Invalid userId provided" })
        }

        if (!validObject(items[0].productId)) {
            return res.status(400).send({ status: false, msg: "Invalid productId provided" })
        }

        if (!(items[0].productId && items[0].quantity)) {
            return res.status(400).send({ status: false, msg: "productId and quantity is mandatory" })
        }

        const productIsFound = await productModel.findOne({ _id: items[0].productId, isDeleted: false })
        if (!productIsFound) {
            res.status(400).send({ status: false, msg: "The product requested is not found" })
        }

        totalPriceOfProduct = productIsFound.price * items[0].quantity

        let findUserCart = await cartModel.findOne({ userId: userId })
        if (findUserCart) {

            const cartItemsArray = findUserCart.items
            const productAlreadyInCart = cartItemsArray.findIndex(element => element.productId == items[0].productId)

            if (productAlreadyInCart >= 0) {
                let addQuantity = await cartModel.findOneAndUpdate({ _id: findUserCart._id, "items.$.productId": items[0].productId },
                    {
                        $inc: { "items.$.quantity": +items[0].quantity, totalPrice: +totalPriceOfProduct, totalItems: +items[0].quantity }
                    }, { new: true })

                return res.status(400).send({ status: false, msg: `Quantity of this product is increased by ${items[0].quantity}`, data: addQuantity })
            }

            if (productAlreadyInCart < 0) {
                addProduct = await cartModel.findOneAndUpdate({ _id: findUserCart._id },
                    {
                        $push: { items: items[0] }, $inc: { totalPrice: +totalPriceOfProduct, totalItems: +items[0].quantity }
                    }, { new: true })

                return res.status(400).send({ status: false, msg: "Successfully added to cart", data: addProduct })
            }

        } else {
            let cart = { userId: userId, items: items[0], totalPrice: totalPriceOfProduct, totalItems: items[0].quantity }
            let create = await cartModel.create(cart)
            return res.status(201).send({ status: true, msg: "Successfully added to cart", data: cart })
        }
    }catch (err){
        res.status(500).send({ status: false, msg: err.message })
    }
}


module.exports.createCart = createCart

const updateCart = async function (req, res) {
    try {

        let userId = req.params.userId
        let body = req.body
        const { cartId, productId, removeProduct } = body

        if (!isValidrequestBody(body)) {
            return res.status(400).send({ status: false, msg: "Please provide details to proceed" })
        }

        if (!validObject(userId)) {
            res.status(400).send({ status: false, msg: "Provide a valid userId" })
        }

        let userExists = await userModel.findOne({ _id: userId })
        if (!userExists) {
            return res.status(400).send({ status: false, message: "user do not exists" })
        }

        if (req.user.userId != userId) {
            return res.status(401).send({ status: false, msg: "User not Authorized" })
        }

        if (!validObject(cartId)) {
            res.status(400).send({ status: false, msg: "Provide a valid cartId" })
        }

        let findCart = await cartModel.findOne({ _id: cartId, userId: userId })
        if (!findCart) {
            res.status(400).send({ status: false, msg: "cart do not exists" })
        }

        if (!validObject(productId)) {
            res.status(400).send({ status: false, msg: "Provide a valid productId" })
        }

        let checkProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!checkProduct) {
            return res.status(400).send({ status: false, msg: "The product no longer exist" })
        }

        productInCart = await cartModel.findOne({ _id: cartId, userId: userId, "items.productId": productId})
        if(!productInCart){
           return res.status(400).send({status:false, message: "Product not in cart to modify"})
        }

        let productIndex = productInCart.items.findIndex(element => element.productId == productId)
        //console.log(productIndex)
        // checkProductExistsInCart = findCart.items
        // //console.log(checkProductExistsInCart)
        // productFoundArray = []        
        // for(let i=0; i<checkProductExistsInCart.length; i++){
        //         if(checkProductExistsInCart[i].productId == productId){
        //             productFoundArray.push(checkProductExistsInCart[i])
        //         }
        //     }

        // if(productFoundArray.length == 0){
        //   return res.status(400).send({status: false, message: "Product not in cart to modify"})
        // }  

       // if (productFoundArray.length != 0) {
            if (removeProduct == 1) {
                if (productInCart.items[productIndex].quantity > 1) {
                   // let productIndex = checkProductExistsInCart.findIndex(element => element.productId == productId)
                    // findCart.items[productIndex].quantity = findCart.items[productIndex].quantity - 1
                    // findCart.totalItems = findCart.totalItems - 1
                    // findCart.totalPrice = findCart.totalPrice - checkProduct.price
                    // await findCart.save()

                    decrementProductAndRemove = await cartModel.findOneAndUpdate({ _id: cartId, "items.productId": productId}, 
                    {
                       $inc: { "items.$.quantity" : -1, totalPrice: -checkProduct.price, totalItems: -1 }
                    }, { new: true })

                    //decrementProductAndRemove = await cartModel.findOne({ /*_id: cartId,*/ $expr: { $arrayElemAt: [`$items.${productIndex}productId`, productIndex]}})
                    // {   $expr: { $arrayElemAt: ["items.$.productId", productIndex]}}

                        //     $inc: { "items.$.quantity": -1, totalPrice: -checkProduct.price, totalItems: -1 }
                        // }, { new: true })

                      // console.log(decrementProductAndRemove)
                    return res.status(400).send({ status: false, message: "cart modified", data: decrementProductAndRemove })
                }
            }

            if(removeProduct == 0 || productInCart.items[productIndex].quantity == 1){
                const priceOfProductRemoved = checkProduct.price*productInCart.items[productIndex].quantity
                const removeProductFromCart = await cartModel.findOneAndUpdate({ _id: cartId },
                    {  
                        $pull: { items: productInCart.items[productIndex] }, $inc: { totalPrice: -priceOfProductRemoved, totalItems: -productInCart.items[productIndex].quantity }
                    }, { new: true })
                return res.status(400).send({ status: false, message: "cart modified", data: removeProductFromCart })

            }
        //}

    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}


module.exports.updateCart = updateCart

const getCart = async function(req,res){
    try{
        
        let userId = req.params.userId
        
        if(!validObject(userId)){
            return res.status(400).send({status: false, msg: "userId is invalid"})
        }
        if(req.user.userId!= userId){
            return res.status(401).send({status: false, msg:"Invalid userId provided"})
            }
        
        let findUser = await userModel.findOne({_id: userId})
        if(!findUser){
            return res.status(400).send({status: false, msg: "User does not exist"})
        }
        let findCart = await cartModel.findOne({userId: userId}).select({items: 1, _id:0})
        if(!findCart){
            return res.status(400).send({status: false, msg: "Cart does not exist"})
        }
        res.status(200).send({status: true, data: findCart})
        
    }catch(err){
        res.status(500).send({status: false, msg: err.message})
    }
}
module.exports.getCart = getCart

const deleteCart = async function(req,res){
    try{
        let userId = req.params.userId
        if(req.user.userId != userId){
            return res.status(401).send({status: false, msg:"Invalid userId provided"})
    
            }
        if(!validObject(userId)){
            return res.status(400).send({status: false, msg: "Provide a valid object Id"})
        }
        let checkCart = await cartModel.findOne({userId: userId})
        if(!checkCart){
            return res.status(400).send({status: false, msg: "Cart does not exist"})
        }
        let checkUser = await userModel.findOne({_id: userId})
        if(!checkUser){
            return res.status(400).send({status: false, msg: "User not found"})
        }
        let deleteItems = await cartModel.findOneAndUpdate({userId: userId},
            {items: [], totalPrice: 0, totalItems: 0}, {new: true})
        res.status(200).send({status: true, msg:"Cart is empty", data: deleteItems})
    }catch(err){
        res.status(500).send({status: false, msg: err.message})

    }
}
module.exports.deleteCart = deleteCart
