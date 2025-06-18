import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema({    
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar:{
        type: String, // cloudinary url
        required: true
    },
    coverImage:{
        type: String, // cloudinary url
        required: true
    },
    watchHistory:[
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    refreshToken: {
        type: String
    }
},{
    timestamps: true
}
)

userSchema.pre("save", async function(next){
    
    if(!this.isModified("password"))
        return next()

    this.password = await bcrypt.hash(this.password,10)
    next()
    //  the password is encrypted using the hash method - we pass string and number of rounds
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

//  we check wether the password which is being stored correct or not using the compare method
//  When we are importing user we verify the user by comparing the password sent by user and 
//  the hash of the password - using this custom isPasswordCorrect method  

userSchema.methods.generateAccessToken = function(){

    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )

}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)

// the index field in the username - so that it becomes a searchable field
// 