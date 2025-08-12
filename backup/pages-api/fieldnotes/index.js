import pool from "../../../src/lib/db.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { userEmail } = req.query;

      if (!userEmail) {
        return res.status(400).json({ error: "User email is required" });
      }

      // Get all fieldnotes for the user from database
      const [rows] = await pool.query(
        "SELECT * FROM fieldnotes WHERE user_email = ? ORDER BY created DESC",
        [userEmail]
      );

      // Parse the JSON data and add any missing fields for frontend compatibility
      const fieldnotes = rows.map((row) => {
        // Check if row.json is already an object or needs parsing
        const fieldnote =
          typeof row.json === "string" ? JSON.parse(row.json) : row.json;
        return {
          ...fieldnote,
          id: fieldnote.id || row.id, // Use JSON id or fallback to database id
        };
      });

      return res.status(200).json(fieldnotes);
    } catch (error) {
      console.error("Error in GET /api/fieldnotes:", error);
      return res.status(500).json({ error: "Failed to fetch fieldnotes" });
    }
  } else if (req.method === "POST") {
    try {
      const { userEmail, userName, ...fieldNoteData } = req.body;

      if (!userEmail) {
        return res.status(400).json({ error: "User email is required" });
      }

      // Generate ID and slug for new fieldnote
      const id = Date.now();
      const slug =
        fieldNoteData.slug ||
        `${fieldNoteData.title
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")}-${id}`;

      // Create complete fieldnote data
      const fullFieldNoteData = {
        id: id,
        slug: slug,
        title: fieldNoteData.title || "",
        content: fieldNoteData.content || "",
        by: userName || userEmail,
        tags: fieldNoteData.tags || "",
        mood: fieldNoteData.mood || "",
        images: fieldNoteData.images || [],
        date: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        personalNotes: fieldNoteData.personalNotes || "",
        isFavorite: fieldNoteData.isFavorite || false,
        dateAdded: new Date().toISOString(),
      };

      // Insert into database
      await pool.query(
        "INSERT INTO fieldnotes (user_email, json) VALUES (?, ?)",
        [userEmail, JSON.stringify(fullFieldNoteData)]
      );

      return res.status(201).json(fullFieldNoteData);
    } catch (error) {
      console.error("Error in POST /api/fieldnotes:", error);
      return res.status(500).json({ error: "Failed to create fieldnote" });
    }
  } else if (req.method === "PUT") {
    try {
      const { userEmail, userName, slug, id, ...updates } = req.body;

      if (!userEmail) {
        return res.status(400).json({ error: "User email is required" });
      }

      // Find the fieldnote by slug or id
      let query, params;
      if (slug) {
        query =
          "SELECT * FROM fieldnotes WHERE user_email = ? AND JSON_EXTRACT(json, '$.slug') = ?";
        params = [userEmail, slug];
      } else if (id) {
        query =
          "SELECT * FROM fieldnotes WHERE user_email = ? AND JSON_EXTRACT(json, '$.id') = ?";
        params = [userEmail, id];
      } else {
        return res.status(400).json({
          error: "Fieldnote identifier (slug or id) is required",
        });
      }

      const [rows] = await pool.query(query, params);

      if (rows.length === 0) {
        return res.status(404).json({ error: "Fieldnote not found" });
      }

      const row = rows[0];
      const existingFieldNote =
        typeof row.json === "string" ? JSON.parse(row.json) : row.json;

      // Update the fieldnote data
      const updatedFieldNote = {
        ...existingFieldNote,
        ...updates,
        by: userName || existingFieldNote.by || userEmail,
        updatedAt: new Date().toISOString(),
      };

      // Update in database
      await pool.query("UPDATE fieldnotes SET json = ? WHERE id = ?", [
        JSON.stringify(updatedFieldNote),
        row.id,
      ]);

      return res.status(200).json(updatedFieldNote);
    } catch (error) {
      console.error("Error in PUT /api/fieldnotes:", error);
      return res.status(500).json({ error: "Failed to update fieldnote" });
    }
  } else if (req.method === "DELETE") {
    try {
      const { userEmail, slug, id } = req.body;

      if (!userEmail) {
        return res.status(400).json({ error: "User email is required" });
      }

      // Find the fieldnote by slug or id
      let query, params;
      if (slug) {
        query =
          "SELECT id FROM fieldnotes WHERE user_email = ? AND JSON_EXTRACT(json, '$.slug') = ?";
        params = [userEmail, slug];
      } else if (id) {
        query =
          "SELECT id FROM fieldnotes WHERE user_email = ? AND JSON_EXTRACT(json, '$.id') = ?";
        params = [userEmail, id];
      } else {
        return res.status(400).json({
          error: "Fieldnote identifier (slug or id) is required",
        });
      }

      const [rows] = await pool.query(query, params);

      if (rows.length === 0) {
        return res.status(404).json({ error: "Fieldnote not found" });
      }

      // Delete from database
      await pool.query("DELETE FROM fieldnotes WHERE id = ?", [rows[0].id]);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error in DELETE /api/fieldnotes:", error);
      return res.status(500).json({ error: "Failed to delete fieldnote" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
