const pool = require('../db');

class User {
  static async create(userId, username) {
    const [result] = await pool.query(
      'INSERT INTO users (user_id, username, points) VALUES (?, ?, 100) ON DUPLICATE KEY UPDATE username = ?',
      [userId, username, username]
    );
    return result;
  }

  static async getPoints(userId) {
    const [rows] = await pool.query('SELECT points FROM users WHERE user_id = ?', [userId]);
    return rows[0] ? rows[0].points : null;
  }

  static async updatePoints(userId, points) {
    const [result] = await pool.query(
      'UPDATE users SET points = points + ? WHERE user_id = ?',
      [points, userId]
    );
    return result;
  }
}

module.exports = User;
