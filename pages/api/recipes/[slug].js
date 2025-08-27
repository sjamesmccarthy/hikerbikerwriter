import pool from "../../../src/lib/db.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { slug } = req.query;
      const { userEmail } = req.query;

      if (!slug) {
        return res.status(400).json({ error: "Missing slug parameter" });
      }

      let canAccess = false;
      let familyEmails = [];

      // If user is logged in, get their family member emails
      if (
        userEmail &&
        userEmail !== "undefined" &&
        userEmail !== "" &&
        userEmail !== "null"
      ) {
        // Get the user's person_id
        const [userRows] = await pool.query(
          "SELECT person_id FROM users WHERE email = ?",
          [userEmail]
        );

        if (userRows.length > 0) {
          const personId = userRows[0].person_id;

          // Get the familyline data for this person_id
          const [familyRows] = await pool.query(
            "SELECT json FROM familyline WHERE person_id = ?",
            [personId]
          );

          if (familyRows.length > 0) {
            let familyData = familyRows[0].json;
            if (typeof familyData === "string") {
              familyData = JSON.parse(familyData);
            }

            // Collect family member emails
            const familyMembers = familyData?.people || [];
            for (const person of familyMembers) {
              if (person.email && person.email !== userEmail) {
                familyEmails.push(person.email);
              }
            }
          }
        }
      }

      // First try to find the recipe
      const findQuery =
        "SELECT r.*, u.name as user_name FROM recipes r LEFT JOIN users u ON r.user_email = u.email WHERE JSON_EXTRACT(r.json, '$.slug') = ?";
      const [rows] = await pool.query(findQuery, [slug]);

      if (rows.length === 0) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      const row = rows[0];
      const recipe =
        typeof row.json === "string" ? JSON.parse(row.json) : row.json;

      // Check access permissions
      if (
        userEmail &&
        userEmail !== "undefined" &&
        userEmail !== "" &&
        userEmail !== "null"
      ) {
        // User is logged in - check multiple access conditions
        const isOwner = userEmail === row.user_email;
        const isPublic = row.is_public === true || row.is_public === 1;
        const isFamilyShared =
          (row.shared_family === true || row.shared_family === 1) &&
          familyEmails.includes(row.user_email);

        canAccess = isOwner || isPublic || isFamilyShared;

        console.log("Access check for user:", userEmail, "slug:", slug);
        console.log("- isOwner:", isOwner);
        console.log("- isPublic:", isPublic);
        console.log("- isFamilyShared:", isFamilyShared);
        console.log("- familyEmails:", familyEmails);
        console.log("- recipe.user_email:", row.user_email);
        console.log("- canAccess:", canAccess);
      } else {
        // Not logged in: can only access public recipes
        canAccess = row.is_public === true || row.is_public === 1;
        console.log(
          "Public-only access for slug:",
          slug,
          "canAccess:",
          canAccess
        );
      }

      if (!canAccess) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      const isOwner = userEmail && userEmail === row.user_email;

      // Ensure compatibility with frontend expectations
      const responseData = {
        ...recipe,
        author: row.user_name || recipe.author || "Unknown", // Use current user name from database
        userEmail: recipe.userEmail || row.user_email,
        dateAdded: recipe.dateAdded || row.created,
        personalNotes: isOwner ? recipe.personalNotes || "" : "", // Only show personal notes to owner
        isFavorite: isOwner ? recipe.isFavorite || false : false, // Only show favorite status to owner
        isPublic: row.is_public, // Include public status
        shared_family: row.shared_family === 1 || row.shared_family === true, // Ensure boolean conversion
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
