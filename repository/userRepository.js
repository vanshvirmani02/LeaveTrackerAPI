import User from "../models/userModel.js";

class UserRepository {
  async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase().trim() });
  }

  async createUser(userData) {
    return User.create(userData);
  }
}

export default new UserRepository();
