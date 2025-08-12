import pool from "../../src/lib/db";

export default async function handler(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT title, file_name FROM catalog_photo WHERE status='ACTIVE' LIMIT 24"
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Database error in jmgalleries API:", error);

    // Provide more specific error messages based on error type
    let errorMessage = "Database connection failed";

    if (error.code === "ECONNREFUSED") {
      errorMessage = "Database server is unavailable";
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      errorMessage = "Database authentication failed";
    } else if (error.code === "ER_BAD_DB_ERROR") {
      errorMessage = "Database not found";
    } else if (error.code === "ENOTFOUND") {
      errorMessage = "Database host not found";
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({
      error: errorMessage,
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
