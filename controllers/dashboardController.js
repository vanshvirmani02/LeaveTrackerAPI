import asyncHandler from "../middleware/asyncHandler.js";
import userRepository from "../repository/userRepository.js";
import leaveRequestRepository from "../repository/leaveRequestRepository.js";
import leaveBalanceRepository from "../repository/leaveBalanceRepository.js";
import leaveTypeRepository from "../repository/leaveTypeRepository.js";
import holidayRepository from "../repository/holidayRepository.js";
import {
  LEAVE_REQUEST_STATUS,
  LEAVE_TYPE_STATUS,
  ROLES,
  USER_STATUS,
} from "../config/constants.js";
import {
  calculateAllocatedLeaves,
  getUtcDayBounds,
  getUpcomingWeekBounds,
} from "../utils/leaveAllocationUtils.js";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const getUpcomingHolidaysEndDate = (fromDate = new Date()) => {
  const end = new Date(fromDate);
  end.setUTCMonth(11, 31);
  end.setUTCHours(23, 59, 59, 999);
  return end;
};

const formatHoliday = (holiday) => {
  const doc = holiday.toObject ? holiday.toObject() : { ...holiday };
  const { _id, ...rest } = doc;

  return {
    ...rest,
    id: _id?.toString(),
  };
};

const getUpcomingHolidays = async () => {
  const { start: todayStart } = getUtcDayBounds();
  return holidayRepository.findBetweenDates(
    todayStart,
    getUpcomingHolidaysEndDate(todayStart),
  );
};

const buildMonthlyLeaveStats = ({ appliedByMonth, approvedByMonth, year }) => {
  const appliedMap = new Map(
    appliedByMonth.map((entry) => [entry._id, entry.count]),
  );
  const approvedMap = new Map(
    approvedByMonth.map((entry) => [entry._id, entry.count]),
  );

  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;

    return {
      month,
      monthName: MONTH_NAMES[index],
      year,
      appliedLeaves: appliedMap.get(month) ?? 0,
      approvedLeaves: approvedMap.get(month) ?? 0,
    };
  });
};

const buildEmployeeConsumedLeaves = async () => {
  const [employees, consumedByEmployee] = await Promise.all([
    userRepository.findAllByRole(ROLES.EMPLOYEE),
    leaveBalanceRepository.getTotalConsumedLeavesByEmployee(),
  ]);

  const consumedMap = new Map(
    consumedByEmployee.map((entry) => [entry._id, entry.totalConsumedLeaves]),
  );

  return employees.map((employee) => ({
    employeeId: employee.employeeId,
    employeeName: employee.name,
    totalConsumedLeaves: consumedMap.get(employee.employeeId) ?? 0,
  }));
};

const buildEmployeeLeaveSummary = async (employeeId) => {
  const employee = await userRepository.findByEmployeeId(employeeId);
  if (!employee) {
    return null;
  }

  const [leaveBalances, allLeaveTypes] = await Promise.all([
    leaveBalanceRepository.findByEmployeeIds([employeeId]),
    leaveTypeRepository.findAll(),
  ]);

  const balanceByLeaveTypeId = new Map(
    leaveBalances.map((balance) => {
      const leaveTypeId =
        balance.leaveTypeId?._id?.toString() ?? balance.leaveTypeId?.toString();
      return [leaveTypeId, balance];
    }),
  );

  const activeLeaveTypes = allLeaveTypes.filter(
    (leaveType) => leaveType.status === LEAVE_TYPE_STATUS.ACTIVE,
  );

  const leaveTypes = activeLeaveTypes.map((leaveType) => {
    const leaveTypeId = leaveType._id.toString();
    const balance = balanceByLeaveTypeId.get(leaveTypeId);
    const allocatedLeaves =
      balance?.allocatedLeaves ??
      calculateAllocatedLeaves({
        annualQuota: leaveType.annualQuota,
        accrualType: leaveType.accrualType,
        joiningDate: employee.joiningDate,
      });
    const consumedLeaves = balance?.consumedLeaves ?? 0;
    const availableLeaves = Math.max(allocatedLeaves - consumedLeaves, 0);

    return {
      leaveName: leaveType.leaveName,
      allocatedLeaves,
      consumedLeaves,
      availableLeaves,
    };
  });

  const availableLeaveCount = leaveTypes.reduce(
    (total, leaveType) => total + leaveType.availableLeaves,
    0,
  );

  return { availableLeaveCount, leaveTypes };
};

export const getEmployeeDashboard = asyncHandler(async (req, res) => {
  const employeeId = req.user?.employeeId;

  if (!employeeId) {
    return res.status(400).json({
      success: false,
      message: "Employee ID not found for the authenticated user.",
    });
  }

  const leaveSummary = await buildEmployeeLeaveSummary(employeeId);
  if (!leaveSummary) {
    return res.status(404).json({
      success: false,
      message: "Employee not found.",
    });
  }

  const [
    pendingRequestCount,
    approvedRequestCount,
    upcomingHolidays,
  ] = await Promise.all([
    leaveRequestRepository.countByStatus({
      status: LEAVE_REQUEST_STATUS.PENDING,
      employeeIds: [employeeId],
    }),
    leaveRequestRepository.countByStatus({
      status: LEAVE_REQUEST_STATUS.APPROVED,
      employeeIds: [employeeId],
    }),
    getUpcomingHolidays(),
  ]);

  return res.status(200).json({
    success: true,
    message: "Employee dashboard retrieved successfully.",
    employeeId,
    availableLeaveCount: leaveSummary.availableLeaveCount,
    pendingRequestCount,
    approvedRequestCount,
    upcomingHolidaysCount: upcomingHolidays.length,
    upcomingHolidays: upcomingHolidays.map(formatHoliday),
    leaveTypes: leaveSummary.leaveTypes,
  });
});

export const getManagerDashboard = asyncHandler(async (req, res) => {
  const managerId = req.user?.id;
  const teamMembers = await userRepository.findByManagerId(managerId);
  const teamEmployeeIds = teamMembers
    .map((member) => member.employeeId)
    .filter(Boolean);

  if (teamEmployeeIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No employees are assigned to this manager.",
    });
  }

  const { start: todayStart, end: todayEnd } = getUtcDayBounds();
  const { start: weekStart, end: weekEnd } = getUpcomingWeekBounds();

  const [
    totalTeamMembers,
    pendingRequestCount,
    teamMembersOnLeaveToday,
    upcomingWeekLeaves,
  ] = await Promise.all([
    userRepository.countEmployees({ managerId }),
    leaveRequestRepository.countByStatus({
      status: LEAVE_REQUEST_STATUS.PENDING,
      employeeIds: teamEmployeeIds,
    }),
    leaveRequestRepository.countDistinctEmployeesOnLeave(
      teamEmployeeIds,
      todayStart,
      todayEnd,
    ),
    leaveRequestRepository.findApprovedOverlappingRange(
      teamEmployeeIds,
      weekStart,
      weekEnd,
    ),
  ]);

  return res.status(200).json({
    success: true,
    message: "Manager dashboard retrieved successfully.",
    totalTeamMembers,
    pendingRequestCount,
    teamMembersOnLeaveToday,
    upcomingWeekLeaveCount: upcomingWeekLeaves.length,
  });
});

export const getAdminDashboard = asyncHandler(async (req, res) => {
  const { start: todayStart, end: todayEnd } = getUtcDayBounds();
  const currentYear = new Date().getUTCFullYear();

  const [
    totalEmployees,
    activeEmployees,
    employeesOnLeaveToday,
    pendingRequestCount,
    employeeConsumedLeaves,
    monthlyLeaveCounts,
  ] = await Promise.all([
    userRepository.countEmployees(),
    userRepository.countEmployees({ status: USER_STATUS.ACTIVE }),
    leaveRequestRepository.countDistinctEmployeesOnLeave(
      null,
      todayStart,
      todayEnd,
    ),
    leaveRequestRepository.countByStatus({
      status: LEAVE_REQUEST_STATUS.PENDING,
    }),
    buildEmployeeConsumedLeaves(),
    leaveRequestRepository.getMonthlyLeaveRequestCounts(currentYear),
  ]);

  return res.status(200).json({
    success: true,
    message: "Admin dashboard retrieved successfully.",
    totalEmployees,
    activeEmployees,
    employeesOnLeaveToday,
    pendingRequestCount,
    employeeConsumedLeaves,
    monthlyLeaveStats: buildMonthlyLeaveStats(monthlyLeaveCounts),
  });
});
