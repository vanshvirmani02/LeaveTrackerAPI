import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import CryptoJS from "crypto-js";
import Session from "../models/sessionModel.js";
import { DEVICE_TYPES } from "../config/constants.js";

dotenv.config();
const ENCRYPTION_KEY1 = CryptoJS.enc.Hex.parse(process.env.ENCRYPTION_KEY1); 
const ENCRYPTION_KEY2 = CryptoJS.enc.Hex.parse(process.env.ENCRYPTION_KEY2); 
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export const encrypt = (text) => {
    if (typeof text !== "string") {
      throw new Error("Input text must be a string");
    }
    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted1 = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY1, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const encrypted2 = CryptoJS.AES.encrypt(
      encrypted1.toString(),
      ENCRYPTION_KEY2,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );
    return `${iv.toString(CryptoJS.enc.Hex)}:${encrypted2.toString()}`;
};
export const decrypt = (encryptedText) => {
    if (typeof encryptedText !== "string") {
      throw new Error("Encrypted text must be a string");
    }
    const parts = encryptedText.split(":");
    const iv = CryptoJS.enc.Hex.parse(parts[0]);
    const encryptedTextPart = parts[1];
    const decrypted1 = CryptoJS.AES.decrypt(encryptedTextPart, ENCRYPTION_KEY2, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const decrypted2 = CryptoJS.AES.decrypt(
      decrypted1.toString(CryptoJS.enc.Utf8),
      ENCRYPTION_KEY1,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );
    return decrypted2.toString(CryptoJS.enc.Utf8);
};

export const encryptPasswordForStorage = async (password) => {
    const saltRounds = parseInt(process.env.SALT_ROUNDS, 10) || 10;
    return await bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (plainPassword, hashedPassword) => {
    return bcrypt.compare(plainPassword, hashedPassword);
};

const getDefaultSessionExpiry = () => {
  const sessionExpDays = parseInt(process.env.SESSION_EXP, 10);
  const days = Number.isNaN(sessionExpDays) ? 7 : sessionExpDays;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

export const generateSessionId = async ({
  userId,
  deviceType,
  deviceId,
  ipAddress,
  expiredAt,
}) => {
  const now = new Date();

  const query = {
    employeeId: userId,
    deviceType,
    isRevoked: false,
    expiredAt: { $gt: now },
  };

  if (deviceType === "mobile") {
    query.deviceId = deviceId;
  }

  const existingSession = await Session.findOne(query);

  if (existingSession) {
    return existingSession._id;
  }

  const sessionData = {
    employeeId: userId,
    deviceType,
    ipAddress,
    isRevoked: false,
    expiredAt: expiredAt ?? getDefaultSessionExpiry(),
  };

  if (deviceType === "mobile") {
    sessionData.deviceId = deviceId;
  }

  const session = await Session.create(sessionData);

  return session._id;
};

/** Minimal claims used by auth middleware / protected APIs. */
export const buildTokenClaims = ({ id, sessionId }) => ({
  id: String(id),
  sessionId: String(sessionId),
});

export const generateToken = (userData, sessionId) => {
  const claims = buildTokenClaims({
    id: userData.id,
    sessionId,
  });
  const encryptedPayload = encrypt(JSON.stringify(claims));
  return jwt.sign({ data: encryptedPayload }, JWT_SECRET, {
    expiresIn: "10m",
  });
};

export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const decryptedPayload = JSON.parse(decrypt(decoded.data));
    return decryptedPayload;
  } catch {
    throw new Error("Invalid or expired access token");
  }
};

export const generateRefreshToken = (userData, sessionId) => {
  const claims = buildTokenClaims({
    id: userData.id,
    sessionId,
  });
  return jwt.sign(claims, JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch {
    throw new Error("Invalid or expired refresh token");
  }
};

export const getClientContext = (req) => {
  const appId = req.headers["x-app-id"];
  const deviceId = req.headers["x-device-id"];

  if (appId && deviceId) {
    return {
      deviceType: DEVICE_TYPES.MOBILE,
      deviceId,
      appId,
    };
  }

  return {
    deviceType: DEVICE_TYPES.WEB,
    deviceId: null,
    appId: null,
  };
};