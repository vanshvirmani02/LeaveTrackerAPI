import asyncHandler from "../middleware/asyncHandler.js";
import holidayRepository from "../repository/holidayRepository.js";

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
  const holidays = await holidayRepository.findAll();

  if (holidays.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      message: "No holidays found.",
      holidays: [],
    });
  }

  res.status(200).json({
    success: true,
    count: holidays.length,
    holidays: holidays.map(formatHoliday),
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
