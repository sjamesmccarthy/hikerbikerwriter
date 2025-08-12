import mysql from "mysql2/promise";

const isDev = process.env.NODE_ENV === "development";

// Database configuration - same as db.ts
const dbConfig = {
  host: isDev ? "127.0.0.1" : process.env.DB_HOST,
  port: isDev ? 3306 : parseInt(process.env.DB_PORT || "3306"),
  user: isDev ? "root" : process.env.DB_USER,
  password: isDev ? "root" : process.env.DB_PASSWORD,
  database: isDev ? "hikerbikerwriter" : process.env.DB_NAME,
};

async function migrateUsers() {
  let connection;

  try {
    console.log("Connecting to database...");
    connection = await mysql.createConnection(dbConfig);

    // Create users table
    console.log("Creating users table...");
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        oauth VARCHAR(50) DEFAULT 'GOOGLE',
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      );
    `;

    await connection.execute(createUsersTable);
    console.log("Users table created successfully");

    // Insert the first user record
    console.log("Inserting initial user record...");
    const insertUser = `
      INSERT IGNORE INTO users (email, name, oauth) 
      VALUES ('hikerbikerwriter@gmail.com', 'James Mc', 'GOOGLE');
    `;

    const [result] = await connection.execute(insertUser);

    if (result.affectedRows > 0) {
      console.log("✅ User record inserted successfully");
    } else {
      console.log("ℹ️  User record already exists");
    }

    // Verify the insertion
    const [rows] = await connection.execute(
      "SELECT * FROM users WHERE email = ?",
      ["hikerbikerwriter@gmail.com"]
    );
    console.log("Verified user record:", rows[0]);

    console.log("\n🎉 Users table migration completed successfully!");
    console.log("\nNext steps:");
    console.log(
      "1. Update your authentication logic to check the users table instead of ALLOWED_EMAILS env var"
    );
    console.log("2. Remove ALLOWED_EMAILS from your .env.local file");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the migration
migrateUsers();
