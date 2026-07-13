import { body, param, query } from "express-validator";
import mongoose from "mongoose";
import { HOLIDAY_TYPES } from "../config/constants.js";

const mongoIdValidator = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error("Invalid ID format.");
  }
  return true;
};

const holidayTypeValues = Object.values(HOLIDAY_TYPES);

export const addHolidayValidation = [
  body("holidayName")
    .trim()
    .notEmpty()
    .withMessage("Holiday name is required.")
    .isLength({ max: 100 })
    .withMessage("Holiday name must not exceed 100 characters."),

  body("date")
    .notEmpty()
    .withMessage("Date is required.")
    .isISO8601({ strict: true })
    .withMessage("Date must be a valid date."),

  body("type")
    .notEmpty()
    .withMessage("Holiday type is required.")
    .isIn(holidayTypeValues)
    .withMessage(`Type must be one of: ${holidayTypeValues.join(", ")}.`),
];

export const updateHolidayValidation = [
  param("id").custom(mongoIdValidator),

  body("holidayName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Holiday name cannot be empty.")
    .isLength({ max: 100 })
    .withMessage("Holiday name must not exceed 100 characters."),

  body("date")
    .optional()
    .isISO8601({ strict: true })
    .withMessage("Date must be a valid date."),

  body("type")
    .optional()
    .isIn(holidayTypeValues)
    .withMessage(`Type must be one of: ${holidayTypeValues.join(", ")}.`),
];

export const holidayIdParamValidation = [
  param("id").custom(mongoIdValidator),
];

export const getHolidaysQueryValidation = [
  query("year")
    .optional()
    .isInt({ min: 1900, max: 2100 })
    .withMessage("Year must be a valid 4-digit year.")
    .toInt(),
];
