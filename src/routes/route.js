const express = require('express');

const router = express.Router();

const usercontroller=require("../controllers/userController")
const cartcontroller=require("../controllers/cartController")
const orderController=require("../controllers/orderController")
const Middleware=require("../middleware/Authentication")
const ProductController = require("../controllers/productController")


//USER API
router.post('/User',usercontroller.registerUser)
router.post('/login',usercontroller.login)
router.get('/user/:userId/profile',Middleware.Auth,usercontroller.GetUsers)
router.put('/user/:userId/profile',Middleware.Auth,usercontroller.UpdateUser)
// Product APIs
router.post('/products', ProductController.CreateProduct)
router.get('/products', ProductController.GetProducts)
router.get('/products/:productId', ProductController.GetWithProductId)
router.put('/products/:productId', ProductController.updateProduct)
router.delete('/products/:productId', ProductController.deleteProduct)
// Cart APIs
router.post('/users/:userId/cart', Middleware.Auth,cartcontroller.createCart)
router.put('/users/:userId/cart',Middleware.Auth ,cartcontroller.updateCart)
router.get('/users/:userId/cart', Middleware.Auth,cartcontroller.getCart)
router.delete('/users/:userId/cart', Middleware.Auth,cartcontroller.deleteCart)
// Order APIs
router.post('/users/:userId/orders', Middleware.Auth,orderController.createOrder)
router.put('/users/:userId/orders', Middleware.Auth, orderController.updateOrder)
module.exports = router;