import crypto from "crypto";
import EmailActionToken from "../models/emailActionTokenModel.js";
import { LEAVE_REQUEST_ACTION } from "../config/constants.js";
import { EMAIL_ACTION_TOKEN_EXPIRY_HOURS } from "../config/index.js";

class EmailActionTokenRepository {
  createTokenValue() {
    return crypto.randomBytes(32).toString("hex");
  }

  getExpiryDate(hours = EMAIL_ACTION_TOKEN_EXPIRY_HOURS) {
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  async createActionTokens(leaveRequestId) {
    const expiresAt = this.getExpiryDate();
    const tokens = [
      {
        token: this.createTokenValue(),
        leaveRequestId,
        action: LEAVE_REQUEST_ACTION.APPROVE,
        expiresAt,
      },
      {
        token: this.createTokenValue(),
        leaveRequestId,
        action: LEAVE_REQUEST_ACTION.REJECT,
        expiresAt,
      },
    ];

    const created = await EmailActionToken.insertMany(tokens);
    return {
      approveToken: created.find(
        (item) => item.action === LEAVE_REQUEST_ACTION.APPROVE,
      ),
      rejectToken: created.find(
        (item) => item.action === LEAVE_REQUEST_ACTION.REJECT,
      ),
      expiresAt,
    };
  }

  async findByToken(token) {
    return EmailActionToken.findOne({ token });
  }

  async markTokensUsedForLeaveRequest(leaveRequestId) {
    return EmailActionToken.updateMany(
      { leaveRequestId, usedAt: null },
      { usedAt: new Date() },
    );
  }
}

export default new EmailActionTokenRepository();
