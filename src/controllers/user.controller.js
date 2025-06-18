import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploaduploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req,res) => {

    /*
        steps for registering user

        get user details from frontend
        validation - email,username not empty
        check if user already exists
        check for images, check for avatar - required files
        upload them to cloudinary, check for successful upload of avatar
        create user object - create entry in db
        remove password and refresh token field from field
        check for user creation 
        return res
    */

    const {fullName, email, username, password} = req.body
    console.log("Email : ",email);
/*
    if(fullName === ""){
        throw new ApiError(400,"Full Name is required")
    }
*/
    
// here some() - method is used to check wether a field exists and even after trimming
// the field is empty then the condition is true and return an error
    if(
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are required")
    }

// It is optional to chek each field wether they are valid or not
// Like we might check if email is vaild - and this can be done by maintaining a validation file
// that contains the methods to validate different fields and import those methods to validate

    // User.findOne({username})

    // instead of checking for one field alone i want to check multiple fields in either or manner
    // atleast one of the mentioned field matches 

    // so we use operators - 

    const existedUser = User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409,"User already exists")
    }

// since express gives access to req.body - the same way multer gives us access to req.files

// here we are using the optional fiels since the filed may or may not exist '?'
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar = await uploaduploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploaduploadOnCloudinary(coverImageLocalPath)


    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
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
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

    res.status(200).json({
        message:"Successful"
    })
    
})

export {registerUser}