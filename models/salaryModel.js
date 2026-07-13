import mongoose from "mongoose";
import { PAYROLL_TYPES } from "../config/constants.js";

const salarySchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      trim: true,
    },
    ctc: {
      type: Number,
      required: true,
      min: 0,
    },
    basicSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    hra: {
      type: Number,
      required: true,
      min: 0,
    },
    specialAllowance: {
      type: Number,
      required: true,
      min: 0,
    },
    pf: {
      type: Number,
      required: true,
      min: 0,
    },
    professionalTax: {
      type: Number,
      required: true,
      min: 0,
    },
    salaryEffectiveDate: {
      type: Date,
      required: true,
    },
    payrollType: {
      type: String,
      enum: Object.values(PAYROLL_TYPES),
      default: PAYROLL_TYPES.MONTHLY,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

salarySchema.index({ employeeId: 1, salaryEffectiveDate: 1 });

const Salary = mongoose.model("Salary", salarySchema);

export default Salary;
