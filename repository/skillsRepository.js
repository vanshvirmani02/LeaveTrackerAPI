import Skills from "../models/skillsModel.js";

class SkillsRepository {
  async create(skillsData) {
    return Skills.create(skillsData);
  }

  async findByEmployeeId(employeeId) {
    return Skills.findOne({ employeeId });
  }

  async updateByEmployeeId(employeeId, updateData) {
    return Skills.findOneAndUpdate({ employeeId }, updateData, {
      returnDocument: "after",
      runValidators: true,
    });
  }

  async deleteByEmployeeId(employeeId) {
    return Skills.findOneAndDelete({ employeeId });
  }
}

export default new SkillsRepository();
