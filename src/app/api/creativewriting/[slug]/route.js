import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail");

    let query, params_array;

    if (userEmail) {
      // Logged in user - get creative writing entry if:
      // 1. They own it OR
      // 2. It's public OR
      // 3. It's shared with family
      query = `
        SELECT f.*, u.name as user_name FROM creativewriting f 
        LEFT JOIN users u ON f.user_email = u.email
        WHERE JSON_EXTRACT(f.json, '$.slug') = ?
        AND (
          f.user_email = ?
          OR f.is_public = 1
          OR f.shared_family = 1
        )`;
      params_array = [slug, userEmail];
    } else {
      // Not logged in - get public creative writing entry only
      query = `
        SELECT f.*, u.name as user_name FROM creativewriting f 
        LEFT JOIN users u ON f.user_email = u.email
        WHERE JSON_EXTRACT(f.json, '$.slug') = ?
        AND f.is_public = 1`;
      params_array = [slug];
    }

    console.log("Executing query:", {
      query,
      params: params_array,
      userEmail,
    });

    // First, check if the entry exists at all
    const [allRows] = await pool.execute(
      "SELECT * FROM creativewriting WHERE JSON_EXTRACT(json, '$.slug') = ?",
      [slug]
    );

    if (allRows.length === 0) {
      console.log("No creative writing entry found with slug:", slug);
      return NextResponse.json(
        { error: "Creative writing entry not found" },
        { status: 404 }
      );
    }

    // Now get the creative writing entry with visibility checks
    const [rows] = await pool.execute(query, params_array);

    if (rows.length === 0) {
      console.log("Creative writing entry exists but not accessible:", {
        entryExists: true,
        isPublic: Boolean(allRows[0].is_public),
        sharedFamily: Boolean(allRows[0].shared_family),
        entryOwner: allRows[0].user_email,
        requestingUser: userEmail,
      });
      return NextResponse.json(
        { error: "Creative writing entry not accessible" },
        { status: 404 }
      );
    }

    // Check if row.json is already an object or needs parsing
    const entry =
      typeof rows[0].json === "string"
        ? JSON.parse(rows[0].json)
        : rows[0].json;

    // Ensure compatibility with frontend expectations and use consistent field names
    const mergedEntry = {
      ...entry,
      author:
        rows[0].user_name ||
        entry.by ||
        entry.author ||
        userEmail ||
        "Anonymous",
      personalNotes: entry.personalNotes || "",
      isFavorite: entry.isFavorite || false,
      dateAdded: entry.dateAdded || rows[0].created,
      is_public: Boolean(rows[0].is_public),
      shared_family: Boolean(rows[0].shared_family), // Use consistent field name
      userEmail: rows[0].user_email, // Add userEmail so frontend can check ownership
    };

    console.log("Returning creative writing entry with ownership info:", {
      entryOwner: rows[0].user_email,
      requestingUser: userEmail,
      canEdit: rows[0].user_email === userEmail,
    });

    return NextResponse.json(mergedEntry);
  } catch (error) {
    console.error("Error reading creative writing entry:", error);
    return NextResponse.json(
      { error: "Failed to read creative writing entry" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { slug } = params;
    const updates = await request.json();
    const userEmail = updates.userEmail;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    // First, get the existing creative writing entry
    const [existingRows] = await pool.execute(
      "SELECT * FROM creativewriting WHERE user_email = ? AND JSON_EXTRACT(json, '$.slug') = ?",
      [userEmail, slug]
    );

    if (existingRows.length === 0) {
      return NextResponse.json(
        { error: "Creative writing entry not found" },
        { status: 404 }
      );
    }

    // Parse existing JSON
    const existingData = JSON.parse(existingRows[0].json);

    // Merge updates with existing data
    const updatedData = {
      ...existingData,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Update the database with consistent field names
    const isPublic = updates.is_public || false;
    // Accept either shared_family or share_with_family from frontend
    const sharedFamily =
      updates.shared_family || updates.share_with_family || false;

    await pool.execute(
      "UPDATE creativewriting SET is_public = ?, shared_family = ?, json = ? WHERE user_email = ? AND JSON_EXTRACT(json, '$.slug') = ?",
      [
        isPublic ? 1 : 0,
        sharedFamily ? 1 : 0,
        JSON.stringify({
          ...updatedData,
          is_public: isPublic,
          shared_family: sharedFamily, // Use consistent field name
        }),
        userEmail,
        slug,
      ]
    );

    return NextResponse.json(updatedData);
  } catch (error) {
    console.error("Error updating creative writing entry:", error);
    return NextResponse.json(
      { error: "Failed to update creative writing entry" },
      { status: 500 }
    );
  }
}
