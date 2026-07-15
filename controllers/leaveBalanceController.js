import asyncHandler from "../middleware/asyncHandler.js";
import leaveBalanceRepository from "../repository/leaveBalanceRepository.js";
import leaveRequestRepository from "../repository/leaveRequestRepository.js";
import leaveTypeRepository from "../repository/leaveTypeRepository.js";
import userRepository from "../repository/userRepository.js";
import { calculateAllocatedLeaves } from "../utils/leaveAllocationUtils.js";
import { LEAVE_TYPE_STATUS, ROLES } from "../config/constants.js";

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

const formatLeaveBalanceDetails = ({
  id = null,
  employeeId,
  leaveType,
  leaveTypeId,
  allocatedLeaves,
  consumedLeaves,
  leaveRequests = [],
}) => {
  const availableLeaves = Math.max(
    (allocatedLeaves ?? 0) - (consumedLeaves ?? 0),
    0,
  );

  return {
    id: id?.toString() ?? null,
    employeeId,
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
  let employees;

  if (employeeIds?.length) {
    employees = await userRepository.findByEmployeeIds(employeeIds);
  } else {
    employees = await userRepository.findAllByRole(ROLES.EMPLOYEE);
  }

  if (!employees.length) {
    return [];
  }

  const resolvedEmployeeIds = employees
    .map((employee) => employee.employeeId)
    .filter(Boolean);

  const [leaveBalances, allLeaveTypes, leaveRequests] = await Promise.all([
    leaveBalanceRepository.findByEmployeeIds(resolvedEmployeeIds),
    leaveTypeRepository.findAll(),
    leaveRequestRepository.findByEmployeeIds(resolvedEmployeeIds),
  ]);

  const activeLeaveTypes = allLeaveTypes.filter(
    (leaveType) => leaveType.status === LEAVE_TYPE_STATUS.ACTIVE,
  );

  if (activeLeaveTypes.length === 0) {
    return [];
  }

  const balanceByEmployeeAndType = new Map(
    leaveBalances.map((balance) => {
      const leaveTypeId =
        balance.leaveTypeId?._id?.toString() ??
        balance.leaveTypeId?.toString();
      return [`${balance.employeeId}:${leaveTypeId}`, balance];
    }),
  );

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

  const employeeById = new Map(
    employees.map((employee) => [employee.employeeId, employee]),
  );

  const result = [];

  for (const employeeId of resolvedEmployeeIds) {
    const employee = employeeById.get(employeeId);

    for (const leaveType of activeLeaveTypes) {
      const leaveTypeId = leaveType._id.toString();
      const key = `${employeeId}:${leaveTypeId}`;
      const balance = balanceByEmployeeAndType.get(key);

      const allocatedLeaves =
        balance?.allocatedLeaves ??
        calculateAllocatedLeaves({
          annualQuota: leaveType.annualQuota,
          accrualType: leaveType.accrualType,
          joiningDate: employee?.joiningDate,
        });
      const consumedLeaves = balance?.consumedLeaves ?? 0;

      result.push(
        formatLeaveBalanceDetails({
          id: balance?._id ?? null,
          employeeId,
          leaveType,
          leaveTypeId,
          allocatedLeaves,
          consumedLeaves,
          leaveRequests: requestsByEmployeeAndType.get(key) ?? [],
        }),
      );
    }
  }

  return result;
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
