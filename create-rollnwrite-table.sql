-- Create rollnwrite table (for Roll & Write entries)
CREATE TABLE IF NOT EXISTS rollnwrite (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_email VARCHAR(255) DEFAULT NULL,
  json JSON DEFAULT NULL,
  created DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_public TINYINT(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
