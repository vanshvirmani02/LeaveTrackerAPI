import mongoose from "mongoose";
import { PAYROLL_STATUS } from "../config/constants.js";

const employeeSalarySchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      trim: true,
    },
    grossSalary: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    deduction: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(PAYROLL_STATUS),
      default: PAYROLL_STATUS.DRAFT,
      required: true,
    },
    bonus: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    reason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { _id: true },
);

const payrollSchema = new mongoose.Schema(
  {
    monthYear: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },
    employeeSalary: {
      type: [employeeSalarySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

payrollSchema.index({ "employeeSalary.employeeId": 1 });

const Payroll = mongoose.model("Payroll", payrollSchema);

export default Payroll;
