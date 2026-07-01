import mongoose from "mongoose";

const leavePolicySchema = new mongoose.Schema(
  {
    policyName: {
      type: String,
      required: true,
      trim: true,
    },
    leaveTypeIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "LeaveType",
        },
      ],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "At least one leave type is required.",
      },
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
