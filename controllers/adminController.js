const User = require('../models/user');

class AdminController {
  static async isAdmin(userId) {
    // 将您的用户 ID 设置为管理员
    return userId === 5899212978;
  }

  static async handleCommand(command, userId) {
    const [action, ...params] = command.split(' ');
    
    switch (action) {
      case 'addPoints':
        return await this.addPoints(userId, ...params);
      default:
        return '未知的管理员命令';
    }
  }

  static async addPoints(adminId, targetUserId, points) {
    if (!await this.isAdmin(adminId)) {
      return '您没有管理员权限';
    }

    const pointsToAdd = parseInt(points);
    if (isNaN(pointsToAdd)) {
      return '无效的积分数量';
    }

    try {
      await User.updatePoints(targetUserId, pointsToAdd);
      return `成功为用户 ${targetUserId} 添加了 ${pointsToAdd} 积分`;
    } catch (error) {
      console.error('添加积分时出错:', error);
      return '添加积分失败，请检查用户ID是否正确';
    }
  }
}

module.exports = AdminController;
