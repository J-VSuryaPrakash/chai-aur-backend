const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}


export { asyncHandler }




/*

const asyncHandler = (func) => {() => {}}
    
// here we are trying to pass the function "func" further down the chain as a parameter

const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next)
    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message
        })
    }
} 


The catch block is the error handler that sends the status so that it becomes easier for the front-end person to handle
message is also sent to the front-end to be displayed

*/