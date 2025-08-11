import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const FIELDNOTES_DIR = path.join(process.cwd(), "src", "data", "fieldnotes");

function sanitizeEmail(email) {
  return email.replace(/[@.]/g, "_");
}

function getUserFieldNotesFile(userEmail) {
  const sanitizedEmail = sanitizeEmail(userEmail);
  return path.join(
    process.cwd(),
    "src",
    "data",
    "users",
    `${sanitizedEmail}-fieldnotes.json`
  );
}

function readFieldNoteFile(slug, userEmail) {
  try {
    const filePath = path.join(FIELDNOTES_DIR, userEmail, `${slug}.json`);
    if (!fs.existsSync(filePath)) return null;

    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading fieldnote file ${slug}:`, error);
    return null;
  }
}

function getUserFieldNoteData(slug, userEmail) {
  try {
    if (!userEmail) return null;

    const userFilePath = getUserFieldNotesFile(userEmail);
    if (!fs.existsSync(userFilePath)) return null;

    const userData = fs.readFileSync(userFilePath, "utf8");
    const userJson = JSON.parse(userData);

    return userJson.fieldnotes?.find((fn) => fn.slug === slug) || null;
  } catch (error) {
    console.error("Error reading user fieldnote data:", error);
    return null;
  }
}

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail");

    // Get the complete fieldnote data from individual file
    const fieldNote = readFieldNoteFile(slug, userEmail);

    if (!fieldNote) {
      return NextResponse.json(
        { error: "Field note not found" },
        { status: 404 }
      );
    }

    // Get user-specific data (personalNotes, isFavorite) if userEmail provided
    const userFieldNoteData = getUserFieldNoteData(slug, userEmail);

    // Merge fieldnote data with user-specific data
    const mergedFieldNote = {
      ...fieldNote,
      author: fieldNote.by || fieldNote.author || "", // Map 'by' field to 'author' for frontend compatibility
      personalNotes: userFieldNoteData?.personalNotes || "",
      isFavorite: userFieldNoteData?.isFavorite || false,
      dateAdded: userFieldNoteData?.dateAdded,
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
