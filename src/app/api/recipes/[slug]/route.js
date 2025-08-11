import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const RECIPES_BASE_DIR = path.join(process.cwd(), "src", "data", "recipes");

function getUserRecipesDir(userEmail) {
  return path.join(RECIPES_BASE_DIR, userEmail);
}

function readRecipeFile(slug, userEmail) {
  const userRecipesDir = getUserRecipesDir(userEmail);
  const filePath = path.join(userRecipesDir, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  const data = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    // Get userEmail from query parameters
    const url = new URL(request.url);
    const userEmail = url.searchParams.get("userEmail");

    if (!slug) {
      return NextResponse.json(
        { error: "Missing slug parameter" },
        { status: 400 }
      );
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email required" },
        { status: 400 }
      );
    }

    const recipe = readRecipeFile(slug, userEmail);

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Error reading recipe:", error);
    return NextResponse.json(
      { error: "Failed to read recipe" },
      { status: 500 }
    );
  }
}
