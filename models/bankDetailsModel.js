import mongoose from "mongoose";

const bankDetailsSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    accountHolderName: {
      type: String,
      required: true,
      trim: true,
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },
    ifscCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    branch: {
      type: String,
      required: true,
      trim: true,
    },
    upiId: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const BankDetails = mongoose.model("BankDetails", bankDetailsSchema);

export default BankDetails;
