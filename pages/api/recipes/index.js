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

      let allRecipes = [];

      if (
        userEmail &&
        userEmail !== "undefined" &&
        userEmail !== "" &&
        userEmail !== "null"
      ) {
        // Step 1: Get the user's person_id
        console.log("Looking up person_id for user:", userEmail);
        const [userRows] = await pool.query(
          "SELECT person_id FROM users WHERE email = ?",
          [userEmail]
        );

        if (userRows.length > 0) {
          const personId = userRows[0].person_id;
          console.log("Found person_id:", personId);

          // Step 2: Get the familyline data for this person_id
          const [familyRows] = await pool.query(
            "SELECT json FROM familyline WHERE person_id = ?",
            [personId]
          );

          let familyEmails = [];
          if (familyRows.length > 0) {
            console.log("Found familyline data");
            let familyData = familyRows[0].json;
            if (typeof familyData === "string") {
              familyData = JSON.parse(familyData);
            }

            // Step 3: Loop through each person in the family JSON and collect emails
            const familyMembers = familyData?.people || [];
            console.log("Family members found:", familyMembers.length);
            console.log(
              "Full family JSON:",
              JSON.stringify(familyData, null, 2)
            );

            for (const person of familyMembers) {
              console.log(
                "Processing family member:",
                JSON.stringify(person, null, 2)
              );
              if (person.email && person.email !== userEmail) {
                familyEmails.push(person.email);
                console.log("Added family email:", person.email);
              } else {
                console.log(
                  "Skipped person - email:",
                  person.email,
                  "userEmail:",
                  userEmail
                );
              }
            }
          }

          console.log("All family emails to check:", familyEmails);

          // Step 4: Get user's own recipes (all) + public recipes from non-family members
          let query, params;

          if (familyEmails.length > 0) {
            // If user has family, exclude family members from public recipes to avoid duplicates
            const familyEmailPlaceholders = familyEmails
              .map(() => "?")
              .join(",");
            query = `SELECT r.*, u.name as user_name FROM recipes r LEFT JOIN users u ON r.user_email = u.email WHERE r.user_email = ? OR (r.is_public = TRUE AND r.user_email NOT IN (${familyEmailPlaceholders}))`;
            params = [userEmail, ...familyEmails];
          } else {
            // If no family, get user's recipes + all public recipes
            query =
              "SELECT r.*, u.name as user_name FROM recipes r LEFT JOIN users u ON r.user_email = u.email WHERE r.user_email = ? OR r.is_public = TRUE";
            params = [userEmail];
          }

          console.log("Step 4 Query:", query);
          console.log("Step 4 Params:", params);

          const [userAndPublicRecipes] = await pool.query(query, params);
          allRecipes.push(...userAndPublicRecipes);
          console.log(
            "Found",
            userAndPublicRecipes.length,
            "user + public recipes"
          );

          // Step 5: For each family member email, get their shared_family recipes
          if (familyEmails.length > 0) {
            for (const familyEmail of familyEmails) {
              console.log(
                "Checking shared recipes for family member:",
                familyEmail
              );
              const familyQuery =
                "SELECT r.*, u.name as user_name FROM recipes r LEFT JOIN users u ON r.user_email = u.email WHERE r.user_email = ? AND r.shared_family = TRUE";
              console.log("Family Query:", familyQuery);
              console.log("Family Query Params:", [familyEmail]);

              const [familyRecipes] = await pool.query(familyQuery, [
                familyEmail,
              ]);
              console.log(
                "Found",
                familyRecipes.length,
                "shared recipes from",
                familyEmail
              );

              // Log details of found recipes
              familyRecipes.forEach((recipe) => {
                const recipeData =
                  typeof recipe.json === "string"
                    ? JSON.parse(recipe.json)
                    : recipe.json;
                console.log(
                  `  - Recipe: "${recipeData.title}" from ${recipe.user_email}, shared_family: ${recipe.shared_family}`
                );
              });

              allRecipes.push(...familyRecipes);
            }
          } else {
            console.log("No family emails found, skipping family recipe check");
          }

          // Sort all recipes by created date
          allRecipes.sort((a, b) => new Date(b.created) - new Date(a.created));
          console.log(
            "Total recipes after combining all sources:",
            allRecipes.length
          );
        } else {
          console.log("No user found with email:", userEmail);
          // Fallback: just get public recipes
          const [publicRecipes] = await pool.query(
            "SELECT r.*, u.name as user_name FROM recipes r LEFT JOIN users u ON r.user_email = u.email WHERE r.is_public = TRUE ORDER BY r.created DESC"
          );
          allRecipes = publicRecipes;
        }
      } else {
        // Not logged in: only get public recipes
        const [publicRecipes] = await pool.query(
          "SELECT r.*, u.name as user_name FROM recipes r LEFT JOIN users u ON r.user_email = u.email WHERE r.is_public = TRUE ORDER BY r.created DESC"
        );
        allRecipes = publicRecipes;
        console.log("Using public-only query");
      }

      // Parse the JSON data and add any missing fields for frontend compatibility
      const recipes = allRecipes.map((row) => {
        // Check if row.json is already an object or needs parsing
        const recipe =
          typeof row.json === "string" ? JSON.parse(row.json) : row.json;
        return {
          ...recipe,
          id: recipe.id || row.id, // Use JSON id or fallback to database id
          author: row.user_name || recipe.author || "Unknown", // Use current user name from database
          userEmail: recipe.userEmail || row.user_email, // Use recipe's actual owner
          dateAdded: recipe.dateAdded || row.created,
          personalNotes: userEmail ? recipe.personalNotes || "" : "", // Only show personal notes to the owner
          isFavorite:
            userEmail === row.user_email ? recipe.isFavorite || false : false, // Only show favorite status to owner
          public: row.is_public, // Use 'public' property to match frontend interface
          shared_family: row.shared_family, // Include shared_family property for frontend filtering
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
        category,
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
        familyPhoto,
        familyNotes,
      } = req.body;

      if (!userEmail) {
        return res.status(400).json({ error: "User email required" });
      }

      if (!title || !description || !ingredients || !steps) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Look up the user's name from the database
      const [userRows] = await pool.query(
        "SELECT name FROM users WHERE email = ?",
        [userEmail]
      );

      const authorName =
        userRows.length > 0 ? userRows[0].name : userName || userEmail;

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
        category: category || "Dinner",
        photo,
        prepTime: prepTime || 0,
        cookTime: cookTime || 0,
        servings: servings || 1,
        ingredients: ingredients || [],
        steps: steps || [],
        myNotes: notes || "",
        author: authorName,
        author_email: userEmail,
        favorite: favorite || false,
        public: isPublic || false,
        shared_family:
          req.body.shared_family === 1 || req.body.shared_family === true
            ? 1
            : 0,
        familyPhoto: familyPhoto || "",
        familyNotes: familyNotes || "",
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

      // Look up the user's name from the database
      const [userRows] = await pool.query(
        "SELECT name FROM users WHERE email = ?",
        [userEmail]
      );

      const authorName = userRows.length > 0 ? userRows[0].name : userEmail;

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
        category: category || existingRecipe.category || "Dinner",
        photo,
        prepTime: prepTime || 0,
        cookTime: cookTime || 0,
        servings: servings || 1,
        ingredients: ingredients || [],
        steps: steps || [],
        myNotes: notes || "",
        author: authorName,
        author_email: userEmail,
        favorite: favorite || false,
        public: isPublic || false,
        shared_family:
          req.body.shared_family === 1 || req.body.shared_family === true
            ? 1
            : 0,
        familyPhoto: familyPhoto || existingRecipe.familyPhoto || "",
        familyNotes: familyNotes || existingRecipe.familyNotes || "",
        date: req.body.date || existingRecipe.date,
        personalNotes: personalNotes || "",
        isFavorite: isFavorite || false,
        sourceTitle: sourceTitle || existingRecipe.sourceTitle || undefined,
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
