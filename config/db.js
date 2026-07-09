import mongoose from "mongoose";
import config from "./index.js";
import dns from 'dns';
// Change DNS
dns.setServers(["0.0.0.0", "8.8.8.8"]);

const connectDB = async () => {
  try {
    const conn = mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.error(err));
    // await mongoose.connect(config.dbURI);
    // console.log(`MongoDB Connected`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
