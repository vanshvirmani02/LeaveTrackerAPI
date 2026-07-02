import LeaveBalance from "../models/leaveBalanceModel.js";

class LeaveBalanceRepository {
  async findByEmployeeIdAndLeaveTypeId(employeeId, leaveTypeId) {
    return LeaveBalance.findOne({ employeeId, leaveTypeId });
  }

  async upsertOnApprove({
    employeeId,
    leaveTypeId,
    allocatedLeaves,
    leaveDays,
  }) {
    return LeaveBalance.findOneAndUpdate(
      { employeeId, leaveTypeId },
      {
        $set: { allocatedLeaves },
        $inc: { consumedLeaves: leaveDays },
        $setOnInsert: { employeeId, leaveTypeId },
      },
      { upsert: true, new: true, runValidators: true },
    );
  }
}

export default new LeaveBalanceRepository();
