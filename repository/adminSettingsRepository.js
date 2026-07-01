import AdminSettings from "../models/adminSettingsModel.js";

class AdminSettingsRepository {
  async findByOrganizationName(organizationName) {
    return AdminSettings.findOne({
      "organization.organizationName": {
        $regex: new RegExp(`^${organizationName.trim()}$`, "i"),
      },
    });
  }

  async findById(id) {
    return AdminSettings.findById(id);
  }

  async createAdminSettings(adminSettingsData) {
    return AdminSettings.create(adminSettingsData);
  }

  async findAll() {
    return AdminSettings.find().sort({ createdAt: -1 });
  }

  async updateById(id, updateData) {
    return AdminSettings.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async deleteById(id) {
    return AdminSettings.findByIdAndDelete(id);
  }
}

export default new AdminSettingsRepository();
