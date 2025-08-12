 import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail");

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    // Get the fieldnote from database by slug
    const [rows] = await pool.execute(
      "SELECT * FROM fieldnotes WHERE user_email = ? AND JSON_EXTRACT(json, '$.slug') = ?",
      [userEmail, slug]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Field note not found" },
        { status: 404 }
      );
    }

    const fieldNote = JSON.parse(rows[0].json);

    // Ensure compatibility with frontend expectations
    const mergedFieldNote = {
      ...fieldNote,
      author: fieldNote.by || fieldNote.author || userEmail,
      personalNotes: fieldNote.personalNotes || "",
      isFavorite: fieldNote.isFavorite || false,
      dateAdded: fieldNote.dateAdded || rows[0].created,
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
