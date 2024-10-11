require('dotenv').config();

module.exports = {
  telegramToken: process.env.TELEGRAM_TOKEN,
  mysqlConfig: {
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  },
  redisConfig: {
    url: process.env.REDIS_URL
  },
  drawInterval: parseInt(process.env.DRAW_INTERVAL),
  adminUserId: parseInt(process.env.ADMIN_USER_ID)
};
