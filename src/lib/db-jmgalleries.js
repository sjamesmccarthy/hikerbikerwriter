import mysql from "mysql2/promise";

const isDev = process.env.NODE_ENV === "development";

const jmGalleriesPool = mysql.createPool({
  host: isDev ? "127.0.0.1" : process.env.DB_HOST,
  port: isDev ? 3306 : parseInt(process.env.DB_PORT || "3306"),
  user: isDev ? "root" : process.env.DB_USER_JMG,
  password: isDev ? "root" : process.env.DB_PASSWORD_JMG,
  database: isDev ? "jmgalusa_website" : process.env.DB_NAME_JMG,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default jmGalleriesPool;
