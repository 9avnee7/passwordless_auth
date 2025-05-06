const {handleLoginFinish,handleLoginStart,handleLogOut,handleRefresh,handleRegistrationFinish,handleRegistrationStart,
    fetchUserData,verifyOTP,sendOTP }=require('../controllers/auth-controllers')

const express=require('express')
const {authenticateRequest}=require('../middleware/auth-middleware')
const router=express.Router()

router.post('/register-start',handleRegistrationStart)
router.post('/register-finish',handleRegistrationFinish)


router.post('/login-start',handleLoginStart)
router.post('/login-finish',handleLoginFinish)


router.post('/send-otp',sendOTP)
router.post('/verify-otp',verifyOTP)

router.post('/refresh',handleRefresh)

router.get('/fetchuserdata',authenticateRequest,fetchUserData)

router.post('/logout',handleLogOut)


module.exports=router