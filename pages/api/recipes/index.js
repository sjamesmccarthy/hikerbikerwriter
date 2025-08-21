import pool from "../../../src/lib/db.js";

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim("-");
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { userEmail } = req.query;

      // Add some debugging for production
      console.log(
        "GET /api/recipes - userEmail:",
        userEmail,
        "type:",
        typeof userEmail
      );

      let query;
      let params;

      if (
        userEmail &&
        userEmail !== "undefined" &&
        userEmail !== "" &&
        userEmail !== "null"
      ) {
        // Logged in user: get their recipes + public recipes
        query =
          "SELECT * FROM recipes WHERE user_email = ? OR is_public = TRUE ORDER BY created DESC";
        params = [userEmail];
        console.log("Using authenticated query for user:", userEmail);
        console.log("Query:", query);
      } else {
        // Not logged in: only get public recipes
        query =
          "SELECT * FROM recipes WHERE is_public = TRUE ORDER BY created DESC";
        params = [];
        console.log("Using public-only query");
      }

      // Get recipes from database
      const [rows] = await pool.query(query, params);

      // Parse the JSON data and add any missing fields for frontend compatibility
      const recipes = rows.map((row) => {
        // Check if row.json is already an object or needs parsing
        const recipe =
          typeof row.json === "string" ? JSON.parse(row.json) : row.json;
        return {
          ...recipe,
          id: recipe.id || row.id, // Use JSON id or fallback to database id
          userEmail: recipe.userEmail || row.user_email, // Use recipe's actual owner
          dateAdded: recipe.dateAdded || row.created,
          personalNotes: userEmail ? recipe.personalNotes || "" : "", // Only show personal notes to the owner
          isFavorite:
            userEmail === row.user_email ? recipe.isFavorite || false : false, // Only show favorite status to owner
          isPublic: row.is_public, // Add public status for frontend
        };
      });

      console.log("Returning", recipes.length, "recipes");
      recipes.forEach((recipe) => console.log("Recipe title:", recipe.title));
      return res.status(200).json(recipes);
    } catch (error) {
      console.error("Error reading recipes:", error);
      // Always return an array, even on error, to prevent frontend issues
      return res.status(200).json([]);
    }
  } else if (req.method === "POST") {
    try {
      const {
        title,
        description,
        source,
        sourceTitle,
        type,
        recommendedPellets,
        categories,
        photo,
        prepTime,
        cookTime,
        servings,
        ingredients,
        steps,
        notes,
        favorite,
        public: isPublic,
        userEmail,
        userName,
      } = req.body;

      if (!userEmail) {
        return res.status(400).json({ error: "User email required" });
      }

      if (!title || !description || !ingredients || !steps) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const slug = generateSlug(title);
      const timestamp = Date.now();
      const id = timestamp;

      // Check if recipe with this slug already exists for this user and create unique slug if needed
      const [existingRows] = await pool.query(
        "SELECT id FROM recipes WHERE user_email = ? AND JSON_EXTRACT(json, '$.slug') = ?",
        [userEmail, slug]
      );

      let finalSlug = slug;
      if (existingRows.length > 0) {
        finalSlug = `${slug}-${timestamp}`;
      }

      // Create the full recipe data
      const recipeData = {
        id,
        slug: finalSlug,
        title,
        description,
        source,
        type: type || "grill",
        recommendedPellets,
        category: req.body.category || "Dinner",
        photo,
        prepTime: prepTime || 0,
        cookTime: cookTime || 0,
        servings: servings || 1,
        ingredients: ingredients || [],
        steps: steps || [],
        myNotes: notes || "",
        author: userName || userEmail,
        favorite: favorite || false,
        public: isPublic || false,
        shared_family:
          req.body.shared_family === 1 || req.body.shared_family === true
            ? 1
            : 0,
        familyPhoto: req.body.familyPhoto || "",
        familyNotes: req.body.familyNotes || "",
        date: new Date().toISOString(),
        dateAdded: new Date().toISOString(),
        personalNotes: "",
        isFavorite: false,
        sourceTitle: sourceTitle || undefined,
      };

      // Insert into database
      await pool.query(
        "INSERT INTO recipes (user_email, json, is_public, shared_family) VALUES (?, ?, ?, ?)",
        [
          userEmail,
          JSON.stringify(recipeData),
          isPublic || false,
          recipeData.shared_family,
        ]
      );

      // Return the full recipe data for the response
      const responseData = {
        ...recipeData,
        userEmail: userEmail,
      };

      return res.status(201).json(responseData);
    } catch (error) {
      console.error("Error creating recipe:", error);
      return res.status(500).json({ error: "Failed to create recipe" });
    }
  } else if (req.method === "PUT") {
    try {
      const {
        id,
        slug,
        title,
        description,
        source,
        sourceTitle,
        type,
        recommendedPellets,
        category, // Changed from categories to category
        photo,
        prepTime,
        cookTime,
        servings,
        ingredients,
        steps,
        notes,
        favorite,
        public: isPublic,
        familyPhoto,
        familyNotes,
        userEmail,
        personalNotes,
        isFavorite,
      } = req.body;

      if (!userEmail) {
        return res.status(400).json({ error: "User email required" });
      }

      if (!id || !slug || !title || !description) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Find the recipe by slug
      const [rows] = await pool.query(
        "SELECT * FROM recipes WHERE user_email = ? AND JSON_EXTRACT(json, '$.slug') = ?",
        [userEmail, slug]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      const row = rows[0];
      const existingRecipe =
        typeof row.json === "string" ? JSON.parse(row.json) : row.json;

      // Update the recipe data
      const updatedRecipe = {
        ...existingRecipe,
        id,
        slug,
        title,
        description,
        source,
        type: type || "grill",
        recommendedPellets,
        category: req.body.category || existingRecipe.category || "Dinner",
        photo,
        prepTime: prepTime || 0,
        cookTime: cookTime || 0,
        servings: servings || 1,
        ingredients: ingredients || [],
        steps: steps || [],
        myNotes: notes || "",
        author: req.body.userName || userEmail,
        favorite: favorite || false,
        public: isPublic || false,
        shared_family:
          req.body.shared_family === 1 || req.body.shared_family === true
            ? 1
            : 0,
        familyPhoto: req.body.familyPhoto || existingRecipe.familyPhoto || "",
        familyNotes: req.body.familyNotes || existingRecipe.familyNotes || "",
        date: req.body.date || existingRecipe.date,
        personalNotes: personalNotes || "",
        isFavorite: isFavorite || false,
        sourceTitle:
          req.body.sourceTitle || existingRecipe.sourceTitle || undefined,
      };

      // Update in database
      await pool.query(
        "UPDATE recipes SET json = ?, is_public = ?, shared_family = ? WHERE id = ?",
        [
          JSON.stringify(updatedRecipe),
          isPublic || false,
          updatedRecipe.shared_family,
          row.id,
        ]
      );

      // Return the full recipe data for the response
      const responseData = {
        ...updatedRecipe,
        userEmail: userEmail,
      };

      return res.status(200).json(responseData);
    } catch (error) {
      console.error("Error updating recipe:", error);
      return res.status(500).json({ error: "Failed to update recipe" });
    }
  } else if (req.method === "DELETE") {
    try {
      const { slug, userEmail } = req.body;

      if (!userEmail) {
        return res.status(400).json({ error: "User email required" });
      }

      if (!slug) {
        return res.status(400).json({ error: "Missing slug" });
      }

      // Find the recipe by slug
      const [rows] = await pool.query(
        "SELECT id FROM recipes WHERE user_email = ? AND JSON_EXTRACT(json, '$.slug') = ?",
        [userEmail, slug]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      // Delete from database
      await pool.query("DELETE FROM recipes WHERE id = ?", [rows[0].id]);

      return res.status(200).json({
        message: "Recipe removed from your collection successfully",
      });
    } catch (error) {
      console.error("Error removing recipe:", error);
      return res.status(500).json({ error: "Failed to remove recipe" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
