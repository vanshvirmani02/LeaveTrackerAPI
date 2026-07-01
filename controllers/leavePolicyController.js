import asyncHandler from "../middleware/asyncHandler.js";
import leavePolicyRepository from "../repository/leavePolicyRepository.js";
import leaveTypeRepository from "../repository/leaveTypeRepository.js";

const formatLeavePolicy = (leavePolicy) => {
  const doc = leavePolicy.toObject ? leavePolicy.toObject() : { ...leavePolicy };
  const { _id, leaveTypeIds, ...rest } = doc;
  return {
    ...rest,
    id: _id?.toString(),
    leaveTypeIds: (leaveTypeIds || []).map(
      (leaveTypeId) => leaveTypeId?._id?.toString() ?? leaveTypeId?.toString(),
    ),
  };
};

const validateLeaveTypeIds = async (leaveTypeIds) => {
  const uniqueIds = [...new Set(leaveTypeIds)];
  const leaveTypes = await leaveTypeRepository.findByIds(uniqueIds);

  if (leaveTypes.length !== uniqueIds.length) {
    return {
      valid: false,
      message: "One or more leave types not found.",
    };
  }

  return { valid: true, leaveTypeIds: uniqueIds };
};

export const addLeavePolicy = asyncHandler(async (req, res) => {
  const {
    policyName,
    leaveTypeIds,
    accrualRules,
    carryForwardRules,
    probationRules,
  } = req.body;

  const leaveTypeValidation = await validateLeaveTypeIds(leaveTypeIds);
  if (!leaveTypeValidation.valid) {
    return res.status(400).json({
      success: false,
      message: leaveTypeValidation.message,
    });
  }

  const existingLeavePolicy = await leavePolicyRepository.findByName(policyName);
  if (existingLeavePolicy) {
    return res.status(400).json({
      success: false,
      message: "Leave policy with this name already exists.",
    });
  }

  const leavePolicy = await leavePolicyRepository.createLeavePolicy({
    policyName: policyName.trim(),
    leaveTypeIds: leaveTypeValidation.leaveTypeIds,
    accrualRules,
    carryForwardRules,
    probationRules,
  });

  res.status(201).json({
    success: true,
    message: "Leave policy added successfully.",
    leavePolicy: formatLeavePolicy(leavePolicy),
  });
});

export const getAllLeavePolicies = asyncHandler(async (req, res) => {
  const leavePolicies = await leavePolicyRepository.findAll();

  if (leavePolicies.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      message: "No leave policies found.",
      leavePolicies: [],
    });
  }

  res.status(200).json({
    success: true,
    count: leavePolicies.length,
    leavePolicies: leavePolicies.map(formatLeavePolicy),
  });
});

export const updateLeavePolicyById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    policyName,
    leaveTypeIds,
    accrualRules,
    carryForwardRules,
    probationRules,
  } = req.body;

  const existingLeavePolicy = await leavePolicyRepository.findById(id);
  if (!existingLeavePolicy) {
    return res.status(404).json({
      success: false,
      message: "Leave policy not found.",
    });
  }

  let validatedLeaveTypeIds;
  if (leaveTypeIds !== undefined) {
    const leaveTypeValidation = await validateLeaveTypeIds(leaveTypeIds);
    if (!leaveTypeValidation.valid) {
      return res.status(400).json({
        success: false,
        message: leaveTypeValidation.message,
      });
    }
    validatedLeaveTypeIds = leaveTypeValidation.leaveTypeIds;
  }

  if (
    policyName &&
    policyName.trim().toLowerCase() !== existingLeavePolicy.policyName.toLowerCase()
  ) {
    const nameTaken = await leavePolicyRepository.findByName(policyName);
    if (nameTaken) {
      return res.status(400).json({
        success: false,
        message: "Leave policy with this name already exists.",
      });
    }
  }

  const updateData = {};
  if (policyName !== undefined) updateData.policyName = policyName.trim();
  if (leaveTypeIds !== undefined) updateData.leaveTypeIds = validatedLeaveTypeIds;
  if (accrualRules !== undefined) updateData.accrualRules = accrualRules;
  if (carryForwardRules !== undefined) updateData.carryForwardRules = carryForwardRules;
  if (probationRules !== undefined) updateData.probationRules = probationRules;

  const updatedLeavePolicy = await leavePolicyRepository.updateById(id, updateData);

  res.status(200).json({
    success: true,
    message: "Leave policy updated successfully.",
    leavePolicy: formatLeavePolicy(updatedLeavePolicy),
  });
});

export const deleteLeavePolicyById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingLeavePolicy = await leavePolicyRepository.findById(id);
  if (!existingLeavePolicy) {
    return res.status(404).json({
      success: false,
      message: "Leave policy not found.",
    });
  }

  await leavePolicyRepository.deleteById(id);

  res.status(200).json({
    success: true,
    message: "Leave policy deleted successfully.",
  });
});
