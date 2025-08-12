import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail");

    let query, params_array;

    if (userEmail) {
      // Logged in user - get their fieldnote
      query =
        "SELECT * FROM fieldnotes WHERE user_email = ? AND JSON_EXTRACT(json, '$.slug') = ?";
      params_array = [userEmail, slug];
    } else {
      // Not logged in - get public fieldnote only
      query =
        "SELECT * FROM fieldnotes WHERE is_public = 1 AND JSON_EXTRACT(json, '$.slug') = ?";
      params_array = [slug];
    }

    // Get the fieldnote from database by slug
    const [rows] = await pool.execute(query, params_array);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Field note not found" },
        { status: 404 }
      );
    }

    // Check if row.json is already an object or needs parsing
    const fieldNote =
      typeof rows[0].json === "string"
        ? JSON.parse(rows[0].json)
        : rows[0].json;

    // Ensure compatibility with frontend expectations
    const mergedFieldNote = {
      ...fieldNote,
      author: fieldNote.by || fieldNote.author || userEmail || "Anonymous",
      personalNotes: fieldNote.personalNotes || "",
      isFavorite: fieldNote.isFavorite || false,
      dateAdded: fieldNote.dateAdded || rows[0].created,
      is_public: Boolean(rows[0].is_public), // Add is_public from database column
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
