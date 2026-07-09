import LeavePolicy from "../models/leavePolicyModel.js";

class LeavePolicyRepository {
  async findByName(policyName) {
    return LeavePolicy.findOne({
      policyName: { $regex: new RegExp(`^${policyName.trim()}$`, "i") },
    });
  }

  async findById(id) {
    return LeavePolicy.findById(id);
  }

  async createLeavePolicy(leavePolicyData) {
    return LeavePolicy.create(leavePolicyData);
  }

  async findAll() {
    return LeavePolicy.find().sort({ createdAt: -1 });
  }

  async updateById(id, updateData) {
    return LeavePolicy.findByIdAndUpdate(id, updateData, {
      returnDocument: "after",
      runValidators: true,
    });
  }

  async deleteById(id) {
    return LeavePolicy.findByIdAndDelete(id);
  }
}

export default new LeavePolicyRepository();
