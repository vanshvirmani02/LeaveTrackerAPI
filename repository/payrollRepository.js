import Payroll from "../models/payrollModel.js";

class PayrollRepository {
  async createPayroll(payrollData) {
    return Payroll.create(payrollData);
  }

  async findByMonthYear(monthYear) {
    return Payroll.findOne({ monthYear });
  }

  async findById(id) {
    return Payroll.findById(id);
  }

  async updateByMonthYear(monthYear, updateData) {
    return Payroll.findOneAndUpdate({ monthYear }, updateData, {
      returnDocument: "after",
      runValidators: true,
    });
  }

  async updateEmployeeSalaryEntry(monthYear, employeeId, entryUpdate) {
    const setFields = Object.fromEntries(
      Object.entries(entryUpdate).map(([key, value]) => [
        `employeeSalary.$.${key}`,
        value,
      ]),
    );

    return Payroll.findOneAndUpdate(
      { monthYear, "employeeSalary.employeeId": employeeId },
      { $set: setFields },
      { returnDocument: "after", runValidators: true },
    );
  }
}

export default new PayrollRepository();
