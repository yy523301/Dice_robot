const User = require('../models/user');
const Bet = require('../models/bet');
const DiceGame = require('../game/dice');

class GameController {
  static async placeBet(userId, betType, amount) {
    const userPoints = await User.getPoints(userId);
    if (userPoints < amount) {
      return '您的积分不足';
    }

    let normalizedBetType;
    switch (betType) {
      case 'big':
        normalizedBetType = '大';
        break;
      case 'small':
        normalizedBetType = '小';
        break;
      case 'odd':
        normalizedBetType = '单';
        break;
      case 'even':
        normalizedBetType = '双';
        break;
      default:
        normalizedBetType = betType;
    }

    await User.updatePoints(userId, -amount);
    await Bet.create(userId, normalizedBetType, amount);
    return `下注成功：${normalizedBetType} ${amount}积分`;
  }

  static async drawLottery(diceResults) {
    const [dice1, dice2, dice3] = diceResults;
    const result = DiceGame.calculateResult(dice1, dice2, dice3);

    const activeBets = await Bet.getActiveBets();
    const winningUsers = [];

    for (const bet of activeBets) {
      let winAmount = 0;
      if (this.checkWin(bet.bet_type, result)) {
        winAmount = this.calculateWinAmount(bet.amount);
        await User.updatePoints(bet.user_id, winAmount);
        winningUsers.push({userId: bet.user_id, winAmount, betType: bet.bet_type});
      }
      await Bet.updateResult(bet.id, result);
    }

    return { ...result, dice1, dice2, dice3, winningUsers };
  }

  static async getParticipants() {
    const activeBets = await Bet.getActiveBets();
    return [...new Set(activeBets.map(bet => bet.user_id))];
  }

  static async clearBets() {
    return await Bet.clearBets();
  }

  static checkWin(betType, result) {
    switch (betType) {
      case '大': return result.isBig;
      case '小': return result.isSmall;
      case '单': return result.isOdd;
      case '双': return result.isEven;
      default: return false;
    }
  }

  static calculateWinAmount(amount) {
    // 中奖获得下注金额的2倍
    return amount * 2;
  }
}

module.exports = GameController;
