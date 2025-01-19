import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError}  from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from  "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { sendMail } from "../utils/mailerservice.js"; // Import sendMail from mailService


// hum use kagrenge access token ko baar baar isliye hum method bana rahe hai
const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false })
        
        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500,"something went wrong while generating refresh and access token. ")
    }

}







const registerUser = asyncHandler( async (req, res) =>{
    //steps to register user by me
    /* 1 take email, username, name, password, 
       2 check if the email is unique 
       3 at last save the user data and give message user logged in
    */ 

    /*steps to register user by histesh sir
        1 get user details from frontend
        2 validation -not empty
        3 check if user already exists: using username or email
        4 check for images , check for avatar
        5 upload them to cloudinary, avatar
        6 create user object and create entry in db
        7 remove password and refresh token field in response
        8 check for user creation
        9 return response
    */

        const {fullName, email, username, password} = req.body;
   

        // yaha se hum validations likenge
        // if(fullName ===""){
        //     throw new ApiError(400,"fullname is required";)
        // }

        //to check if the filed is valid
        if(
            [fullName, email, username, password].some((field) => field?.trim()=="")
        ){
            throw new ApiError(400, "All fileds are required.")
        }

        // checking if username or email exist
        // const existedUser = User.findOne({
        //     $or: [{username}, {email}]
        // })

        const existUserName = await User.findOne({username});
        const existUserEmail = await User.findOne({email});
       
        console.log(existUserEmail);

        if(existUserName){
            throw new ApiError(409,"username is taken.")
        } 
        
        if(existUserEmail){
            throw new ApiError(409,"user already exists.")
        }

        // check for image and  avatar
        const avatarLocalPath = req.files?.avatar[0]?.path;
        // const coverImageLocalPath = req.files?.coverImage[0]?.path;
        let coverImageLocalPath;

        if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
            coverImageLocalPath = req.files.coverImage[0].path;
        }

        if(!avatarLocalPath){
            throw new ApiError(400, "Avatar file is required.");
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath)
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)

        if(!avatar){
            throw new ApiError(400, "Avatar file is required.")
        }


        const user = await User.create({
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        })

        const createdUser = await User.findById(user._id).select(
            "-password -refeshToken"
        )

        if(!createdUser){
            throw new ApiError(500,"something Went wrong while registering the user.")
        }else{
            // email sercive used 
            const receiverMail = email;
            const subject = "Register successful ";
            const mailData = {
            username:`Dear, ${fullName}`,
            message: "You've made an excellent choice by joining our community! At Pawsome Pets, we're dedicated to providing top-notch care and unparalleled service to you and your beloved pet. Our team of professionals is passionate about delivering exceptional experiences, ensuring your pet receives the love, attention, and expertise they deserve. We're committed to exceeding your expectations and building a lifelong relationship with you and your furry friend!"

            }
            
            await sendMail(receiverMail, subject, mailData);
        }



        console.log(createdUser);
        
        res.status(201).json(
            new ApiResponse(200,createdUser,"user registered successfully")
        )
} )


const loginUser = asyncHandler(async (req, res) => {
/*  steps to register user
    1 step req body -> data
    2 username or email
    3 find the user
    4 check password
    5 access and refresh token
    6 send cookiees
    7 send response
*/ 

    
    const { email, username, password } = req.body;

    console.log(`USernam: ${username}  | Email: ${email}  | Password: ${password}`);


    if( (!password || password.trim() == "") && (!email || email.trim() == "") && (!username || username.trim() === "" )){
        throw new ApiError(400,"All fields empty.")
    }

    if ( (!email || email.trim() === "" )  && (!username || username.trim() === "" )) {
        throw new ApiError(400, "Email or username required.");
    }

    if (!password || password.trim() === "") {
        throw new ApiError(400, "Password required.");
    }


    const user = await User.findOne({ $or:[
        {email},
        {username}
    ]});

    if (!user) {
        throw new ApiError(404, "Email or user is invalid.");
    }

    const isValidPassword = await user.isPasswordCorrect(password);

    if (!isValidPassword) {
        throw new ApiError(401, "Invalid user credentails. ");
    }

   
    const{accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select(" -password -refreshToken ")

    const options = {
        httpOnly: true,
        secure: true
    }


    
    // |this  syntax is same as below note: .json() is not used |  
    //return res.status(200).cookie("accessToken",accessToken).cookie("refreshToken",refreshToken)

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken,
                refreshToken
            },
            "user Logged In Successfully"
        )
    )

});


const logoutUser = asyncHandler( async(req, res) =>{
    /* so lets say ki hum user ko logout karna chahte hai to kaise karenge || iss karne ke liye user ka accessToken aur refreshToken delete karenge jo cookie mein hai || aur db mein refreshToken Field ko empty karenge*/ 
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {refreshToken: undefined }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200,null,"user logout Successfully"))


})

const refreshUserToken = asyncHandler( async(req, res) =>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401,"unautherized request.")
    } 

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

    // verify the user exist
   
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(404,"refresh token used or expired.")
        }
    
        const{accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken: newRefreshToken
                },
                "Token generated Successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh - token")
    }

}) 

const changeCurrentPassword = asyncHandler( async(req, res) =>{

    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"password changed successfully"))
})

const getCurrentUser = asyncHandler( async(req, res) =>{
    
    const getUserData = await User.findById(req.user._id).select("-password -refreshToken")
    
    if(!getUserData){
        throw new ApiError(404,"invalid access.")
    }

    return res.status(200).json(new ApiResponse(201, getUserData, "successfully fetched user data"));
})

let storedotp;
const resetUserPassword = asyncHandler( async(req, res) => {
    const reqType = req.params.type;
    
    
    if(reqType === "verify-email" || reqType === "verify-otp" || reqType === "reset-pwd") {
        const { email } = req.body;
        
        const user = await User.findOne({ email });

        if(reqType === "verify-email") {
            const getuser = user;
            if(!getuser) {
                throw new ApiError("Invalid email ... retry with correct mail");
            }

            let randomOtp; 
            // Function to generate a random 6-digit number
            function generateRandomNumber(){
                return Math.floor(100000 + Math.random() * 900000).toString();
            }
        
            // Generate a random number 
            randomOtp = generateRandomNumber();

            const usermail = email;
            const subject = "password reset mail";
            const userData = {
                username: " ",
                message: `yours otp is: ${randomOtp} please verify quickly..`
            };
            
            storedotp = randomOtp;
            await sendMail(usermail, subject, userData);
            return res.status(200).json(200,{},"email verified and otp sent to email.")

        }

        if (reqType === "verify-otp") {
            let { userOtp } = req.body;
            console.log(storedotp)
            if(storedotp === userOtp) {
               return res.status(200).json(new ApiResponse(201, {}, "otp-checked validated."));
            } else {
                throw new ApiError(404, "invalid otp");
            }
        } 

        if (reqType === "reset-pwd") {
            const { newPassword , email} = req.body;

            // always wait for the asynchrones nature of the await in combination
            const user = await User.findOne({email});
 
            console.log(user)
            console.log(user.pa)
            user.password = newPassword

            await user.save({validateBeforeSave: false})

             return res
            .status(200)
            .json(new ApiResponse(200,{},"password changed successfully"))
        } 
    }
});


const getUSerChannelProfile = asyncHandler( async(req, res) => {

    const { username } = req.params

    if(!username?.trim()){
        throw new ApiError(400, "username is missing")
    }


} )



export {
    registerUser, 
    loginUser,
    logoutUser,
    refreshUserToken,
    changeCurrentPassword,
    getCurrentUser,
    resetUserPassword,
    getUSerChannelProfile
};