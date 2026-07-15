import asyncHandler from "../middleware/asyncHandler.js";
import {
  PAYROLL_ACTION,
  PAYROLL_STATUS,
} from "../config/constants.js";
import adminSettingsRepository from "../repository/adminSettingsRepository.js";
import bankDetailsRepository from "../repository/bankDetailsRepository.js";
import holidayRepository from "../repository/holidayRepository.js";
import leaveRequestRepository from "../repository/leaveRequestRepository.js";
import payrollRepository from "../repository/payrollRepository.js";
import salaryRepository from "../repository/salaryRepository.js";
import userRepository from "../repository/userRepository.js";
import {
  calculateGrossSalary,
  calculateLeaveDeduction,
  calculatePayrollSummary,
  parseMonthYear,
} from "../utils/payrollUtils.js";
import { buildSalarySlipPdf } from "../utils/salarySlipPdfUtils.js";
import { sendPayrollApprovedEmail } from "../utils/leaveRequestEmail.js";
import { isEmailNotificationEnabled } from "../utils/leaveSettingsUtils.js";

const normalizeStatusFilter = (status) => {
  if (!status || String(status).toUpperCase() === "ALL") {
    return null;
  }

  const normalized = String(status).toUpperCase();
  if (normalized === "APPROVE") {
    return PAYROLL_STATUS.APPROVED;
  }

  return normalized;
};

const formatEmployeeSalary = (entry) => {
  const doc = entry.toObject ? entry.toObject() : { ...entry };
  const { _id, ...rest } = doc;
  const grossSalary = Number(rest.grossSalary) || 0;
  const deduction = Number(rest.deduction) || 0;
  const bonus = Number(rest.bonus) || 0;
  return {
    ...rest,
    id: _id?.toString(),
    netSalary: Math.round((grossSalary - deduction + bonus + Number.EPSILON) * 100) / 100,
  };
};

const formatPayroll = (payroll, { statusFilter = null, employeeMap = null } = {}) => {
  const doc = payroll.toObject ? payroll.toObject() : { ...payroll };
  const { _id, employeeSalary = [], ...rest } = doc;

  let entries = employeeSalary;
  if (statusFilter) {
    entries = entries.filter((entry) => entry.status === statusFilter);
  }

  const formattedEntries = entries.map((entry) => {
    const formatted = formatEmployeeSalary(entry);
    if (employeeMap) {
      const employee = employeeMap.get(formatted.employeeId);
      if (employee) {
        formatted.employeeName = employee.name;
        formatted.designation = employee.designation ?? null;
        formatted.department = employee.department ?? null;
      }
    }
    return formatted;
  });

  return {
    ...rest,
    id: _id?.toString(),
    employeeSalary: formattedEntries,
    summary: calculatePayrollSummary(employeeSalary),
  };
};

export const generatePayroll = asyncHandler(async (req, res) => {
  const { monthYear } = req.body;
  const parsed = parseMonthYear(monthYear);

  if (!parsed) {
    return res.status(400).json({
      success: false,
      message: "Invalid monthYear. Expected format YYYY-MM.",
    });
  }

  const existing = await payrollRepository.findByMonthYear(monthYear);
  if (existing) {
    return res.status(400).json({
      success: false,
      message: `Payroll for ${monthYear} already exists.`,
    });
  }

  const activeEmployees = await userRepository.findActiveEmployees();
  if (!activeEmployees.length) {
    return res.status(400).json({
      success: false,
      message: "No active employees found to generate payroll.",
    });
  }

  const employeeIds = activeEmployees
    .map((employee) => employee.employeeId)
    .filter(Boolean);

  const [salaries, holidays, approvedLeaves] = await Promise.all([
    salaryRepository.findLatestByEmployeeIds(employeeIds),
    holidayRepository.findBetweenDates(parsed.monthStart, parsed.monthEnd),
    leaveRequestRepository.findApprovedOverlappingRange(
      employeeIds,
      parsed.monthStart,
      parsed.monthEnd,
    ),
  ]);

  const salaryMap = new Map(
    salaries.map((salary) => [salary.employeeId, salary]),
  );
  const leavesByEmployee = new Map();
  for (const leave of approvedLeaves) {
    const list = leavesByEmployee.get(leave.employeeId) || [];
    list.push(leave);
    leavesByEmployee.set(leave.employeeId, list);
  }

  const employeeSalary = employeeIds.map((employeeId) => {
    const grossSalary = calculateGrossSalary(salaryMap.get(employeeId));
    const deduction = calculateLeaveDeduction({
      grossSalary,
      daysInMonth: parsed.daysInMonth,
      leaves: leavesByEmployee.get(employeeId) || [],
      holidays,
      monthStart: parsed.monthStart,
      monthEnd: parsed.monthEnd,
    });

    return {
      employeeId,
      grossSalary,
      deduction,
      status: PAYROLL_STATUS.DRAFT,
      bonus: 0,
      reason: null,
    };
  });

  const payroll = await payrollRepository.createPayroll({
    monthYear,
    employeeSalary,
  });

  const employeeMap = new Map(
    activeEmployees.map((employee) => [employee.employeeId, employee]),
  );

  return res.status(201).json({
    success: true,
    message: `Payroll generated successfully for ${monthYear}.`,
    payroll: formatPayroll(payroll, { employeeMap }),
  });
});

export const getPayroll = asyncHandler(async (req, res) => {
  const { monthYear, status } = req.query;
  const parsed = parseMonthYear(monthYear);

  if (!parsed) {
    return res.status(400).json({
      success: false,
      message: "Invalid monthYear. Expected format YYYY-MM.",
    });
  }

  const statusFilter = normalizeStatusFilter(status);
  if (
    statusFilter &&
    !Object.values(PAYROLL_STATUS).includes(statusFilter)
  ) {
    return res.status(400).json({
      success: false,
      message: `Status must be one of: ALL, ${Object.values(PAYROLL_STATUS).join(", ")}.`,
    });
  }

  const payroll = await payrollRepository.findByMonthYear(monthYear);
  if (!payroll) {
    return res.status(404).json({
      success: false,
      message: `Payroll for ${monthYear} not found.`,
    });
  }

  const employeeIds = payroll.employeeSalary.map((entry) => entry.employeeId);
  const employees = await userRepository.findByEmployeeIds(employeeIds);
  const employeeMap = new Map(
    employees.map((employee) => [employee.employeeId, employee]),
  );

  return res.status(200).json({
    success: true,
    payroll: formatPayroll(payroll, { statusFilter, employeeMap }),
  });
});

export const editPayrollEntry = asyncHandler(async (req, res) => {
  const { monthYear, employeeId } = req.params;
  const { grossSalary, deduction, bonus } = req.body;

  const payroll = await payrollRepository.findByMonthYear(monthYear);
  if (!payroll) {
    return res.status(404).json({
      success: false,
      message: `Payroll for ${monthYear} not found.`,
    });
  }

  const entry = payroll.employeeSalary.find(
    (item) => item.employeeId === employeeId,
  );
  if (!entry) {
    return res.status(404).json({
      success: false,
      message: "Employee salary entry not found in this payroll.",
    });
  }

  if (entry.status !== PAYROLL_STATUS.DRAFT) {
    return res.status(400).json({
      success: false,
      message: "Only draft payroll entries can be edited.",
    });
  }

  const entryUpdate = {};
  if (grossSalary !== undefined) entryUpdate.grossSalary = grossSalary;
  if (deduction !== undefined) entryUpdate.deduction = deduction;
  if (bonus !== undefined) entryUpdate.bonus = bonus;

  if (!Object.keys(entryUpdate).length) {
    return res.status(400).json({
      success: false,
      message: "Provide at least one of grossSalary, deduction, or bonus.",
    });
  }

  const updated = await payrollRepository.updateEmployeeSalaryEntry(
    monthYear,
    employeeId,
    entryUpdate,
  );

  const updatedEntry = updated.employeeSalary.find(
    (item) => item.employeeId === employeeId,
  );

  return res.status(200).json({
    success: true,
    message: "Payroll entry updated successfully.",
    employeeSalary: formatEmployeeSalary(updatedEntry),
    summary: calculatePayrollSummary(updated.employeeSalary),
  });
});

export const actionPayrollEntry = asyncHandler(async (req, res) => {
  const { monthYear, employeeId } = req.params;
  const { action, reason } = req.body;

  const payroll = await payrollRepository.findByMonthYear(monthYear);
  if (!payroll) {
    return res.status(404).json({
      success: false,
      message: `Payroll for ${monthYear} not found.`,
    });
  }

  const entry = payroll.employeeSalary.find(
    (item) => item.employeeId === employeeId,
  );
  if (!entry) {
    return res.status(404).json({
      success: false,
      message: "Employee salary entry not found in this payroll.",
    });
  }

  if (entry.status !== PAYROLL_STATUS.DRAFT) {
    return res.status(400).json({
      success: false,
      message: `Payroll entry is already ${entry.status.toLowerCase()}.`,
    });
  }

  const nextStatus =
    action === PAYROLL_ACTION.APPROVE
      ? PAYROLL_STATUS.APPROVED
      : PAYROLL_STATUS.REJECTED;

  if (action === PAYROLL_ACTION.REJECT && !String(reason || "").trim()) {
    return res.status(400).json({
      success: false,
      message: "Reason is required when rejecting a payroll entry.",
    });
  }

  const updated = await payrollRepository.updateEmployeeSalaryEntry(
    monthYear,
    employeeId,
    {
      status: nextStatus,
      reason: reason?.trim() || null,
    },
  );

  const updatedEntry = updated.employeeSalary.find(
    (item) => item.employeeId === employeeId,
  );

  if (nextStatus === PAYROLL_STATUS.APPROVED) {
    Promise.all([
      isEmailNotificationEnabled(),
      userRepository.findByEmployeeId(employeeId),
    ])
      .then(([enabled, employee]) => {
        if (!enabled || !employee?.email) {
          return null;
        }

        return sendPayrollApprovedEmail({
          to: employee.email,
          employeeName: employee.name,
          monthYear,
        });
      })
      .catch((error) => {
        console.error("Failed to send payroll approved email:", error);
      });
  }

  return res.status(200).json({
    success: true,
    message: `Payroll entry ${nextStatus.toLowerCase()} successfully.`,
    employeeSalary: formatEmployeeSalary(updatedEntry),
    summary: calculatePayrollSummary(updated.employeeSalary),
  });
});

const getApprovedEmployeePayrollEntry = async (employeeId, monthYear) => {
  const parsed = parseMonthYear(monthYear);
  if (!parsed) {
    return {
      error: {
        statusCode: 400,
        message: "Invalid monthYear. Expected format YYYY-MM.",
      },
    };
  }

  const payroll = await payrollRepository.findApprovedEntryByEmployee(
    monthYear,
    employeeId,
    PAYROLL_STATUS.APPROVED,
  );

  const entry = payroll?.employeeSalary?.[0];
  if (!entry) {
    return {
      error: {
        statusCode: 404,
        message:
          "Approved payroll not found for this month. It may still be pending or was rejected.",
      },
    };
  }

  return { payroll, entry };
};

export const getMyPayroll = asyncHandler(async (req, res) => {
  const employeeId = req.user?.employeeId;
  const { monthYear } = req.query;

  if (!employeeId) {
    return res.status(400).json({
      success: false,
      message: "Employee ID not found for the logged-in user.",
    });
  }

  const result = await getApprovedEmployeePayrollEntry(employeeId, monthYear);
  if (result.error) {
    return res.status(result.error.statusCode).json({
      success: false,
      message: result.error.message,
    });
  }

  const employee = await userRepository.findByEmployeeId(employeeId);
  const formatted = formatEmployeeSalary(result.entry);

  return res.status(200).json({
    success: true,
    monthYear: result.payroll.monthYear,
    payroll: {
      ...formatted,
      employeeName: employee?.name ?? null,
      designation: employee?.designation ?? null,
      department: employee?.department ?? null,
    },
  });
});

export const downloadMySalarySlip = asyncHandler(async (req, res) => {
  const employeeId = req.user?.employeeId;
  const { monthYear } = req.query;

  if (!employeeId) {
    return res.status(400).json({
      success: false,
      message: "Employee ID not found for the logged-in user.",
    });
  }

  const result = await getApprovedEmployeePayrollEntry(employeeId, monthYear);
  if (result.error) {
    return res.status(result.error.statusCode).json({
      success: false,
      message: result.error.message,
    });
  }

  const [employee, bankDetails, adminSettingsList] = await Promise.all([
    userRepository.findByEmployeeId(employeeId),
    bankDetailsRepository.findByEmployeeId(employeeId),
    adminSettingsRepository.findAll(),
  ]);

  if (!employee) {
    return res.status(404).json({
      success: false,
      message: "Employee not found.",
    });
  }

  const organizationName =
    adminSettingsList?.[0]?.organization?.organizationName ||
    "Leave Tracker Organization";

  const pdfBuffer = await buildSalarySlipPdf({
    organizationName,
    employee,
    bankDetails,
    monthYear: result.payroll.monthYear,
    payrollEntry: result.entry,
  });

  const filename = `salary-slip-${employeeId}-${monthYear}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Length", pdfBuffer.length);
  return res.status(200).send(pdfBuffer);
});
