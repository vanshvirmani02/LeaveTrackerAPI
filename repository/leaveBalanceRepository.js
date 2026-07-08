import LeaveBalance from "../models/leaveBalanceModel.js";

class LeaveBalanceRepository {
  async findByEmployeeIdAndLeaveTypeId(employeeId, leaveTypeId) {
    return LeaveBalance.findOne({ employeeId, leaveTypeId });
  }

  async findByEmployeeIds(employeeIds) {
    const filter = {};

    if (employeeIds?.length) {
      filter.employeeId =
        employeeIds.length === 1 ? employeeIds[0] : { $in: employeeIds };
    }

    return LeaveBalance.find(filter)
      .populate("leaveTypeId")
      .sort({ employeeId: 1, createdAt: -1 });
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
