const mysql = require("mysql2/promise");

const isDev = process.env.NODE_ENV === "development";

// Database configuration - same as db.ts
const dbConfig = {
  host: isDev ? "127.0.0.1" : process.env.DB_HOST,
  port: isDev ? 3306 : parseInt(process.env.DB_PORT || "3306"),
  user: isDev ? "root" : process.env.DB_USER,
  password: isDev ? "root" : process.env.DB_PASSWORD,
  database: isDev ? "hikerbikerwriter" : process.env.DB_NAME,
};

async function addAdminUser() {
  let connection;
  try {
    console.log("Connecting to database...");
    connection = await mysql.createConnection(dbConfig);

    // First, let's check what users exist
    console.log("Checking existing users...");
    const [existingUsers] = await connection.execute("SELECT * FROM users");
    console.log("Existing users:", existingUsers);

    // Add a default admin user (you can change this email to your Google account email)
    const adminEmail = "jmccarthy@jamespmccarthy.com"; // Change this to your email
    const adminName = "James McCarthy"; // Change this to your name

    console.log(`Adding admin user: ${adminEmail}`);
    try {
      const [result] = await connection.execute(
        "INSERT INTO users (email, name, oauth) VALUES (?, ?, ?)",
        [adminEmail, adminName, "GOOGLE"]
      );
      console.log(`✅ Admin user added successfully: ${adminEmail}`);
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
      } else {
        throw error;
      }
    }

    // List all users after the operation
    console.log("\nFinal user list:");
    const [finalUsers] = await connection.execute("SELECT * FROM users");
    finalUsers.forEach((user) => {
      console.log(`- ${user.email} (${user.name}) - ${user.oauth}`);
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addAdminUser();
