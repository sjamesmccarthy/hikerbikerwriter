-- Twain Story Builder Database Schema
-- Created: September 29, 2025
-- This schema supports the complete Twain Story Builder application

-- Drop existing tables if they exist (in correct order to handle foreign keys)
DROP TABLE IF EXISTS recent_activities;
DROP TABLE IF EXISTS part_chapters;
DROP TABLE IF EXISTS part_stories;
DROP TABLE IF EXISTS parts;
DROP TABLE IF EXISTS outlines;
DROP TABLE IF EXISTS chapters;
DROP TABLE IF EXISTS stories;
DROP TABLE IF EXISTS characters;
DROP TABLE IF EXISTS ideas;
DROP TABLE IF EXISTS contributors;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS user_preferences;
DROP TABLE IF EXISTS users;

-- Create Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    image TEXT,
    provider VARCHAR(50) DEFAULT 'google',
    provider_id VARCHAR(255),
    account_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    login_count INT DEFAULT 1,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_provider_id (provider_id),
    INDEX idx_status (status)
);

-- Create User Preferences table
CREATE TABLE user_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    
    -- Plan and subscription info
    plan_type ENUM('freelance', 'professional') DEFAULT 'freelance',
    plan_status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    plan_start_date TIMESTAMP NULL,
    plan_end_date TIMESTAMP NULL,
    plan_features JSON,
    
    -- User interface preferences
    theme ENUM('light', 'dark', 'auto') DEFAULT 'auto',
    sidebar_collapsed BOOLEAN DEFAULT FALSE,
    default_view ENUM('bookshelf', 'write', 'manage') DEFAULT 'bookshelf',
    
    -- Writing preferences
    auto_save BOOLEAN DEFAULT TRUE,
    auto_save_interval INT DEFAULT 30,
    word_count_goal INT NULL,
    preferred_font_size INT DEFAULT 14,
    preferred_font_family VARCHAR(255) DEFAULT "'Rubik', sans-serif",
    
    -- Notification preferences
    show_notifications BOOLEAN DEFAULT TRUE,
    show_word_count_notifications BOOLEAN DEFAULT TRUE,
    show_save_notifications BOOLEAN DEFAULT TRUE,
    
    -- Export preferences
    default_export_format ENUM('pdf', 'docx', 'txt', 'html') DEFAULT 'pdf',
    include_metadata_in_export BOOLEAN DEFAULT TRUE,
    
    -- Privacy and data preferences
    analytics_opt_in BOOLEAN DEFAULT FALSE,
    share_usage_data BOOLEAN DEFAULT FALSE,
    
    -- Feature flags and beta access
    beta_features JSON,
    experimental_features JSON,
    
    -- Recent activity tracking
    recent_books JSON,
    recent_stories JSON,
    
    -- Custom settings
    custom_settings JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_preferences (user_id)
);

-- Create Books table
CREATE TABLE books (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500) NULL,
    author VARCHAR(255) NOT NULL,
    edition VARCHAR(100) DEFAULT 'First Edition',
    copyright_year VARCHAR(4) NOT NULL,
    word_count INT DEFAULT 0,
    cover_image TEXT NULL,
    
    -- Series information
    is_series BOOLEAN DEFAULT FALSE,
    series_name VARCHAR(255) NULL,
    series_number INT NULL,
    
    -- Metadata
    description TEXT NULL,
    genre VARCHAR(100) NULL,
    age_group ENUM('Adult', 'Teen', 'Child') DEFAULT 'Adult',
    publisher_name VARCHAR(255) NULL,
    
    -- ISBN numbers
    isbn_epub VARCHAR(17) NULL,
    isbn_kindle VARCHAR(17) NULL,
    isbn_paperback VARCHAR(17) NULL,
    isbn_hardcover VARCHAR(17) NULL,
    isbn_pdf VARCHAR(17) NULL,
    
    -- Legal clauses
    clause_all_rights_reserved BOOLEAN DEFAULT FALSE,
    clause_fiction BOOLEAN DEFAULT FALSE,
    clause_moral_rights BOOLEAN DEFAULT FALSE,
    
    -- Type distinction
    is_quick_story BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_books (user_id),
    INDEX idx_series (series_name),
    INDEX idx_genre (genre),
    INDEX idx_is_quick_story (is_quick_story),
    INDEX idx_word_count (word_count)
);

-- Create Contributors table
CREATE TABLE contributors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    book_id INT NOT NULL,
    contributor_id VARCHAR(255) NOT NULL, -- Original ID from the frontend
    role ENUM('Co-Author', 'Editor', 'Illustrator', 'Photographer', 'Translator', 'Foreword', 'Introduction', 'Preface', 'Agent', 'Proof Reader', 'Advisor', 'Typesetter') NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    INDEX idx_book_contributors (book_id),
    INDEX idx_contributor_role (role),
    UNIQUE KEY unique_book_contributor (book_id, contributor_id)
);

-- Create Ideas table
CREATE TABLE ideas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    idea_id VARCHAR(255) NOT NULL, -- Original ID from the frontend
    title VARCHAR(500) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    INDEX idx_user_ideas (user_id),
    INDEX idx_book_ideas (book_id),
    UNIQUE KEY unique_book_idea (book_id, idea_id)
);

-- Create Characters table
CREATE TABLE characters (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    character_id VARCHAR(255) NOT NULL, -- Original ID from the frontend
    name VARCHAR(255) NOT NULL,
    gender VARCHAR(100),
    avatar LONGTEXT NULL, -- Base64 image data
    backstory TEXT,
    characterization TEXT,
    voice TEXT,
    appearance TEXT,
    friends_family TEXT,
    favorites TEXT,
    misc TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    INDEX idx_user_characters (user_id),
    INDEX idx_book_characters (book_id),
    INDEX idx_character_name (name),
    UNIQUE KEY unique_book_character (book_id, character_id)
);

-- Create Stories table (for quick stories and book stories)
CREATE TABLE stories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    story_id VARCHAR(255) NOT NULL, -- Original ID from the frontend
    title VARCHAR(500) NOT NULL,
    content LONGTEXT, -- JSON string of Quill delta
    word_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    INDEX idx_user_stories (user_id),
    INDEX idx_book_stories (book_id),
    INDEX idx_story_word_count (word_count),
    UNIQUE KEY unique_book_story (book_id, story_id)
);

-- Create Chapters table
CREATE TABLE chapters (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    chapter_id VARCHAR(255) NOT NULL, -- Original ID from the frontend
    title VARCHAR(500) NOT NULL,
    content LONGTEXT, -- JSON string of Quill delta
    word_count INT DEFAULT 0,
    chapter_order INT DEFAULT 0, -- For ordering chapters
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    INDEX idx_user_chapters (user_id),
    INDEX idx_book_chapters (book_id),
    INDEX idx_chapter_order (chapter_order),
    INDEX idx_chapter_word_count (word_count),
    UNIQUE KEY unique_book_chapter (book_id, chapter_id)
);

-- Create Outlines table
CREATE TABLE outlines (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    outline_id VARCHAR(255) NOT NULL, -- Original ID from the frontend
    title VARCHAR(500) NOT NULL,
    content LONGTEXT, -- JSON string of Quill delta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    INDEX idx_user_outlines (user_id),
    INDEX idx_book_outlines (book_id),
    UNIQUE KEY unique_book_outline (book_id, outline_id)
);

-- Create Parts table
CREATE TABLE parts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    part_id VARCHAR(255) NOT NULL, -- Original ID from the frontend
    title VARCHAR(500) NOT NULL,
    part_order INT DEFAULT 0, -- For ordering parts
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    INDEX idx_user_parts (user_id),
    INDEX idx_book_parts (book_id),
    INDEX idx_part_order (part_order),
    UNIQUE KEY unique_book_part (book_id, part_id)
);

-- Create Part-Chapter relationship table
CREATE TABLE part_chapters (
    id INT PRIMARY KEY AUTO_INCREMENT,
    part_id INT NOT NULL,
    chapter_id INT NOT NULL,
    chapter_order INT DEFAULT 0, -- Order within the part
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    UNIQUE KEY unique_part_chapter (part_id, chapter_id),
    INDEX idx_part_chapters (part_id),
    INDEX idx_chapter_order_in_part (part_id, chapter_order)
);

-- Create Part-Story relationship table
CREATE TABLE part_stories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    part_id INT NOT NULL,
    story_id INT NOT NULL,
    story_order INT DEFAULT 0, -- Order within the part
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_part_story (part_id, story_id),
    INDEX idx_part_stories (part_id),
    INDEX idx_story_order_in_part (part_id, story_order)
);

-- Create Recent Activities table for tracking user actions
CREATE TABLE recent_activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    book_id INT NULL,
    activity_id VARCHAR(255) NOT NULL, -- Original ID from the frontend
    type ENUM('idea', 'character', 'story', 'chapter', 'outline', 'part') NOT NULL,
    title VARCHAR(500) NOT NULL, -- Title of the item when the action occurred
    action ENUM('created', 'modified', 'deleted') NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL,
    INDEX idx_user_activities (user_id),
    INDEX idx_activity_type (type),
    INDEX idx_activity_timestamp (timestamp),
    INDEX idx_book_activities (book_id)
);

-- Create triggers to automatically update word counts

DELIMITER //

-- Trigger to update book word count when chapters are modified
CREATE TRIGGER update_book_wordcount_chapters
AFTER INSERT ON chapters
FOR EACH ROW
BEGIN
    UPDATE books 
    SET word_count = (
        SELECT COALESCE(SUM(word_count), 0) 
        FROM chapters 
        WHERE book_id = NEW.book_id
    ) + (
        SELECT COALESCE(SUM(word_count), 0) 
        FROM stories 
        WHERE book_id = NEW.book_id
    )
    WHERE id = NEW.book_id;
END//

CREATE TRIGGER update_book_wordcount_chapters_update
AFTER UPDATE ON chapters
FOR EACH ROW
BEGIN
    UPDATE books 
    SET word_count = (
        SELECT COALESCE(SUM(word_count), 0) 
        FROM chapters 
        WHERE book_id = NEW.book_id
    ) + (
        SELECT COALESCE(SUM(word_count), 0) 
        FROM stories 
        WHERE book_id = NEW.book_id
    )
    WHERE id = NEW.book_id;
END//

CREATE TRIGGER update_book_wordcount_chapters_delete
AFTER DELETE ON chapters
FOR EACH ROW
BEGIN
    UPDATE books 
    SET word_count = (
        SELECT COALESCE(SUM(word_count), 0) 
        FROM chapters 
        WHERE book_id = OLD.book_id
    ) + (
        SELECT COALESCE(SUM(word_count), 0) 
        FROM stories 
        WHERE book_id = OLD.book_id
    )
    WHERE id = OLD.book_id;
END//

-- Trigger to update book word count when stories are modified
CREATE TRIGGER update_book_wordcount_stories
AFTER INSERT ON stories
FOR EACH ROW
BEGIN
    UPDATE books 
    SET word_count = (
        SELECT COALESCE(SUM(word_count), 0) 
        FROM chapters 
        WHERE book_id = NEW.book_id
    ) + (
        SELECT COALESCE(SUM(word_count), 0) 
        FROM stories 
        WHERE book_id = NEW.book_id
    )
    WHERE id = NEW.book_id;
END//

CREATE TRIGGER update_book_wordcount_stories_update
AFTER UPDATE ON stories
FOR EACH ROW
BEGIN
    UPDATE books 
    SET word_count = (
        SELECT COALESCE(SUM(word_count), 0) 
        FROM chapters 
        WHERE book_id = NEW.book_id
    ) + (
        SELECT COALESCE(SUM(word_count), 0) 
        FROM stories 
        WHERE book_id = NEW.book_id
    )
    WHERE id = NEW.book_id;
END//

CREATE TRIGGER update_book_wordcount_stories_delete
AFTER DELETE ON stories
FOR EACH ROW
BEGIN
    UPDATE books 
    SET word_count = (
        SELECT COALESCE(SUM(word_count), 0) 
        FROM chapters 
        WHERE book_id = OLD.book_id
    ) + (
        SELECT COALESCE(SUM(word_count), 0) 
        FROM stories 
        WHERE book_id = OLD.book_id
    )
    WHERE id = OLD.book_id;
END//

DELIMITER ;

-- Insert sample data for testing (optional)
-- You can uncomment these if you want some initial test data

/*
-- Sample user
INSERT INTO users (email, name, image) VALUES 
('test@example.com', 'Test User', 'https://example.com/avatar.jpg');

-- Sample user preferences
INSERT INTO user_preferences (user_id, plan_type) VALUES (1, 'freelance');

-- Sample book
INSERT INTO books (user_id, title, author, copyright_year) VALUES 
(1, 'My First Novel', 'Test User', '2025');

-- Sample chapter
INSERT INTO chapters (user_id, book_id, chapter_id, title, content, word_count) VALUES 
(1, 1, 'ch1', 'Chapter 1: The Beginning', '{"ops":[{"insert":"It was a dark and stormy night...\\n"}]}', 8);
*/

-- Create indexes for performance optimization
CREATE INDEX idx_books_updated_at ON books(updated_at);
CREATE INDEX idx_chapters_updated_at ON chapters(updated_at);
CREATE INDEX idx_stories_updated_at ON stories(updated_at);
CREATE INDEX idx_user_login_count ON users(login_count);
CREATE INDEX idx_user_last_login ON users(last_login_at);

-- Views for common queries

-- View for getting book statistics
CREATE VIEW book_stats AS
SELECT 
    b.id,
    b.title,
    b.user_id,
    b.word_count,
    COUNT(DISTINCT c.id) as chapter_count,
    COUNT(DISTINCT s.id) as story_count,
    COUNT(DISTINCT ch.id) as character_count,
    COUNT(DISTINCT i.id) as idea_count,
    COUNT(DISTINCT o.id) as outline_count,
    COUNT(DISTINCT p.id) as part_count
FROM books b
LEFT JOIN chapters c ON b.id = c.book_id
LEFT JOIN stories s ON b.id = s.book_id
LEFT JOIN characters ch ON b.id = ch.book_id
LEFT JOIN ideas i ON b.id = i.book_id
LEFT JOIN outlines o ON b.id = o.book_id
LEFT JOIN parts p ON b.id = p.book_id
GROUP BY b.id, b.title, b.user_id, b.word_count;

-- View for user activity summary
CREATE VIEW user_activity_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    COUNT(DISTINCT b.id) as total_books,
    COUNT(DISTINCT CASE WHEN b.is_quick_story = TRUE THEN b.id END) as quick_stories,
    COUNT(DISTINCT CASE WHEN b.is_quick_story = FALSE THEN b.id END) as regular_books,
    COALESCE(SUM(b.word_count), 0) as total_word_count,
    u.login_count,
    u.last_login_at,
    u.account_created_at
FROM users u
LEFT JOIN books b ON u.id = b.user_id
GROUP BY u.id, u.email, u.name, u.login_count, u.last_login_at, u.account_created_at;

-- Show tables created
SHOW TABLES;