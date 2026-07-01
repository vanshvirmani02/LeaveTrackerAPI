import { body, param } from "express-validator";
import mongoose from "mongoose";

const mongoIdValidator = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error("Invalid ID format.");
  }
  return true;
};

export const addLeavePolicyValidation = [
  body("policyName")
    .trim()
    .notEmpty()
    .withMessage("Policy name is required.")
    .isLength({ max: 100 })
    .withMessage("Policy name must not exceed 100 characters."),

  body("leaveTypeIds")
    .isArray({ min: 1 })
    .withMessage("At least one leave type ID is required."),

  body("leaveTypeIds.*")
    .custom(mongoIdValidator),

  body("accrualRules")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Accrual rules must not exceed 500 characters."),

  body("carryForwardRules")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Carry forward rules must not exceed 500 characters."),

  body("probationRules")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Probation rules must not exceed 500 characters."),
];

export const updateLeavePolicyValidation = [
  param("id").custom(mongoIdValidator),

  body("policyName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Policy name cannot be empty.")
    .isLength({ max: 100 })
    .withMessage("Policy name must not exceed 100 characters."),

  body("leaveTypeIds")
    .optional()
    .isArray({ min: 1 })
    .withMessage("At least one leave type ID is required."),

  body("leaveTypeIds.*")
    .optional()
    .custom(mongoIdValidator),

  body("accrualRules")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Accrual rules must not exceed 500 characters."),

  body("carryForwardRules")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Carry forward rules must not exceed 500 characters."),

  body("probationRules")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Probation rules must not exceed 500 characters."),
];

export const leavePolicyIdParamValidation = [
  param("id").custom(mongoIdValidator),
];
