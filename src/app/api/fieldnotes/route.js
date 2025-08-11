import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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
    const fieldNotesDir = path.join(
      process.cwd(),
      "src",
      "data",
      "fieldnotes",
      userEmail
    );
    const filePath = path.join(fieldNotesDir, `${slug}.json`);

    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error(`Error reading fieldnote file ${slug}:`, error);
    return null;
  }
}

function writeFieldNoteFile(slug, fieldNoteData, userEmail) {
  try {
    const fieldNotesDir = path.join(
      process.cwd(),
      "src",
      "data",
      "fieldnotes",
      userEmail
    );
    const filePath = path.join(fieldNotesDir, `${slug}.json`);

    // Ensure directory exists
    if (!fs.existsSync(fieldNotesDir)) {
      fs.mkdirSync(fieldNotesDir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(fieldNoteData, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing fieldnote file ${slug}:`, error);
    return false;
  }
}

function readUserFieldNotes(userEmail) {
  const filePath = getUserFieldNotesFile(userEmail);

  try {
    if (fs.existsSync(filePath)) {
      const userData = fs.readFileSync(filePath, "utf8");
      const userJson = JSON.parse(userData);

      // Check if this is old format (has full fieldnote data) and migrate
      if (userJson.fieldnotes && userJson.fieldnotes.length > 0) {
        const firstFieldNote = userJson.fieldnotes[0];
        if (firstFieldNote.content !== undefined) {
          // This is old format, migrate it
          console.log(
            "Migrating old format fieldnotes to reference-based format"
          );
          migrateUserFieldNotes(userEmail, userJson);
          // Re-read the migrated data
          const migratedData = fs.readFileSync(filePath, "utf8");
          return JSON.parse(migratedData);
        }
      }

      return userJson;
    }

    // Create empty user file if it doesn't exist
    const emptyData = { fieldnotes: [] };
    writeUserFieldNotes(userEmail, emptyData);
    return emptyData;
  } catch (error) {
    console.error("Error reading user fieldnotes:", error);
    return { fieldnotes: [] };
  }
}

function writeUserFieldNotes(userEmail, data) {
  const filePath = getUserFieldNotesFile(userEmail);
  const dir = path.dirname(filePath);

  // Ensure directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function migrateUserFieldNotes(userEmail, oldData) {
  try {
    const newUserData = { fieldnotes: [] };

    for (const fieldNote of oldData.fieldnotes) {
      // Write full fieldnote data to individual file
      const fullFieldNoteData = {
        id: fieldNote.id,
        slug: fieldNote.slug,
        title: fieldNote.title,
        content: fieldNote.content || "",
        tags: fieldNote.tags || "",
        mood: fieldNote.mood || "",
        images: fieldNote.images || [],
        date: fieldNote.date,
        updatedAt: fieldNote.updatedAt,
      };

      writeFieldNoteFile(fieldNote.slug, fullFieldNoteData, userEmail);

      // Add reference to user file
      newUserData.fieldnotes.push({
        slug: fieldNote.slug,
        dateAdded: fieldNote.date || new Date().toISOString(),
        personalNotes: "",
        isFavorite: false,
      });
    }

    writeUserFieldNotes(userEmail, newUserData);
    console.log(
      `Migrated ${oldData.fieldnotes.length} fieldnotes for user ${userEmail}`
    );
  } catch (error) {
    console.error("Error migrating user fieldnotes:", error);
  }
}

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

    const userData = readUserFieldNotes(userEmail);

    // Build complete fieldnotes by combining user references with individual files
    const fieldnotes = [];

    for (const userFieldNote of userData.fieldnotes || []) {
      const fullFieldNote = readFieldNoteFile(userFieldNote.slug, userEmail);

      if (fullFieldNote) {
        // Combine individual file data with user-specific data
        fieldnotes.push({
          ...fullFieldNote,
          author: fullFieldNote.by || fullFieldNote.author || "", // Map 'by' field to 'author' for frontend compatibility
          // Add user-specific metadata
          personalNotes: userFieldNote.personalNotes || "",
          isFavorite: userFieldNote.isFavorite || false,
          dateAdded: userFieldNote.dateAdded,
        });
      }
    }

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

    // Create complete fieldnote data for individual file
    const fullFieldNoteData = {
      id: id,
      slug: slug,
      title: fieldNoteData.title || "",
      content: fieldNoteData.content || "",
      by: userName || userEmail, // Use userName if available, fallback to email
      tags: fieldNoteData.tags || "",
      mood: fieldNoteData.mood || "",
      images: fieldNoteData.images || [],
      date: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Write to individual fieldnote file
    const success = writeFieldNoteFile(slug, fullFieldNoteData, userEmail);
    if (!success) {
      return NextResponse.json(
        { error: "Failed to create fieldnote file" },
        { status: 500 }
      );
    }

    // Add reference to user file
    const userData = readUserFieldNotes(userEmail);
    userData.fieldnotes.push({
      slug: slug,
      dateAdded: fullFieldNoteData.date,
      personalNotes: "",
      isFavorite: false,
    });

    writeUserFieldNotes(userEmail, userData);

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

    // Support both slug and id for backward compatibility
    let fieldNoteSlug = slug;

    if (!fieldNoteSlug && id) {
      // If no slug provided but id is provided, find the fieldnote by id
      // We need to look through the user's fieldnotes to find the slug
      const userData = readUserFieldNotes(userEmail);

      // Find the slug by looking through individual files for the matching id
      for (const userFieldNote of userData.fieldnotes || []) {
        const existingFieldNote = readFieldNoteFile(
          userFieldNote.slug,
          userEmail
        );
        if (existingFieldNote && existingFieldNote.id === id) {
          fieldNoteSlug = userFieldNote.slug;
          break;
        }
      }
    }

    if (!fieldNoteSlug) {
      return NextResponse.json(
        { error: "Fieldnote identifier (slug or id) is required" },
        { status: 400 }
      );
    }

    // Read the existing fieldnote from individual file
    const existingFieldNote = readFieldNoteFile(fieldNoteSlug, userEmail);

    if (!existingFieldNote) {
      return NextResponse.json(
        { error: "Fieldnote not found" },
        { status: 404 }
      );
    }

    // Update the fieldnote data
    const updatedFieldNote = {
      ...existingFieldNote,
      ...updates,
      // Update the 'by' field if userName is provided
      by: userName || existingFieldNote.by || userEmail,
      updatedAt: new Date().toISOString(),
    };

    // Write updated data to individual file
    const success = writeFieldNoteFile(
      fieldNoteSlug,
      updatedFieldNote,
      userEmail
    );
    if (!success) {
      return NextResponse.json(
        { error: "Failed to update fieldnote file" },
        { status: 500 }
      );
    }

    // Check if this is a user-specific update (personalNotes, isFavorite)
    if (
      updates.personalNotes !== undefined ||
      updates.isFavorite !== undefined
    ) {
      const userData = readUserFieldNotes(userEmail);
      const userFieldNoteIndex = userData.fieldnotes.findIndex(
        (fn) => fn.slug === fieldNoteSlug
      );

      if (userFieldNoteIndex !== -1) {
        if (updates.personalNotes !== undefined) {
          userData.fieldnotes[userFieldNoteIndex].personalNotes =
            updates.personalNotes;
        }
        if (updates.isFavorite !== undefined) {
          userData.fieldnotes[userFieldNoteIndex].isFavorite =
            updates.isFavorite;
        }
        writeUserFieldNotes(userEmail, userData);
      }
    }

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

    // Support both slug and id for backward compatibility
    let fieldNoteSlug = slug;

    if (!fieldNoteSlug && id) {
      // If no slug provided but id is provided, find the fieldnote by id
      const userData = readUserFieldNotes(userEmail);

      // Find the slug by looking through individual files for the matching id
      for (const userFieldNote of userData.fieldnotes || []) {
        const existingFieldNote = readFieldNoteFile(
          userFieldNote.slug,
          userEmail
        );
        if (existingFieldNote && existingFieldNote.id === id) {
          fieldNoteSlug = userFieldNote.slug;
          break;
        }
      }
    }

    if (!fieldNoteSlug) {
      return NextResponse.json(
        { error: "Fieldnote identifier (slug or id) is required" },
        { status: 400 }
      );
    }

    // Check if the individual fieldnote file exists
    const fieldNoteExists = readFieldNoteFile(fieldNoteSlug, userEmail);
    if (!fieldNoteExists) {
      return NextResponse.json(
        { error: "Fieldnote not found" },
        { status: 404 }
      );
    }

    // Remove reference from user file
    const userData = readUserFieldNotes(userEmail);
    const fieldNoteIndex = userData.fieldnotes.findIndex(
      (fn) => fn.slug === fieldNoteSlug
    );

    if (fieldNoteIndex !== -1) {
      userData.fieldnotes.splice(fieldNoteIndex, 1);
      writeUserFieldNotes(userEmail, userData);
    }

    // Delete the individual fieldnote file
    try {
      const fieldNotesDir = path.join(
        process.cwd(),
        "src",
        "data",
        "fieldnotes"
      );
      const filePath = path.join(fieldNotesDir, `${fieldNoteSlug}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Error deleting fieldnote file ${fieldNoteSlug}:`, error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/fieldnotes:", error);
    return NextResponse.json(
      { error: "Failed to delete fieldnote" },
      { status: 500 }
    );
  }
}
