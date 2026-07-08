import asyncHandler from "../middleware/asyncHandler.js";
import leaveBalanceRepository from "../repository/leaveBalanceRepository.js";
import leaveRequestRepository from "../repository/leaveRequestRepository.js";
import userRepository from "../repository/userRepository.js";

const formatLeaveRequestSummary = (leaveRequest) => {
  const doc = leaveRequest.toObject
    ? leaveRequest.toObject()
    : { ...leaveRequest };
  const { _id, leaveType, ...rest } = doc;

  return {
    id: _id?.toString(),
    startDate: rest.startDate,
    endDate: rest.endDate,
    halfDay: rest.halfDay,
    status: rest.status,
    reason: rest.reason ?? null,
  };
};

const formatLeaveBalanceDetails = (leaveBalance, leaveRequests = []) => {
  const doc = leaveBalance.toObject
    ? leaveBalance.toObject()
    : { ...leaveBalance };
  const { _id, leaveTypeId, allocatedLeaves, consumedLeaves, ...rest } = doc;

  const leaveType =
    leaveTypeId && typeof leaveTypeId === "object"
      ? leaveTypeId.toObject
        ? leaveTypeId.toObject()
        : leaveTypeId
      : null;

  const availableLeaves = Math.max(
    (allocatedLeaves ?? 0) - (consumedLeaves ?? 0),
    0,
  );

  return {
    id: _id?.toString(),
    employeeId: rest.employeeId,
    leaveTypeId: leaveType?._id?.toString() ?? leaveTypeId?.toString(),
    leaveName: leaveType?.leaveName ?? null,
    policyName: leaveType?.policyName ?? null,
    annualQuota: leaveType?.annualQuota ?? null,
    carryForward: leaveType?.carryForward ?? false,
    maxCarryForward: leaveType?.maxCarryForward ?? 0,
    allocatedLeaves,
    consumedLeaves,
    availableLeaves,
    leaveRequests: leaveRequests.map(formatLeaveRequestSummary),
  };
};

const buildLeaveBalancesResponse = async (employeeIds) => {
  const leaveBalances =
    await leaveBalanceRepository.findByEmployeeIds(employeeIds);

  if (leaveBalances.length === 0) {
    return [];
  }

  const requestEmployeeIds =
    employeeIds?.length > 0
      ? employeeIds
      : [...new Set(leaveBalances.map((balance) => balance.employeeId))];

  const leaveRequests =
    await leaveRequestRepository.findByEmployeeIds(requestEmployeeIds);

  const requestsByEmployeeAndType = new Map();

  for (const leaveRequest of leaveRequests) {
    const leaveTypeId =
      leaveRequest.leaveType?._id?.toString() ??
      leaveRequest.leaveType?.toString();

    if (!leaveTypeId) {
      continue;
    }

    const key = `${leaveRequest.employeeId}:${leaveTypeId}`;
    if (!requestsByEmployeeAndType.has(key)) {
      requestsByEmployeeAndType.set(key, []);
    }
    requestsByEmployeeAndType.get(key).push(leaveRequest);
  }

  return leaveBalances.map((leaveBalance) => {
    const leaveTypeId =
      leaveBalance.leaveTypeId?._id?.toString() ??
      leaveBalance.leaveTypeId?.toString();
    const key = `${leaveBalance.employeeId}:${leaveTypeId}`;

    return formatLeaveBalanceDetails(
      leaveBalance,
      requestsByEmployeeAndType.get(key) ?? [],
    );
  });
};

export const getMyLeaveBalances = asyncHandler(async (req, res) => {
  const employeeId = req.user.employeeId;

  if (!employeeId) {
    return res.status(400).json({
      success: false,
      message: "Employee ID not found for the authenticated user.",
    });
  }

  const leaveBalances = await buildLeaveBalancesResponse([employeeId]);

  if (leaveBalances.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No leave balances found.",
      count: 0,
      leaveBalances: [],
    });
  }

  return res.status(200).json({
    success: true,
    message: "Leave balances retrieved successfully.",
    count: leaveBalances.length,
    leaveBalances,
  });
});

export const getLeaveBalances = asyncHandler(async (req, res) => {
  const { employeeId } = req.query;
  let scopedEmployeeIds;

  if (req.leaveRequestScope === "team") {
    const teamMembers = await userRepository.findByManagerId(req.user?.id);
    scopedEmployeeIds = teamMembers
      .map((member) => member.employeeId)
      .filter(Boolean);

    if (scopedEmployeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No employees are assigned to this manager.",
      });
    }
  }

  if (employeeId) {
    if (
      scopedEmployeeIds &&
      !scopedEmployeeIds.includes(employeeId)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You can only view leave balances for your team members.",
      });
    }

    const employee = await userRepository.findByEmployeeId(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    const leaveBalances = await buildLeaveBalancesResponse([employeeId]);

    if (leaveBalances.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No leave balances found for this employee.",
        count: 0,
        employeeId,
        leaveBalances: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Leave balances retrieved successfully.",
      count: leaveBalances.length,
      employeeId,
      leaveBalances,
    });
  }

  const leaveBalances = await buildLeaveBalancesResponse(scopedEmployeeIds);

  if (leaveBalances.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No leave balances found.",
      count: 0,
      leaveBalances: [],
    });
  }

  return res.status(200).json({
    success: true,
    message: "Leave balances retrieved successfully.",
    count: leaveBalances.length,
    leaveBalances,
  });
});
