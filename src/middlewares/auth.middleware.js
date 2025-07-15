// this middleware work is only see => Is user login or not.

import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        // const token = req.cookies?.AccessToken || req.header("Authorization")?.replace("Bearer ", "")
        // const token = req.cookies?.AccessToken || req.headers["authorization"]?.replace("Bearer ", "");
        const token =
            req.cookies?.accessToken ||
            (req.headers?.authorization && req.headers.authorization.replace("Bearer ", ""));

        console.log('the token :', token);

        if (!token) {
            throw new ApiError(401, "UnAuthorization Request or User Invalid access token.")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if (!user) {
            throw new ApiError(401, "You are invalid authorization, there is problem and Invalid access token")
        }

        // adding new Object
        req.user = user // you can use random name.
        next()
    } catch (error) {
        console.log('middleware error :', error);
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})