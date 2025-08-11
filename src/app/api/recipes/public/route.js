import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const USERS_DIR = path.join(process.cwd(), "src", "data", "users");
const RECIPES_BASE_DIR = path.join(process.cwd(), "src", "data", "recipes");
const PUBLIC_RECIPES_FILE = path.join(USERS_DIR, "public-recipes.json");

function readPublicRecipes() {
  if (!fs.existsSync(PUBLIC_RECIPES_FILE)) return [];

  try {
    const data = fs.readFileSync(PUBLIC_RECIPES_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function readRecipeFile(slug, userEmail) {
  const userRecipesDir = path.join(RECIPES_BASE_DIR, userEmail);
  const filePath = path.join(userRecipesDir, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;

  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const publicRecipes = readPublicRecipes();

    // Get full recipe data for each public recipe
    const fullPublicRecipes = publicRecipes
      .map((publicRecipe) => {
        const recipeData = readRecipeFile(
          publicRecipe.slug,
          publicRecipe.userEmail
        );
        if (!recipeData) {
          // Recipe file not found, skip it
          return null;
        }

        // Return the full recipe data with public recipe metadata
        return {
          ...recipeData,
          dateAdded: publicRecipe.dateAdded,
          userEmail: publicRecipe.userEmail,
        };
      })
      .filter((recipe) => recipe !== null); // Remove null entries

    // Sort by date added (newest first)
    fullPublicRecipes.sort(
      (a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)
    );

    return NextResponse.json(fullPublicRecipes);
  } catch (error) {
    console.error("Error reading public recipes:", error);
    return NextResponse.json(
      { error: "Failed to read public recipes" },
      { status: 500 }
    );
  }
}
