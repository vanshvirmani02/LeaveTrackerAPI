import leaveRequestRepository from "../repository/leaveRequestRepository.js";
import leaveTypeRepository from "../repository/leaveTypeRepository.js";
import leaveBalanceRepository from "../repository/leaveBalanceRepository.js";
import holidayRepository from "../repository/holidayRepository.js";
import userRepository from "../repository/userRepository.js";
import emailActionTokenRepository from "../repository/emailActionTokenRepository.js";
import {
  calculateAllocatedLeaves,
  calculateLeaveDays,
} from "./leaveAllocationUtils.js";
import { LEAVE_REQUEST_STATUS, LEAVE_REQUEST_ACTION } from "../config/constants.js";

const getLeaveTypeId = (leaveType) => {
  if (!leaveType) {
    return null;
  }

  if (typeof leaveType === "object") {
    return leaveType._id?.toString() ?? leaveType.id?.toString();
  }

  return leaveType.toString();
};

export const processLeaveRequestAction = async ({
  leaveRequestId,
  action,
  employeeId,
  leaveTypeId,
}) => {
  const leaveRequest = await leaveRequestRepository.findById(leaveRequestId);

  if (!leaveRequest) {
    return { success: false, statusCode: 404, message: "Leave request not found." };
  }

  if (leaveRequest.status !== LEAVE_REQUEST_STATUS.PENDING) {
    return {
      success: false,
      statusCode: 400,
      message: "Only pending leave requests can be approved or rejected.",
    };
  }

  if (employeeId && leaveRequest.employeeId !== employeeId) {
    return {
      success: false,
      statusCode: 400,
      message: "Employee ID does not match the leave request.",
    };
  }

  const requestLeaveTypeId = getLeaveTypeId(leaveRequest.leaveType);
  if (leaveTypeId && requestLeaveTypeId !== leaveTypeId) {
    return {
      success: false,
      statusCode: 400,
      message: "Leave type does not match the leave request.",
    };
  }

  const resolvedLeaveTypeId = leaveTypeId || requestLeaveTypeId;
  const resolvedEmployeeId = employeeId || leaveRequest.employeeId;

  if (action === LEAVE_REQUEST_ACTION.REJECT) {
    const updatedLeaveRequest = await leaveRequestRepository.updateStatusById(
      leaveRequestId,
      LEAVE_REQUEST_STATUS.REJECTED,
    );
    await emailActionTokenRepository.markTokensUsedForLeaveRequest(leaveRequestId);

    return {
      success: true,
      statusCode: 200,
      message: "Leave request rejected successfully.",
      leaveRequest: updatedLeaveRequest,
    };
  }

  if (action !== LEAVE_REQUEST_ACTION.APPROVE) {
    return { success: false, statusCode: 400, message: "Invalid action." };
  }

  const leaveTypeDoc = await leaveTypeRepository.findById(resolvedLeaveTypeId);
  if (!leaveTypeDoc) {
    return { success: false, statusCode: 404, message: "Leave type not found." };
  }

  const employee = await userRepository.findByEmployeeId(resolvedEmployeeId);
  if (!employee) {
    return { success: false, statusCode: 404, message: "Employee not found." };
  }

  const holidays = await holidayRepository.findBetweenDates(
    leaveRequest.startDate,
    leaveRequest.endDate,
  );

  const leaveDays = calculateLeaveDays({
    startDate: leaveRequest.startDate,
    endDate: leaveRequest.endDate,
    halfDay: leaveRequest.halfDay,
    holidays,
  });

  if (leaveDays <= 0) {
    return {
      success: false,
      statusCode: 400,
      message:
        "Leave request has no applicable leave days after excluding holidays.",
    };
  }

  const allocatedLeaves = calculateAllocatedLeaves({
    annualQuota: leaveTypeDoc.annualQuota,
    accrualType: leaveTypeDoc.accrualType,
    joiningDate: employee.joiningDate,
    referenceDate: leaveRequest.startDate,
  });

  const existingLeaveBalance =
    await leaveBalanceRepository.findByEmployeeIdAndLeaveTypeId(
      resolvedEmployeeId,
      resolvedLeaveTypeId,
    );

  const currentConsumedLeaves = existingLeaveBalance?.consumedLeaves ?? 0;

  if (currentConsumedLeaves + leaveDays > allocatedLeaves) {
    return {
      success: false,
      statusCode: 400,
      message: "Insufficient leave balance for approval.",
      leaveBalance: {
        allocatedLeaves,
        consumedLeaves: currentConsumedLeaves,
        requestedLeaveDays: leaveDays,
        availableLeaves: Math.max(allocatedLeaves - currentConsumedLeaves, 0),
      },
    };
  }

  const updatedLeaveRequest = await leaveRequestRepository.updateStatusById(
    leaveRequestId,
    LEAVE_REQUEST_STATUS.APPROVED,
  );

  const leaveBalance = await leaveBalanceRepository.upsertOnApprove({
    employeeId: resolvedEmployeeId,
    leaveTypeId: resolvedLeaveTypeId,
    allocatedLeaves,
    leaveDays,
  });

  await emailActionTokenRepository.markTokensUsedForLeaveRequest(leaveRequestId);

  return {
    success: true,
    statusCode: 200,
    message: "Leave request approved successfully.",
    leaveRequest: updatedLeaveRequest,
    leaveBalance,
  };
};

export default processLeaveRequestAction;
