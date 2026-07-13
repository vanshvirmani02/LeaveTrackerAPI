import emailActionTokenRepository from "../repository/emailActionTokenRepository.js";
import userRepository from "../repository/userRepository.js";
import { sendLeaveRequestActionEmail } from "./leaveRequestEmail.js";

export const notifyAdminsOfLeaveRequest = async (leaveRequest, employee) => {
  if (!leaveRequest?._id || !employee) {
    return;
  }

  const admins = await userRepository.findActiveAdmins();
  if (!admins.length) {
    console.warn(
      "No active admin users found. Skipping leave request email notification.",
    );
    return;
  }

  const { approveToken, rejectToken, expiresAt } =
    await emailActionTokenRepository.createActionTokens(leaveRequest._id);

  const leaveTypeName =
    leaveRequest.leaveType?.leaveName ||
    leaveRequest.leaveType?.name ||
    "Leave";

  const emailPayload = {
    employeeName: employee.name,
    employeeId: employee.employeeId,
    leaveTypeName,
    startDate: leaveRequest.startDate,
    endDate: leaveRequest.endDate,
    halfDay: leaveRequest.halfDay,
    reason: leaveRequest.reason,
    approveToken: approveToken.token,
    rejectToken: rejectToken.token,
    expiresAt,
  };

  await Promise.all(
    admins.map((admin) =>
      sendLeaveRequestActionEmail({
        ...emailPayload,
        to: admin.email,
      }),
    ),
  );
};

export default notifyAdminsOfLeaveRequest;
