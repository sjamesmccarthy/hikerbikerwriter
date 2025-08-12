import pool from "../../../src/lib/db.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { slug } = req.query;
      const { userEmail } = req.query;

      if (!userEmail) {
        return res.status(400).json({ error: "User email is required" });
      }

      // Get the fieldnote from database by slug
      const [rows] = await pool.query(
        "SELECT * FROM fieldnotes WHERE user_email = ? AND JSON_EXTRACT(json, '$.slug') = ?",
        [userEmail, slug]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Field note not found" });
      }

      const fieldNote =
        typeof rows[0].json === "string"
          ? JSON.parse(rows[0].json)
          : rows[0].json;

      // Ensure compatibility with frontend expectations
      const mergedFieldNote = {
        ...fieldNote,
        author: fieldNote.by || fieldNote.author || userEmail,
        personalNotes: fieldNote.personalNotes || "",
        isFavorite: fieldNote.isFavorite || false,
        dateAdded: fieldNote.dateAdded || rows[0].created,
      };

      return res.status(200).json(mergedFieldNote);
    } catch (error) {
      console.error("Error reading field note:", error);
      return res.status(500).json({ error: "Failed to read field note" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
