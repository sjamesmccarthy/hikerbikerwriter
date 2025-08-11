import fs from "fs";
import path from "path";

// Configuration
const USER_EMAIL = "hikerbikerwriter@gmail.com";
const DATA_DIR = path.join(process.cwd(), "src", "data");
const USERS_DIR = path.join(DATA_DIR, "users");

function sanitizeEmail(email) {
  return email.replace(/[^a-zA-Z0-9@.-]/g, "").replace(/\./g, "_");
}

function getUserDataFile(userEmail, type) {
  const sanitizedEmail = sanitizeEmail(userEmail);
  return path.join(USERS_DIR, `${sanitizedEmail}-${type}.json`);
}

async function migrateData() {
  console.log("Starting data migration...");

  // Ensure users directory exists
  if (!fs.existsSync(USERS_DIR)) {
    fs.mkdirSync(USERS_DIR, { recursive: true });
  }

  // Migrate fieldnotes
  try {
    const fieldNotesPath = path.join(DATA_DIR, "fieldNotes.json");
    if (fs.existsSync(fieldNotesPath)) {
      const fieldNotesData = JSON.parse(
        fs.readFileSync(fieldNotesPath, "utf8")
      );

      // Load individual fieldnote files
      const fieldNotesDir = path.join(DATA_DIR, "fieldnotes");
      const fullFieldNotes = [];

      if (fs.existsSync(fieldNotesDir)) {
        for (const fieldNoteRef of fieldNotesData.fieldnotes || []) {
          const fieldNoteFile = path.join(
            fieldNotesDir,
            `${fieldNoteRef.slug}.json`
          );
          if (fs.existsSync(fieldNoteFile)) {
            const fullFieldNote = JSON.parse(
              fs.readFileSync(fieldNoteFile, "utf8")
            );
            fullFieldNotes.push({
              ...fullFieldNote,
              userEmail: USER_EMAIL,
              author: fullFieldNote.author || "James M",
            });
          }
        }
      }

      // Save to user-specific file
      const userFieldNotesFile = getUserDataFile(USER_EMAIL, "fieldnotes");
      fs.writeFileSync(
        userFieldNotesFile,
        JSON.stringify({ fieldnotes: fullFieldNotes }, null, 2)
      );
      console.log(`✅ Migrated ${fullFieldNotes.length} fieldnotes`);
    }
  } catch (error) {
    console.error("Error migrating fieldnotes:", error);
  }

  // Migrate recipes
  try {
    const recipesPath = path.join(DATA_DIR, "recipes.json");
    if (fs.existsSync(recipesPath)) {
      const recipesData = JSON.parse(fs.readFileSync(recipesPath, "utf8"));

      // Load individual recipe files
      const recipesDir = path.join(DATA_DIR, "recipes");
      const fullRecipes = [];

      if (fs.existsSync(recipesDir)) {
        for (const recipeRef of recipesData.recipes || []) {
          const recipeFile = path.join(recipesDir, `${recipeRef.slug}.json`);
          if (fs.existsSync(recipeFile)) {
            const fullRecipe = JSON.parse(fs.readFileSync(recipeFile, "utf8"));
            fullRecipes.push({
              ...fullRecipe,
              userEmail: USER_EMAIL,
              author: fullRecipe.author || "James M",
            });
          } else {
            // If no individual file exists, use the data from the index
            fullRecipes.push({
              ...recipeRef,
              userEmail: USER_EMAIL,
              author: recipeRef.author || "James M",
            });
          }
        }
      }

      // Save to user-specific file
      const userRecipesFile = getUserDataFile(USER_EMAIL, "recipes");
      fs.writeFileSync(
        userRecipesFile,
        JSON.stringify({ recipes: fullRecipes }, null, 2)
      );
      console.log(`✅ Migrated ${fullRecipes.length} recipes`);
    }
  } catch (error) {
    console.error("Error migrating recipes:", error);
  }

  console.log("Migration completed!");
  console.log(`Data migrated for user: ${USER_EMAIL}`);
  console.log(`Files created in: ${USERS_DIR}`);
}

// Run the migration
migrateData().catch(console.error);
