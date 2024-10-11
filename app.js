const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const userController = require('./controllers/userController');
const gameController = require('./controllers/gameController');
const adminController = require('./controllers/adminController');
const logger = require('./utils/logger');

process.env.NTBA_FIX_319 = 1;

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的 Promise 拒绝:', reason);
});

const bot = new TelegramBot(config.telegramToken, {polling: true});

let gameChatId = null;

// 处理 /start 命令
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username;
  await userController.createUser(userId, username);
  bot.sendMessage(chatId, '欢迎使用骰子机器人!');
});

// 处理 /help 命令
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
*🎲 骰子机器人使用说明 🎲*

1️⃣ *下注命令*
   格式：\`#[下注类型] [下注金额]\`
   例如：\`#大 100\` 或 \`#小 50\`

   下注类型：
   • 大：总点数大于 10
   • 小：总点数小于或等于 10
   • 单：总点数为奇数
   • 双：总点数为偶数

2️⃣ *快捷下注*
   使用 /bet 命令调出快捷下注按钮

3️⃣ *查询积分*
   使用 /points 命令查看您当前的积分

4️⃣ *游戏规则*
   • 每 10 秒进行一次开奖
   • 使用 3 个骰子，点数范围为 1-6
   • 总点数范围为 3-18
   • 中奖后，您将获得下注金额的 2 倍积分

5️⃣ *管理员命令*
   \`/admin addPoints [用户ID] [积分数量]\`
   (仅限管理员使用)

6️⃣ *设置游戏群聊*
   在目标群聊中使用 /setgamechat 命令

⚠️ *注意事项*
• 请在设置的游戏群聊中进行下注和游戏操作。
• 每次开奖后，未中奖的下注将被清空。
• 如有任何问题，请联系管理员。

祝您游戏愉快！🍀
  `;
  
  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// 处理下注命令
bot.onText(/^#(\S+)\s+(\d+)$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const betType = match[1];
  const betAmount = parseInt(match[2]);

  logger.info(`收到下注请求：用户 ${userId}，类型 ${betType}，金额 ${betAmount}`);

  if (chatId !== gameChatId) {
    logger.warn(`用户 ${userId} 在错误的群聊中下注`);
    bot.sendMessage(chatId, '请在指定的游戏群聊中下注');
    return;
  }

  const result = await gameController.placeBet(userId, betType, betAmount);
  logger.info(`下注结果：${result}`);
  bot.sendMessage(chatId, `@${msg.from.username} ${result}`);
});

// 处理查询积分命令
bot.onText(/\/points/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const points = await userController.getPoints(userId);
  bot.sendMessage(chatId, `@${msg.from.username} 您当前的积分为: ${points}`);
});

// 处理管理员命令
bot.onText(/\/admin (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const command = match[1];

  if (await adminController.isAdmin(userId)) {
    const result = await adminController.handleCommand(command, userId);
    bot.sendMessage(chatId, result);
  } else {
    bot.sendMessage(chatId, '您没有管理员权限');
  }
});

// 定时开奖逻辑
let gameInProgress = false;

setInterval(async () => {
  if (gameInProgress || !gameChatId) return;

  try {
    gameInProgress = true;

    // 获取所有参与的用户
    const participants = await gameController.getParticipants();
    
    // 如果没有参与者，跳过本次开奖
    if (participants.length === 0) {
      logger.info('没有参与者，跳过本次开奖');
      gameInProgress = false;
      return;
    }

    // 发送三个骰子
    const diceResults = [];
    for (let i = 0; i < 3; i++) {
      const diceMsg = await bot.sendDice(gameChatId);
      diceResults.push(diceMsg.dice.value);
    }

    const result = await gameController.drawLottery(diceResults);
    logger.info('开奖结果:', result);

    // 向群聊发送开奖结果
    let resultMessage = `开奖结果: ${diceResults.join(' ')}\n` +
      `总和: ${result.sum}\n` +
      `${result.isBig ? '大' : '小'} ${result.isOdd ? '单' : '双'}` +
      `${result.isTriple ? ' 豹子' : ''}`;

    // 添加中奖用户信息
    if (result.winningUsers.length > 0) {
      resultMessage += '\n\n中奖用户：';
      for (const winner of result.winningUsers) {
        resultMessage += `\n@${winner.userId} 下注${winner.betType}，赢得${winner.winAmount}积分`;
      }
    } else {
      resultMessage += '\n\n本轮没有用户中奖';
    }

    await bot.sendMessage(gameChatId, resultMessage);

    // 清空当前回合的下注记录
    await gameController.clearBets();
    gameInProgress = false;
  } catch (error) {
    logger.error('开奖过程中出错:', error);
    gameInProgress = false;
  }
}, config.drawInterval);

// 添加错误处理
bot.on('polling_error', (error) => {
  console.log('Polling error:', error);
});

bot.on('error', (error) => {
  console.log('General error:', error);
});

// 设置游戏群聊
bot.onText(/\/setgamechat/, (msg) => {
  if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
    gameChatId = msg.chat.id;
    bot.sendMessage(msg.chat.id, '已将此群设置为游戏群聊');
  } else {
    bot.sendMessage(msg.chat.id, '请在群聊中使用此命令');
  }
});

function getBetKeyboard(betAmount) {
  return {
    inline_keyboard: [
      [
        { text: '大', callback_data: `bet_big_${betAmount}` },
        { text: '小', callback_data: `bet_small_${betAmount}` }
      ],
      [
        { text: '单', callback_data: `bet_odd_${betAmount}` },
        { text: '双', callback_data: `bet_even_${betAmount}` }
      ],
      [
        { text: '50', callback_data: 'amount_50' },
        { text: '100', callback_data: 'amount_100' },
        { text: '200', callback_data: 'amount_200' }
      ]
    ]
  };
}

// 处理 /bet 命令
bot.onText(/\/bet/, (msg) => {
  const chatId = msg.chat.id;
  if (chatId !== gameChatId) {
    bot.sendMessage(chatId, '请在指定的游戏群聊中使用此命令');
    return;
  }
  bot.sendMessage(chatId, '请选择下注类型和金额：', {
    reply_markup: getBetKeyboard(50) // 默认金额为50
  });
});

// 处理按钮回调
bot.on('callback_query', async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;

  if (chatId !== gameChatId) {
    bot.answerCallbackQuery(callbackQuery.id, '请在指定的游戏群聊中使用此功能');
    return;
  }

  if (data.startsWith('bet_')) {
    const [, betType, amount] = data.split('_');
    const result = await gameController.placeBet(userId, betType, parseInt(amount));
    bot.answerCallbackQuery(callbackQuery.id, result);
    bot.sendMessage(chatId, `@${callbackQuery.from.username} ${result}`);
  } else if (data.startsWith('amount_')) {
    const newAmount = data.split('_')[1];
    bot.editMessageReplyMarkup(getBetKeyboard(newAmount), {
      chat_id: chatId,
      message_id: msg.message_id
    });
    bot.answerCallbackQuery(callbackQuery.id, `已选择下注金额：${newAmount}`);
  }
});

logger.info('骰子机器人已启动');
