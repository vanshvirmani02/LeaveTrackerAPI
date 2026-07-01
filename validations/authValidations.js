import { body, header } from "express-validator";
import { ROLES } from "../config/constants.js";

export const signupUserValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required.")
    .isLength({ max: 100 })
    .withMessage("Name must not exceed 100 characters."),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("A valid email is required.")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isString()
    .withMessage("Password must be a string."),

  body("contactNo")
    .trim()
    .notEmpty()
    .withMessage("Contact number is required.")
    .matches(/^[0-9+\-\s()]{7,15}$/)
    .withMessage("Contact number must be a valid phone number."),

  body("joiningDate")
    .notEmpty()
    .withMessage("Joining date is required.")
    .isISO8601({ strict: true })
    .withMessage("Joining date must be a valid date."),

  body("designation")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Designation must not exceed 100 characters."),

  header("x-device-id")
    .custom((deviceId, { req }) => {
      const appId = req.headers["x-app-id"];
      if (appId && !deviceId) {
        throw new Error("deviceId is required for mobile.");
      }
      return true;
    }),
];

export const loginUserValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("A valid email is required.")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isString()
    .withMessage("Password must be a string."),

  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required.")
    .isIn(Object.values(ROLES))
    .withMessage("Role is required."),

  header("x-device-id")
    .custom((deviceId, { req }) => {
      const appId = req.headers["x-app-id"];
      if (appId && !deviceId) {
        throw new Error("deviceId is required for mobile.");
      }
      return true;
    }),
];
