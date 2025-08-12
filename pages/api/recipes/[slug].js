import pool from "../../../src/lib/db.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { slug } = req.query;
      const { userEmail } = req.query;

      if (!slug) {
        return res.status(400).json({ error: "Missing slug parameter" });
      }

      let query;
      let params;

      if (
        userEmail &&
        userEmail !== "undefined" &&
        userEmail !== "" &&
        userEmail !== "null"
      ) {
        // Logged in user: can access their own recipes or public recipes
        query =
          "SELECT * FROM recipes WHERE (user_email = ? OR is_public = TRUE) AND JSON_EXTRACT(json, '$.slug') = ?";
        params = [userEmail, slug];
        console.log(
          "Using authenticated query for user:",
          userEmail,
          "slug:",
          slug
        );
      } else {
        // Not logged in: can only access public recipes
        query =
          "SELECT * FROM recipes WHERE is_public = TRUE AND JSON_EXTRACT(json, '$.slug') = ?";
        params = [slug];
        console.log("Using public-only query for slug:", slug);
      }

      // Get the recipe from database by slug
      const [rows] = await pool.query(query, params);

      if (rows.length === 0) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      const recipe =
        typeof rows[0].json === "string"
          ? JSON.parse(rows[0].json)
          : rows[0].json;

      const row = rows[0];
      const isOwner = userEmail && userEmail === row.user_email;

      // Ensure compatibility with frontend expectations
      const responseData = {
        ...recipe,
        userEmail: recipe.userEmail || row.user_email,
        dateAdded: recipe.dateAdded || row.created,
        personalNotes: isOwner ? recipe.personalNotes || "" : "", // Only show personal notes to owner
        isFavorite: isOwner ? recipe.isFavorite || false : false, // Only show favorite status to owner
        isPublic: row.is_public, // Include public status
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
