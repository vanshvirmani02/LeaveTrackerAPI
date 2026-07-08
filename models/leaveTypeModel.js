import mongoose from "mongoose";
import { ACCRUAL_TYPES, LEAVE_TYPE_STATUS } from "../config/constants.js";

const leaveTypeSchema = new mongoose.Schema(
  {
    leaveName: {
      type: String,
      required: true,
      trim: true,
    },
    policyName: {
      type: String,
      required: true,
      trim: true,
    },
    annualQuota: {
      type: Number,
      required: true,
      min: 0,
    },
    accrualType: {
      type: String,
      enum: Object.values(ACCRUAL_TYPES),
      default: ACCRUAL_TYPES.NONE,
    },
    carryForward: {
      type: Boolean,
      default: false,
    },
    maxCarryForward: {
      type: Number,
      default: 0,
      min: 0,
    },
    encashment: {
      type: Boolean,
      default: false,
    },
    accrualRules: {
      type: String,
      trim: true,
    },
    carryForwardRules: {
      type: String,
      trim: true,
    },
    probationRules: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(LEAVE_TYPE_STATUS),
      default: LEAVE_TYPE_STATUS.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

const LeaveType = mongoose.model("LeaveType", leaveTypeSchema);

export default LeaveType;
