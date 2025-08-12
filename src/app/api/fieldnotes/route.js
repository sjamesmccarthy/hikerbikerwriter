import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail");

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    // Get all fieldnotes for the user from database
    const [rows] = await pool.execute(
      "SELECT * FROM fieldnotes WHERE user_email = ? ORDER BY created DESC",
      [userEmail]
    );

    // Parse the JSON data and add any missing fields for frontend compatibility
    const fieldnotes = rows.map((row) => {
      const fieldnote = JSON.parse(row.json);
      return {
        ...fieldnote,
        id: fieldnote.id || row.id, // Use JSON id or fallback to database id
        author: fieldnote.by || fieldnote.author || userEmail,
        personalNotes: fieldnote.personalNotes || "",
        isFavorite: fieldnote.isFavorite || false,
        dateAdded: fieldnote.dateAdded || row.created,
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
      "INSERT INTO fieldnotes (user_email, json) VALUES (?, ?)",
      [userEmail, JSON.stringify(fullFieldNoteData)]
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
    const existingFieldNote = JSON.parse(row.json);

    // Update the fieldnote data
    const updatedFieldNote = {
      ...existingFieldNote,
      ...updates,
      by: userName || existingFieldNote.by || userEmail,
      updatedAt: new Date().toISOString(),
    };

    // Update in database
    await pool.execute("UPDATE fieldnotes SET json = ? WHERE id = ?", [
      JSON.stringify(updatedFieldNote),
      row.id,
    ]);

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
