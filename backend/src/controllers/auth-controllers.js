const mongoose = require('mongoose');
const User = require("../model/authUser");
const RefreshToken = require('../model/refreshToken');
const { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } = require('@simplewebauthn/server');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {generateTokens}=require('../utils/generateToken')
const {sendOTPEmail}=require('../utils/email')
const {}=require('crypto')
const redisClient=require('../utils/redisClient')

const { webcrypto } = require('crypto');
globalThis.crypto = webcrypto;

// Add logger (assuming you have a logger configured)
const logger = require('../utils/logger'); // Adjust path as needed
const { transports } = require('winston');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-strong-secret-key-here';
const JWT_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// FIDO2 Configuration
const rpName = 'passwordless-auth';
const rpID = process.env.RP_ID || 'localhost';
const origin = process.env.ORIGIN || 'http://localhost:5173';

const handleRegistrationStart = async (req, res) => {
    try {
        const { username, email } = req.body;
        logger.info(`Registration started for email: ${email}`);

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            logger.error(`User already exists: ${email}`);
            return res.status(400).json({ error: 'User already exists' });
        }

        // Generate registration options
        const options = await generateRegistrationOptions({
            rpName,
            rpID,
            userName: username,
            attestationType: 'none',
            authenticatorSelection: {
                residentKey: 'required',
                userVerification: 'preferred',
            },
            excludeCredentials: [],
            timeout: 60000,  
        });

        // Store temporary challenge (in production, use Redis with expiry)
        const newUser = new User({
            username,
            email,
            currentChallenge: options.challenge,
            registrationInProgress: true
        });
        await newUser.save();
        logger.info(`Registration options generated for: ${email}`);

        res.json(options);
    } catch (error) {
        logger.error(`Registration start error: ${error.message}`, { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

const handleRegistrationFinish = async (req, res) => {
    try {
        const { email, attestationResponse } = req.body;
        logger.info(`Registration finish initiated for: ${email}`);

        // Find the user with registration in progress
        const user = await User.findOne({ email, registrationInProgress: true });
        if (!user) {
            logger.error(`User not found or registration not started: ${email}`);
            return res.status(404).json({ error: 'User not found or registration not started' });
        }

        // Verify the registration response
        const verification = await verifyRegistrationResponse({
            response: attestationResponse,
            expectedChallenge: user.currentChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
        });

        if (!verification.verified || !verification.registrationInfo) {
            logger.error(`Verification failed for: ${email}`);
            return res.status(400).json({ error: 'Verification failed' });
        }

        // Save the verified credential
        // console.log(verification)
        // const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

        const { credential } = verification.registrationInfo;

        const { id, publicKey, counter, transports } = credential;

        // Store credentials properly
        user.credentials = [{
            credentialID: id, // Store the raw base64url string
            credentialPublicKey: Buffer.from(publicKey), // Convert to base64 string
            counter,
            transports: transports || ['internal'],
        }];
        
        res.setHeader('x-user-id',`${user._id}`);
        user.registrationInProgress = false;
        user.currentChallenge = null;
        await user.save();
        logger.info(`User registration completed successfully: ${email}`);

        // Generate tokens
        const { accessToken, refreshToken }= await generateTokens(user);
        res.cookie('refreshToken',refreshToken,{
            httpOnly:true,
            secure:true,
            sameSite:'None',
            maxAge:7*24*60*60*1000

        })

        res.cookie('xUserId',user._id,{
            httpOnly: true, 
            secure:true,
            sameSite:'None',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        console.log(accessToken,refreshToken)
        
        res.json({ 
            success: true, 
            accessToken, 
            refreshToken,
            user: { email: user.email, username: user.username }
        });
    } catch (error) {
        logger.error(`Registration finish error: ${error.message}`, { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

const handleLoginStart = async (req, res) => {
    try {
        const { email } = req.body;
        logger.info(`Login started for: ${email}`);

        // Find user by email
        const user = await User.findOne({ email });
        // console.log(user)
        if (!user || !user.credentials || user.credentials.length === 0) {
            logger.error(`User not found or not registered: ${email}`);
            return res.status(404).json({ error: 'User not found or not registered' });
        }

        // Generate authentication options
        console.log("till here")
        const allowCredentials = user.credentials.map(cred => {
            return {
                id: cred.credentialID, // Use the stored base64url string directly
                type: 'public-key',
                transports: cred.transports,
            };
        });

        const options = await generateAuthenticationOptions({
            rpID,
            allowCredentials,
            userVerification: 'preferred',
        });



        // console.log(options)

        // Store challenge for verification
        user.currentChallenge = options.challenge;
        await user.save();
        logger.info(`Login options generated for: ${email}`);

        res.json(options);
    } catch (error) {
        logger.error(`Login start error: ${error.message}`, { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

const handleLoginFinish = async (req, res) => {
    try {
        const { email, assertionResponse } = req.body;
        logger.info(`Login finish initiated for: ${email}`);

        // Find user by email
        const user = await User.findOne({ email });
        // console.log("login finish",user)
        if (!user || !user.credentials || user.credentials.length === 0) {
            logger.error(`User not found or not registered: ${email}`);
            return res.status(404).json({ error: 'User not found or not registered' });
        }
        console.log("till here")
        // Get the credential used for authentication
        const credential = user.credentials.find(
            cred => cred.credentialID === assertionResponse.id
        );
        // console.log(credential.counter)
        console.log("till here 2")
        if (!credential) {
            logger.error(`Invalid credential for: ${email}`);
            return res.status(400).json({ error: 'Invalid credential' });
        }
        console.log("till here 23")
        // const publicKeyUint8 = new Uint8Array(credential.credentialPublicKey.buffer);

        const webauthCredenatials={
            id:credential.id,
            publicKey: credential.credentialPublicKey,
            counter:credential.counter,
            transports:credential.transports
            
        }
        // console.log("cred",webauthCredenatials)
        const verification = await verifyAuthenticationResponse({
            response: assertionResponse,
            expectedChallenge: user.currentChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            credential:webauthCredenatials,
            
            requireUserVerification: false 
        });
        console.log("till here 3")
        if (!verification.verified) {
            logger.error(`Authentication failed for: ${email}`);
            return res.status(400).json({ error: 'Authentication failed' });
        }

        // console.log(verification)
        // Update credential counter
        credential.counter = verification.authenticationInfo.newCounter;
        user.currentChallenge = null;
        await user.save();
        logger.info(`User logged in successfully: ${email}`);

        // Generate tokens
        const { accessToken, refreshToken } = await generateTokens(user);
        console.log(accessToken,"accessToken",refreshToken)

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true, // Prevents XSS attacks
            secure:true,
            sameSite:'None',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.cookie('xUserId',user._id,{
            httpOnly: true, // Prevents XSS attacks
            secure:true,
            sameSite:'None',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

   
        
        console.log("Set-Cookie Header:", res.getHeaders()["set-cookie"]);
        // console.log(res.cookie);

        res.setHeader('x-user-id',`${user._id}`);//setting header
        console.log('x-user-id', res.getHeaders()["x-user-id"]);

        res.json({ 
            success: true, 
            accessToken, 
            refreshToken,
            user: { email: user.email, username: user.username }
        });
    } catch (error) {
        console.log(error)
        logger.error(`Login finish error: ${error.message}`, { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

const handleLogOut=async(req,res)=>{
    logger.info("logout endpoint hit");
    try{
        
        res.clearCookie("refreshToken");
        res.clearCookie('xUserId');
        return res.status(200).json({ message: "Logged out successfully" });
    }
    catch(e){
        return res.status(500).json({
            message:"Error Occured in logging out",
            error:e
        })
    }
        
}

const handleRefresh = async (req, res) => {
    console.log("New Request Cookies:", req.cookies);
    logger.info("Handle refresh token endpoint hit");

    try {
        
        const userId=req.cookies.xUserId;
        console.log(userId)
        const refreshToken = req.cookies.refreshToken;
        console.log(refreshToken)
        if (!refreshToken) {
            return res.status(403).json({ message: "Refresh Token Required" });
        }

        // Verify refresh token
        jwt.verify(refreshToken, process.env.JWT_SECURITY_KEY, async (err, user) => {
            if (err) {
                console.error("JWT Verification Error:", err);
                return res.status(403).json({ message: "Invalid Refresh Token" });
            }

          
            const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user);

            console.log("New Access Token Generated:", accessToken);

            res.cookie("refreshToken", newRefreshToken, {
                httpOnly: true,
                secure:true,
                sameSite:'None',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            return res.status(200).json({
                accessToken,
                userId:userId
            });
        });
    } catch (error) {
        logger.error(`Error in handling refresh token: ${error.message}`);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};




const fetchUserData=async(req,res)=>{
    logger.info('fetch user endpoint hit')
    
    try{
        const user_id=req.user?.userId;

        console.log("user-id",user_id);
        const userData=await User.findById(user_id);
        // console.log(userData)

        if(!userData){
            return res.status(401).json({
                message: "Unauthorized request userId is not valid"
            });
        }

       return res.status(200).json({
           userData:userData
        })


    }
    catch(e){

        return res.status(500).json({
            message:`Error Occured in handling fetching user  data ${e}`,
            error:e
        })
    }
}



const OTP_EXPIRY = 5 * 60; // 5 minutes

const sendOTP = async (req, res) => {
  const { email } = req.body;

  const otp = crypto.randomInt(100000, 999999).toString();
  await redisClient.setEx(`otp:${email}`, OTP_EXPIRY, otp);

  // TODO: send OTP via email (use nodemailer or third-party SMS API)
  console.log(`OTP for ${email}: ${otp}`);

  await sendOTPEmail(email,otp)
  return res.status(200).json({ message: 'OTP sent' });
};


const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  const storedOtp = await redisClient.get(`otp:${email}`);
  if (!storedOtp || storedOtp !== otp) {

    return res.status(401).json({ message: 'Invalid or expired OTP' });
  }

  await redisClient.del(`otp:${email}`);

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const {accessToken,refreshToken}=await generateTokens(user);

  return res.json({ 
    success: true, 
    accessToken, 
    refreshToken,
    user: { email: user.email, username: user.username }
});
};


module.exports = {
    handleLoginFinish,
    handleLoginStart,
    handleRegistrationFinish,
    handleRegistrationStart,
    handleRefresh,
    fetchUserData,
    handleLogOut,
    sendOTP,
    verifyOTP
};