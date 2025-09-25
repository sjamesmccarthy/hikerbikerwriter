import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail");
    const includePublic = searchParams.get("includePublic");

    console.log(
      "GET /api/creativewriting - userEmail:",
      userEmail,
      "includePublic:",
      includePublic
    );

    let allCreativeWriting = [];

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

        // Step 4: Get user's own creative writing + public entries (if requested)
        let query, params;
        if (includePublic === "true") {
          if (familyEmails.length > 0) {
            // If user has family, exclude family members from public notes to avoid duplicates
            const familyEmailPlaceholders = familyEmails
              .map(() => "?")
              .join(",");
            query = `SELECT f.*, u.name as user_name FROM creativewriting f LEFT JOIN users u ON f.user_email = u.email WHERE f.user_email = ? OR (f.is_public = 1 AND f.user_email NOT IN (${familyEmailPlaceholders}))`;
            params = [userEmail, ...familyEmails];
          } else {
            // If no family, get user's entries + all public entries
            query =
              "SELECT f.*, u.name as user_name FROM creativewriting f LEFT JOIN users u ON f.user_email = u.email WHERE f.user_email = ? OR f.is_public = 1";
            params = [userEmail];
          }
        } else {
          // Just user's own creative writing
          query =
            "SELECT f.*, u.name as user_name FROM creativewriting f LEFT JOIN users u ON f.user_email = u.email WHERE f.user_email = ?";
          params = [userEmail];
        }

        console.log("Step 4 Query:", query);
        console.log("Step 4 Params:", params);

        const [userAndPublicEntries] = await pool.execute(query, params);
        allCreativeWriting.push(...userAndPublicEntries);
        console.log(
          "Found",
          userAndPublicEntries.length,
          "user + public creative writing entries"
        );

        // Step 5: For each family member email, get their shared_family entries
        if (familyEmails.length > 0) {
          for (const familyEmail of familyEmails) {
            console.log(
              "Checking shared creative writing for family member:",
              familyEmail
            );
            const [familyEntries] = await pool.execute(
              "SELECT f.*, u.name as user_name FROM creativewriting f LEFT JOIN users u ON f.user_email = u.email WHERE f.user_email = ? AND f.shared_family = 1",
              [familyEmail]
            );
            allCreativeWriting.push(...familyEntries);
            console.log(
              "Found",
              familyEntries.length,
              "shared creative writing from",
              familyEmail
            );
          }
        }

        // Sort all creative writing by created date
        allCreativeWriting.sort(
          (a, b) => new Date(b.created) - new Date(a.created)
        );
        console.log(
          "Total creative writing entries after combining all sources:",
          allCreativeWriting.length
        );
      } else {
        console.log("No user found with email:", userEmail);
        // Fallback: just get public creative writing
        if (includePublic === "true") {
          const [publicEntries] = await pool.execute(
            "SELECT f.*, u.name as user_name FROM creativewriting f LEFT JOIN users u ON f.user_email = u.email WHERE f.is_public = 1 ORDER BY f.created DESC"
          );
          allCreativeWriting = publicEntries;
        }
      }
    } else {
      // Not logged in - get public creative writing only
      const [publicEntries] = await pool.execute(
        "SELECT f.*, u.name as user_name FROM creativewriting f LEFT JOIN users u ON f.user_email = u.email WHERE f.is_public = 1 ORDER BY f.created DESC"
      );
      allCreativeWriting = publicEntries;
      console.log("Using public-only query");
    }

    // Parse the JSON data and add any missing fields for frontend compatibility
    const creativeWriting = allCreativeWriting.map((row) => {
      // Check if row.json is already an object or needs parsing
      const entry =
        typeof row.json === "string" ? JSON.parse(row.json) : row.json;
      return {
        ...entry,
        id: entry.id || row.id, // Use JSON id or fallback to database id
        is_public: Boolean(row.is_public), // Add is_public from database column
        shared_family: Boolean(row.shared_family), // Add shared_family from database column
        author:
          row.user_name ||
          entry.by ||
          entry.author ||
          row.user_email ||
          "Anonymous", // Use database name first, then fallback to JSON data
        userEmail: row.user_email, // Add userEmail field for family filtering
        author_email: entry.author_email || row.user_email, // Add author_email field for backwards compatibility
      };
    });

    return NextResponse.json(creativeWriting);
  } catch (error) {
    console.error("Error in GET /api/creativewriting:", error);
    return NextResponse.json(
      { error: "Failed to fetch creative writing" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { userEmail, userName, ...entryData } = await request.json();

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

    // Generate ID and slug for new entry
    const id = Date.now();
    const slug =
      entryData.slug ||
      `${entryData.title
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")}-${id}`;

    // Create complete entry data
    const fullEntryData = {
      id: id,
      slug: slug,
      title: entryData.title || "",
      content: entryData.content || "",
      by: authorName,
      author_email: userEmail,
      tags: entryData.tags || "",
      mood: entryData.mood || "",
      type: entryData.type || "CreativeWriting",
      images: entryData.images || [],
      date: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      personalNotes: entryData.personalNotes || "",
      isFavorite: entryData.isFavorite || false,
      dateAdded: new Date().toISOString(),
    };

    // Insert into database
    await pool.execute(
      "INSERT INTO creativewriting (user_email, is_public, shared_family, json) VALUES (?, ?, ?, ?)",
      [
        userEmail,
        entryData.is_public || false,
        entryData.shared_family ? 1 : 0,
        JSON.stringify(fullEntryData),
      ]
    );

    return NextResponse.json(fullEntryData, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/creativewriting:", error);
    return NextResponse.json(
      { error: "Failed to create creative writing entry" },
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

    // Find the entry by slug or id
    let query, params;
    if (slug) {
      query =
        "SELECT f.*, u.name as user_name FROM creativewriting f LEFT JOIN users u ON f.user_email = u.email WHERE f.user_email = ? AND JSON_EXTRACT(f.json, '$.slug') = ?";
      params = [userEmail, slug];
    } else if (id) {
      query =
        "SELECT f.*, u.name as user_name FROM creativewriting f LEFT JOIN users u ON f.user_email = u.email WHERE f.user_email = ? AND JSON_EXTRACT(f.json, '$.id') = ?";
      params = [userEmail, id];
    } else {
      return NextResponse.json(
        { error: "Entry identifier (slug or id) is required" },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute(query, params);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Creative writing entry not found" },
        { status: 404 }
      );
    }

    const row = rows[0];
    const existingEntry =
      typeof row.json === "string" ? JSON.parse(row.json) : row.json;

    // Update the entry data
    const updatedEntry = {
      ...existingEntry,
      ...updates,
      by: authorName,
      author_email: userEmail,
      updatedAt: new Date().toISOString(),
    };

    // Update in database
    await pool.execute(
      "UPDATE creativewriting SET json = ?, is_public = ?, shared_family = ? WHERE id = ?",
      [
        JSON.stringify(updatedEntry),
        updates.is_public !== undefined ? updates.is_public : row.is_public,
        updates.shared_family !== undefined
          ? updates.shared_family
          : row.shared_family,
        row.id,
      ]
    );

    // Return the updated entry with author field mapped for frontend consistency
    const responseEntry = {
      ...updatedEntry,
      author: row.user_name || authorName || userEmail || "Anonymous",
      userEmail: userEmail,
      is_public: Boolean(
        updates.is_public !== undefined ? updates.is_public : row.is_public
      ),
      shared_family: Boolean(
        updates.shared_family !== undefined
          ? updates.shared_family
          : row.shared_family
      ),
    };

    return NextResponse.json(responseEntry);
  } catch (error) {
    console.error("Error in PUT /api/creativewriting:", error);
    return NextResponse.json(
      { error: "Failed to update creative writing entry" },
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

    // Find the entry by slug or id
    let query, params;
    if (slug) {
      query =
        "SELECT id FROM creativewriting WHERE user_email = ? AND JSON_EXTRACT(json, '$.slug') = ?";
      params = [userEmail, slug];
    } else if (id) {
      query =
        "SELECT id FROM creativewriting WHERE user_email = ? AND JSON_EXTRACT(json, '$.id') = ?";
      params = [userEmail, id];
    } else {
      return NextResponse.json(
        { error: "Entry identifier (slug or id) is required" },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute(query, params);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Creative writing entry not found" },
        { status: 404 }
      );
    }

    // Delete from database
    await pool.execute("DELETE FROM creativewriting WHERE id = ?", [
      rows[0].id,
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/creativewriting:", error);
    return NextResponse.json(
      { error: "Failed to delete creative writing entry" },
      { status: 500 }
    );
  }
}
