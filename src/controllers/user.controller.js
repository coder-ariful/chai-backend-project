import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
    const existedUser = User.findOne(
        { $or: [{ username }, { email }] }
    )
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists!!")
    }

    // 4.
    const avatarLocalPath = body.files?.avatar[0]?.path;  // multer give us the files || 'avatar' this write because we give this 'name' in middlewares. || local path because this image file not upload in cloudinary. It have in our server
    const coverImageLocalPath = body.files?.coverImage[0]?.path
    // 4.5 .
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar Image is Require")
    }

    // 5. 
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
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

    // 7.
    const createdUser = await User.findById(user._id).select("-password -refreshToken")  // last after select work for number 7.

    // 8.
    if (!createdUser) {
        throw new ApiError(500, 'there is server problem in user creating in DB. and wrong in also in registering User.')
    }

    // 9.
    return res.status(201).json( new ApiResponse(200,createdUser,"User Successfully Created") )

})

export { registerUser }