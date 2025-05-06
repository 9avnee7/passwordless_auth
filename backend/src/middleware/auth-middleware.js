const logger=require('../utils/logger')
const jwt=require('jsonwebtoken')
const authenticateRequest=async(req,res,next)=>{
    logger.info("authentication middleware endpoint hit");
    try{
        const userId=req.headers["x-user-id"];
        logger.info("auth Error", userId);
        console.log('userId',userId)
        if(!userId){
            console.warn("Access attempt Failed");
            return res.status(401).json({
                sucess:false,
                message:"Unauthorized user"
            })
        }

        req.user={userId};
        next();
    }
    catch(e){
        logger.warn("Error authenticating",e);
        res.status(401).json({
            success:false,
            message:"Unauthorized user"
        })
    }

}



module.exports={authenticateRequest};