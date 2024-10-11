class DiceGame {
  static rollDice() {
    return Math.floor(Math.random() * 6) + 1;
  }

  static calculateResult(dice1, dice2, dice3) {
    const sum = dice1 + dice2 + dice3;
    return {
      sum,
      isBig: sum > 10,
      isSmall: sum <= 10,
      isOdd: sum % 2 !== 0,
      isEven: sum % 2 === 0,
      isTriple: dice1 === dice2 && dice2 === dice3
    };
  }
}

module.exports = DiceGame;
