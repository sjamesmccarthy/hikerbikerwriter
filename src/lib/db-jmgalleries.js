import mysql from "mysql2/promise";

const isDev = process.env.NODE_ENV === "development";

const jmGalleriesPool = mysql.createPool({
  host: isDev ? "127.0.0.1" : process.env.DB_HOST,
  port: isDev ? 3306 : parseInt(process.env.DB_PORT || "3306"),
  user: isDev ? "root" : process.env.DB_USER,
  password: isDev ? "root" : process.env.DB_PASSWORD,
  database: "jmgalusa_website", // Always use jmgalusa_website database
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default jmGalleriesPool;
