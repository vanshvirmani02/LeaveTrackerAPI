import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deviceType: {
      type: String,
      required: true,
    },
    deviceId: {
      type: String,
      trim: true,
      required: function () {
        return this.deviceType === "mobile";
      },
    },
    ipAddress: {
      type: String,
      required: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      required: true,
    },
    expiredAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

sessionSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });

const Session = mongoose.model("Session", sessionSchema);

export default Session;
