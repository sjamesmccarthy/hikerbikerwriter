const pool = require("./src/lib/db.ts").default;

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

    // Check table structure
    const [fieldnotesSchema] = await pool.execute("DESCRIBE fieldnotes");
    console.log("🗂️  Fieldnotes table structure:", fieldnotesSchema);

    const [recipesSchema] = await pool.execute("DESCRIBE recipes");
    console.log("🗂️  Recipes table structure:", recipesSchema);
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  } finally {
    await pool.end();
  }
}

testConnection();
