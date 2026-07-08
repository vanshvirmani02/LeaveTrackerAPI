import { query } from "express-validator";

export const getLeaveBalancesQueryValidation = [
  query("employeeId")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Employee ID cannot be empty.")
    .isLength({ max: 50 })
    .withMessage("Employee ID must not exceed 50 characters."),
];
