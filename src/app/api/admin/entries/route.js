import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../pages/api/auth/[...nextauth]";
import pool from "@/lib/db";

// Check if user is admin
async function checkAdminAuth() {
  try {
    console.log("Starting checkAdminAuth function...");
    console.log("Checking admin auth...");
    const session = await getServerSession(authOptions);
    console.log(
      "Session:",
      session ? { email: session.user?.email } : "No session"
    );

    if (!session?.user?.email) {
      console.log("No session or email found");
      return { error: "Not authenticated", status: 401 };
    }

    // Check if user is admin (checking if they're in the users table AND is_admin = 1)
    console.log("Checking if user is admin:", session.user.email);
    const [adminCheck] = await pool.execute(
      'SELECT id, is_admin FROM users WHERE email = ? AND oauth = "GOOGLE"',
      [session.user.email]
    );

    console.log("Admin check result:", adminCheck);

    if (!Array.isArray(adminCheck) || adminCheck.length === 0) {
      console.log("User not found in users table");
      return { error: "Access denied", status: 403 };
    }

    // Check if user has admin privileges
    if (adminCheck[0].is_admin !== 1) {
      console.log("User is not an admin (is_admin !== 1)");
      return { error: "Admin access required", status: 403 };
    }

    console.log("Admin auth successful");
    return { success: true, user: session.user };
  } catch (error) {
    console.error("Admin auth error:", error);
    return { error: "Authentication error", status: 500 };
  }
}

// Helper function to add common fields
const formatEntry = (entry, type, tableName) => ({
  ...entry,
  entryType: type,
  tableName: tableName,
  formattedDate: new Date(
    entry.created || entry.date_created || entry.createdAt
  ).toLocaleDateString(),
  title: entry.title || entry.name || `${type} Entry`,
  author: entry.author || entry.user_email || "Unknown",
  user_email: entry.user_email || null,
  isFavorite: Boolean(entry.is_favorite || entry.favorite),
  isPublic: Boolean(entry.is_public || entry.public),
});

// Build query conditions helper
const buildQueryConditions = (user, favorites) => {
  const conditions = [];
  const params = [];

  if (user) {
    conditions.push("user_email = ?");
    params.push(user);
  }

  if (favorites) {
    conditions.push("is_favorite = TRUE");
  }

  return { conditions, params };
};

// Fetch recipes helper
const fetchRecipes = async (user, favorites, sortBy) => {
  const { conditions, params } = buildQueryConditions(user, favorites);
  let query = "SELECT * FROM recipes";

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  // Try different date column names that might exist
  const possibleDateColumns = [
    "date_created",
    "created",
    "date_added",
    "created_at",
  ];
  let orderClause = " ORDER BY id " + (sortBy === "oldest" ? "ASC" : "DESC"); // fallback

  try {
    // Check what columns exist in the recipes table
    const [columns] = await pool.execute("DESCRIBE recipes");
    console.log(
      "Recipes table columns:",
      columns.map((col) => col.Field)
    );

    // Find the first available date column
    const availableDateColumn = possibleDateColumns.find((col) =>
      columns.some((dbCol) => dbCol.Field === col)
    );

    if (availableDateColumn) {
      orderClause =
        ` ORDER BY ${availableDateColumn} ` +
        (sortBy === "oldest" ? "ASC" : "DESC");
      console.log("Using date column:", availableDateColumn);
    } else {
      console.log("No date column found, using ID for sorting");
    }
  } catch (error) {
    console.error("Error checking recipes table schema:", error);
  }

  query += orderClause;
  console.log("Final recipes query:", query);

  try {
    const [recipes] = await pool.execute(query, params);
    console.log(`Found ${recipes.length} recipes`);
    return recipes.map((recipe) => {
      // Parse JSON data to extract title and other fields
      const parsedRecipe =
        typeof recipe.json === "string" ? JSON.parse(recipe.json) : recipe.json;
      return formatEntry(
        {
          ...recipe,
          title: parsedRecipe?.title || recipe.title || `Recipe ${recipe.id}`,
          author:
            parsedRecipe?.author ||
            recipe.author ||
            recipe.user_email ||
            "Unknown",
          created: recipe.created,
        },
        "Recipe",
        "recipes"
      );
    });
  } catch (error) {
    console.error("Error executing recipes query:", error);
    return []; // Return empty array on error
  }
};

// Fetch fieldnotes helper
const fetchFieldnotes = async (user, favorites, sortBy) => {
  const { conditions, params } = buildQueryConditions(user, favorites);
  let query = "SELECT * FROM fieldnotes";

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  // Try different date column names that might exist
  const possibleDateColumns = [
    "date_created",
    "created",
    "date_added",
    "created_at",
  ];
  let orderClause = " ORDER BY id " + (sortBy === "oldest" ? "ASC" : "DESC"); // fallback

  try {
    // Check what columns exist in the fieldnotes table
    const [columns] = await pool.execute("DESCRIBE fieldnotes");
    console.log(
      "Fieldnotes table columns:",
      columns.map((col) => col.Field)
    );

    // Find the first available date column
    const availableDateColumn = possibleDateColumns.find((col) =>
      columns.some((dbCol) => dbCol.Field === col)
    );

    if (availableDateColumn) {
      orderClause =
        ` ORDER BY ${availableDateColumn} ` +
        (sortBy === "oldest" ? "ASC" : "DESC");
      console.log("Using date column for fieldnotes:", availableDateColumn);
    }
  } catch (error) {
    console.error("Error checking fieldnotes table schema:", error);
  }

  query += orderClause;
  console.log("Final fieldnotes query:", query);

  try {
    const [fieldnotes] = await pool.execute(query, params);
    console.log(`Found ${fieldnotes.length} fieldnotes`);
    return fieldnotes.map((note) => {
      // Parse JSON data to extract title and other fields
      const parsedNote =
        typeof note.json === "string" ? JSON.parse(note.json) : note.json;
      return formatEntry(
        {
          ...note,
          title: parsedNote?.title || note.title || `Field Note ${note.id}`,
          author:
            parsedNote?.author || note.author || note.user_email || "Unknown",
          created: note.created,
        },
        "Field Note",
        "fieldnotes"
      );
    });
  } catch (error) {
    console.error("Error executing fieldnotes query:", error);
    return []; // Return empty array on error
  }
};

// Fetch rollnwrite helper
const fetchRollnwrite = async (user, favorites, sortBy) => {
  const conditions = [];
  const params = [];

  if (user) {
    conditions.push("user_email = ?");
    params.push(user);
  }

  if (favorites) {
    conditions.push("favorite = 1");
  }

  let query = "SELECT * FROM rollnwrite";

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY created " + (sortBy === "oldest" ? "ASC" : "DESC");

  const [rollnwrite] = await pool.execute(query, params);
  return rollnwrite.map((entry) => {
    const parsedEntry =
      typeof entry.json === "string" ? JSON.parse(entry.json) : entry.json;
    return formatEntry(
      {
        ...entry,
        title: parsedEntry?.title || `Roll & Write Entry ${entry.id}`,
        created: entry.created,
      },
      "Roll & Write",
      "rollnwrite"
    );
  });
};

export async function GET(request) {
  try {
    console.log("Admin entries API called");

    const authResult = await checkAdminAuth();
    console.log("Auth result:", authResult);

    if (authResult.error) {
      console.log("Auth failed:", authResult.error);
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    console.log("Auth bypassed, fetching entries");

    const { searchParams } = new URL(request.url);
    const app = searchParams.get("app");
    const user = searchParams.get("user");
    const sortBy = searchParams.get("sortBy") || "newest";
    const favorites = searchParams.get("favorites") === "true";

    console.log("Query params:", { app, user, sortBy, favorites });

    let entries = [];

    // Fetch entries based on app filter
    if (!app || app === "all" || app === "recipe") {
      console.log("Fetching recipes...");
      entries.push(...(await fetchRecipes(user, favorites, sortBy)));
    }

    if (!app || app === "all" || app === "field note") {
      console.log("Fetching fieldnotes...");
      entries.push(...(await fetchFieldnotes(user, favorites, sortBy)));
    }

    if (!app || app === "all" || app === "roll & write") {
      console.log("Fetching rollnwrite...");
      entries.push(...(await fetchRollnwrite(user, favorites, sortBy)));
    }

    console.log(`Fetched ${entries.length} total entries`);

    // Sort all entries if fetching from multiple tables
    if (!app || app === "all") {
      entries.sort((a, b) => {
        const dateA = new Date(a.created || a.date_created || a.createdAt);
        const dateB = new Date(b.created || b.date_created || b.createdAt);
        return sortBy === "oldest" ? dateA - dateB : dateB - dateA;
      });
    }

    // Get unique users for filter dropdown
    console.log("Fetching users list...");
    const [users] = await pool.execute(`
      SELECT DISTINCT user_email as email FROM (
        SELECT user_email FROM recipes WHERE user_email IS NOT NULL
        UNION
        SELECT user_email FROM fieldnotes WHERE user_email IS NOT NULL
        UNION 
        SELECT user_email FROM rollnwrite WHERE user_email IS NOT NULL
      ) as all_users ORDER BY user_email
    `);

    console.log(`Found ${users.length} unique users`);

    return NextResponse.json({
      entries,
      users: users.map((u) => u.email),
      totalCount: entries.length,
    });
  } catch (error) {
    console.error("Error fetching admin entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get("id");
    const tableName = searchParams.get("table");

    if (!entryId || !tableName) {
      return NextResponse.json(
        { error: "Missing entry ID or table name" },
        { status: 400 }
      );
    }

    // Validate table name for security
    const allowedTables = ["recipes", "fieldnotes", "rollnwrite"];
    if (!allowedTables.includes(tableName)) {
      return NextResponse.json(
        { error: "Invalid table name" },
        { status: 400 }
      );
    }

    // Delete the entry
    const [result] = await pool.execute(
      `DELETE FROM ${tableName} WHERE id = ?`,
      [entryId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Entry deleted from ${tableName}`,
    });
  } catch (error) {
    console.error("Error deleting entry:", error);
    return NextResponse.json(
      { error: "Failed to delete entry" },
      { status: 500 }
    );
  }
}
