import { PAYROLL_STATUS } from "../config/constants.js";
import { calculateLeaveDays } from "./leaveAllocationUtils.js";

export const parseMonthYear = (monthYear) => {
  const [yearStr, monthStr] = String(monthYear).split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  const daysInMonth = monthEnd.getUTCDate();

  return { year, month, monthStart, monthEnd, daysInMonth };
};

export const calculateGrossSalary = (salary) => {
  if (!salary) {
    return 0;
  }

  const basic = Number(salary.basicSalary) || 0;
  const hra = Number(salary.hra) || 0;
  const specialAllowance = Number(salary.specialAllowance) || 0;

  return roundMoney(basic + hra + specialAllowance);
};

export const roundMoney = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

/**
 * LOP deduction: (grossSalary / daysInMonth) * approved leave days in month.
 * Leave ranges that span months are clipped to the payroll month bounds.
 */
export const calculateLeaveDeduction = ({
  grossSalary,
  daysInMonth,
  leaves = [],
  holidays = [],
  monthStart,
  monthEnd,
}) => {
  if (!grossSalary || !daysInMonth) {
    return 0;
  }

  let leaveDays = 0;

  for (const leave of leaves) {
    const leaveStart = new Date(leave.startDate);
    const leaveEnd = new Date(leave.endDate);
    leaveStart.setUTCHours(0, 0, 0, 0);
    leaveEnd.setUTCHours(0, 0, 0, 0);

    if (leaveEnd < monthStart || leaveStart > monthEnd) {
      continue;
    }

    const clippedStart = leaveStart < monthStart ? monthStart : leaveStart;
    const clippedEnd = leaveEnd > monthEnd ? monthEnd : leaveEnd;

    const isSingleDayHalfLeave =
      leave.halfDay &&
      leaveStart.getTime() === leaveEnd.getTime() &&
      clippedStart.getTime() === leaveStart.getTime() &&
      clippedEnd.getTime() === leaveEnd.getTime();

    leaveDays += calculateLeaveDays({
      startDate: clippedStart,
      endDate: clippedEnd,
      halfDay: Boolean(isSingleDayHalfLeave),
      holidays,
    });
  }

  const dailyRate = grossSalary / daysInMonth;
  return roundMoney(dailyRate * leaveDays);
};

export const calculatePayrollSummary = (employeeSalary = []) => {
  let totalGrossSalary = 0;
  let totalDeduction = 0;
  let totalBonus = 0;
  let draftCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;

  for (const entry of employeeSalary) {
    totalGrossSalary += Number(entry.grossSalary) || 0;
    totalDeduction += Number(entry.deduction) || 0;
    totalBonus += Number(entry.bonus) || 0;

    if (entry.status === PAYROLL_STATUS.DRAFT) draftCount += 1;
    else if (entry.status === PAYROLL_STATUS.APPROVED) approvedCount += 1;
    else if (entry.status === PAYROLL_STATUS.REJECTED) rejectedCount += 1;
  }

  return {
    totalGrossSalary: roundMoney(totalGrossSalary),
    totalDeduction: roundMoney(totalDeduction),
    totalBonus: roundMoney(totalBonus),
    netDisbursement: roundMoney(totalGrossSalary - totalDeduction + totalBonus),
    draftCount,
    approvedCount,
    rejectedCount,
    totalEmployees: employeeSalary.length,
  };
};
