import asyncHandler from "../middleware/asyncHandler.js";
import userRepository from "../repository/userRepository.js";
import { isAllowedOrigin } from "../utils/commonFunctions.js";
import {
  encryptPasswordForStorage,
  decrypt,
  generateSessionId,
  generateToken,
  generateRefreshToken,
  getClientContext,
} from "../utils/authUtils.js";

const getClientIpAddress = (req) =>
  req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
  req.ip ||
  req.socket?.remoteAddress ||
  "unknown";

const generateAndReturnTokens = async ({
  userId,
  deviceType,
  deviceId,
  ipAddress,
  userData,
}) => {
  const sessionId = await generateSessionId({
    employeeId: userId,
    deviceType,
    deviceId,
    ipAddress,
  });

  const accessToken = generateToken(userData, sessionId.toString());
  const refreshToken = generateRefreshToken(userData);

  return { accessToken, refreshToken };
};

export const signupUser = asyncHandler(async (req, res) => {
  const {
    name,
    password,
    email,
    designation,
    contactNo,
    joiningDate,
    managerId,
  } = req.body;
  const { deviceType, deviceId } = getClientContext(req);

  if (!isAllowedOrigin(req.headers.origin)) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized: Request must originate from the official website.",
    });
  }

  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User already exists.",
    });
  }

  const ipAddress = getClientIpAddress(req);

  const user = await userRepository.createUser({
    name,
    email,
    password: await encryptPasswordForStorage(decrypt(password)),
    contactNo,
    joiningDate,
    designation,
    managerId : null,
  });

  const userData = {
    id: user._id.toString(),
    employeeId: user.employeeId,
    name: user.name,
    email: user.email,
    joiningDate: user.joiningDate.toISOString(),
  };

  const { accessToken, refreshToken } = await generateAndReturnTokens({
    userId: user._id,
    deviceType,
    deviceId,
    ipAddress,
    userData,
  });

  res.status(201).json({
    success: true,
    user: userData,
    accessToken,
    refreshToken,
  });
});
