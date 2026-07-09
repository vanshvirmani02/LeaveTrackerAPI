import asyncHandler from "../middleware/asyncHandler.js";
import leaveTypeRepository from "../repository/leaveTypeRepository.js";
import leaveBalanceRepository from "../repository/leaveBalanceRepository.js";
import userRepository from "../repository/userRepository.js";
import { LEAVE_TYPE_STATUS, ROLES } from "../config/constants.js";
import { calculateAllocatedLeaves } from "../utils/leaveAllocationUtils.js";

const formatLeaveType = (leaveType) => {
  const doc = leaveType.toObject ? leaveType.toObject() : { ...leaveType };
  const { _id, ...rest } = doc;
  return {
    ...rest,
    id: _id?.toString(),
  };
};

const buildEmployeeLeaveBalance = async (employeeId) => {
  const employee = await userRepository.findByEmployeeId(employeeId);
  if (!employee) {
    return [];
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

  return allLeaveTypes
    .filter((leaveType) => leaveType.status === LEAVE_TYPE_STATUS.ACTIVE)
    .map((leaveType) => {
      const leaveTypeId = leaveType._id.toString();
      const balance = balanceByLeaveTypeId.get(leaveTypeId);

      return {
        leaveTypeName: leaveType.leaveName,
        allocatedLeaves:
          balance?.allocatedLeaves ??
          calculateAllocatedLeaves({
            annualQuota: leaveType.annualQuota,
            accrualType: leaveType.accrualType,
            joiningDate: employee.joiningDate,
          }),
        consumedLeaves: balance?.consumedLeaves ?? 0,
      };
    });
};

export const addLeaveType = asyncHandler(async (req, res) => {
  const {
    leaveName,
    policyName,
    annualQuota,
    accrualType,
    carryForward,
    maxCarryForward,
    encashment,
    accrualRules,
    carryForwardRules,
    probationRules,
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
    policyName: policyName.trim(),
    annualQuota,
    accrualType,
    carryForward,
    maxCarryForward,
    encashment,
    accrualRules: accrualRules?.trim(),
    carryForwardRules: carryForwardRules?.trim(),
    probationRules: probationRules?.trim(),
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
    const response = {
      success: true,
      count: 0,
      message: "No leave types found.",
      leaveTypes: [],
    };

    if (req.user?.role === ROLES.EMPLOYEE && req.user?.employeeId) {
      response.leaveBalance = [];
    }

    return res.status(200).json(response);
  }

  const response = {
    success: true,
    count: leaveTypes.length,
    leaveTypes: leaveTypes.map(formatLeaveType),
  };

  if (req.user?.role === ROLES.EMPLOYEE && req.user?.employeeId) {
    response.leaveBalance = await buildEmployeeLeaveBalance(req.user.employeeId);
  }

  res.status(200).json(response);
});

export const updateLeaveTypeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    leaveName,
    policyName,
    annualQuota,
    accrualType,
    carryForward,
    maxCarryForward,
    encashment,
    accrualRules,
    carryForwardRules,
    probationRules,
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
  if (policyName !== undefined) updateData.policyName = policyName.trim();
  if (annualQuota !== undefined) updateData.annualQuota = annualQuota;
  if (accrualType !== undefined) updateData.accrualType = accrualType;
  if (carryForward !== undefined) updateData.carryForward = carryForward;
  if (maxCarryForward !== undefined) updateData.maxCarryForward = maxCarryForward;
  if (encashment !== undefined) updateData.encashment = encashment;
  if (accrualRules !== undefined) updateData.accrualRules = accrualRules.trim();
  if (carryForwardRules !== undefined)
    updateData.carryForwardRules = carryForwardRules.trim();
  if (probationRules !== undefined) updateData.probationRules = probationRules.trim();
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
