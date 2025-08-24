import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail");
    const includePublic = searchParams.get("includePublic");

    let query, params;

    if (userEmail && includePublic === "true") {
      // Logged in user requesting both their own notes and public notes
      query =
        "SELECT * FROM fieldnotes WHERE user_email = ? OR is_public = 1 ORDER BY created DESC";
      params = [userEmail];
    } else if (userEmail) {
      // Logged in user - get their fieldnotes only
      query =
        "SELECT * FROM fieldnotes WHERE user_email = ? ORDER BY created DESC";
      params = [userEmail];
    } else {
      // Not logged in - get public fieldnotes only
      query =
        "SELECT * FROM fieldnotes WHERE is_public = 1 ORDER BY created DESC";
      params = [];
    }

    // Get fieldnotes from database based on login status
    const [rows] = await pool.execute(query, params);

    // Parse the JSON data and add any missing fields for frontend compatibility
    const fieldnotes = rows.map((row) => {
      // Check if row.json is already an object or needs parsing
      const fieldnote =
        typeof row.json === "string" ? JSON.parse(row.json) : row.json;
      return {
        ...fieldnote,
        id: fieldnote.id || row.id, // Use JSON id or fallback to database id
        is_public: Boolean(row.is_public), // Add is_public from database column
        shared_family: Boolean(row.shared_family), // Add shared_family from database column
        author:
          fieldnote.by || fieldnote.author || row.user_email || "Anonymous", // Map 'by' field to 'author'
        userEmail: row.user_email, // Add userEmail field for family filtering
      };
    });

    return NextResponse.json(fieldnotes);
  } catch (error) {
    console.error("Error in GET /api/fieldnotes:", error);
    return NextResponse.json(
      { error: "Failed to fetch fieldnotes" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { userEmail, userName, ...fieldNoteData } = await request.json();

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    // Generate ID and slug for new fieldnote
    const id = Date.now();
    const slug =
      fieldNoteData.slug ||
      `${fieldNoteData.title
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")}-${id}`;

    // Create complete fieldnote data
    const fullFieldNoteData = {
      id: id,
      slug: slug,
      title: fieldNoteData.title || "",
      content: fieldNoteData.content || "",
      by: userName || userEmail,
      tags: fieldNoteData.tags || "",
      mood: fieldNoteData.mood || "",
      images: fieldNoteData.images || [],
      date: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      personalNotes: fieldNoteData.personalNotes || "",
      isFavorite: fieldNoteData.isFavorite || false,
      dateAdded: new Date().toISOString(),
    };

    // Insert into database
    await pool.execute(
      "INSERT INTO fieldnotes (user_email, is_public, shared_family, json) VALUES (?, ?, ?, ?)",
      [
        userEmail,
        fieldNoteData.is_public || false,
        fieldNoteData.share_with_family ? 1 : 0,
        JSON.stringify(fullFieldNoteData),
      ]
    );

    return NextResponse.json(fullFieldNoteData, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/fieldnotes:", error);
    return NextResponse.json(
      { error: "Failed to create fieldnote" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { userEmail, userName, slug, id, ...updates } = await request.json();

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    // Find the fieldnote by slug or id
    let query, params;
    if (slug) {
      query =
        "SELECT * FROM fieldnotes WHERE user_email = ? AND JSON_EXTRACT(json, '$.slug') = ?";
      params = [userEmail, slug];
    } else if (id) {
      query =
        "SELECT * FROM fieldnotes WHERE user_email = ? AND JSON_EXTRACT(json, '$.id') = ?";
      params = [userEmail, id];
    } else {
      return NextResponse.json(
        { error: "Fieldnote identifier (slug or id) is required" },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute(query, params);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Fieldnote not found" },
        { status: 404 }
      );
    }

    const row = rows[0];
    const existingFieldNote =
      typeof row.json === "string" ? JSON.parse(row.json) : row.json;

    // Update the fieldnote data
    const updatedFieldNote = {
      ...existingFieldNote,
      ...updates,
      by: userName || existingFieldNote.by || userEmail,
      updatedAt: new Date().toISOString(),
    };

    // Update in database
    await pool.execute(
      "UPDATE fieldnotes SET json = ?, is_public = ?, shared_family = ? WHERE id = ?",
      [
        JSON.stringify(updatedFieldNote),
        updates.is_public !== undefined ? updates.is_public : row.is_public,
        updates.shared_family !== undefined
          ? updates.shared_family
          : row.shared_family,
        row.id,
      ]
    );

    return NextResponse.json(updatedFieldNote);
  } catch (error) {
    console.error("Error in PUT /api/fieldnotes:", error);
    return NextResponse.json(
      { error: "Failed to update fieldnote" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { userEmail, slug, id } = await request.json();

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    // Find the fieldnote by slug or id
    let query, params;
    if (slug) {
      query =
        "SELECT id FROM fieldnotes WHERE user_email = ? AND JSON_EXTRACT(json, '$.slug') = ?";
      params = [userEmail, slug];
    } else if (id) {
      query =
        "SELECT id FROM fieldnotes WHERE user_email = ? AND JSON_EXTRACT(json, '$.id') = ?";
      params = [userEmail, id];
    } else {
      return NextResponse.json(
        { error: "Fieldnote identifier (slug or id) is required" },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute(query, params);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Fieldnote not found" },
        { status: 404 }
      );
    }

    // Delete from database
    await pool.execute("DELETE FROM fieldnotes WHERE id = ?", [rows[0].id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/fieldnotes:", error);
    return NextResponse.json(
      { error: "Failed to delete fieldnote" },
      { status: 500 }
    );
  }
}
