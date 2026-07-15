import emailActionTokenRepository from "../repository/emailActionTokenRepository.js";
import userRepository from "../repository/userRepository.js";
import {
  sendLeaveRequestActionEmail,
  sendManagerLeaveRequestEmail,
} from "./leaveRequestEmail.js";
import { isEmailNotificationEnabled } from "./leaveSettingsUtils.js";

const buildLeaveEmailPayload = (leaveRequest, employee) => {
  const leaveTypeName =
    leaveRequest.leaveType?.leaveName ||
    leaveRequest.leaveType?.name ||
    "Leave";

  return {
    employeeName: employee.name,
    employeeId: employee.employeeId,
    leaveTypeName,
    startDate: leaveRequest.startDate,
    endDate: leaveRequest.endDate,
    halfDay: leaveRequest.halfDay,
    reason: leaveRequest.reason,
  };
};

export const notifyAdminsOfLeaveRequest = async (leaveRequest, employee) => {
  if (!leaveRequest?._id || !employee) {
    return;
  }

  if (!(await isEmailNotificationEnabled())) {
    return;
  }

  const emailPayload = buildLeaveEmailPayload(leaveRequest, employee);

  const admins = await userRepository.findActiveAdmins();
  if (admins.length) {
    const { approveToken, rejectToken, expiresAt } =
      await emailActionTokenRepository.createActionTokens(leaveRequest._id);

    for (const admin of admins) {
      await sendLeaveRequestActionEmail({
        ...emailPayload,
        to: admin.email,
        approveToken: approveToken.token,
        rejectToken: rejectToken.token,
        expiresAt,
      });
    }
  } else {
    console.warn(
      "No active admin users found. Skipping leave request admin email notification.",
    );
  }

  const manager = employee.managerId;
  const managerEmail =
    manager && typeof manager === "object" ? manager.email : null;

  if (managerEmail) {
    await sendManagerLeaveRequestEmail({
      ...emailPayload,
      to: managerEmail,
    });
  }
};

export default notifyAdminsOfLeaveRequest;
