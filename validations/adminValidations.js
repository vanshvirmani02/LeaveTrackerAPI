import { body, param, query } from "express-validator";
import mongoose from "mongoose";

const mongoIdValidator = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error("Invalid ID format.");
  }
  return true;
};

export const addEmployeeValidation = [
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
];

export const updateEmployeeValidation = [
  param("id").custom(mongoIdValidator),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty.")
    .isLength({ max: 100 })
    .withMessage("Name must not exceed 100 characters."),

  body("email")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Email cannot be empty.")
    .isEmail()
    .withMessage("A valid email is required.")
    .normalizeEmail(),

  body("password")
    .optional()
    .isString()
    .withMessage("Password must be a string."),

  body("contactNo")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Contact number cannot be empty.")
    .matches(/^[0-9+\-\s()]{7,15}$/)
    .withMessage("Contact number must be a valid phone number."),

  body("joiningDate")
    .optional()
    .isISO8601({ strict: true })
    .withMessage("Joining date must be a valid date."),

  body("designation")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Designation must not exceed 100 characters."),

  body("managerId")
    .optional({ values: "null" })
    .custom(mongoIdValidator),
];

export const employeeIdParamValidation = [
  param("id").custom(mongoIdValidator),
];

export const getEmployeesQueryValidation = [
  query("managerId")
    .optional()
    .custom(mongoIdValidator),

  query("managerName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Manager name cannot be empty.")
    .isLength({ max: 100 })
    .withMessage("Manager name must not exceed 100 characters."),
];

export const setEmployeeManagerValidation = [
  body("id").optional().custom(mongoIdValidator),

  query("id").optional().custom(mongoIdValidator),
];
