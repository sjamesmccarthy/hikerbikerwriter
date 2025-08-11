const fs = require("fs");
const path = require("path");

const USERS_DIR = path.join(__dirname, "src", "data", "users");
const RECIPES_DIR = path.join(__dirname, "src", "data", "recipes");

function migrateUserRecipes() {
  console.log("Starting recipe migration...");

  // Get all user recipe files
  const userFiles = fs
    .readdirSync(USERS_DIR)
    .filter((file) => file.endsWith("-recipes.json"));

  for (const userFile of userFiles) {
    console.log(`\nMigrating ${userFile}...`);

    const userFilePath = path.join(USERS_DIR, userFile);
    const userData = JSON.parse(fs.readFileSync(userFilePath, "utf8"));

    if (!userData.recipes || userData.recipes.length === 0) {
      console.log(`  No recipes found in ${userFile}`);
      continue;
    }

    const newUserData = { recipes: [] };

    for (const recipe of userData.recipes) {
      // Check if this is already in the new format (has only reference data)
      if (!recipe.ingredients || !recipe.steps) {
        console.log(
          `  Recipe ${recipe.slug} already in new format, keeping as-is`
        );
        newUserData.recipes.push(recipe);
        continue;
      }

      console.log(`  Processing recipe: ${recipe.title} (${recipe.slug})`);

      // Create individual recipe file
      const recipeData = {
        id: recipe.id,
        slug: recipe.slug,
        title: recipe.title,
        description: recipe.description,
        type: recipe.type || "grill",
        recommendedPellets: recipe.recommendedPellets,
        categories: recipe.categories || [],
        photo: recipe.photo,
        prepTime: recipe.prepTime || 0,
        cookTime: recipe.cookTime || 0,
        servings: recipe.servings || 1,
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        myNotes: recipe.notes || recipe.myNotes || "",
        author: recipe.author || recipe.userName || "Unknown",
        favorite: recipe.favorite || false,
        date: recipe.date || new Date().toISOString(),
      };

      // Save individual recipe file
      const recipeFilePath = path.join(RECIPES_DIR, `${recipe.slug}.json`);
      if (!fs.existsSync(recipeFilePath)) {
        fs.writeFileSync(recipeFilePath, JSON.stringify(recipeData, null, 2));
        console.log(`    Created recipe file: ${recipe.slug}.json`);
      } else {
        console.log(`    Recipe file already exists: ${recipe.slug}.json`);
      }

      // Create user reference
      const userReference = {
        slug: recipe.slug,
        dateAdded: recipe.date || new Date().toISOString(),
        personalNotes: "", // Users can add these later
        isFavorite: recipe.favorite || false,
      };

      newUserData.recipes.push(userReference);
    }

    // Create backup of original file
    const backupPath = userFilePath + ".backup";
    fs.copyFileSync(userFilePath, backupPath);
    console.log(`  Created backup: ${userFile}.backup`);

    // Write new user data
    fs.writeFileSync(userFilePath, JSON.stringify(newUserData, null, 2));
    console.log(
      `  Updated user file with ${newUserData.recipes.length} recipe references`
    );
  }

  console.log("\nMigration completed!");
}

// Run migration
migrateUserRecipes();
