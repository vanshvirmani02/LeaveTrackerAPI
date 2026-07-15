import { body, param, query } from "express-validator";
import { PAYROLL_ACTION, PAYROLL_STATUS } from "../config/constants.js";

const monthYearRule = (location, field = "monthYear") =>
  location(field)
    .trim()
    .notEmpty()
    .withMessage("monthYear is required.")
    .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
    .withMessage("monthYear must be in YYYY-MM format.");

export const generatePayrollValidation = [monthYearRule(body)];

export const getPayrollValidation = [
  monthYearRule(query),
  query("status")
    .optional()
    .trim()
    .custom((value) => {
      const normalized = String(value).toUpperCase();
      const allowed = ["ALL", "APPROVE", ...Object.values(PAYROLL_STATUS)];
      if (!allowed.includes(normalized)) {
        throw new Error(
          `Status must be one of: ALL, DRAFT, APPROVED, REJECTED.`,
        );
      }
      return true;
    }),
];

export const editPayrollValidation = [
  monthYearRule(param),
  param("employeeId")
    .trim()
    .notEmpty()
    .withMessage("employeeId is required."),
  body("grossSalary")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("grossSalary must be a number greater than or equal to 0."),
  body("deduction")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("deduction must be a number greater than or equal to 0."),
  body("bonus")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("bonus must be a number greater than or equal to 0."),
  body().custom((_, { req }) => {
    const { grossSalary, deduction, bonus } = req.body || {};
    if (
      grossSalary === undefined &&
      deduction === undefined &&
      bonus === undefined
    ) {
      throw new Error(
        "Provide at least one of grossSalary, deduction, or bonus.",
      );
    }
    return true;
  }),
];

export const actionPayrollValidation = [
  monthYearRule(param),
  param("employeeId")
    .trim()
    .notEmpty()
    .withMessage("employeeId is required."),
  body("action")
    .trim()
    .notEmpty()
    .withMessage("Action is required.")
    .isIn(Object.values(PAYROLL_ACTION))
    .withMessage(
      `Action must be one of: ${Object.values(PAYROLL_ACTION).join(", ")}.`,
    ),
  body("reason")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Reason must not exceed 500 characters."),
  body("reason").custom((value, { req }) => {
    if (
      req.body?.action === PAYROLL_ACTION.REJECT &&
      !String(value || "").trim()
    ) {
      throw new Error("Reason is required when rejecting a payroll entry.");
    }
    return true;
  }),
];

export const getMyPayrollValidation = [monthYearRule(query)];

export const downloadSalarySlipValidation = [monthYearRule(query)];
