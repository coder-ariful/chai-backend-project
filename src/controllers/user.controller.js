import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
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
    console.log(password);
    // 2.
    if (!email && !username) {
        throw new ApiError(400, "Email or username is required")
    }
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
    // }

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
            $: {
                refreshToken: 1 // this removes the field from document
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

const refreshAccessToken = asyncHandler(async (req, res) => {
    // 1. get the token . with help of cookies.
    // 2. verify the token . and then store in const
    // 3. get user information within help with line-1. token
    // 4. we need to match myRefresh_token(user.model.js) and const refresh token_(line.1)
    // 5. before generate new token always remember to create (options)
    // 6. create new access or refresh token with help of generateAccessAndRefreshTokens (const)


    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    console.log(incomingRefreshToken);
    if (!incomingRefreshToken) {
        throw new ApiError(401, 'unauthorized access and your token in not right and not get in coming refresh token.')
    }
    try {
        // 2.
        const decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        // 3.
        const user = await User.findById(decodedRefreshToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
        // 4.
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
        // 5.
        const options = {
            httpOnly: true,
            secure: true
        }
        // 6.
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user?._id);

        return res
            .status(201)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', newRefreshToken, options)
            .json(new ApiResponse(
                200,
                { accessToken, refreshToken: newRefreshToken },
                'Access token refresh successfully.'

            )
            )
    } catch (error) {
        console.log(error);
        throw new ApiError(500, error?.message || "there is problem in accessToken Refreshing process.")
    }

})

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
    // 1. get data from Client => Old_Password, New_Password, or Confirm_Password
    // 2. find User from User_DataBase 
    // 3. match the Old_Password and check the validation.
    // 4. set New_Password in password box Within MongoDB or (DataBase)
    // 5. save the new_Password 
    // 6. send the response in return.


    // 1.
    const { oldPassword, newPassword } = req.body;
    // 2.
    const user = await User.findById(req.user?._id)
    console.log(user);
    // 3. 
    const passwordValidation = await user.isPasswordCorrect(oldPassword);
    if (!passwordValidation) {
        throw new ApiError(401, "Your Old password is not Matched." || "Invalid Old Password")
    }
    // 4.
    user.password = newPassword;
    // 5.
    await user.save({ validateBeforeSave: false })
    // 6.
    return res
        .status(201)
        .json(new ApiResponse(201, {}, "Password changed successfully."))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;
    if (!fullName || !email) {
        throw new ApiError(401, "fullName and email fields are required.")
    }



    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        { new: true } // after update save and show the updated one.
    ).select("-password")

    console.log("there is a error", user);

    return res
        .status(201)
        .json(new ApiResponse(201, user, "Account Details updated successfully."))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    // 1. get image of file path form locally.
    // 2. check is there have any error or not.
    // 3. then send the local file to cloudinary to became online. (Always use await)
    // 4. then check is server give us the Cloudinary_Image_URL 
    // 5. update in DataBase.

    // 1.
    const avatarLocalPath = req.file?.path; // req.file or req.files we have from multer or multer_middleware
    // 2.
    if (!avatarLocalPath) {
        throw new ApiError(401, "there is an error in updating file or avatar.")
    }
    // 3.
    const avatar = await uploadOnCloudinary(avatarLocalPath); // this give us a image url
    // 4.
    if (!avatar.url) {
        throw new ApiError(401, "Error while updating avatar. and avatar image is missing")
    }


    // 5.
    const user = await User.findByIdAndUpdate(
        req.user?._id, // this get from auth.middleware.js to jwtVerify middleware.
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(201)
        .json(new ApiResponse(201, user, "Avatar updated successfully."))

})
const updateUserCoverImage = asyncHandler(async (req, res) => {
    // 1. get image of file path form locally.
    // 2. check is there have any error or not.
    // 3. then send the local file to cloudinary to became online. (Always use await)
    // 4. then check is server give us the Cloudinary_Image_URL 
    // 5. update in DataBase.

    // 1.
    const coverImageLocalPath = req.file?.path; // req.file or req.files we have from multer or multer_middleware
    // 2.
    if (!coverImageLocalPath) {
        throw new ApiError(401, "there is an error in updating file or cover Image is missing.")
    }
    // 3.
    const coverImage = await uploadOnCloudinary(coverImageLocalPath); // this give us a image url
    // 4.
    if (!coverImage.url) {
        throw new ApiError(401, "Error while updating coverImage image.")
    }


    // 5.
    const user = await User.findByIdAndUpdate(
        req.user?._id, // this get from auth.middleware.js to jwtVerify middleware.
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(201)
        .json(new ApiResponse(201, user, "cover image updated successfully."))

})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
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
                foreignField: "subscriber",
                as: "subscribedTo "
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
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
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])
    console.log("Here is Channel :", channel);

    if (!channel.length) {
        throw new ApiError(404, "Channel doesn't exist.")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "User Channel fetched successfully"))
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, user[0].watchHistory, "Watch History Fetched Successfully."))
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentUserPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory }