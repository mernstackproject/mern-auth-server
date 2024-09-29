exports.errorMessages = {
  emailError: "Email is required.",
  nameError: "Name is required.",
  passwordError: "Password is required and must be at least 6 characters long.",
  emailExist: "Email already exists.",
  userNotFound: "User not found with this email.",
  invalidCredentials: "Invalid credential.",
  internalServerError: "Something went wrong.",
  GoogleLoginFailed:"Google login failed.",
  tokenValid:"Token is not valid.",
};
exports.successMessages = {
  registrationSuccess: "User registered successful.",
  loginSuccess: "Login successful.",
  OauthLogin:"Google login successful.",
 userFound:"User found successful."
};

exports.createErrorResponse = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({ status: false, message });
};

exports.createSuccessResponse = (res, data, message) => {
  return res.status(200).json({ status: true, message, data });
};
