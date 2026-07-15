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

const smtpConfig = {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    // Set SMTP_TLS_REJECT_UNAUTHORIZED=false when antivirus/proxy injects a self-signed cert
    rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
};

const apiBaseUrl = (process.env.API_BASE_URL || `http://localhost:${PORT}`).replace(
    /\/$/,
    "",
);
const frontendUrl = (
    process.env.FRONTEND_URL ||
    process.env.ALLOWED_WEBSITE ||
    "http://localhost:3000"
).replace(/\/$/, "");
const portalLoginPath = process.env.PORTAL_LOGIN_PATH || "/login";
const portalLoginUrl = `${frontendUrl}${portalLoginPath.startsWith("/") ? portalLoginPath : `/${portalLoginPath}`}`;

const EMAIL_ACTION_TOKEN_EXPIRY_HOURS = 2;

export {
    config,
    PORT,
    smtpConfig,
    apiBaseUrl,
    frontendUrl,
    portalLoginUrl,
    EMAIL_ACTION_TOKEN_EXPIRY_HOURS,
};
export default config;