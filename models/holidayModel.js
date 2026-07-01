import mongoose from "mongoose";
import { HOLIDAY_TYPES } from "../config/constants.js";

const holidaySchema = new mongoose.Schema(
  {
    holidayName: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(HOLIDAY_TYPES),
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Holiday = mongoose.model("Holiday", holidaySchema);

export default Holiday;
