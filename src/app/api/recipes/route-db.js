import { NextResponse } from "next/server";
import pool from "../../../lib/db";

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim("-");
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const userEmail = url.searchParams.get("userEmail");

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email required" },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute(
      `SELECT 
        id, slug, title, description, source, type, recommended_pellets,
        categories, photo, prep_time, cook_time, servings, ingredients,
        steps, my_notes, author, favorite, public, date_created,
        personal_notes, is_favorite, date_added
       FROM recipes 
       WHERE user_email = ? 
       ORDER BY date_added DESC`,
      [userEmail]
    );

    // Parse JSON fields
    const recipes = rows.map(recipe => ({
      ...recipe,
      categories: recipe.categories ? JSON.parse(recipe.categories) : [],
      ingredients: recipe.ingredients ? JSON.parse(recipe.ingredients) : [],
      steps: recipe.steps ? JSON.parse(recipe.steps) : [],
      dateAdded: recipe.date_added,
      personalNotes: recipe.personal_notes || "",
      isFavorite: Boolean(recipe.is_favorite),
      userEmail: userEmail,
      // Map database fields to expected API response format
      prepTime: recipe.prep_time,
      cookTime: recipe.cook_time,
      myNotes: recipe.my_notes,
      recommendedPellets: recipe.recommended_pellets,
      public: Boolean(recipe.public),
      date: recipe.date_created
    }));

    return NextResponse.json(recipes);
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
    
    // Check if recipe with same slug exists for this user
    const [existingRecipes] = await pool.execute(
      "SELECT id FROM recipes WHERE slug = ? AND user_email = ?",
      [slug, userEmail]
    );
    
    const finalSlug = existingRecipes.length > 0 ? `${slug}-${timestamp}` : slug;

    // Insert recipe into database
    const [result] = await pool.execute(
      `INSERT INTO recipes (
        slug, title, description, source, type, recommended_pellets,
        categories, photo, prep_time, cook_time, servings, ingredients,
        steps, my_notes, author, favorite, public, user_email,
        date_created, date_added, personal_notes, is_favorite
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), '', ?)`,
      [
        finalSlug,
        title,
        description,
        source || null,
        type || "grill",
        recommendedPellets || null,
        JSON.stringify(categories || []),
        photo || null,
        prepTime || 0,
        cookTime || 0,
        servings || 1,
        JSON.stringify(ingredients || []),
        JSON.stringify(steps || []),
        notes || "",
        userName || userEmail,
        Boolean(favorite),
        Boolean(isPublic),
        userEmail,
        Boolean(favorite) // is_favorite matches favorite initially
      ]
    );

    // If public, add to public recipes table
    if (isPublic) {
      await pool.execute(
        `INSERT INTO public_recipes (slug, user_email, title, author, date_added)
         VALUES (?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE title = VALUES(title), author = VALUES(author)`,
        [finalSlug, userEmail, title, userName || userEmail]
      );
    }

    // Return the created recipe
    const responseData = {
      id: result.insertId,
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
      dateAdded: new Date().toISOString(),
      personalNotes: "",
      isFavorite: favorite || false,
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

    // Update the recipe
    await pool.execute(
      `UPDATE recipes SET
        title = ?, description = ?, source = ?, type = ?, recommended_pellets = ?,
        categories = ?, photo = ?, prep_time = ?, cook_time = ?, servings = ?,
        ingredients = ?, steps = ?, my_notes = ?, favorite = ?, public = ?,
        personal_notes = ?, is_favorite = ?
       WHERE id = ? AND user_email = ?`,
      [
        title,
        description,
        source || null,
        type || "grill",
        recommendedPellets || null,
        JSON.stringify(categories || []),
        photo || null,
        prepTime || 0,
        cookTime || 0,
        servings || 1,
        JSON.stringify(ingredients || []),
        JSON.stringify(steps || []),
        notes || "",
        Boolean(favorite),
        Boolean(isPublic),
        personalNotes || "",
        Boolean(isFavorite),
        id,
        userEmail
      ]
    );

    // Handle public recipe index
    if (isPublic) {
      await pool.execute(
        `INSERT INTO public_recipes (slug, user_email, title, author, date_added)
         VALUES (?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE title = VALUES(title), author = VALUES(author)`,
        [slug, userEmail, title, body.userName || userEmail]
      );
    } else {
      await pool.execute(
        "DELETE FROM public_recipes WHERE slug = ? AND user_email = ?",
        [slug, userEmail]
      );
    }

    // Return updated recipe data
    const responseData = {
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
      dateAdded: new Date().toISOString(),
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

    // Delete from recipes table
    const [result] = await pool.execute(
      "DELETE FROM recipes WHERE slug = ? AND user_email = ?",
      [slug, userEmail]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Remove from public recipes
    await pool.execute(
      "DELETE FROM public_recipes WHERE slug = ? AND user_email = ?",
      [slug, userEmail]
    );

    return NextResponse.json({
      message: "Recipe deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    return NextResponse.json(
      { error: "Failed to delete recipe" },
      { status: 500 }
    );
  }
}
