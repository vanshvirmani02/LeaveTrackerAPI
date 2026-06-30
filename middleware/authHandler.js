import userRepository from "../repository/userRepository.js";
import sessionRepository from "../repository/sessionRepository.js";
import { verifyToken, getClientContext } from "../utils/authUtils.js";
import { USER_STATUS } from "../config/constants.js";

export const authHandler = async (req, res, next) => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer")
  ) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided",
    });
  }

  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = verifyToken(token);
    const { id, sessionId } = decoded;

    if (!id || !sessionId) {
      throw new Error("Invalid token payload");
    }

    const { deviceType, deviceId } = getClientContext(req);

    const session = await sessionRepository.findValidSession({
      sessionId,
      userId: id,
      deviceType,
      deviceId,
    });

    if (!session) {
      throw new Error("Session expired");
    }

    const user = await userRepository.findById(id);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.status === USER_STATUS.INACTIVE) {
      throw new Error("User is inactive");
    }

    const userObject = user.toObject();
    delete userObject.password;

    req.user = {
      ...userObject,
      id: user._id,
      sessionId,
      deviceType: session.deviceType,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || "Not authorized",
    });
  }
};
