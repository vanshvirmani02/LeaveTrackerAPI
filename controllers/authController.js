import asyncHandler from "../middleware/asyncHandler.js";
import userRepository from "../repository/userRepository.js";
import sessionRepository from "../repository/sessionRepository.js";
import bankDetailsRepository from "../repository/bankDetailsRepository.js";
import skillsRepository from "../repository/skillsRepository.js";
import { isAllowedOrigin } from "../utils/commonFunctions.js";
import { USER_STATUS, ROLES } from "../config/constants.js";
import {
  encryptPasswordForStorage,
  decrypt,
  verifyPassword,
  generateSessionId,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  getClientContext,
} from "../utils/authUtils.js";

const getClientIpAddress = (req) =>
  req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
  req.ip ||
  req.socket?.remoteAddress ||
  "unknown";

const buildAuthUserResponse = (user, { isManager } = {}) => ({
  id: user._id.toString(),
  employeeId: user.employeeId,
  name: user.name,
  email: user.email,
  joiningDate: user.joiningDate?.toISOString?.() ?? user.joiningDate,
  role: user.role,
  ...(isManager !== undefined ? { isManager: Boolean(isManager) } : {}),
});

const buildTokenUser = (user) => ({
  id: user._id.toString(),
});

const generateAndReturnTokens = async ({
  deviceType,
  deviceId,
  ipAddress,
  user,
  existingSessionId,
}) => {
  const tokenUser = buildTokenUser(user);
  const sessionId =
    existingSessionId ??
    (await generateSessionId({
      userId: tokenUser.id,
      deviceType,
      deviceId,
      ipAddress,
    }));

  const accessToken = generateToken(tokenUser, sessionId.toString());
  const refreshToken = generateRefreshToken(tokenUser, sessionId.toString());

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
    role,
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

  if (role === ROLES.ADMIN) {
    const existingAdminCount = await userRepository.countByRole(ROLES.ADMIN);
    if (existingAdminCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          "An admin already exists. Only one admin account is allowed.",
      });
    }
  }

  const existingUser = await userRepository.findByEmailAndRole(email, role);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User already exists.",
    });
  }

  const ipAddress = getClientIpAddress(req);

  let user;
  try {
    user = await userRepository.createUser({
      name,
      email,
      password: await encryptPasswordForStorage(decrypt(password)),
      contactNo,
      joiningDate,
      designation,
      managerId: null,
      role,
    });
  } catch (error) {
    if (error?.code === 11000 && role === ROLES.ADMIN) {
      return res.status(400).json({
        success: false,
        message:
          "An admin already exists. Only one admin account is allowed.",
      });
    }
    throw error;
  }

  const userResponse = buildAuthUserResponse(user);

  const { accessToken, refreshToken } = await generateAndReturnTokens({
    deviceType,
    deviceId,
    ipAddress,
    user,
  });

  res.status(201).json({
    success: true,
    user: userResponse,
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

  const isManager = await userRepository.isManagerOfAnyUser(existingUser._id);
  const userResponse = buildAuthUserResponse(existingUser, { isManager });

  const { accessToken, refreshToken } = await generateAndReturnTokens({
    deviceType,
    deviceId,
    ipAddress,
    user: existingUser,
  });

  res.status(200).json({
    success: true,
    user: userResponse,
    accessToken,
    refreshToken,
  });
});

export const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const employeeId = req.user?.employeeId;

  if (!userId || !employeeId) {
    return res.status(400).json({
      success: false,
      message: "User context is missing.",
    });
  }

  const user = await userRepository.findByIdWithManager(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found.",
    });
  }

  if (user.employeeId !== employeeId) {
    return res.status(403).json({
      success: false,
      message: "Invalid user context.",
    });
  }

  const userData = user.toObject ? user.toObject() : { ...user };
  const { _id, ...rest } = userData;

  return res.status(200).json({
    success: true,
    profile: {
      ...rest,
      id: _id?.toString(),
    },
  });
});

export const getProfileStatus = asyncHandler(async (req, res) => {
  const employeeId = req.user?.employeeId;

  if (!employeeId) {
    return res.status(400).json({
      success: false,
      message: "Employee ID not found for the authenticated user.",
    });
  }

  const [bankDetails, skills] = await Promise.all([
    bankDetailsRepository.findByEmployeeId(employeeId),
    skillsRepository.findByEmployeeId(employeeId),
  ]);

  const bankDetailsFilled = Boolean(
    bankDetails?.accountHolderName &&
      bankDetails?.bankName &&
      bankDetails?.accountNumber &&
      bankDetails?.ifscCode &&
      bankDetails?.branch,
  );

  const skillsFilled = Boolean(
    skills &&
      ((Array.isArray(skills.skills) && skills.skills.length > 0) ||
        skills.primarySkill?.trim()),
  );

  return res.status(200).json({
    success: true,
    employeeId,
    bankDetailsFilled,
    skillsFilled,
  });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  const { deviceType, deviceId } = getClientContext(req);
  const ipAddress = getClientIpAddress(req);

  const decoded = verifyRefreshToken(token);
  const { id, sessionId } = decoded;

  if (!id || !sessionId) {
    return res.status(401).json({
      success: false,
      message: "Invalid refresh token payload.",
    });
  }

  const session = await sessionRepository.findValidSession({
    sessionId,
    userId: id,
    deviceType,
    deviceId,
  });

  if (!session) {
    return res.status(401).json({
      success: false,
      message: "Session expired.",
    });
  }

  const user = await userRepository.findById(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found.",
    });
  }

  if (user.status === USER_STATUS.INACTIVE) {
    return res.status(400).json({
      success: false,
      message: "User is inactive.",
    });
  }

  const isManager = await userRepository.isManagerOfAnyUser(user._id);

  const { accessToken, refreshToken: nextRefreshToken } =
    await generateAndReturnTokens({
      deviceType,
      deviceId,
      ipAddress,
      user,
      existingSessionId: session._id,
    });

  return res.status(200).json({
    success: true,
    user: buildAuthUserResponse(user, { isManager }),
    accessToken,
    refreshToken: nextRefreshToken,
  });
});

export const signoutUser = asyncHandler(async (req, res) => {
  const sessionId = req.user?.sessionId;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: "Session context is missing.",
    });
  }

  await sessionRepository.revokeSessionById(sessionId);

  return res.status(200).json({
    success: true,
    message: "Signed out successfully.",
  });
});