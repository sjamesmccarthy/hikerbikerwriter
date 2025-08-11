import pool from "../../src/lib/db";

export default async function handler(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT title, file_name FROM catalog_photo WHERE status='ACTIVE' LIMIT 24"
    );
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
