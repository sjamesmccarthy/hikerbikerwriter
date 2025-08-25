import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail");
    const includePublic = searchParams.get("includePublic");

    console.log(
      "GET /api/fieldnotes - userEmail:",
      userEmail,
      "includePublic:",
      includePublic
    );

    let allFieldnotes = [];

    if (
      userEmail &&
      userEmail !== "undefined" &&
      userEmail !== "" &&
      userEmail !== "null"
    ) {
      // Step 1: Get the user's person_id
      console.log("Looking up person_id for user:", userEmail);
      const [userRows] = await pool.execute(
        "SELECT person_id FROM users WHERE email = ?",
        [userEmail]
      );

      if (userRows.length > 0) {
        const personId = userRows[0].person_id;
        console.log("Found person_id:", personId);

        // Step 2: Get the familyline data for this person_id
        const [familyRows] = await pool.execute(
          "SELECT json FROM familyline WHERE person_id = ?",
          [personId]
        );

        let familyEmails = [];
        if (familyRows.length > 0) {
          console.log("Found familyline data");
          let familyData = familyRows[0].json;
          if (typeof familyData === "string") {
            familyData = JSON.parse(familyData);
          }

          // Step 3: Loop through each person in the family JSON and collect emails
          const familyMembers = familyData?.people || [];
          console.log("Family members found:", familyMembers.length);

          for (const person of familyMembers) {
            if (person.email && person.email !== userEmail) {
              familyEmails.push(person.email);
              console.log("Added family email:", person.email);
            }
          }
        }

        console.log("All family emails to check:", familyEmails);

        // Step 4: Get user's own field notes + public field notes (if requested)
        let query, params;
        if (includePublic === "true") {
          if (familyEmails.length > 0) {
            // If user has family, exclude family members from public notes to avoid duplicates
            const familyEmailPlaceholders = familyEmails
              .map(() => "?")
              .join(",");
            query = `SELECT * FROM fieldnotes WHERE user_email = ? OR (is_public = 1 AND user_email NOT IN (${familyEmailPlaceholders}))`;
            params = [userEmail, ...familyEmails];
          } else {
            // If no family, get user's notes + all public notes
            query =
              "SELECT * FROM fieldnotes WHERE user_email = ? OR is_public = 1";
            params = [userEmail];
          }
        } else {
          // Just user's own field notes
          query = "SELECT * FROM fieldnotes WHERE user_email = ?";
          params = [userEmail];
        }

        console.log("Step 4 Query:", query);
        console.log("Step 4 Params:", params);

        const [userAndPublicFieldnotes] = await pool.execute(query, params);
        allFieldnotes.push(...userAndPublicFieldnotes);
        console.log(
          "Found",
          userAndPublicFieldnotes.length,
          "user + public field notes"
        );

        // Step 5: For each family member email, get their shared_family field notes
        if (familyEmails.length > 0) {
          for (const familyEmail of familyEmails) {
            console.log(
              "Checking shared field notes for family member:",
              familyEmail
            );
            const [familyFieldnotes] = await pool.execute(
              "SELECT * FROM fieldnotes WHERE user_email = ? AND shared_family = 1",
              [familyEmail]
            );
            allFieldnotes.push(...familyFieldnotes);
            console.log(
              "Found",
              familyFieldnotes.length,
              "shared field notes from",
              familyEmail
            );
          }
        }

        // Sort all field notes by created date
        allFieldnotes.sort((a, b) => new Date(b.created) - new Date(a.created));
        console.log(
          "Total field notes after combining all sources:",
          allFieldnotes.length
        );
      } else {
        console.log("No user found with email:", userEmail);
        // Fallback: just get public field notes
        if (includePublic === "true") {
          const [publicFieldnotes] = await pool.execute(
            "SELECT * FROM fieldnotes WHERE is_public = 1 ORDER BY created DESC"
          );
          allFieldnotes = publicFieldnotes;
        }
      }
    } else {
      // Not logged in - get public field notes only
      const [publicFieldnotes] = await pool.execute(
        "SELECT * FROM fieldnotes WHERE is_public = 1 ORDER BY created DESC"
      );
      allFieldnotes = publicFieldnotes;
      console.log("Using public-only query");
    }

    // Parse the JSON data and add any missing fields for frontend compatibility
    const fieldnotes = allFieldnotes.map((row) => {
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
        author_email: fieldnote.author_email || row.user_email, // Add author_email field for backwards compatibility
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

    // Look up the user in the database to get their name
    let authorName = userName || userEmail; // fallback to userName or email
    try {
      const [userRows] = await pool.execute(
        "SELECT name FROM users WHERE email = ?",
        [userEmail]
      );

      if (userRows.length > 0) {
        authorName = userRows[0].name;
        console.log("Found user name from database:", authorName);
      } else {
        console.log("User not found in database, using fallback:", authorName);
      }
    } catch (dbError) {
      console.error("Error looking up user:", dbError);
      // Continue with fallback name
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
      by: authorName,
      author_email: userEmail,
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
        fieldNoteData.shared_family ? 1 : 0,
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

    // Look up the user in the database to get their name
    let authorName = userName || userEmail; // fallback to userName or email
    try {
      const [userRows] = await pool.execute(
        "SELECT name FROM users WHERE email = ?",
        [userEmail]
      );

      if (userRows.length > 0) {
        authorName = userRows[0].name;
        console.log("Found user name from database:", authorName);
      } else {
        console.log("User not found in database, using fallback:", authorName);
      }
    } catch (dbError) {
      console.error("Error looking up user:", dbError);
      // Continue with fallback name
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
      by: authorName,
      author_email: userEmail,
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
