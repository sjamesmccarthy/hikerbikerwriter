import mysql from "mysql2/promise";

const isDev = process.env.NODE_ENV === "development";

const pool = mysql.createPool({
  host: isDev ? "localhost" : process.env.DB_HOST,
  port: isDev ? 3306 : parseInt(process.env.DB_PORT || "3306"),
  user: isDev ? "root" : process.env.DB_USER,
  password: isDev ? "root" : process.env.DB_PASSWORD,
  database: isDev ? "jmgalusa_website" : process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
