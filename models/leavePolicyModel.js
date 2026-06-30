import mongoose from "mongoose";

const leavePolicySchema = new mongoose.Schema(
  {
    policyName: {
      type: String,
      required: true,
      trim: true,
    },
    leaveTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveType",
      required: true,
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
  },
  {
    timestamps: true,
  }
);

const LeavePolicy = mongoose.model("LeavePolicy", leavePolicySchema);

export default LeavePolicy;
