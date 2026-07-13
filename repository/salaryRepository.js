import Salary from "../models/salaryModel.js";

class SalaryRepository {
  async createSalary(salaryData) {
    return Salary.create(salaryData);
  }

  async findLatestByEmployeeId(employeeId) {
    return Salary.findOne({ employeeId }).sort({ salaryEffectiveDate: -1 });
  }

  async findLatestByEmployeeIds(employeeIds) {
    if (!employeeIds?.length) {
      return [];
    }

    return Salary.aggregate([
      { $match: { employeeId: { $in: employeeIds } } },
      { $sort: { salaryEffectiveDate: -1, createdAt: -1 } },
      {
        $group: {
          _id: "$employeeId",
          doc: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$doc" } },
    ]);
  }

  async updateById(id, updateData) {
    return Salary.findByIdAndUpdate(id, updateData, {
      returnDocument: "after",
      runValidators: true,
    });
  }

  async upsertLatestByEmployeeId(employeeId, salaryData) {
    const existing = await this.findLatestByEmployeeId(employeeId);
    if (existing) {
      return this.updateById(existing._id, salaryData);
    }
    return this.createSalary({ ...salaryData, employeeId });
  }

  async deleteByEmployeeId(employeeId) {
    return Salary.deleteMany({ employeeId });
  }
}

export default new SalaryRepository();
