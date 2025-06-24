import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async(userId) => {
    try {
        
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken

        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating access and refresh token")
    }
}

const registerUser = asyncHandler(async (req,res) => {

    console.log("Request : ", req);
    

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

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
   
    if(existedUser){
        throw new ApiError(409,"User already exists")
    }

// since express gives access to req.body - the same way multer gives us access to req.files

// here we are using the optional fiels since the filed may or may not exist '?'

    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && (req.files.coverImage.length > 0)){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    console.log("Request files : ", req.files);
    

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

//  I encountered a validation error since i have mentioned the coverImage field in the 
//  schema as required 

    console.log("Avatar: ",avatar);
    console.log("Cover Image: ",coverImage);
    

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: (coverImage)?coverImage.url:"",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
// here the '-' indicate not include these fields in the response
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    console.log("Created User details: ", createdUser);
    

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    
    /*
        login todo steps

        front-end data collection
        validate the input data 
        find user exists or not in db
        if exists - username and password validate
        if verified - send or grant the tokens
        store the tokens on client machine
    
    */
    console.log(req.body);
    
    const {email, username, password} = req.body

    if(!(username || email)){
        throw new ApiError(400,"username or email is required")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    // here it is upto us wether to chose a db call again or just make the updation within the object
    // because the user here in this reference doesn't have the refreshtoken


    const loggedInUser = await User.findOne(user._id).select("-password -refreshToken")

    // by setting the options in this manner ensures that only server can modify them bcoz by default any one from 
    // from front-end can modify them

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(200,
        {
            user: loggedInUser, accessToken,refreshToken
        },
        "User is logged in successfully"
    ))

})

const logoutUser = asyncHandler(async (req,res) => {
   
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken : undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))

})

// we logout the user - and we validate based on the tokens, reset the refresh token


const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }

    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decodedToken?._id)

    if(!user){
        throw new ApiError(401,"Invalid refresh token")
    }

    try {

        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

// User updation controller

const changeCurrentPassword = asyncHandler(async (req, res) => {

    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordValid){
        throw new ApiError(400,"Invalid old password")
    }

    user.password = newPassword

    await user.save({validateBeforeSave: false})

    return res.status(200).json(new ApiResponse(200,{},"Password Updated Successfully"))
})


const getCurrentUser = asyncHandler(async (req,res) => {

    return res.status(200)
    .json(200,req.user,"Current user fetched successfully")

})

// Inorder to update any user files - like profile image, cover image write a separate controller for it

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body

    if(!fullName || !email){
        throw new ApiResponse(400,"All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.body?._id,
        { 
            $set: {
                fullName,
                email
            } 
        },
        { new: true } // the new-true indicates to return the updated document
    ).select("-password -refreshToken")

    return res.status(200)
    .json(new ApiResponse(200,user,"Details updated successfully"))
})

const updateAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar not uploaded")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(500,"Failed to upload avatar on cloudinary")
    }

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar : avatar.url
            }
        },
        { new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Avatar Updated Successfully")) 

})

const updateCoverImage = asyncHandler(async (req, res) => {

    const coverImageLocalPath = req.file.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover Image not uploaded")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(500,"Failed to upload cover image on cloudinary")
    }

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage : coverImage.url
            }
        },
        { new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, req.user ,"Cover Image Updated Successfully"))
})

const getUserDetails = asyncHandler(async (req,res) => {

    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subsubscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelSubscribeToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount:  1,
                channelSubscribeToCount: 1,
                isSubscribed: 1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404,"Channel doesn't exist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User channel fetched successfully"))
})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getUserDetails
}