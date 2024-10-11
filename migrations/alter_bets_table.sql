USE bot0001;

-- 创建用户表（如果不存在）
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  points INT DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建下注表（如果不存在）
CREATE TABLE IF NOT EXISTS bets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT,
  bet_type VARCHAR(50),
  amount INT,
  result TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 修改 bets 表的 result 列为 TEXT 类型（如果需要）
ALTER TABLE bets MODIFY COLUMN result TEXT;

-- 创建索引以提高查询性能
CREATE INDEX idx_user_id ON users(user_id);
CREATE INDEX idx_bet_user_id ON bets(user_id);
CREATE INDEX idx_bet_created_at ON bets(created_at);

-- 添加一个新列来跟踪最后一次下注时间（可选）
ALTER TABLE users ADD COLUMN last_bet_at TIMESTAMP;

-- 创建一个视图来显示用户的总下注金额（可选）
CREATE OR REPLACE VIEW user_total_bets AS
SELECT user_id, SUM(amount) as total_bet_amount
FROM bets
GROUP BY user_id;

-- 添加触发器来更新用户的最后下注时间（可选）
DELIMITER //
CREATE TRIGGER update_last_bet_time
AFTER INSERT ON bets
FOR EACH ROW
BEGIN
    UPDATE users SET last_bet_at = NOW() WHERE user_id = NEW.user_id;
END;
//
DELIMITER ;
