import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import {User} from "../models/user.model.js"

export const verifyJWT = asyncHandler( async(req, res, next) =>{
    // yaha user ke pass se cookie manga hai || jisme accessToken hoga || but user ke pass cookies hai hi nahi toh vo directly error send karega
   try {
     const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
 
     if(!token){
         throw new ApiError(401,"Unauthorized request")
     }
 
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
 
     const user = await User.findById(decodedToken?._id).select("-password-refreshToken")
 
     if(!user){
         // Next Video Discuss about frontend
         throw new ApiError(401, "Invalid Access Token")
     }
 
     req.user = user;
     next()
   } catch (error) {
        throw new ApiError(401,error?.message ||"Invalid access")
   }
}) 