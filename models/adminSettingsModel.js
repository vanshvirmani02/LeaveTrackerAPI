import mongoose from "mongoose";

const adminSettingsSchema = new mongoose.Schema(
  {
    organization: {
      organizationName: {
        type: String,
        required: true,
        trim: true,
      },
      timezone: {
        type: String,
        required: true,
        trim: true,
      },
      fiscalYearStart: {
        type: Date,
        required: true,
      },
    },
    leaveSettings: {
      weekendAsWorkingDay: {
        type: Boolean,
        default: false,
      },
      autoApproveSickLeave: {
        type: Boolean,
        default: false,
      },
      emailNotification: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

const AdminSettings = mongoose.model("AdminSettings", adminSettingsSchema);

export default AdminSettings;
