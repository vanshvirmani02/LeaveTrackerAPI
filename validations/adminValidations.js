import { body, param, query } from "express-validator";
import mongoose from "mongoose";
import { EMPLOYMENT_TYPES, PAYROLL_TYPES } from "../config/constants.js";

const mongoIdValidator = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error("Invalid ID format.");
  }
  return true;
};

const employmentTypeValues = Object.values(EMPLOYMENT_TYPES);
const payrollTypeValues = Object.values(PAYROLL_TYPES);

const salaryFieldValidations = (prefix, { required = false } = {}) => {
  const path = (field) => `${prefix}.${field}`;

  const whenSalaryPresent = (field) =>
    required
      ? body(path(field))
      : body(path(field)).if(body(prefix).exists());

  const numberRule = (field, label) =>
    whenSalaryPresent(field)
      .exists()
      .withMessage(`${label} is required.`)
      .isFloat({ min: 0 })
      .withMessage(`${label} must be a number greater than or equal to 0.`);

  return [
    ...(required
      ? [
          body(prefix)
            .exists()
            .withMessage("Salary details are required.")
            .isObject()
            .withMessage("Salary details must be an object."),
        ]
      : [
          body(prefix)
            .optional()
            .isObject()
            .withMessage("Salary details must be an object."),
        ]),
    numberRule("ctc", "CTC"),
    numberRule("basicSalary", "Basic salary"),
    numberRule("hra", "HRA"),
    numberRule("specialAllowance", "Special allowance"),
    numberRule("pf", "PF"),
    numberRule("professionalTax", "Professional tax"),
    whenSalaryPresent("salaryEffectiveDate")
      .exists()
      .withMessage("Salary effective date is required.")
      .isISO8601({ strict: true })
      .withMessage("Salary effective date must be a valid date."),
    whenSalaryPresent("payrollType")
      .optional()
      .isIn(payrollTypeValues)
      .withMessage(
        `Payroll type must be one of: ${payrollTypeValues.join(", ")}.`,
      ),
  ];
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

  body("department")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Department must not exceed 100 characters."),

  body("yearsOfExperience")
    .optional({ values: "null" })
    .isFloat({ min: 0 })
    .withMessage("Years of experience must be a number greater than or equal to 0."),

  body("employmentType")
    .optional({ values: "null" })
    .isIn(employmentTypeValues)
    .withMessage(
      `Employment type must be one of: ${employmentTypeValues.join(", ")}.`,
    ),

  body("workLocation")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 200 })
    .withMessage("Work location must not exceed 200 characters."),

  body("managerId")
    .optional({ values: "null" })
    .custom(mongoIdValidator),

  ...salaryFieldValidations("salary", { required: true }),
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

  body("department")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Department must not exceed 100 characters."),

  body("yearsOfExperience")
    .optional({ values: "null" })
    .isFloat({ min: 0 })
    .withMessage("Years of experience must be a number greater than or equal to 0."),

  body("employmentType")
    .optional({ values: "null" })
    .isIn(employmentTypeValues)
    .withMessage(
      `Employment type must be one of: ${employmentTypeValues.join(", ")}.`,
    ),

  body("workLocation")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 200 })
    .withMessage("Work location must not exceed 200 characters."),

  body("managerId")
    .optional({ values: "null" })
    .custom(mongoIdValidator),

  ...salaryFieldValidations("salary", { required: false }),
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
