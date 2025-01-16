import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError}  from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from  "../utils/ApiResponse.js"

import { sendMail } from "../utils/mailerservice.js"; // Import sendMail from mailService










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
            username:fullName,
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
    console.log("indise the function");
    const { email, password } = req.body;

    console.log(`Email: ${email}  | Password: ${password}`);


    if( (!password || password.trim() == "") && (!email || email.trim() == "") ){
        throw new ApiError(400,"email and password filed is empty.")
    }

    if (!email || email.trim() === "") {
        throw new ApiError(400, "Email field is empty.");
    }

    if (!password || password.trim() === "") {
        throw new ApiError(400, "Password field is empty.");
    }

    console.log("Required fields are filled.");

    const usermail = await User.findOne({ email });

    if (!usermail) {
        throw new ApiError(404, "Email is invalid.");
    }

    const validPassword = await usermail.isPasswordCorrect(password);

    if (!validPassword) {
        throw new ApiError(401, "Password is incorrect.");
    }

    res.status(200).json(new ApiResponse(200, usermail, "User successfully logged-in"));
});


export {
    registerUser, 
    loginUser
};