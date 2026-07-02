import { body, param, query } from "express-validator";
import mongoose from "mongoose";
import { LEAVE_REQUEST_STATUS, LEAVE_REQUEST_ACTION } from "../config/constants.js";

const leaveRequestStatusValues = Object.values(LEAVE_REQUEST_STATUS);
const leaveRequestActionValues = Object.values(LEAVE_REQUEST_ACTION);

const mongoIdValidator = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error("Invalid ID format.");
  }
  return true;
};

export const addLeaveRequestValidation = [
  body("leaveType")
    .notEmpty()
    .withMessage("Leave type is required.")
    .custom(mongoIdValidator),

  body("startDate")
    .notEmpty()
    .withMessage("Start date is required.")
    .isISO8601({ strict: true })
    .withMessage("Start date must be a valid date."),

  body("endDate")
    .notEmpty()
    .withMessage("End date is required.")
    .isISO8601({ strict: true })
    .withMessage("End date must be a valid date.")
    .custom((endDate, { req }) => {
      if (!req.body.startDate) {
        return true;
      }
      if (new Date(endDate) < new Date(req.body.startDate)) {
        throw new Error("End date must be on or after start date.");
      }
      return true;
    }),

  body("halfDay")
    .optional()
    .isBoolean()
    .withMessage("Half day must be a boolean value."),

  body("reason")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Reason must not exceed 500 characters."),

  body("attachmentDoc")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Attachment document path must not exceed 500 characters."),

  body("status")
    .not()
    .exists()
    .withMessage("Status cannot be set manually."),
];

export const getLeaveRequestsQueryValidation = [
  query("status")
    .optional()
    .isIn(leaveRequestStatusValues)
    .withMessage(
      `Status must be one of: ${leaveRequestStatusValues.join(", ")}.`,
    ),

  query("employeeName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Employee name cannot be empty.")
    .isLength({ max: 100 })
    .withMessage("Employee name must not exceed 100 characters."),

  query("startDate")
    .optional()
    .isISO8601({ strict: true })
    .withMessage("Start date must be a valid date."),

  query("endDate")
    .optional()
    .isISO8601({ strict: true })
    .withMessage("End date must be a valid date.")
    .custom((endDate, { req }) => {
      if (!req.query?.startDate) {
        return true;
      }
      if (new Date(endDate) < new Date(req.query.startDate)) {
        throw new Error("End date must be on or after start date.");
      }
      return true;
    }),
];

export const getAllLeaveRequestsQueryValidation = [
  query("status")
    .optional()
    .isIn(leaveRequestStatusValues)
    .withMessage(
      `Status must be one of: ${leaveRequestStatusValues.join(", ")}.`,
    ),

  query("employeeName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Employee name cannot be empty.")
    .isLength({ max: 100 })
    .withMessage("Employee name must not exceed 100 characters."),

  query("startDate")
    .optional()
    .isISO8601({ strict: true })
    .withMessage("Start date must be a valid date."),

  query("endDate")
    .optional()
    .isISO8601({ strict: true })
    .withMessage("End date must be a valid date.")
    .custom((endDate, { req }) => {
      if (!req.query?.startDate) {
        return true;
      }
      if (new Date(endDate) < new Date(req.query.startDate)) {
        throw new Error("End date must be on or after start date.");
      }
      return true;
    }),

  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be either asc or desc."),
];

export const updateLeaveRequestValidation = [
  param("id").custom(mongoIdValidator),

  body("leaveType")
    .optional()
    .custom(mongoIdValidator),

  body("startDate")
    .optional()
    .isISO8601({ strict: true })
    .withMessage("Start date must be a valid date."),

  body("endDate")
    .optional()
    .isISO8601({ strict: true })
    .withMessage("End date must be a valid date."),

  body("halfDay")
    .optional()
    .isBoolean()
    .withMessage("Half day must be a boolean value."),

  body("reason")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Reason must not exceed 500 characters."),

  body("attachmentDoc")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Attachment document path must not exceed 500 characters."),

  body("status")
    .not()
    .exists()
    .withMessage("Status cannot be updated through this endpoint."),
];

export const leaveRequestIdParamValidation = [
  param("id").custom(mongoIdValidator),
];

export const getLeaveRequestByIdQueryValidation = [
  param("id").custom(mongoIdValidator),

  query("status")
    .optional()
    .isIn(leaveRequestStatusValues)
    .withMessage(
      `Status must be one of: ${leaveRequestStatusValues.join(", ")}.`,
    ),

  query("leaveType")
    .optional()
    .custom(mongoIdValidator)
    .withMessage("Leave type must be a valid ID."),
];

export const actionLeaveRequestValidation = [
  param("id").custom(mongoIdValidator),

  body("action")
    .notEmpty()
    .withMessage("Action is required.")
    .isIn(leaveRequestActionValues)
    .withMessage(`Action must be one of: ${leaveRequestActionValues.join(", ")}.`),

  body("employeeId")
    .trim()
    .notEmpty()
    .withMessage("Employee ID is required."),

  body("leaveType")
    .notEmpty()
    .withMessage("Leave type is required.")
    .custom(mongoIdValidator),
];
