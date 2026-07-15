import mongoose from "mongoose";
import { EMPLOYMENT_TYPES, ROLES, USER_STATUS } from "../config/constants.js";
import { generateEmployeeId } from "../utils/generateEmployeeId.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true, 
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
    },
    contactNo: {
      type: String,
      required: true,
      trim: true,
    },
    employeeId: {
      type: String,
      unique: true,
      trim: true,
    },
    joiningDate: {
      type: Date,
      required: true,
    },
    designation: {
      type: String,
    },
    department: {
      type: String,
      trim: true,
    },
    yearsOfExperience: {
      type: Number,
      min: 0,
    },
    employmentType: {
      type: String,
      enum: Object.values(EMPLOYMENT_TYPES),
    },
    workLocation: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.EMPLOYEE,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function () {
  if (this.employeeId) {
    return;
  }

  this.employeeId = await generateEmployeeId(this.joiningDate, this.constructor);
});

// Enforce at most one ADMIN user at the database level
userSchema.index(
  { role: 1 },
  {
    unique: true,
    partialFilterExpression: { role: ROLES.ADMIN },
    name: "unique_single_admin",
  },
);

const User = mongoose.model("User", userSchema);

export default User;
