import pool from "../../../src/lib/db.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { slug } = req.query;
      const { userEmail } = req.query;

      if (!slug) {
        return res.status(400).json({ error: "Missing slug parameter" });
      }

      if (!userEmail) {
        return res.status(400).json({ error: "User email required" });
      }

      // Get the recipe from database by slug
      const [rows] = await pool.query(
        "SELECT * FROM recipes WHERE user_email = ? AND JSON_EXTRACT(json, '$.slug') = ?",
        [userEmail, slug]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      const recipe =
        typeof rows[0].json === "string"
          ? JSON.parse(rows[0].json)
          : rows[0].json;

      // Ensure compatibility with frontend expectations
      const responseData = {
        ...recipe,
        userEmail: userEmail,
        dateAdded: recipe.dateAdded || rows[0].created,
        personalNotes: recipe.personalNotes || "",
        isFavorite: recipe.isFavorite || false,
      };

      return res.status(200).json(responseData);
    } catch (error) {
      console.error("Error reading recipe:", error);
      return res.status(500).json({ error: "Failed to read recipe" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
