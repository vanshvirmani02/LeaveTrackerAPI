import asyncHandler from "../middleware/asyncHandler.js";
import bankDetailsRepository from "../repository/bankDetailsRepository.js";

const formatBankDetails = (bankDetails) => {
  if (!bankDetails) {
    return null;
  }

  const doc = bankDetails.toObject ? bankDetails.toObject() : { ...bankDetails };
  const { _id, ...rest } = doc;
  return {
    ...rest,
    id: _id?.toString(),
  };
};

const getAuthenticatedEmployeeId = (req, res) => {
  const employeeId = req.user?.employeeId;
  if (!employeeId) {
    res.status(400).json({
      success: false,
      message: "Employee ID not found for the authenticated user.",
    });
    return null;
  }
  return employeeId;
};

export const addBankDetails = asyncHandler(async (req, res) => {
  const employeeId = getAuthenticatedEmployeeId(req, res);
  if (!employeeId) {
    return;
  }

  const existing = await bankDetailsRepository.findByEmployeeId(employeeId);
  if (existing) {
    return res.status(400).json({
      success: false,
      message: "Bank details already exist. Use update instead.",
    });
  }

  const {
    accountHolderName,
    bankName,
    accountNumber,
    ifscCode,
    branch,
    upiId,
  } = req.body;

  const bankDetails = await bankDetailsRepository.create({
    employeeId,
    accountHolderName: accountHolderName.trim(),
    bankName: bankName.trim(),
    accountNumber: accountNumber.trim(),
    ifscCode: ifscCode.trim().toUpperCase(),
    branch: branch.trim(),
    upiId: upiId?.trim() || null,
  });

  return res.status(201).json({
    success: true,
    message: "Bank details added successfully.",
    bankDetails: formatBankDetails(bankDetails),
  });
});

export const getBankDetails = asyncHandler(async (req, res) => {
  const employeeId = getAuthenticatedEmployeeId(req, res);
  if (!employeeId) {
    return;
  }

  const bankDetails = await bankDetailsRepository.findByEmployeeId(employeeId);
  if (!bankDetails) {
    return res.status(404).json({
      success: false,
      message: "Bank details not found.",
    });
  }

  return res.status(200).json({
    success: true,
    bankDetails: formatBankDetails(bankDetails),
  });
});

export const updateBankDetails = asyncHandler(async (req, res) => {
  const employeeId = getAuthenticatedEmployeeId(req, res);
  if (!employeeId) {
    return;
  }

  const existing = await bankDetailsRepository.findByEmployeeId(employeeId);
  if (!existing) {
    return res.status(404).json({
      success: false,
      message: "Bank details not found.",
    });
  }

  const {
    accountHolderName,
    bankName,
    accountNumber,
    ifscCode,
    branch,
    upiId,
  } = req.body;

  const updateData = {};
  if (accountHolderName !== undefined) {
    updateData.accountHolderName = accountHolderName.trim();
  }
  if (bankName !== undefined) updateData.bankName = bankName.trim();
  if (accountNumber !== undefined) {
    updateData.accountNumber = accountNumber.trim();
  }
  if (ifscCode !== undefined) {
    updateData.ifscCode = ifscCode.trim().toUpperCase();
  }
  if (branch !== undefined) updateData.branch = branch.trim();
  if (upiId !== undefined) updateData.upiId = upiId?.trim() || null;

  const updated = await bankDetailsRepository.updateByEmployeeId(
    employeeId,
    updateData,
  );

  return res.status(200).json({
    success: true,
    message: "Bank details updated successfully.",
    bankDetails: formatBankDetails(updated),
  });
});

export const deleteBankDetails = asyncHandler(async (req, res) => {
  const employeeId = getAuthenticatedEmployeeId(req, res);
  if (!employeeId) {
    return;
  }

  const deleted = await bankDetailsRepository.deleteByEmployeeId(employeeId);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: "Bank details not found.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Bank details deleted successfully.",
  });
});
