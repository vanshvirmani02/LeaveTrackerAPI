import asyncHandler from "../middleware/asyncHandler.js";
import userRepository from "../repository/userRepository.js";
import { isAllowedOrigin } from "../utils/commonFunctions.js";
import { USER_STATUS, ROLES } from "../config/constants.js";
import {
  encryptPasswordForStorage,
  decrypt,
  verifyPassword,
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
  deviceType,
  deviceId,
  ipAddress,
  userData,
}) => {
  const sessionId = await generateSessionId({
    userId: userData.id,
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

export const loginUser = asyncHandler(async (req, res) => {
  const {
    email,
    password,
    role
  } = req.body;
  const { deviceType, deviceId } = getClientContext(req);

  if (!isAllowedOrigin(req.headers.origin)) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized: Request must originate from the official website.",
    });
  }

  if (!role || !Object.values(ROLES).includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Role is required.",
    });
  }

  const existingUser = await userRepository.findByEmailAndRole(email, role);
  if (!existingUser) {
    return res.status(400).json({
      success: false,
      message: "User not found.",
    });
  }

  if (existingUser.status === USER_STATUS.INACTIVE) {
    return res.status(400).json({
      success: false,
      message: "User is inactive.",
    });
  }

  const isPasswordValid = await verifyPassword(
    decrypt(password),
    existingUser.password,
  );
  if (!isPasswordValid) {
    return res.status(400).json({
      success: false,
      message: "Invalid email or password.",
    });
  }

  const ipAddress = getClientIpAddress(req);

  const userData = {
    id: existingUser._id.toString(),
    employeeId: existingUser.employeeId,
    name: existingUser.name,
    email: existingUser.email,
    joiningDate: existingUser.joiningDate.toISOString(),
    role: existingUser.role,
  };

  const { accessToken, refreshToken } = await generateAndReturnTokens({
    deviceType,
    deviceId,
    ipAddress,
    userData,
  });

  res.status(200).json({
    success: true,
    user: userData,
    accessToken,
    refreshToken,
  });
});

export const getReqUser = asyncHandler(async (req, res) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user: user,
  });
});