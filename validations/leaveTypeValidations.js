import { body, param } from "express-validator";
import mongoose from "mongoose";
import { ACCRUAL_TYPES, LEAVE_TYPE_STATUS } from "../config/constants.js";

const mongoIdValidator = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error("Invalid ID format.");
  }
  return true;
};

const accrualTypeValues = Object.values(ACCRUAL_TYPES);
const leaveTypeStatusValues = Object.values(LEAVE_TYPE_STATUS);

export const addLeaveTypeValidation = [
  body("leaveName")
    .trim()
    .notEmpty()
    .withMessage("Leave name is required.")
    .isLength({ max: 100 })
    .withMessage("Leave name must not exceed 100 characters."),

  body("policyName")
    .trim()
    .notEmpty()
    .withMessage("Policy name is required.")
    .isLength({ max: 100 })
    .withMessage("Policy name must not exceed 100 characters."),

  body("annualQuota")
    .notEmpty()
    .withMessage("Annual quota is required.")
    .isFloat({ min: 0 })
    .withMessage("Annual quota must be a number greater than or equal to 0."),

  body("accrualType")
    .optional()
    .isIn(accrualTypeValues)
    .withMessage(`Accrual type must be one of: ${accrualTypeValues.join(", ")}.`),

  body("carryForward")
    .optional()
    .isBoolean()
    .withMessage("Carry forward must be a boolean."),

  body("maxCarryForward")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Max carry forward must be a number greater than or equal to 0."),

  body("encashment")
    .optional()
    .isBoolean()
    .withMessage("Encashment must be a boolean."),

  body("accrualRules")
    .optional()
    .isString()
    .withMessage("Accrual rules must be a string."),

  body("carryForwardRules")
    .optional()
    .isString()
    .withMessage("Carry forward rules must be a string."),

  body("probationRules")
    .optional()
    .isString()
    .withMessage("Probation rules must be a string."),

  body("status")
    .optional()
    .isIn(leaveTypeStatusValues)
    .withMessage(`Status must be one of: ${leaveTypeStatusValues.join(", ")}.`),
];

export const updateLeaveTypeValidation = [
  param("id").custom(mongoIdValidator),

  body("leaveName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Leave name cannot be empty.")
    .isLength({ max: 100 })
    .withMessage("Leave name must not exceed 100 characters."),

  body("policyName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Policy name cannot be empty.")
    .isLength({ max: 100 })
    .withMessage("Policy name must not exceed 100 characters."),

  body("annualQuota")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Annual quota must be a number greater than or equal to 0."),

  body("accrualType")
    .optional()
    .isIn(accrualTypeValues)
    .withMessage(`Accrual type must be one of: ${accrualTypeValues.join(", ")}.`),

  body("carryForward")
    .optional()
    .isBoolean()
    .withMessage("Carry forward must be a boolean."),

  body("maxCarryForward")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Max carry forward must be a number greater than or equal to 0."),

  body("encashment")
    .optional()
    .isBoolean()
    .withMessage("Encashment must be a boolean."),

  body("accrualRules")
    .optional()
    .isString()
    .withMessage("Accrual rules must be a string."),

  body("carryForwardRules")
    .optional()
    .isString()
    .withMessage("Carry forward rules must be a string."),

  body("probationRules")
    .optional()
    .isString()
    .withMessage("Probation rules must be a string."),

  body("status")
    .optional()
    .isIn(leaveTypeStatusValues)
    .withMessage(`Status must be one of: ${leaveTypeStatusValues.join(", ")}.`),
];

export const leaveTypeIdParamValidation = [
  param("id").custom(mongoIdValidator),
];
