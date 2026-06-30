import Session from "../models/sessionModel.js";
import { DEVICE_TYPES } from "../config/constants.js";

class SessionRepository {
  async findValidSession({ sessionId, userId, deviceType, deviceId }) {
    const query = {
      _id: sessionId,
      employeeId: userId,
      deviceType,
      isRevoked: false,
      expiredAt: { $gt: new Date() },
    };

    if (deviceType === DEVICE_TYPES.MOBILE) {
      query.deviceId = deviceId;
    }

    return Session.findOne(query);
  }
}

export default new SessionRepository();
