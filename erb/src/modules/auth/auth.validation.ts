import Joi from "joi";

class AuthValidation {

  // ================= Signin =================
   signin = Joi.object({
    identifier: Joi.string()
      .required()
      .messages({
        "any.required": "Identifier is required",
        "string.empty": "Identifier cannot be empty",
      }),

    password: Joi.string()
      .min(6)
      .required()
      .messages({
        "string.min": "Password must be at least 6 characters",
        "any.required": "Password is required",
      }),
  });

  // ================= Change Password =================
   changePassword = Joi.object({
    password: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
  });

  // ================= Forget Password =================
   forgetPassword = Joi.object({
    email: Joi.string().email().required(),
  });

  // ================= Verify Code =================
   verifyCode = Joi.object({
    code: Joi.string().length(6).pattern(/^\d+$/).required(),
  });

  // ================= Reset Password =================
   resetPassword = Joi.object({
    email: Joi.string().email().required(),
    newPassword: Joi.string().min(6).required(),
  });

}

export const authValidation = new AuthValidation;