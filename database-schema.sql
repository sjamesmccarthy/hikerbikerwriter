-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  oauth VARCHAR(50) DEFAULT 'GOOGLE',
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  source VARCHAR(255),
  type ENUM('smoker', 'flat-top', 'grill') DEFAULT 'grill',
  recommended_pellets VARCHAR(255),
  categories JSON,
  photo VARCHAR(500),
  prep_time INT DEFAULT 0,
  cook_time INT DEFAULT 0,
  servings INT DEFAULT 1,
  ingredients JSON NOT NULL,
  steps JSON NOT NULL,
  my_notes TEXT,
  author VARCHAR(255) NOT NULL,
  favorite BOOLEAN DEFAULT FALSE,
  public BOOLEAN DEFAULT FALSE,
  user_email VARCHAR(255) NOT NULL,
  date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  personal_notes TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  INDEX idx_user_email (user_email),
  INDEX idx_slug_user (slug, user_email),
  INDEX idx_public (public),
  UNIQUE KEY unique_user_slug (user_email, slug)
);

-- Create public_recipes table for managing public recipe index
CREATE TABLE IF NOT EXISTS public_recipes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_public_recipe (slug, user_email),
  INDEX idx_date_added (date_added)
);

-- Create fieldnotes table (for future migration)
CREATE TABLE IF NOT EXISTS fieldnotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  mood VARCHAR(50),
  weather JSON,
  location VARCHAR(255),
  tags JSON,
  user_email VARCHAR(255) NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  personal_notes TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  INDEX idx_user_email (user_email),
  INDEX idx_slug_user (slug, user_email),
  INDEX idx_public (is_public),
  UNIQUE KEY unique_user_slug (user_email, slug)
);

-- Create public_fieldnotes table
CREATE TABLE IF NOT EXISTS public_fieldnotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_public_fieldnote (slug, user_email),
  INDEX idx_date_added (date_added)
);
