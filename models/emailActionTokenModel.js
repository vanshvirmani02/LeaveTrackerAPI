import mongoose from "mongoose";
import { LEAVE_REQUEST_ACTION } from "../config/constants.js";

const emailActionTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    leaveRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveRequest",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: Object.values(LEAVE_REQUEST_ACTION),
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

emailActionTokenSchema.index({ leaveRequestId: 1, action: 1 });

const EmailActionToken = mongoose.model(
  "EmailActionToken",
  emailActionTokenSchema,
);

export default EmailActionToken;
