import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";


// creating method for tokens
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        if (!accessToken) {
            throw new ApiError(500, "there is a problem in generating access token.")
        }
        if (!refreshToken) {
            throw new ApiError(500, "there is a problem in generating refresh token.")
        }

        // add refresh token to DataBase(DB)
        user.refreshToken = refreshToken
        // then save in DB.
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, 'Something went wrong when creating accessToken and refreshToken.' || `server error : ${error}`,)
    }
}

const registerUser = asyncHandler(async (req, res) => {
    //1. Get User Data from frontend. with from text
    //2. validation the data or filed .- not empty
    //3. check if User already exists or not : check with ( username and email)
    //4. check for images, //(4.5). check for avatar,
    //5. upload them(image) to cloudinary - avatar image
    //6. create User object in DB, create entry in DB browser
    //7. remove password and refresh token field from response , means remove password and token form client site.
    //8. check for user creation is new User created or not
    //9. then send or return the response.

    // 1.
    const { username, email, fullName, password } = req.body;
    console.log("email :", email, 'and Password :', password);

    // 2.
    // ----- for beginner level--------
    // if (fullName === '') {
    //     throw new ApiError(400, "FullName is required.")
    // }
    //  ================= for expert level ==================
    if (
        [username, email, fullName, password].some(field => field?.trim() === '')
    ) {
        throw new ApiError(400, `all field are required`)
    }

    // 3.
    const existedUser = await User.findOne(
        { $or: [{ username }, { email }] }
    )
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists!!")
    }

    // 4.
    const avatarLocalPath = req.files?.avatar[0]?.path;  // multer give us the files || 'avatar' this write because we give this 'name' in middlewares. || local path because this image file not upload in cloudinary. It have in our server
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    // 4.5 .
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar Image is Require")
    }

    // 5. 
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    console.log('avatar is here :', avatar);
    if (!avatar) {
        throw new ApiError(400, "there is problem in uploading image in cloudinary")
    }

    // 6.
    const user = await User.create(
        {
            username: username.toLowerCase(),
            email,
            fullName,
            password,
            avatar: avatar.url,
            coverImage: coverImage?.url || ""
        }
    )

    console.log(user);

    // 7.
    const createdUser = await User.findById(user._id).select("-password -refreshToken")  // last after select work for number 7.

    // 8.
    if (!createdUser) {
        throw new ApiError(500, 'there is server problem in user creating in DB. and wrong in also in registering User.')
    }

    // 9.
    return res.status(201).json(new ApiResponse(200, createdUser, "User Successfully Created"))

})

const loginUser = asyncHandler(async (req, res) => {
    // 1. Get data from request body => req.body => to get data
    // 2. email or username base login . => match email with before get data form body
    // 3. find the user in DB.
    // 4. find the user => check the user has or not
    // 5. password check 
    // 6. generate AccessToken and RefreshToken 
    // 7. Send token in cookies 


    // 1.
    const { email, username, password } = req.body;
    // console.log(email);
    // 2.
    if (!email && !username) {
        throw new ApiError(400, "Email or username is required")
    }
    // 3.
    const user = await User.findOne({
        $or: [{ email }, { username }]
    })

    // 4.
    if (!user) {
        throw new ApiError(404, "User Does Not Exist" || "User Not Has been Registered !!")
    }
    // 5.

   /* if (user) {
        console.log(user instanceof mongoose.Model); // ✅ should now be true
        console.log(typeof user.isPasswordCorrect);  // ✅ should be 'function'
    }*/

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid Password." || " Password is not matching !!")
    }
    // 6.
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    // ============ Update or Create New User in DataBase(DB) ======= depend on you =========
    // after login what i need.
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // 7.
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('RefreshToken', refreshToken, options)
        .json(new ApiResponse(
            201,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User Login successfully"
        ))
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
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

    res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('RefreshToken', options)
        .json(new ApiResponse(
            200,
            {},
            "user logout successfully."
        ))
})

export { registerUser, loginUser, logoutUser }