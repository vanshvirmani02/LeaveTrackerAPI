import mongoose from "mongoose";
import config from "./index.js";

const connectDB = async () => {
  try {
    // Local antivirus/proxy SSL inspection often breaks Atlas TLS verification
    // ("unable to verify the first certificate"). Safe to allow only in development.
    const options =
      process.env.NODE_ENV === "development"
        ? { tlsAllowInvalidCertificates: true }
        : {};

    await mongoose.connect(process.env.MONGO_URI || config.dbURI, options);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
