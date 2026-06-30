import dotenv from "dotenv";
dotenv.config();

const env = process.env.NODE_ENV || "development";
const config = {
    development: {
        dbURI: process.env.MONGO_URI || process.env.DEV_DB_URI,
    },
    production: {
        dbURI: process.env.MONGO_URI || process.env.PROD_DB_URI,
    },
    test: {
        dbURI: process.env.MONGO_URI || process.env.TEST_DB_URI,
    },
}[env];
const PORT = process.env.PORT || 5000;
export { config, PORT };
export default config;