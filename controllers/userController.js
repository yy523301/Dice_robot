const User = require('../models/user');

class UserController {
  static async createUser(userId, username) {
    return await User.create(userId, username);
  }

  static async getPoints(userId) {
    return await User.getPoints(userId);
  }

  static async updatePoints(userId, points) {
    return await User.updatePoints(userId, points);
  }
}

module.exports = UserController;
