const user = require("../models/User");
const {
    createSuccessResponse,
    createErrorResponse,
    errorMessages,
    successMessages,
} = require("./AuthErrors");
exports.getAdminProfile = async (req, res) => {
    try {
        if (req.userRole !== 'admin') {
            return createErrorResponse(res, errorMessages.adminAccess)
        }
        const adminData = await user.findById(req.loginUserId).select("-password"); // Avoid returning password
        if (!adminData) {
            return createErrorResponse(res, errorMessages.adminNotFound);
        }

        return createSuccessResponse(
            res,
            { adminData },
            successMessages.adminProfileFound
        );
    } catch (error) {
        return createErrorResponse(res, errorMessages.internalServerError, 500);
    }
};
