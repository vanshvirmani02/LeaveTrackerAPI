import LeaveRequest from "../models/leaveRequestModel.js";
import { LEAVE_REQUEST_STATUS } from "../config/constants.js";

class LeaveRequestRepository {
  async createLeaveRequest(leaveRequestData) {
    return LeaveRequest.create(leaveRequestData);
  }

  async findById(id) {
    return LeaveRequest.findById(id).populate("leaveType");
  }

  async findPendingByEmployeeIdAndLeaveType(employeeId, leaveType) {
    return LeaveRequest.findOne({
      employeeId,
      leaveType,
      status: LEAVE_REQUEST_STATUS.PENDING,
    });
  }

  async findByEmployeeId(employeeId, { status, startDate, endDate } = {}) {
    const filter = { employeeId };

    if (status) {
      filter.status = status;
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setUTCHours(0, 0, 0, 0);
      filter.startDate = { $gte: start };
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      filter.endDate = { $lte: end };
    }

    return LeaveRequest.find(filter)
      .populate("leaveType")
      .sort({ createdAt: -1 });
  }

  async findByIdAndEmployeeId(id, employeeId, { status, leaveType } = {}) {
    const filter = { _id: id, employeeId };

    if (status) {
      filter.status = status;
    }

    if (leaveType) {
      filter.leaveType = leaveType;
    }

    return LeaveRequest.findOne(filter).populate("leaveType");
  }

  async updateStatusById(id, status) {
    return LeaveRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true },
    ).populate("leaveType");
  }

  async updateByIdAndEmployeeId(id, employeeId, updateData) {
    return LeaveRequest.findOneAndUpdate({ _id: id, employeeId }, updateData, {
      new: true,
      runValidators: true,
    }).populate("leaveType");
  }

  async deleteByIdAndEmployeeId(id, employeeId) {
    return LeaveRequest.findOneAndDelete({ _id: id, employeeId });
  }
}

export default new LeaveRequestRepository();
