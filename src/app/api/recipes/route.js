import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const USERS_DIR = path.join(process.cwd(), "src", "data", "users");
const RECIPES_BASE_DIR = path.join(process.cwd(), "src", "data", "recipes");
const PUBLIC_RECIPES_FILE = path.join(USERS_DIR, "public-recipes.json");

function sanitizeEmail(email) {
  return email.replace(/[@.]/g, "_");
}

function getUserRecipesDir(userEmail) {
  return path.join(RECIPES_BASE_DIR, userEmail);
}

function getUserRecipesFile(userEmail) {
  const sanitizedEmail = sanitizeEmail(userEmail);
  return path.join(USERS_DIR, `${sanitizedEmail}-recipes.json`);
}

function readUserRecipes(userEmail) {
  const filePath = getUserRecipesFile(userEmail);
  if (!fs.existsSync(filePath)) return { recipes: [] };

  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch {
    return { recipes: [] };
  }
}

function readRecipeFile(slug, userEmail) {
  const userRecipesDir = getUserRecipesDir(userEmail);
  const filePath = path.join(userRecipesDir, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;

  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function writeRecipeFile(slug, recipeData, userEmail) {
  const userRecipesDir = getUserRecipesDir(userEmail);
  const filePath = path.join(userRecipesDir, `${slug}.json`);

  // Ensure directory exists
  if (!fs.existsSync(userRecipesDir)) {
    fs.mkdirSync(userRecipesDir, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(recipeData, null, 2));
}

function writeUserRecipes(userEmail, data) {
  const filePath = getUserRecipesFile(userEmail);

  // Ensure directory exists
  if (!fs.existsSync(USERS_DIR)) {
    fs.mkdirSync(USERS_DIR, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim("-");
}

function readPublicRecipes() {
  if (!fs.existsSync(PUBLIC_RECIPES_FILE)) return [];

  try {
    const data = fs.readFileSync(PUBLIC_RECIPES_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writePublicRecipes(recipes) {
  // Ensure directory exists
  if (!fs.existsSync(USERS_DIR)) {
    fs.mkdirSync(USERS_DIR, { recursive: true });
  }

  fs.writeFileSync(PUBLIC_RECIPES_FILE, JSON.stringify(recipes, null, 2));
}

function addToPublicRecipes(slug, userEmail, title, author) {
  const publicRecipes = readPublicRecipes();
  const existingIndex = publicRecipes.findIndex(
    (recipe) => recipe.slug === slug && recipe.userEmail === userEmail
  );

  const publicRecipe = {
    slug,
    userEmail,
    title,
    author,
    dateAdded: new Date().toISOString(),
  };

  if (existingIndex === -1) {
    publicRecipes.push(publicRecipe);
  } else {
    publicRecipes[existingIndex] = publicRecipe;
  }

  writePublicRecipes(publicRecipes);
}

function removeFromPublicRecipes(slug, userEmail) {
  const publicRecipes = readPublicRecipes();
  const filteredRecipes = publicRecipes.filter(
    (recipe) => !(recipe.slug === slug && recipe.userEmail === userEmail)
  );
  writePublicRecipes(filteredRecipes);
}

export async function GET(request) {
  try {
    // For now, we'll use a query parameter to identify the user
    // In production, you'd validate the session properly
    const url = new URL(request.url);
    const userEmail = url.searchParams.get("userEmail");

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email required" },
        { status: 400 }
      );
    }

    const userData = readUserRecipes(userEmail);
    const userRecipeRefs = userData.recipes || [];

    // Get full recipe data by looking up each reference
    const fullRecipes = userRecipeRefs
      .map((ref) => {
        const recipeData = readRecipeFile(ref.slug, userEmail);
        if (!recipeData) {
          // Recipe file not found, skip it
          return null;
        }

        // Merge recipe data with user-specific data
        return {
          ...recipeData,
          // User-specific overrides
          dateAdded: ref.dateAdded,
          personalNotes: ref.personalNotes || "",
          isFavorite: ref.isFavorite || false,
          userEmail: userEmail,
        };
      })
      .filter((recipe) => recipe !== null); // Remove null entries

    // Sort by date added (newest first)
    fullRecipes.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

    return NextResponse.json(fullRecipes);
  } catch (error) {
    console.error("Error reading recipes:", error);
    return NextResponse.json(
      { error: "Failed to read recipes" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      source,
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
    } = body;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email required" },
        { status: 400 }
      );
    }

    if (!title || !description || !ingredients || !steps) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const slug = generateSlug(title);
    const timestamp = Date.now();
    const id = timestamp;

    // Check if recipe file already exists and create unique slug if needed
    let finalSlug = slug;
    const userRecipesDir = getUserRecipesDir(userEmail);
    if (fs.existsSync(path.join(userRecipesDir, `${finalSlug}.json`))) {
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
      categories: categories || [],
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
      date: new Date().toISOString(),
    };

    // Save the recipe to individual file
    writeRecipeFile(finalSlug, recipeData, userEmail);

    // Handle public recipe index
    if (isPublic) {
      addToPublicRecipes(finalSlug, userEmail, title, userName || userEmail);
    }

    // Get user's existing recipe references
    const userData = readUserRecipes(userEmail);

    // Add reference to user's recipe list
    const recipeRef = {
      slug: finalSlug,
      dateAdded: new Date().toISOString(),
      personalNotes: "",
      isFavorite: false,
    };

    userData.recipes.unshift(recipeRef);

    // Save user data
    writeUserRecipes(userEmail, userData);

    // Return the full recipe data for the response
    const responseData = {
      ...recipeData,
      dateAdded: recipeRef.dateAdded,
      personalNotes: recipeRef.personalNotes,
      isFavorite: recipeRef.isFavorite,
      userEmail: userEmail,
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error("Error creating recipe:", error);
    return NextResponse.json(
      { error: "Failed to create recipe" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();

    const {
      id,
      slug,
      title,
      description,
      source,
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
      personalNotes,
      isFavorite,
    } = body;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email required" },
        { status: 400 }
      );
    }

    if (!id || !slug || !title || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update the recipe file
    const recipeData = {
      id,
      slug,
      title,
      description,
      source,
      type: type || "grill",
      recommendedPellets,
      categories: categories || [],
      photo,
      prepTime: prepTime || 0,
      cookTime: cookTime || 0,
      servings: servings || 1,
      ingredients: ingredients || [],
      steps: steps || [],
      myNotes: notes || "",
      author: body.userName || userEmail,
      favorite: favorite || false,
      public: isPublic || false,
      date: body.date || new Date().toISOString(),
    };

    writeRecipeFile(slug, recipeData, userEmail);

    // Handle public recipe index
    if (isPublic) {
      addToPublicRecipes(slug, userEmail, title, body.userName || userEmail);
    } else {
      removeFromPublicRecipes(slug, userEmail);
    }

    // Update user's recipe reference if personal data changed
    const userData = readUserRecipes(userEmail);
    const recipeRefIndex = userData.recipes.findIndex(
      (ref) => ref.slug === slug
    );

    if (recipeRefIndex !== -1) {
      // Update the reference with new personal data
      userData.recipes[recipeRefIndex] = {
        ...userData.recipes[recipeRefIndex],
        personalNotes: personalNotes || "",
        isFavorite: isFavorite || false,
      };

      writeUserRecipes(userEmail, userData);
    }

    // Return the full recipe data for the response
    const responseData = {
      ...recipeData,
      dateAdded:
        userData.recipes[recipeRefIndex]?.dateAdded || new Date().toISOString(),
      personalNotes: personalNotes || "",
      isFavorite: isFavorite || false,
      userEmail: userEmail,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error updating recipe:", error);
    return NextResponse.json(
      { error: "Failed to update recipe" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { slug, userEmail } = body;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email required" },
        { status: 400 }
      );
    }

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    // Get user's existing recipe references
    const userData = readUserRecipes(userEmail);
    const existingIndex = userData.recipes.findIndex(
      (ref) => ref.slug === slug
    );

    if (existingIndex === -1) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Remove the recipe reference from user's data
    userData.recipes.splice(existingIndex, 1);

    // Remove from public recipes if it was public
    removeFromPublicRecipes(slug, userEmail);

    // Save user data
    writeUserRecipes(userEmail, userData);

    // Note: We don't delete the recipe file itself as it might be used by other users

    return NextResponse.json({
      message: "Recipe removed from your collection successfully",
    });
  } catch (error) {
    console.error("Error removing recipe:", error);
    return NextResponse.json(
      { error: "Failed to remove recipe" },
      { status: 500 }
    );
  }
}
