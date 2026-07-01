import mongoose from "mongoose";
import { LEAVE_REQUEST_STATUS } from "../config/constants.js";

const leaveRequestSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      trim: true,
    },
    leaveType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveType",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    halfDay: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: Object.values(LEAVE_REQUEST_STATUS),
      default: LEAVE_REQUEST_STATUS.PENDING,
    },
    reason: {
      type: String,
      trim: true,
    },
    attachmentDoc: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

leaveRequestSchema.index(
  { employeeId: 1, leaveType: 1 },
  {
    unique: true,
    partialFilterExpression: { status: LEAVE_REQUEST_STATUS.PENDING },
  },
);

const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema);

export default LeaveRequest;
