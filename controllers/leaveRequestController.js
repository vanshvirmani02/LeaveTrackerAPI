import asyncHandler from "../middleware/asyncHandler.js";
import leaveRequestRepository from "../repository/leaveRequestRepository.js";
import leaveTypeRepository from "../repository/leaveTypeRepository.js";
import userRepository from "../repository/userRepository.js";
import { LEAVE_TYPE_STATUS, LEAVE_REQUEST_STATUS } from "../config/constants.js";

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

export const createLeaveRequest = asyncHandler(async (req, res) => {
  const { leaveType, startDate, endDate, halfDay, reason, attachmentDoc } =
    req.body;
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

  res.status(201).json({
    success: true,
    message: "Leave request created successfully.",
    leaveRequest: formatLeaveRequest(populatedLeaveRequest),
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
  const { leaveType, startDate, endDate, halfDay, reason, attachmentDoc } =
    req.body;
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

  const updateData = {};
  if (leaveType !== undefined) updateData.leaveType = leaveType;
  if (startDate !== undefined) updateData.startDate = startDate;
  if (endDate !== undefined) updateData.endDate = endDate;
  if (halfDay !== undefined) updateData.halfDay = halfDay;
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
