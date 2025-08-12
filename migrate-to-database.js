import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

// Database configuration
const pool = mysql.createPool({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "root",
  database: "hikerbikerwriter",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Helper functions
function sanitizeEmail(email) {
  return email.replace(/[@.]/g, "_");
}

function getUserFieldNotesFile(userEmail) {
  const sanitizedEmail = sanitizeEmail(userEmail);
  return path.join(
    process.cwd(),
    "src",
    "data",
    "users",
    `${sanitizedEmail}-fieldnotes.json`
  );
}

function getUserRecipesFile(userEmail) {
  const sanitizedEmail = sanitizeEmail(userEmail);
  return path.join(
    process.cwd(),
    "src",
    "data",
    "users",
    `${sanitizedEmail}-recipes.json`
  );
}

function readFieldNoteFile(slug, userEmail) {
  try {
    const fieldNotesDir = path.join(
      process.cwd(),
      "src",
      "data",
      "fieldnotes",
      userEmail
    );
    const filePath = path.join(fieldNotesDir, `${slug}.json`);

    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error(`Error reading fieldnote file ${slug}:`, error);
    return null;
  }
}

function readRecipeFile(slug, userEmail) {
  try {
    const userRecipesDir = path.join(
      process.cwd(),
      "src",
      "data",
      "recipes",
      userEmail
    );
    const filePath = path.join(userRecipesDir, `${slug}.json`);
    if (!fs.existsSync(filePath)) return null;

    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading recipe file ${slug}:`, error);
    return null;
  }
}

async function migrateFieldNotes() {
  console.log("Starting fieldnotes migration...");

  const usersDir = path.join(process.cwd(), "src", "data", "users");
  if (!fs.existsSync(usersDir)) {
    console.log("No users directory found");
    return;
  }

  const userFiles = fs
    .readdirSync(usersDir)
    .filter((file) => file.endsWith("-fieldnotes.json"));

  for (const userFile of userFiles) {
    try {
      const userEmail = userFile
        .replace("-fieldnotes.json", "")
        .replace(/_/g, "_")
        .replace("hikerbikerwriter_gmail_com", "hikerbikerwriter@gmail.com");
      console.log(`Migrating fieldnotes for user: ${userEmail}`);

      const userData = JSON.parse(
        fs.readFileSync(path.join(usersDir, userFile), "utf8")
      );

      for (const userFieldNote of userData.fieldnotes || []) {
        const fullFieldNote = readFieldNoteFile(userFieldNote.slug, userEmail);

        if (fullFieldNote) {
          // Combine individual file data with user-specific data
          const combinedData = {
            ...fullFieldNote,
            personalNotes: userFieldNote.personalNotes || "",
            isFavorite: userFieldNote.isFavorite || false,
            dateAdded: userFieldNote.dateAdded || fullFieldNote.date,
          };

          // Insert into database
          await pool.execute(
            "INSERT INTO fieldnotes (user_email, json) VALUES (?, ?)",
            [userEmail, JSON.stringify(combinedData)]
          );

          console.log(`  Migrated fieldnote: ${fullFieldNote.slug}`);
        }
      }
    } catch (error) {
      console.error(`Error migrating fieldnotes for ${userFile}:`, error);
    }
  }

  console.log("Fieldnotes migration completed!");
}

async function migrateRecipes() {
  console.log("Starting recipes migration...");

  const usersDir = path.join(process.cwd(), "src", "data", "users");
  if (!fs.existsSync(usersDir)) {
    console.log("No users directory found");
    return;
  }

  const userFiles = fs
    .readdirSync(usersDir)
    .filter((file) => file.endsWith("-recipes.json"));

  for (const userFile of userFiles) {
    try {
      const userEmail = userFile
        .replace("-recipes.json", "")
        .replace(/_/g, "_")
        .replace("hikerbikerwriter_gmail_com", "hikerbikerwriter@gmail.com")
        .replace("public", "public");
      console.log(`Migrating recipes for user: ${userEmail}`);

      const userData = JSON.parse(
        fs.readFileSync(path.join(usersDir, userFile), "utf8")
      );

      for (const userRecipe of userData.recipes || []) {
        const fullRecipe = readRecipeFile(userRecipe.slug, userEmail);

        if (fullRecipe) {
          // Combine individual file data with user-specific data
          const combinedData = {
            ...fullRecipe,
            personalNotes: userRecipe.personalNotes || "",
            isFavorite: userRecipe.isFavorite || false,
            dateAdded: userRecipe.dateAdded || fullRecipe.date,
          };

          // Insert into database
          await pool.execute(
            "INSERT INTO recipes (user_email, json) VALUES (?, ?)",
            [userEmail, JSON.stringify(combinedData)]
          );

          console.log(`  Migrated recipe: ${fullRecipe.slug}`);
        }
      }
    } catch (error) {
      console.error(`Error migrating recipes for ${userFile}:`, error);
    }
  }

  console.log("Recipes migration completed!");
}

async function main() {
  try {
    console.log("Starting data migration from flat files to MySQL database...");

    await migrateFieldNotes();
    await migrateRecipes();

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pool.end();
  }
}

// Run the migration
main();
