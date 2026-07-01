import LeaveBalance from "../models/leaveBalanceModel.js";

class LeaveBalanceRepository {
  async findByEmployeeIdAndLeaveTypeId(employeeId, leaveTypeId) {
    return LeaveBalance.findOne({ employeeId, leaveTypeId });
  }

  async upsertOnApprove({ employeeId, leaveTypeId, allocatedLeaves }) {
    return LeaveBalance.findOneAndUpdate(
      { employeeId, leaveTypeId },
      {
        $setOnInsert: { allocatedLeaves },
        $inc: { consumedLeaves: 1 },
      },
      { upsert: true, new: true, runValidators: true },
    );
  }
}

export default new LeaveBalanceRepository();
