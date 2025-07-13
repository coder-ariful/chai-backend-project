
// ---------  type One -------------
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((error) => next(error))

    }
};

// --------  type Two --------------
/*
const asyncHandler = (functionName) => async (req, res, next) => {
    try {
        await functionName(req, res, next)
    } catch (error) {
        res.status(error.code || 500).json({
            message: error.message,
            success: false,
            error : true
        })
    }
}
*/

export { asyncHandler }