import asyncHandler from "../middleware/asyncHandler.js";
import userRepository from "../repository/userRepository.js";
import leaveRequestRepository from "../repository/leaveRequestRepository.js";
import salaryRepository from "../repository/salaryRepository.js";
import bankDetailsRepository from "../repository/bankDetailsRepository.js";
import skillsRepository from "../repository/skillsRepository.js";
import { formatLeaveRequest } from "./leaveRequestController.js";
import { processLeaveRequestAction } from "../utils/leaveRequestActionService.js";
import {
  PAYROLL_TYPES,
  ROLES,
  USER_STATUS,
  LEAVE_APPROVED_BY,
} from "../config/constants.js";
import { encryptPasswordForStorage, decrypt } from "../utils/authUtils.js";
import { sendEmployeeWelcomeEmail } from "../utils/leaveRequestEmail.js";
import { isEmailNotificationEnabled } from "../utils/leaveSettingsUtils.js";

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

const formatSalary = (salary) => {
  if (!salary) {
    return null;
  }

  const doc = salary.toObject ? salary.toObject() : { ...salary };
  const { _id, ...rest } = doc;
  return {
    ...rest,
    id: _id?.toString(),
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

const buildSalaryPayload = (employeeId, salary) => ({
  employeeId,
  ctc: salary.ctc,
  basicSalary: salary.basicSalary,
  hra: salary.hra,
  specialAllowance: salary.specialAllowance,
  pf: salary.pf,
  professionalTax: salary.professionalTax,
  salaryEffectiveDate: salary.salaryEffectiveDate,
  payrollType: salary.payrollType || PAYROLL_TYPES.MONTHLY,
});

export const addEmployee = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    contactNo,
    joiningDate,
    designation,
    department,
    yearsOfExperience,
    employmentType,
    workLocation,
    managerId,
    salary,
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

  const plainPassword = decrypt(password);

  const employee = await userRepository.createUser({
    name,
    email,
    password: await encryptPasswordForStorage(plainPassword),
    contactNo,
    joiningDate,
    designation,
    department,
    yearsOfExperience,
    employmentType,
    workLocation,
    managerId: managerId || null,
    role: ROLES.EMPLOYEE,
    status: USER_STATUS.ACTIVE,
  });

  const createdSalary = await salaryRepository.createSalary(
    buildSalaryPayload(employee.employeeId, salary),
  );

  isEmailNotificationEnabled()
    .then((enabled) => {
      if (!enabled) {
        return null;
      }

      return sendEmployeeWelcomeEmail({
        to: employee.email,
        employeeName: employee.name,
        employeeId: employee.employeeId,
        password: plainPassword,
      });
    })
    .catch((error) => {
      console.error("Failed to send employee welcome email:", error);
    });

  res.status(201).json({
    success: true,
    message: "Employee added successfully.",
    employee: formatEmployee(employee),
    salary: formatSalary(createdSalary),
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

  const employeeIds = employees
    .map((employee) => employee.employeeId)
    .filter(Boolean);
  const salaries =
    await salaryRepository.findLatestByEmployeeIds(employeeIds);
  const salaryMap = salaries.reduce((map, salary) => {
    map.set(salary.employeeId, formatSalary(salary));
    return map;
  }, new Map());

  res.status(200).json({
    success: true,
    count: employees.length,
    employees: employees.map((employee) => ({
      ...formatEmployee(employee),
      salary: salaryMap.get(employee.employeeId) ?? null,
    })),
  });
});

export const updateEmployeeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    email,
    password,
    contactNo,
    joiningDate,
    designation,
    department,
    yearsOfExperience,
    employmentType,
    workLocation,
    managerId,
    salary,
  } = req.body;

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
  if (department !== undefined) updateData.department = department;
  if (yearsOfExperience !== undefined) {
    updateData.yearsOfExperience = yearsOfExperience;
  }
  if (employmentType !== undefined) updateData.employmentType = employmentType;
  if (workLocation !== undefined) updateData.workLocation = workLocation;
  if (managerId !== undefined) updateData.managerId = managerId || null;
  if (password) {
    updateData.password = await encryptPasswordForStorage(decrypt(password));
  }

  const updatedEmployee = await userRepository.updateById(id, updateData);

  let updatedSalary = null;
  if (salary) {
    updatedSalary = await salaryRepository.upsertLatestByEmployeeId(
      updatedEmployee.employeeId,
      buildSalaryPayload(updatedEmployee.employeeId, salary),
    );
  } else {
    updatedSalary = await salaryRepository.findLatestByEmployeeId(
      updatedEmployee.employeeId,
    );
  }

  res.status(200).json({
    success: true,
    message: "Employee updated successfully.",
    employee: formatEmployee(updatedEmployee),
    salary: formatSalary(updatedSalary),
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

  const employeeId = existingEmployee.employeeId;

  await Promise.all([
    userRepository.deleteById(id),
    employeeId
      ? salaryRepository.deleteByEmployeeId(employeeId)
      : Promise.resolve(),
    employeeId
      ? bankDetailsRepository.deleteByEmployeeId(employeeId)
      : Promise.resolve(),
    employeeId
      ? skillsRepository.deleteByEmployeeId(employeeId)
      : Promise.resolve(),
  ]);

  res.status(200).json({
    success: true,
    message: "Employee deleted successfully.",
  });
});

export const setEmployeeManager = asyncHandler(async (req, res) => {
  const excludeId = req.body?.id ?? req.query?.id;

  const employees = await userRepository.findEmployeesForManagerAssignment(
    ROLES.EMPLOYEE,
    { excludeId },
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

  if (req.leaveRequestScope === "team") {
    const teamMembers = await userRepository.findByManagerId(req.user?.id);
    const isTeamMember = teamMembers.some(
      (member) => member.employeeId === leaveRequest.employeeId,
    );

    if (!isTeamMember) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You can only act on leave requests from your team members.",
      });
    }
  }

  const approvedBy =
    req.leaveRequestScope === "team"
      ? LEAVE_APPROVED_BY.MANAGER
      : LEAVE_APPROVED_BY.ADMIN;

  const result = await processLeaveRequestAction({
    leaveRequestId: id,
    action,
    employeeId,
    leaveTypeId: leaveType,
    approvedBy,
  });

  if (!result.success) {
    return res.status(result.statusCode).json({
      success: false,
      message: result.message,
      ...(result.leaveBalance ? { leaveBalance: result.leaveBalance } : {}),
    });
  }

  return res.status(200).json({
    success: true,
    message: result.message,
    leaveRequest: formatLeaveRequest(result.leaveRequest),
    ...(result.leaveBalance
      ? { leaveBalance: formatLeaveBalance(result.leaveBalance) }
      : {}),
  });
});
