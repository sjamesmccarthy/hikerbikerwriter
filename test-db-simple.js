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

async function testConnection() {
  try {
    console.log("Testing database connection...");

    // Test basic connection
    await pool.execute("SELECT 1 as test");
    console.log("✅ Database connection successful");

    // Check if tables exist
    const [tables] = await pool.execute("SHOW TABLES");
    console.log(
      "📋 Available tables:",
      tables.map((t) => Object.values(t)[0])
    );

    // Check if our tables exist
    const tableNames = tables.map((t) => Object.values(t)[0]);
    if (tableNames.includes("fieldnotes")) {
      const [fieldnotesSchema] = await pool.execute("DESCRIBE fieldnotes");
      console.log("🗂️  Fieldnotes table structure:", fieldnotesSchema);
    } else {
      console.log("⚠️  Fieldnotes table not found");
    }

    if (tableNames.includes("recipes")) {
      const [recipesSchema] = await pool.execute("DESCRIBE recipes");
      console.log("🗂️  Recipes table structure:", recipesSchema);
    } else {
      console.log("⚠️  Recipes table not found");
    }
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  } finally {
    await pool.end();
  }
}

testConnection();
