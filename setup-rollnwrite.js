#!/usr/bin/env node

// Simple script to create rollnwrite table
const mysql = require("mysql2/promise");

async function createTable() {
  const connection = await mysql.createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "root",
    database: "hikerbikerwriter",
  });

  try {
    console.log("🚀 Creating rollnwrite table...");

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS rollnwrite (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        dice1 INT NOT NULL,
        dice2 INT NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        is_public BOOLEAN DEFAULT FALSE,
        date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        personal_notes TEXT,
        is_favorite BOOLEAN DEFAULT FALSE,
        json TEXT NOT NULL,
        INDEX idx_user_email (user_email),
        INDEX idx_slug_user (slug, user_email),
        INDEX idx_public (is_public),
        UNIQUE KEY unique_user_slug (user_email, slug)
      )
    `);

    console.log("✅ Table created successfully!");

    // Show tables to confirm
    const [tables] = await connection.execute("SHOW TABLES");
    console.log(
      "📋 Available tables:",
      tables.map((row) => Object.values(row)[0])
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await connection.end();
  }
}

createTable();
