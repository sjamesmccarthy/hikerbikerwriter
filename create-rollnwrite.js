const pool = require("./src/lib/db.ts").default;

async function createRollnwriteTable() {
  try {
    console.log("Creating rollnwrite table...");

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS rollnwrite (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_email VARCHAR(255) DEFAULT NULL,
        json JSON DEFAULT NULL,
        created DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_public TINYINT(1) DEFAULT '0'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    await pool.execute(createTableSQL);
    console.log("✅ rollnwrite table created successfully");

    // Check if table exists now
    const [tables] = await pool.execute("SHOW TABLES LIKE 'rollnwrite'");
    console.log("📋 rollnwrite table exists:", tables.length > 0);

    if (tables.length > 0) {
      const [schema] = await pool.execute("DESCRIBE rollnwrite");
      console.log("🗂️  rollnwrite table structure:", schema);
    }
  } catch (error) {
    console.error("❌ Failed to create rollnwrite table:", error.message);
  } finally {
    await pool.end();
  }
}

createRollnwriteTable();
