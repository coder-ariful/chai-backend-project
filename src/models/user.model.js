import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"; // for encode-text convert to text
import bcrypt from "bcrypt" // for text convert to encode-text 

const userSchema = new Schema({
    username: {
        type: String,
        require: true,
        unique: true,
        lowercase: true,
        trim: true, //  auto matic gap or space removed it.
        index: true  // for searching topic .
    },
    email: {
        type: String,
        require: true,
        unique: true,
        lowercase: true,
        trim: true, //  auto matic gap or space removed it.
    },
    fullName: {
        type: String,
        require: true,
        trim: true, //  auto matic gap or space removed it.
        index: true  // for searching topic .
    },
    avatar: {
        type: String, // cloudinary url here only .
        require: true
    },
    coverImage: {
        type: String, // cloudinary url
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        require: [true, 'Password is required'],
    },
    refreshToken: {
        type: String
    }
}, { timestamps: true });

// userSchema.pre("save",()=> {})  // this function is wrong because "we need to use 'this' word!!!!"
// this function will run when ( Just before Save or anything update.)
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

// creating a method for checking password is matched or not
userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password)
}

// creating jwt token with accessToken and refreshToken.
userSchema.methods.generateAccessToken = function () {
    //sign method create the main token.
    // ======================== if you need await or async then we can add it ===========================
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
userSchema.methods.generateRefreshToken = function () {
    //sign method create the main token.
    // ======================== if you need await or async then we can add it ===========================
    return jwt.sign(
        {
            _id: this._id,
            // email: this.email,
            // username: this.username,
            // fullname: this.fullname
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model('User', userSchema)
