import User from "../models/userModel.js";
import { ROLES, USER_STATUS } from "../config/constants.js";

class UserRepository {
  async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase().trim() });
  }

  async findByEmailAndRole(email, role) {
    return User.findOne({ email: email.toLowerCase().trim(), role });
  }

  async findById(id) {
    return User.findById(id);
  }

  async findByIdWithManager(id) {
    return User.findById(id)
      .select("-password")
      .populate("managerId", "name employeeId email contactNo designation");
  }

  async findEmployeesForManagerAssignment(role, { excludeId } = {}) {
    const filter = { role };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    return User.find(filter)
      .select("name employeeId")
      .sort({ name: 1 })
      .lean();
  }

  async findByEmployeeId(employeeId) {
    return User.findOne({ employeeId })
      .select("-password")
      .populate("managerId", "name employeeId email");
  }

  async findActiveAdmins() {
    return User.find({
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
    }).select("name email");
  }

  async countByRole(role) {
    return User.countDocuments({ role });
  }

  async findActiveEmployees() {
    return User.find({
      role: { $in: [ROLES.EMPLOYEE, ROLES.MANAGER] },
      status: USER_STATUS.ACTIVE,
    })
      .select("-password")
      .sort({ name: 1 });
  }

  async findByEmployeeIds(employeeIds) {
    if (!employeeIds.length) {
      return [];
    }

    return User.find({ employeeId: { $in: employeeIds } })
      .select("employeeId name designation department managerId joiningDate")
      .populate("managerId", "name");
  }

  async findByManagerId(managerId) {
    return User.find({ managerId })
      .select("employeeId name")
      .sort({ name: 1 });
  }

  async countEmployees({ managerId, status } = {}) {
    const filter = { role: ROLES.EMPLOYEE };

    if (managerId) {
      filter.managerId = managerId;
    }

    if (status) {
      filter.status = status;
    }

    return User.countDocuments(filter);
  }

  async findEmployeeIdsByName(employeeName) {
    const employees = await User.find({
      name: { $regex: employeeName.trim(), $options: "i" },
    }).select("employeeId");

    return employees
      .map((employee) => employee.employeeId)
      .filter(Boolean);
  }

  async createUser(userData) {
    return User.create(userData);
  }

  async findAllByRole(role, { managerId, managerName } = {}) {
    const filter = { role };
    let managerIdsFilter = null;

    if (managerId) {
      managerIdsFilter = [managerId];
    }

    if (managerName) {
      const managers = await User.find({
        name: { $regex: managerName.trim(), $options: "i" },
      }).select("_id");
      const nameMatchedIds = managers.map((manager) => manager._id.toString());

      if (managerIdsFilter) {
        managerIdsFilter = managerIdsFilter.filter((id) =>
          nameMatchedIds.includes(id.toString()),
        );
      } else {
        managerIdsFilter = nameMatchedIds;
      }
    }

    if (managerIdsFilter !== null) {
      if (managerIdsFilter.length === 0) {
        return [];
      }

      filter.managerId =
        managerIdsFilter.length === 1
          ? managerIdsFilter[0]
          : { $in: managerIdsFilter };
    }

    return User.find(filter)
      .select("-password")
      .populate("managerId", "name")
      .sort({ createdAt: -1 });
  }

  async findByIdAndRole(id, role) {
    return User.findOne({ _id: id, role });
  }

  async isManagerOfAnyUser(userId) {
    const hasManagedUsers = await User.exists({ managerId: userId });
    return Boolean(hasManagedUsers);
  }

  async updateById(id, updateData) {
    return User.findByIdAndUpdate(id, updateData, {
      returnDocument: "after",
      runValidators: true,
    }).select("-password");
  }

  async deleteById(id) {
    return User.findByIdAndDelete(id);
  }

  async findAllManagersIdAndName() {
    const managerIds = await User.distinct("managerId", {
      managerId: { $ne: null },
    });

    if (!managerIds.length) {
      return [];
    }

    return User.find({ _id: { $in: managerIds } })
      .select("name")
      .sort({ name: 1 })
      .lean();
  }

  async findAllManagersWithTeamCount() {
    return User.aggregate([
      { $match: { managerId: { $ne: null } } },
      {
        $group: {
          _id: "$managerId",
          teamCount: { $sum: 1 },
          teamMembers: {
            $push: {
              _id: "$_id",
              name: "$name",
              designation: "$designation",
              status: "$status",
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "manager",
          pipeline: [{ $project: { password: 0 } }],
        },
      },
      { $unwind: "$manager" },
      { $sort: { "manager.name": 1 } },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              "$manager",
              { teamCount: "$teamCount", teamMembers: "$teamMembers" },
            ],
          },
        },
      },
    ]);
  }
}

export default new UserRepository();
