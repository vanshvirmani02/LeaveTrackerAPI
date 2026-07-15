import asyncHandler from "../middleware/asyncHandler.js";
import leaveRequestRepository from "../repository/leaveRequestRepository.js";
import leaveTypeRepository from "../repository/leaveTypeRepository.js";
import leaveBalanceRepository from "../repository/leaveBalanceRepository.js";
import holidayRepository from "../repository/holidayRepository.js";
import userRepository from "../repository/userRepository.js";
import {
  calculateAllocatedLeaves,
  calculateLeaveDays,
} from "../utils/leaveAllocationUtils.js";
import { notifyAdminsOfLeaveRequest } from "../utils/leaveRequestNotification.js";
import { processLeaveRequestAction } from "../utils/leaveRequestActionService.js";
import {
  getLeaveSettings,
  isSickLeaveType,
  isWithinSickAutoApproveWindow,
} from "../utils/leaveSettingsUtils.js";
import {
  LEAVE_TYPE_STATUS,
  LEAVE_REQUEST_STATUS,
  LEAVE_REQUEST_ACTION,
} from "../config/constants.js";

export const formatLeaveRequest = (leaveRequest, { employeeName, managerName } = {}) => {
  const doc = leaveRequest.toObject ? leaveRequest.toObject() : { ...leaveRequest };
  const { _id, leaveType, ...rest } = doc;

  const formattedLeaveType = leaveType
    ? {
        ...(leaveType.toObject ? leaveType.toObject() : leaveType),
        id: leaveType._id?.toString(),
      }
  : leaveType;

  if (formattedLeaveType?._id) {
    delete formattedLeaveType._id;
  }

  return {
    ...rest,
    id: _id?.toString(),
    employeeName: employeeName ?? null,
    managerName: managerName ?? null,
    leaveType: formattedLeaveType,
  };
};

const matchesEmployeeNameFilter = (employeeName, filterName) => {
  if (!filterName?.trim()) {
    return true;
  }

  return new RegExp(filterName.trim(), "i").test(employeeName);
};

const validateLeaveType = async (leaveTypeId) => {
  const leaveType = await leaveTypeRepository.findById(leaveTypeId);
  if (!leaveType) {
    return { valid: false, message: "Leave type not found." };
  }
  if (leaveType.status !== LEAVE_TYPE_STATUS.ACTIVE) {
    return { valid: false, message: "Selected leave type is not active." };
  }
  return { valid: true, leaveType };
};

const validateDateRange = (startDate, endDate) => {
  if (new Date(endDate) < new Date(startDate)) {
    return { valid: false, message: "End date must be on or after start date." };
  }
  return { valid: true };
};

const formatConflictDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const validateLeaveDateAvailability = async ({
  employeeId,
  startDate,
  endDate,
  excludeLeaveRequestId = null,
}) => {
  const holidays = await holidayRepository.findBetweenDates(startDate, endDate);
  if (holidays.length > 0) {
    const holidayNames = holidays
      .map(
        (holiday) =>
          `${holiday.holidayName} (${formatConflictDate(holiday.date)})`,
      )
      .join(", ");

    return {
      valid: false,
      message: `Cannot raise leave on holiday(s): ${holidayNames}.`,
      holidays,
    };
  }

  const overlappingApproved =
    await leaveRequestRepository.findApprovedOverlappingForEmployee(
      employeeId,
      startDate,
      endDate,
      { excludeId: excludeLeaveRequestId },
    );

  if (overlappingApproved.length > 0) {
    const conflictText = overlappingApproved
      .map((leave) => {
        const leaveTypeName =
          leave.leaveType?.leaveName || leave.leaveType?.name || "Leave";
        return `${leaveTypeName} (${formatConflictDate(leave.startDate)} - ${formatConflictDate(leave.endDate)})`;
      })
      .join(", ");

    return {
      valid: false,
      message: `You already have approved leave on one or more of these dates: ${conflictText}.`,
      overlappingLeaves: overlappingApproved,
    };
  }

  return { valid: true, holidays: [] };
};

const getEmployeeLeaveAvailability = async ({
  employeeId,
  leaveTypeId,
  leaveTypeDoc,
  referenceDate,
}) => {
  const employee = await userRepository.findByEmployeeId(employeeId);
  if (!employee) {
    return null;
  }

  const existingLeaveBalance =
    await leaveBalanceRepository.findByEmployeeIdAndLeaveTypeId(
      employeeId,
      leaveTypeId,
    );

  const allocatedLeaves =
    existingLeaveBalance?.allocatedLeaves ??
    calculateAllocatedLeaves({
      annualQuota: leaveTypeDoc.annualQuota,
      accrualType: leaveTypeDoc.accrualType,
      joiningDate: employee.joiningDate,
      referenceDate,
    });

  const consumedLeaves = existingLeaveBalance?.consumedLeaves ?? 0;
  const availableLeaves = Math.max(allocatedLeaves - consumedLeaves, 0);

  return {
    allocatedLeaves,
    consumedLeaves,
    availableLeaves,
  };
};

export const createLeaveRequest = asyncHandler(async (req, res) => {
  const {
    leaveType,
    startDate,
    endDate,
    halfDay,
    halfDayPeriod,
    emergencyContactNo,
    location,
    reason,
    attachmentDoc,
  } = req.body;
  const employeeId = req.user.employeeId;

  if (!employeeId) {
    return res.status(400).json({
      success: false,
      message: "Employee ID not found for the authenticated user.",
    });
  }

  const leaveTypeValidation = await validateLeaveType(leaveType);
  if (!leaveTypeValidation.valid) {
    return res.status(400).json({
      success: false,
      message: leaveTypeValidation.message,
    });
  }

  const dateValidation = validateDateRange(startDate, endDate);
  if (!dateValidation.valid) {
    return res.status(400).json({
      success: false,
      message: dateValidation.message,
    });
  }

  const leaveAvailability = await getEmployeeLeaveAvailability({
    employeeId,
    leaveTypeId: leaveType,
    leaveTypeDoc: leaveTypeValidation.leaveType,
    referenceDate: startDate,
  });

  if (!leaveAvailability) {
    return res.status(404).json({
      success: false,
      message: "Employee not found.",
    });
  }

  const { allocatedLeaves, consumedLeaves, availableLeaves } = leaveAvailability;

  if (availableLeaves <= 0) {
    return res.status(400).json({
      success: false,
      message: "All leaves consumed.",
      leaveBalance: {
        allocatedLeaves,
        consumedLeaves,
        availableLeaves: 0,
      },
    });
  }

  const dateAvailability = await validateLeaveDateAvailability({
    employeeId,
    startDate,
    endDate,
  });
  if (!dateAvailability.valid) {
    return res.status(400).json({
      success: false,
      message: dateAvailability.message,
    });
  }

  const holidays = dateAvailability.holidays;
  const requestedLeaveDays = calculateLeaveDays({
    startDate,
    endDate,
    halfDay: halfDay ?? false,
    holidays,
  });

  if (requestedLeaveDays <= 0) {
    return res.status(400).json({
      success: false,
      message:
        "Leave request has no applicable leave days after excluding holidays.",
    });
  }

  if (requestedLeaveDays > availableLeaves) {
    return res.status(400).json({
      success: false,
      message: "Insufficient leave balance for this leave type.",
      leaveBalance: {
        allocatedLeaves,
        consumedLeaves,
        availableLeaves,
        requestedLeaveDays,
      },
    });
  }

  const existingPendingRequest =
    await leaveRequestRepository.findPendingByEmployeeIdAndLeaveType(
      employeeId,
      leaveType,
    );
  if (existingPendingRequest) {
    return res.status(400).json({
      success: false,
      message:
        "You already have a pending leave request for this leave type. Please wait until it is approved or rejected.",
    });
  }

  let leaveRequest;
  try {
    leaveRequest = await leaveRequestRepository.createLeaveRequest({
      employeeId,
      leaveType,
      startDate,
      endDate,
      halfDay: halfDay ?? false,
      halfDayPeriod: halfDay ? halfDayPeriod : null,
      emergencyContactNo: emergencyContactNo?.trim(),
      location: location?.trim(),
      status: LEAVE_REQUEST_STATUS.PENDING,
      reason: reason?.trim(),
      attachmentDoc: attachmentDoc?.trim(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a pending leave request for this leave type. Please wait until it is approved or rejected.",
      });
    }
    throw error;
  }

  const populatedLeaveRequest =
    await leaveRequestRepository.findByIdAndEmployeeId(
      leaveRequest._id,
      employeeId,
    );

  const employee = await userRepository.findByEmployeeId(employeeId);
  const leaveSettings = await getLeaveSettings();
  const leaveTypeDoc = leaveTypeValidation.leaveType;
  const shouldAutoApproveSickLeave =
    leaveSettings.autoApproveSickLeave &&
    isSickLeaveType(leaveTypeDoc) &&
    isWithinSickAutoApproveWindow(startDate);

  if (shouldAutoApproveSickLeave) {
    const autoApproveResult = await processLeaveRequestAction({
      leaveRequestId: leaveRequest._id,
      action: LEAVE_REQUEST_ACTION.APPROVE,
      employeeId,
      leaveTypeId: leaveType,
    });

    if (autoApproveResult.success) {
      const approvedLeaveRequest =
        await leaveRequestRepository.findByIdAndEmployeeId(
          leaveRequest._id,
          employeeId,
        );

      return res.status(201).json({
        success: true,
        message:
          "Sick leave request created and auto-approved successfully.",
        leaveRequest: formatLeaveRequest(approvedLeaveRequest),
        autoApproved: true,
      });
    }

    console.warn(
      "Sick leave auto-approve failed; leaving request pending:",
      autoApproveResult.message,
    );
  }

  if (leaveSettings.emailNotification) {
    notifyAdminsOfLeaveRequest(populatedLeaveRequest, employee).catch(
      (error) => {
        console.error(
          "Failed to send leave request notification email:",
          error,
        );
      },
    );
  }

  res.status(201).json({
    success: true,
    message: "Leave request created successfully.",
    leaveRequest: formatLeaveRequest(populatedLeaveRequest),
    autoApproved: false,
  });
});

export const getMyLeaveRequests = asyncHandler(async (req, res) => {
  const employeeId = req.user.employeeId;
  const { status, employeeName, startDate, endDate } = req.query;

  if (!employeeId) {
    return res.status(400).json({
      success: false,
      message: "Employee ID not found for the authenticated user.",
    });
  }

  const employee = await userRepository.findByEmployeeId(employeeId);
  if (!employee) {
    return res.status(404).json({
      success: false,
      message: "Employee not found.",
    });
  }

  if (!matchesEmployeeNameFilter(employee.name, employeeName)) {
    return res.status(200).json({
      success: true,
      count: 0,
      message: "No leave requests found.",
      leaveRequests: [],
    });
  }

  const leaveRequests = await leaveRequestRepository.findByEmployeeId(
    employeeId,
    { status, startDate, endDate },
  );

  const managerName = employee.managerId?.name ?? null;
  const employeeDetails = {
    employeeName: employee.name,
    managerName,
  };

  if (leaveRequests.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      message: "No leave requests found.",
      leaveRequests: [],
    });
  }

  res.status(200).json({
    success: true,
    count: leaveRequests.length,
    leaveRequests: leaveRequests.map((leaveRequest) =>
      formatLeaveRequest(leaveRequest, employeeDetails),
    ),
  });
});

export const getLeaveRequestById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, leaveType } = req.query;
  const employeeId = req.user.employeeId;

  if (!employeeId) {
    return res.status(400).json({
      success: false,
      message: "Employee ID not found for the authenticated user.",
    });
  }

  const leaveRequest = await leaveRequestRepository.findByIdAndEmployeeId(
    id,
    employeeId,
    { status, leaveType },
  );

  if (!leaveRequest) {
    return res.status(404).json({
      success: false,
      message: "Leave request not found.",
    });
  }

  const employee = await userRepository.findByEmployeeId(employeeId);
  const employeeDetails = {
    employeeName: employee?.name ?? null,
    managerName: employee?.managerId?.name ?? null,
  };

  res.status(200).json({
    success: true,
    leaveRequest: formatLeaveRequest(leaveRequest, employeeDetails),
  });
});

export const updateLeaveRequestById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    leaveType,
    startDate,
    endDate,
    halfDay,
    halfDayPeriod,
    emergencyContactNo,
    location,
    reason,
    attachmentDoc,
  } = req.body;
  const employeeId = req.user.employeeId;

  if (!employeeId) {
    return res.status(400).json({
      success: false,
      message: "Employee ID not found for the authenticated user.",
    });
  }

  const existingLeaveRequest =
    await leaveRequestRepository.findByIdAndEmployeeId(id, employeeId);

  if (!existingLeaveRequest) {
    return res.status(404).json({
      success: false,
      message: "Leave request not found.",
    });
  }

  if (existingLeaveRequest.status !== LEAVE_REQUEST_STATUS.PENDING) {
    return res.status(400).json({
      success: false,
      message: "Only pending leave requests can be updated.",
    });
  }

  if (leaveType) {
    const leaveTypeValidation = await validateLeaveType(leaveType);
    if (!leaveTypeValidation.valid) {
      return res.status(400).json({
        success: false,
        message: leaveTypeValidation.message,
      });
    }
  }

  const nextStartDate = startDate ?? existingLeaveRequest.startDate;
  const nextEndDate = endDate ?? existingLeaveRequest.endDate;
  const dateValidation = validateDateRange(nextStartDate, nextEndDate);
  if (!dateValidation.valid) {
    return res.status(400).json({
      success: false,
      message: dateValidation.message,
    });
  }

  const dateAvailability = await validateLeaveDateAvailability({
    employeeId,
    startDate: nextStartDate,
    endDate: nextEndDate,
    excludeLeaveRequestId: existingLeaveRequest._id,
  });
  if (!dateAvailability.valid) {
    return res.status(400).json({
      success: false,
      message: dateAvailability.message,
    });
  }

  const updateData = {};
  if (leaveType !== undefined) updateData.leaveType = leaveType;
  if (startDate !== undefined) updateData.startDate = startDate;
  if (endDate !== undefined) updateData.endDate = endDate;
  if (halfDay !== undefined) updateData.halfDay = halfDay;
  if (halfDay !== undefined) {
    updateData.halfDayPeriod = halfDay ? halfDayPeriod : null;
  } else if (halfDayPeriod !== undefined) {
    updateData.halfDayPeriod = existingLeaveRequest.halfDay
      ? halfDayPeriod
      : null;
  }
  if (emergencyContactNo !== undefined) {
    updateData.emergencyContactNo = emergencyContactNo?.trim();
  }
  if (location !== undefined) updateData.location = location?.trim();
  if (reason !== undefined) updateData.reason = reason?.trim();
  if (attachmentDoc !== undefined) updateData.attachmentDoc = attachmentDoc?.trim();

  const updatedLeaveRequest =
    await leaveRequestRepository.updateByIdAndEmployeeId(
      id,
      employeeId,
      updateData,
    );

  res.status(200).json({
    success: true,
    message: "Leave request updated successfully.",
    leaveRequest: formatLeaveRequest(updatedLeaveRequest),
  });
});

export const deleteLeaveRequestById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const employeeId = req.user.employeeId;

  if (!employeeId) {
    return res.status(400).json({
      success: false,
      message: "Employee ID not found for the authenticated user.",
    });
  }

  const existingLeaveRequest =
    await leaveRequestRepository.findByIdAndEmployeeId(id, employeeId);

  if (!existingLeaveRequest) {
    return res.status(404).json({
      success: false,
      message: "Leave request not found.",
    });
  }

  if (existingLeaveRequest.status !== LEAVE_REQUEST_STATUS.PENDING) {
    return res.status(400).json({
      success: false,
      message: "Only pending leave requests can be deleted.",
    });
  }

  const deletedLeaveRequest =
    await leaveRequestRepository.deleteByIdAndEmployeeId(id, employeeId);

  res.status(200).json({
    success: true,
    message: "Leave request deleted successfully.",
  });
});

export const getAllLeaveRequests = asyncHandler(async (req, res) => {
  const { status, employeeName, startDate, endDate, sortOrder = "desc" } =
    req.query;

  let filteredEmployeeIds;

  if (req.leaveRequestScope === "team") {
    const teamMembers = await userRepository.findByManagerId(req.user?.id);
    const teamEmployeeIds = teamMembers
      .map((member) => member.employeeId)
      .filter(Boolean);

    if (teamEmployeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No employees are assigned to this manager.",
      });
    }

    if (employeeName) {
      const nameMatchedIds =
        await userRepository.findEmployeeIdsByName(employeeName);
      filteredEmployeeIds = teamEmployeeIds.filter((id) =>
        nameMatchedIds.includes(id),
      );

      if (filteredEmployeeIds.length === 0) {
        return res.status(200).json({
          success: true,
          count: 0,
          message: "No leave requests found.",
          leaveRequests: [],
        });
      }
    } else {
      filteredEmployeeIds = teamEmployeeIds;
    }
  } else if (employeeName) {
    filteredEmployeeIds = await userRepository.findEmployeeIdsByName(employeeName);
    if (filteredEmployeeIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        message: "No leave requests found.",
        leaveRequests: [],
      });
    }
  }

  const leaveRequests = await leaveRequestRepository.findAll({
    status,
    startDate,
    endDate,
    employeeIds: filteredEmployeeIds,
    sortOrder,
  });

  if (leaveRequests.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      message: "No leave requests found.",
      leaveRequests: [],
    });
  }

  const employeeIds = [
    ...new Set(leaveRequests.map((leaveRequest) => leaveRequest.employeeId)),
  ];
  const employees = await userRepository.findByEmployeeIds(employeeIds);

  const employeeDetailsMap = employees.reduce((map, employee) => {
    map.set(employee.employeeId, {
      employeeName: employee.name,
      managerName: employee.managerId?.name ?? null,
    });
    return map;
  }, new Map());

  res.status(200).json({
    success: true,
    count: leaveRequests.length,
    leaveRequests: leaveRequests.map((leaveRequest) =>
      formatLeaveRequest(
        leaveRequest,
        employeeDetailsMap.get(leaveRequest.employeeId) ?? {
          employeeName: null,
          managerName: null,
        },
      ),
    ),
  });
});