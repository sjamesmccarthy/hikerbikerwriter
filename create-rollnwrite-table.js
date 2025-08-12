const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "root",
  database: "hikerbikerwriter",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function createRollnwriteTable() {
  try {
    console.log("Creating rollnwrite table...");

    const createTableSQL = `
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
      );
    `;

    await pool.execute(createTableSQL);
    console.log("✅ rollnwrite table created successfully");

    // Verify table structure
    const [structure] = await pool.execute("DESCRIBE rollnwrite");
    console.log("📋 Table structure:");
    console.table(structure);

    // Check all tables
    const [tables] = await pool.execute("SHOW TABLES");
    console.log(
      "📋 All tables:",
      tables.map((t) => Object.values(t)[0])
    );
  } catch (error) {
    console.error("❌ Error creating table:", error.message);
  } finally {
    await pool.end();
  }
}

createRollnwriteTable();
