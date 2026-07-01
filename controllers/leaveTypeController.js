import asyncHandler from "../middleware/asyncHandler.js";
import leaveTypeRepository from "../repository/leaveTypeRepository.js";

const formatLeaveType = (leaveType) => {
  const doc = leaveType.toObject ? leaveType.toObject() : { ...leaveType };
  const { _id, ...rest } = doc;
  return {
    ...rest,
    id: _id?.toString(),
  };
};

export const addLeaveType = asyncHandler(async (req, res) => {
  const {
    leaveName,
    annualQuota,
    accrualType,
    carryForward,
    maxCarryForward,
    encashment,
    status,
  } = req.body;

  const existingLeaveType = await leaveTypeRepository.findByName(leaveName);
  if (existingLeaveType) {
    return res.status(400).json({
      success: false,
      message: "Leave type with this name already exists.",
    });
  }

  const leaveType = await leaveTypeRepository.createLeaveType({
    leaveName: leaveName.trim(),
    annualQuota,
    accrualType,
    carryForward,
    maxCarryForward,
    encashment,
    status,
  });

  res.status(201).json({
    success: true,
    message: "Leave type added successfully.",
    leaveType: formatLeaveType(leaveType),
  });
});

export const getAllLeaveTypes = asyncHandler(async (req, res) => {
  const leaveTypes = await leaveTypeRepository.findAll();

  if (leaveTypes.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      message: "No leave types found.",
      leaveTypes: [],
    });
  }

  res.status(200).json({
    success: true,
    count: leaveTypes.length,
    leaveTypes: leaveTypes.map(formatLeaveType),
  });
});

export const updateLeaveTypeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    leaveName,
    annualQuota,
    accrualType,
    carryForward,
    maxCarryForward,
    encashment,
    status,
  } = req.body;

  const existingLeaveType = await leaveTypeRepository.findById(id);
  if (!existingLeaveType) {
    return res.status(404).json({
      success: false,
      message: "Leave type not found.",
    });
  }

  if (leaveName && leaveName.trim().toLowerCase() !== existingLeaveType.leaveName.toLowerCase()) {
    const nameTaken = await leaveTypeRepository.findByName(leaveName);
    if (nameTaken) {
      return res.status(400).json({
        success: false,
        message: "Leave type with this name already exists.",
      });
    }
  }

  const updateData = {};
  if (leaveName !== undefined) updateData.leaveName = leaveName.trim();
  if (annualQuota !== undefined) updateData.annualQuota = annualQuota;
  if (accrualType !== undefined) updateData.accrualType = accrualType;
  if (carryForward !== undefined) updateData.carryForward = carryForward;
  if (maxCarryForward !== undefined) updateData.maxCarryForward = maxCarryForward;
  if (encashment !== undefined) updateData.encashment = encashment;
  if (status !== undefined) updateData.status = status;

  const updatedLeaveType = await leaveTypeRepository.updateById(id, updateData);

  res.status(200).json({
    success: true,
    message: "Leave type updated successfully.",
    leaveType: formatLeaveType(updatedLeaveType),
  });
});

export const deleteLeaveTypeById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingLeaveType = await leaveTypeRepository.findById(id);
  if (!existingLeaveType) {
    return res.status(404).json({
      success: false,
      message: "Leave type not found.",
    });
  }

  await leaveTypeRepository.deleteById(id);

  res.status(200).json({
    success: true,
    message: "Leave type deleted successfully.",
  });
});
