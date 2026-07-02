import asyncHandler from "../middleware/asyncHandler.js";
import holidayRepository from "../repository/holidayRepository.js";
import leaveRequestRepository from "../repository/leaveRequestRepository.js";
import userRepository from "../repository/userRepository.js";
import { calculateLeaveDays } from "../utils/leaveAllocationUtils.js";
import { ROLES } from "../config/constants.js";

const formatHoliday = (holiday) => {
  const doc = holiday.toObject ? holiday.toObject() : { ...holiday };
  const { _id, ...rest } = doc;
  return {
    ...rest,
    id: _id?.toString(),
  };
};

export const addHoliday = asyncHandler(async (req, res) => {
  const { holidayName, date, type } = req.body;

  const existingHoliday = await holidayRepository.findByNameAndDate(
    holidayName,
    date,
  );
  if (existingHoliday) {
    return res.status(400).json({
      success: false,
      message: "Holiday with this name and date already exists.",
    });
  }

  const holiday = await holidayRepository.createHoliday({
    holidayName: holidayName.trim(),
    date,
    type,
  });

  res.status(201).json({
    success: true,
    message: "Holiday added successfully.",
    holiday: formatHoliday(holiday),
  });
});

export const getAllHolidays = asyncHandler(async (req, res) => {
  const employeeId = req.user?.employeeId ?? req.query.employeeId;

  if (
    employeeId &&
    req.user?.employeeId &&
    req.user.employeeId !== employeeId
  ) {
    return res.status(403).json({
      success: false,
      message: "You can only view your own approved leaves.",
    });
  }

  const holidays = await holidayRepository.findAll();

  if (!employeeId) {
    if (holidays.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        message: "No holidays found.",
        holidays: [],
      });
    }

    return res.status(200).json({
      success: true,
      count: holidays.length,
      holidays: holidays.map(formatHoliday),
    });
  }

  const approvedLeaves =
    await leaveRequestRepository.findApprovedByEmployeeId(employeeId);

  if (holidays.length === 0 && approvedLeaves.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      message: "No holidays or approved leaves found.",
      holidays: [],
      approvedLeaves: [],
    });
  }

  res.status(200).json({
    success: true,
    count: holidays.length,
    holidays: holidays.map(formatHoliday),
    approvedLeavesCount: approvedLeaves.length,
    approvedLeaves: approvedLeaves.map((leave) => ({
      id: leave._id?.toString(),
      employeeId: leave.employeeId,
      startDate: leave.startDate,
      endDate: leave.endDate,
      type: leave.leaveType?.leaveName ?? null,
      status: leave.status,
      leaveDays: calculateLeaveDays({
        startDate: leave.startDate,
        endDate: leave.endDate,
        halfDay: leave.halfDay,
        holidays,
      }),
    })),
  });
});

export const getManagerHolidays = asyncHandler(async (req, res) => {
  const managerId = req.user?.id;
  const teamMembers = await userRepository.findByManagerId(managerId);

  if (teamMembers.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No employees are assigned to this manager.",
    });
  }

  const employeeIds = teamMembers
    .map((member) => member.employeeId)
    .filter(Boolean);

  const holidays = await holidayRepository.findAll();
  const approvedLeaves =
    await leaveRequestRepository.findApprovedByEmployeeIds(employeeIds);

  const employeeNameMap = teamMembers.reduce((map, member) => {
    map.set(member.employeeId, member.name);
    return map;
  }, new Map());

  return res.status(200).json({
    success: true,
    count: holidays.length,
    holidays: holidays.map(formatHoliday),
    approvedLeavesCount: approvedLeaves.length,
    approvedLeaves: approvedLeaves.map((leave) => ({
      id: leave._id?.toString(),
      employeeId: leave.employeeId,
      employeeName: employeeNameMap.get(leave.employeeId) ?? null,
      startDate: leave.startDate,
      endDate: leave.endDate,
      type: leave.leaveType?.leaveName ?? null,
      status: leave.status,
      leaveDays: calculateLeaveDays({
        startDate: leave.startDate,
        endDate: leave.endDate,
        halfDay: leave.halfDay,
        holidays,
      }),
    })),
  });
});

export const updateHolidayById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { holidayName, date, type } = req.body;

  const existingHoliday = await holidayRepository.findById(id);
  if (!existingHoliday) {
    return res.status(404).json({
      success: false,
      message: "Holiday not found.",
    });
  }

  const nextHolidayName = holidayName?.trim() ?? existingHoliday.holidayName;
  const nextDate = date ?? existingHoliday.date;

  if (
    (holidayName &&
      holidayName.trim().toLowerCase() !==
        existingHoliday.holidayName.toLowerCase()) ||
    date
  ) {
    const duplicateHoliday = await holidayRepository.findByNameAndDate(
      nextHolidayName,
      nextDate,
    );
    if (duplicateHoliday && duplicateHoliday._id.toString() !== id) {
      return res.status(400).json({
        success: false,
        message: "Holiday with this name and date already exists.",
      });
    }
  }

  const updateData = {};
  if (holidayName !== undefined) updateData.holidayName = holidayName.trim();
  if (date !== undefined) updateData.date = date;
  if (type !== undefined) updateData.type = type;

  const updatedHoliday = await holidayRepository.updateById(id, updateData);

  res.status(200).json({
    success: true,
    message: "Holiday updated successfully.",
    holiday: formatHoliday(updatedHoliday),
  });
});

export const deleteHolidayById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingHoliday = await holidayRepository.findById(id);
  if (!existingHoliday) {
    return res.status(404).json({
      success: false,
      message: "Holiday not found.",
    });
  }

  await holidayRepository.deleteById(id);

  res.status(200).json({
    success: true,
    message: "Holiday deleted successfully.",
  });
});
