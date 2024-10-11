const pool = require('../db');

class Bet {
  static async create(userId, betType, amount) {
    const [result] = await pool.query(
      'INSERT INTO bets (user_id, bet_type, amount) VALUES (?, ?, ?)',
      [userId, betType, amount]
    );
    return result;
  }

  static async getActiveBets() {
    const [rows] = await pool.query('SELECT * FROM bets WHERE result IS NULL');
    return rows;
  }

  static async updateResult(betId, result) {
    const [updateResult] = await pool.query(
      'UPDATE bets SET result = ? WHERE id = ?',
      [JSON.stringify(result), betId]
    );
    return updateResult;
  }

  static async clearBets() {
    const [result] = await pool.query('DELETE FROM bets WHERE result IS NULL');
    return result;
  }
}

module.exports = Bet;
