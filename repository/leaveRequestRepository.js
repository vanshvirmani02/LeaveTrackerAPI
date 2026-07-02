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

  async findApprovedByEmployeeId(employeeId) {
    return LeaveRequest.find({
      employeeId,
      status: LEAVE_REQUEST_STATUS.APPROVED,
    })
      .populate("leaveType")
      .sort({ startDate: 1 });
  }

  async findApprovedByEmployeeIds(employeeIds) {
    if (!employeeIds.length) {
      return [];
    }

    return LeaveRequest.find({
      employeeId: { $in: employeeIds },
      status: LEAVE_REQUEST_STATUS.APPROVED,
    })
      .populate("leaveType")
      .sort({ startDate: 1 });
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

  async findAll({
    status,
    startDate,
    endDate,
    employeeIds,
    sortOrder = "desc",
  } = {}) {
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (employeeIds?.length) {
      filter.employeeId =
        employeeIds.length === 1 ? employeeIds[0] : { $in: employeeIds };
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

    const sortDirection = sortOrder === "asc" ? 1 : -1;

    return LeaveRequest.find(filter)
      .populate("leaveType")
      .sort({ createdAt: sortDirection });
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
