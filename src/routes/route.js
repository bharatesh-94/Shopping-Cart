const express = require('express');

const router = express.Router();

const usercontroller=require("../controllers/userController")
const bookcontroller=require("../controllers/cartController")
const Reviewcontroller=require("../controllers/orderController")
 const Middleware=require("../middleware/Authentication")


//USER API
router.post('/User',usercontroller.registerUser)
router.post('/login',usercontroller.login)
router.get('/user/:userId/profile',Middleware.Auth,usercontroller.GetUsers)
router.put('/user/:userId/profile',Middleware.Auth,usercontroller.UpdateUser)

module.exports = router;