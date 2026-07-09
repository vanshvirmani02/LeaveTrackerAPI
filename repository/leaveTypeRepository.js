import LeaveType from "../models/leaveTypeModel.js";

class LeaveTypeRepository {
  async findByName(leaveName) {
    return LeaveType.findOne({
      leaveName: { $regex: new RegExp(`^${leaveName.trim()}$`, "i") },
    });
  }

  async findById(id) {
    return LeaveType.findById(id);
  }

  async findByIds(ids) {
    return LeaveType.find({ _id: { $in: ids } });
  }

  async createLeaveType(leaveTypeData) {
    return LeaveType.create(leaveTypeData);
  }

  async findAll() {
    return LeaveType.find().sort({ createdAt: -1 });
  }

  async updateById(id, updateData) {
    return LeaveType.findByIdAndUpdate(id, updateData, {
      returnDocument: "after",
      runValidators: true,
    });
  }

  async deleteById(id) {
    return LeaveType.findByIdAndDelete(id);
  }
}

export default new LeaveTypeRepository();
