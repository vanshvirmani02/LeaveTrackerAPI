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
}

export default new UserRepository();
