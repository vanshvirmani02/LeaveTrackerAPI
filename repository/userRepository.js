import User from "../models/userModel.js";

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

  async createUser(userData) {
    return User.create(userData);
  }

  async findAllByRole(role) {
    return User.find({ role }).select("-password").sort({ createdAt: -1 });
  }

  async findByIdAndRole(id, role) {
    return User.findOne({ _id: id, role });
  }

  async updateById(id, updateData) {
    return User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");
  }

  async deleteById(id) {
    return User.findByIdAndDelete(id);
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
