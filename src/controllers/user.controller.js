import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError}  from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from  "../"

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

        if(
            [fullName, email, username, password].some((field) => filed?.trim()=="")
        ){
            throw new ApiError(400, "All fileds are required.")
        }

        // checking if username or email exist
        // const existedUser = User.findOne({
        //     $or: [{username}, {email}]
        // })

        const existUserName = User.findOne({username});
        const existUserEmail = User.findOne({email});
       
        console.log(existUserEmail);

        if(existUserName){
            throw new ApiError(409,"username is taken.")
        } 
        
        if(existUserEmail){
            throw new ApiError(409,"user already exists.")
        }

        // check for image and  avatar
        const avatarLocalPath = req.files?.avatar[0]?.path;
        const coverImageLocalPath = req.files?.coverImage[0]?.path;

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
            username: username.toLowercase()
        })

        const createdUser = await User.findById(user._id).select(
            "-password -refeshToken"
        )

        if(!createdUser){
            throw new ApiError(500,"something Went wrong while registering the user.")
        }

        res.status(201).json(
            new ApiResponse(200,createdUser,"user registered successfully")
        )
} )





export {registerUser};