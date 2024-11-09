exports.createErrorResponse = (res, message, statusCode = 400) => {
    return res.status(statusCode).json({ status: false, message });
  };
  
  exports.createSuccessResponse = (res, data, message) => {
    return res.status(200).json({ status: true, message, data });
  };