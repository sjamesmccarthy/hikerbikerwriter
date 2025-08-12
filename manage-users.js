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

class UserManager {
  async getConnection() {
    return await mysql.createConnection(dbConfig);
  }

  async addUser(email, name, oauth = "GOOGLE") {
    let connection;
    try {
      connection = await this.getConnection();
      const [result] = await connection.execute(
        "INSERT INTO users (email, name, oauth) VALUES (?, ?, ?)",
        [email, name, oauth]
      );
      console.log(`✅ User added: ${email}`);
      return result;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        console.log(`ℹ️  User already exists: ${email}`);
      } else {
        console.error("Error adding user:", error);
        throw error;
      }
    } finally {
      if (connection) await connection.end();
    }
  }

  async removeUser(email) {
    let connection;
    try {
      connection = await this.getConnection();
      const [result] = await connection.execute(
        "DELETE FROM users WHERE email = ?",
        [email]
      );
      if (result.affectedRows > 0) {
        console.log(`✅ User removed: ${email}`);
      } else {
        console.log(`ℹ️  User not found: ${email}`);
      }
      return result;
    } catch (error) {
      console.error("Error removing user:", error);
      throw error;
    } finally {
      if (connection) await connection.end();
    }
  }

  async listUsers() {
    let connection;
    try {
      connection = await this.getConnection();
      const [rows] = await connection.execute(
        "SELECT id, email, name, oauth, created FROM users ORDER BY created"
      );
      console.log("\n📋 Authorized Users:");
      console.log("===================");
      rows.forEach((user) => {
        console.log(
          `${user.id}. ${user.email} (${user.name}) - ${user.oauth} - ${
            user.created.toISOString().split("T")[0]
          }`
        );
      });
      return rows;
    } catch (error) {
      console.error("Error listing users:", error);
      throw error;
    } finally {
      if (connection) await connection.end();
    }
  }

  async updateUser(email, updates) {
    let connection;
    try {
      connection = await this.getConnection();
      const fields = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = [...Object.values(updates), email];

      const [result] = await connection.execute(
        `UPDATE users SET ${fields} WHERE email = ?`,
        values
      );

      if (result.affectedRows > 0) {
        console.log(`✅ User updated: ${email}`);
      } else {
        console.log(`ℹ️  User not found: ${email}`);
      }
      return result;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    } finally {
      if (connection) await connection.end();
    }
  }
}

// CLI interface
const userManager = new UserManager();
const command = process.argv[2];
const email = process.argv[3];
const name = process.argv[4];
const oauth = process.argv[5];

switch (command) {
  case "add":
    if (!email || !name) {
      console.log("Usage: node manage-users.js add <email> <name> [oauth]");
      console.log(
        'Example: node manage-users.js add "user@example.com" "John Doe" "GOOGLE"'
      );
    } else {
      userManager.addUser(email, name, oauth);
    }
    break;

  case "remove":
    if (!email) {
      console.log("Usage: node manage-users.js remove <email>");
      console.log('Example: node manage-users.js remove "user@example.com"');
    } else {
      userManager.removeUser(email);
    }
    break;

  case "list":
    userManager.listUsers();
    break;

  case "update":
    console.log(
      "Update functionality - modify the script to add specific update logic"
    );
    break;

  default:
    console.log("User Management Tool");
    console.log("===================");
    console.log("Usage:");
    console.log(
      "  node manage-users.js add <email> <name> [oauth]    - Add a new user"
    );
    console.log(
      "  node manage-users.js remove <email>                - Remove a user"
    );
    console.log(
      "  node manage-users.js list                          - List all users"
    );
    console.log("");
    console.log("Examples:");
    console.log('  node manage-users.js add "user@example.com" "John Doe"');
    console.log('  node manage-users.js remove "user@example.com"');
    console.log("  node manage-users.js list");
    break;
}
