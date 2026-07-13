import BankDetails from "../models/bankDetailsModel.js";

class BankDetailsRepository {
  async create(bankDetailsData) {
    return BankDetails.create(bankDetailsData);
  }

  async findByEmployeeId(employeeId) {
    return BankDetails.findOne({ employeeId });
  }

  async updateByEmployeeId(employeeId, updateData) {
    return BankDetails.findOneAndUpdate({ employeeId }, updateData, {
      returnDocument: "after",
      runValidators: true,
    });
  }

  async deleteByEmployeeId(employeeId) {
    return BankDetails.findOneAndDelete({ employeeId });
  }
}

export default new BankDetailsRepository();
