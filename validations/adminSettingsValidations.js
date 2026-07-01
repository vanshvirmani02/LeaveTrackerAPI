import { body, param } from "express-validator";
import mongoose from "mongoose";

const mongoIdValidator = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error("Invalid ID format.");
  }
  return true;
};

export const addAdminSettingsValidation = [
  body("organization.organizationName")
    .trim()
    .notEmpty()
    .withMessage("Organization name is required.")
    .isLength({ max: 150 })
    .withMessage("Organization name must not exceed 150 characters."),

  body("organization.timezone")
    .trim()
    .notEmpty()
    .withMessage("Timezone is required.")
    .isLength({ max: 100 })
    .withMessage("Timezone must not exceed 100 characters."),

  body("organization.fiscalYearStart")
    .notEmpty()
    .withMessage("Fiscal year start date is required.")
    .isISO8601({ strict: true })
    .withMessage("Fiscal year start must be a valid date."),

  body("leaveSettings.weekendAsWorkingDay")
    .optional()
    .isBoolean()
    .withMessage("weekendAsWorkingDay must be a boolean."),

  body("leaveSettings.autoApproveSickLeave")
    .optional()
    .isBoolean()
    .withMessage("autoApproveSickLeave must be a boolean."),

  body("leaveSettings.emailNotification")
    .optional()
    .isBoolean()
    .withMessage("emailNotification must be a boolean."),
];

export const updateAdminSettingsValidation = [
  param("id").custom(mongoIdValidator),

  body("organization.organizationName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Organization name cannot be empty.")
    .isLength({ max: 150 })
    .withMessage("Organization name must not exceed 150 characters."),

  body("organization.timezone")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Timezone cannot be empty.")
    .isLength({ max: 100 })
    .withMessage("Timezone must not exceed 100 characters."),

  body("organization.fiscalYearStart")
    .optional()
    .isISO8601({ strict: true })
    .withMessage("Fiscal year start must be a valid date."),

  body("leaveSettings.weekendAsWorkingDay")
    .optional()
    .isBoolean()
    .withMessage("weekendAsWorkingDay must be a boolean."),

  body("leaveSettings.autoApproveSickLeave")
    .optional()
    .isBoolean()
    .withMessage("autoApproveSickLeave must be a boolean."),

  body("leaveSettings.emailNotification")
    .optional()
    .isBoolean()
    .withMessage("emailNotification must be a boolean."),
];

export const adminSettingsIdParamValidation = [
  param("id").custom(mongoIdValidator),
];
