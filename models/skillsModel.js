import mongoose from "mongoose";

const skillsSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    primarySkill: {
      type: String,
      trim: true,
    },
    certifications: {
      type: [String],
      default: [],
    },
    resumeUrl: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Skills = mongoose.model("Skills", skillsSchema);

export default Skills;
