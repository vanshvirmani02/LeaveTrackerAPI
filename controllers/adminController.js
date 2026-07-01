import asyncHandler from "../middleware/asyncHandler.js";
import userRepository from "../repository/userRepository.js";
import leaveRequestRepository from "../repository/leaveRequestRepository.js";
import leaveTypeRepository from "../repository/leaveTypeRepository.js";
import leaveBalanceRepository from "../repository/leaveBalanceRepository.js";
import { formatLeaveRequest } from "./leaveRequestController.js";
import {
  ROLES,
  USER_STATUS,
  LEAVE_REQUEST_STATUS,
  LEAVE_REQUEST_ACTION,
} from "../config/constants.js";
import { encryptPasswordForStorage, decrypt } from "../utils/authUtils.js";

const formatEmployee = (user) => {
  const employee = user.toObject ? user.toObject() : { ...user };
  delete employee.password;
  const { _id, managerId, ...rest } = employee;

  let manager = null;
  if (managerId && typeof managerId === "object") {
    manager = {
      id: managerId._id?.toString(),
      name: managerId.name,
    };
  } else if (managerId) {
    manager = {
      id: managerId.toString(),
      name: null,
    };
  }

  return {
    ...rest,
    id: _id?.toString() ?? employee.id?.toString(),
    manager,
  };
};

const formatLeaveBalance = (leaveBalance) => {
  const doc = leaveBalance.toObject ? leaveBalance.toObject() : { ...leaveBalance };
  const { _id, leaveTypeId, ...rest } = doc;

  return {
    ...rest,
    id: _id?.toString(),
    leaveTypeId: leaveTypeId?.toString(),
  };
};

const getLeaveTypeId = (leaveType) => {
  if (!leaveType) {
    return null;
  }

  if (typeof leaveType === "object") {
    return leaveType._id?.toString() ?? leaveType.id?.toString();
  }

  return leaveType.toString();
};

export const addEmployee = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    contactNo,
    joiningDate,
    designation,
    managerId,
  } = req.body;
  const isAdmin = req.user.role === ROLES.ADMIN;
  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }

  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "Employee with this email already exists.",
    });
  }

  if (managerId) {
    const manager = await userRepository.findById(managerId);
    if (!manager) {
      return res.status(400).json({
        success: false,
        message: "Manager not found.",
      });
    }
  }

  const employee = await userRepository.createUser({
    name,
    email,
    password: await encryptPasswordForStorage(decrypt(password)),
    contactNo,
    joiningDate,
    designation,
    managerId: managerId || null,
    role: ROLES.EMPLOYEE,
    status: USER_STATUS.ACTIVE,
  });

  res.status(201).json({
    success: true,
    message: "Employee added successfully.",
    employee: formatEmployee(employee),
  });
});

export const getAllEmployees = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === ROLES.ADMIN;
  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }

  const { managerId, managerName } = req.query;

  const employees = await userRepository.findAllByRole(ROLES.EMPLOYEE, {
    managerId,
    managerName,
  });

  if (employees.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      message: "No employees found.",
      employees: [],
    });
  }

  res.status(200).json({
    success: true,
    count: employees.length,
    employees: employees.map(formatEmployee),
  });
});

export const updateEmployeeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, password, contactNo, joiningDate, designation, managerId } =
    req.body;

  const isAdmin = req.user.role === ROLES.ADMIN;
  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }

  const existingEmployee = await userRepository.findByIdAndRole(id, ROLES.EMPLOYEE);
  if (!existingEmployee) {
    return res.status(404).json({
      success: false,
      message: "Employee not found.",
    });
  }

  if (email && email !== existingEmployee.email) {
    const emailTaken = await userRepository.findByEmail(email);
    if (emailTaken) {
      return res.status(400).json({
        success: false,
        message: "Employee with this email already exists.",
      });
    }
  }

  if (managerId) {
    const manager = await userRepository.findById(managerId);
    if (!manager) {
      return res.status(400).json({
        success: false,
        message: "Manager not found.",
      });
    }
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (contactNo !== undefined) updateData.contactNo = contactNo;
  if (joiningDate !== undefined) updateData.joiningDate = joiningDate;
  if (designation !== undefined) updateData.designation = designation;
  if (managerId !== undefined) updateData.managerId = managerId || null;
  if (password) {
    updateData.password = await encryptPasswordForStorage(decrypt(password));
  }

  const updatedEmployee = await userRepository.updateById(id, updateData);

  res.status(200).json({
    success: true,
    message: "Employee updated successfully.",
    employee: formatEmployee(updatedEmployee),
  });
});

export const deleteEmployeeById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const isAdmin = req.user.role === ROLES.ADMIN;
  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }

  const existingEmployee = await userRepository.findByIdAndRole(id, ROLES.EMPLOYEE);
  if (!existingEmployee) {
    return res.status(404).json({
      success: false,
      message: "Employee not found.",
    });
  }

  await userRepository.deleteById(id);

  res.status(200).json({
    success: true,
    message: "Employee deleted successfully.",
  });
});

export const setEmployeeManager = asyncHandler(async (req, res) => {
  const employees = await userRepository.findEmployeesForManagerAssignment(
    ROLES.EMPLOYEE,
  );

  if (employees.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      message: "No employees found.",
      employees: [],
    });
  }

  res.status(200).json({
    success: true,
    count: employees.length,
    employees: employees.map(({ _id, name, employeeId }) => ({
      _id,
      name,
      employeeId,
    })),
  });
});

export const actionLeaveRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, employeeId, leaveType } = req.body;

  const leaveRequest = await leaveRequestRepository.findById(id);
  if (!leaveRequest) {
    return res.status(404).json({
      success: false,
      message: "Leave request not found.",
    });
  }

  if (leaveRequest.status !== LEAVE_REQUEST_STATUS.PENDING) {
    return res.status(400).json({
      success: false,
      message: "Only pending leave requests can be approved or rejected.",
    });
  }

  if (leaveRequest.employeeId !== employeeId) {
    return res.status(400).json({
      success: false,
      message: "Employee ID does not match the leave request.",
    });
  }

  if (getLeaveTypeId(leaveRequest.leaveType) !== leaveType) {
    return res.status(400).json({
      success: false,
      message: "Leave type does not match the leave request.",
    });
  }

  if (action === LEAVE_REQUEST_ACTION.REJECT) {
    const updatedLeaveRequest = await leaveRequestRepository.updateStatusById(
      id,
      LEAVE_REQUEST_STATUS.REJECTED,
    );

    return res.status(200).json({
      success: true,
      message: "Leave request rejected successfully.",
      leaveRequest: formatLeaveRequest(updatedLeaveRequest),
    });
  }

  const leaveTypeDoc = await leaveTypeRepository.findById(leaveType);
  if (!leaveTypeDoc) {
    return res.status(404).json({
      success: false,
      message: "Leave type not found.",
    });
  }

  const updatedLeaveRequest = await leaveRequestRepository.updateStatusById(
    id,
    LEAVE_REQUEST_STATUS.APPROVED,
  );

  const leaveBalance = await leaveBalanceRepository.upsertOnApprove({
    employeeId,
    leaveTypeId: leaveType,
    allocatedLeaves: leaveTypeDoc.annualQuota,
  });

  return res.status(200).json({
    success: true,
    message: "Leave request approved successfully.",
    leaveRequest: formatLeaveRequest(updatedLeaveRequest),
    leaveBalance: formatLeaveBalance(leaveBalance),
  });
});

