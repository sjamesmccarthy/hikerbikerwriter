import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail");

    let query, params_array;

    if (userEmail) {
      // Logged in user - get fieldnote if:
      // 1. They own it OR
      // 2. It's public OR
      // 3. It's shared with family
      query = `
        SELECT * FROM fieldnotes 
        WHERE JSON_EXTRACT(json, '$.slug') = ?
        AND (
          user_email = ?
          OR is_public = 1
          OR shared_family = 1
        )`;
      params_array = [slug, userEmail];
    } else {
      // Not logged in - get public fieldnote only
      query = `
        SELECT * FROM fieldnotes 
        WHERE JSON_EXTRACT(json, '$.slug') = ?
        AND is_public = 1`;
      params_array = [slug];
    }

    console.log("Executing query:", {
      query,
      params: params_array,
      userEmail,
    });

    // First, check if the note exists at all
    const [allRows] = await pool.execute(
      "SELECT * FROM fieldnotes WHERE JSON_EXTRACT(json, '$.slug') = ?",
      [slug]
    );

    if (allRows.length === 0) {
      console.log("No field note found with slug:", slug);
      return NextResponse.json(
        { error: "Field note not found" },
        { status: 404 }
      );
    }

    // Now get the fieldnote with visibility checks
    const [rows] = await pool.execute(query, params_array);

    if (rows.length === 0) {
      console.log("Field note exists but not accessible:", {
        noteExists: true,
        isPublic: Boolean(allRows[0].is_public),
        sharedFamily: Boolean(allRows[0].shared_family),
        noteOwner: allRows[0].user_email,
        requestingUser: userEmail,
      });
      return NextResponse.json(
        { error: "Field note not accessible" },
        { status: 404 }
      );
    }

    // Check if row.json is already an object or needs parsing
    const fieldNote =
      typeof rows[0].json === "string"
        ? JSON.parse(rows[0].json)
        : rows[0].json;

    // Ensure compatibility with frontend expectations and use consistent field names
    const mergedFieldNote = {
      ...fieldNote,
      author: fieldNote.by || fieldNote.author || userEmail || "Anonymous",
      personalNotes: fieldNote.personalNotes || "",
      isFavorite: fieldNote.isFavorite || false,
      dateAdded: fieldNote.dateAdded || rows[0].created,
      is_public: Boolean(rows[0].is_public),
      shared_family: Boolean(rows[0].shared_family), // Use consistent field name
    };

    return NextResponse.json(mergedFieldNote);
  } catch (error) {
    console.error("Error reading field note:", error);
    return NextResponse.json(
      { error: "Failed to read field note" },
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

    // First, get the existing fieldnote
    const [existingRows] = await pool.execute(
      "SELECT * FROM fieldnotes WHERE user_email = ? AND JSON_EXTRACT(json, '$.slug') = ?",
      [userEmail, slug]
    );

    if (existingRows.length === 0) {
      return NextResponse.json(
        { error: "Field note not found" },
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
      "UPDATE fieldnotes SET is_public = ?, shared_family = ?, json = ? WHERE user_email = ? AND JSON_EXTRACT(json, '$.slug') = ?",
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
    console.error("Error updating field note:", error);
    return NextResponse.json(
      { error: "Failed to update field note" },
      { status: 500 }
    );
  }
}
