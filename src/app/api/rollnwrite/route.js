import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail");
    const includePublic = searchParams.get("includePublic");

    console.log(
      "GET /api/rollnwrite - userEmail:",
      userEmail,
      "includePublic:",
      includePublic
    );

    let allEntries = [];

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

        // Step 4: Get user's own entries + public entries (if requested)
        let query, params;
        if (includePublic === "true") {
          if (familyEmails.length > 0) {
            // If user has family, exclude family members from public entries to avoid duplicates
            const familyEmailPlaceholders = familyEmails
              .map(() => "?")
              .join(",");
            query = `SELECT r.*, u.name as user_name FROM rollnwrite r LEFT JOIN users u ON r.user_email = u.email WHERE r.user_email = ? OR (r.is_public = 1 AND r.user_email NOT IN (${familyEmailPlaceholders}))`;
            params = [userEmail, ...familyEmails];
          } else {
            // If no family, get user's entries + all public entries
            query =
              "SELECT r.*, u.name as user_name FROM rollnwrite r LEFT JOIN users u ON r.user_email = u.email WHERE r.user_email = ? OR r.is_public = 1";
            params = [userEmail];
          }
        } else {
          // Just user's own entries
          query =
            "SELECT r.*, u.name as user_name FROM rollnwrite r LEFT JOIN users u ON r.user_email = u.email WHERE r.user_email = ?";
          params = [userEmail];
        }

        console.log("Step 4 Query:", query);
        console.log("Step 4 Params:", params);

        const [userAndPublicEntries] = await pool.execute(query, params);
        allEntries.push(...userAndPublicEntries);
        console.log(
          "Found",
          userAndPublicEntries.length,
          "user + public roll and write entries"
        );

        // Step 5: For each family member email, get their shared_family entries
        if (familyEmails.length > 0) {
          for (const familyEmail of familyEmails) {
            console.log(
              "Checking shared roll and write entries for family member:",
              familyEmail
            );
            const [familyEntries] = await pool.execute(
              "SELECT r.*, u.name as user_name FROM rollnwrite r LEFT JOIN users u ON r.user_email = u.email WHERE r.user_email = ? AND r.shared_family = 1",
              [familyEmail]
            );
            allEntries.push(...familyEntries);
            console.log(
              "Found",
              familyEntries.length,
              "shared roll and write entries from",
              familyEmail
            );
          }
        }

        // Sort all entries by created date
        allEntries.sort((a, b) => new Date(b.created) - new Date(a.created));
        console.log(
          "Total roll and write entries after combining all sources:",
          allEntries.length
        );
      } else {
        console.log("No user found with email:", userEmail);
        // Fallback: just get public entries
        if (includePublic === "true") {
          const [publicEntries] = await pool.execute(
            "SELECT r.*, u.name as user_name FROM rollnwrite r LEFT JOIN users u ON r.user_email = u.email WHERE r.is_public = 1 ORDER BY r.created DESC"
          );
          allEntries = publicEntries;
        }
      }
    } else {
      // Not logged in - get public entries only
      const [publicEntries] = await pool.execute(
        "SELECT r.*, u.name as user_name FROM rollnwrite r LEFT JOIN users u ON r.user_email = u.email WHERE r.is_public = 1 ORDER BY r.created DESC"
      );
      allEntries = publicEntries;
      console.log("Using public-only query");
    }

    // Parse the JSON data and add any missing fields for frontend compatibility
    const entries = allEntries.map((row) => {
      // Check if row.json is already an object or needs parsing
      const entry =
        typeof row.json === "string" ? JSON.parse(row.json) : row.json;
      return {
        ...entry,
        id: row.id.toString(),
        by: row.user_name || entry.by || "Unknown", // Use current user name from database
        createdAt: row.created,
        is_public: row.is_public,
        shared_family: Boolean(row.shared_family),
        favorite: row.favorite || 0,
        userEmail: row.user_email, // Add userEmail field for family filtering
        author_email: entry.author_email || row.user_email, // Add author_email field for backwards compatibility
      };
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error in GET /api/rollnwrite:", error);
    return NextResponse.json(
      { error: "Failed to fetch roll & write entries" },
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
    const slug = entryData.slug || `roll-entry-${id}`;

    // Create complete entry data
    const fullEntryData = {
      id: id,
      slug: slug,
      title:
        entryData.title ||
        `Roll ${entryData.dice1 || 0} & ${entryData.dice2 || 0}`,
      content: entryData.content || "",
      dice1: entryData.dice1 || 0,
      dice2: entryData.dice2 || 0,
      by: authorName,
      author_email: userEmail,
      date: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      personalNotes: entryData.personalNotes || "",
      isFavorite: entryData.isFavorite || false,
      dateAdded: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    // Insert into database
    await pool.execute(
      "INSERT INTO rollnwrite (user_email, is_public, shared_family, json) VALUES (?, ?, ?, ?)",
      [
        userEmail,
        entryData.is_public || false,
        entryData.shared_family || false,
        JSON.stringify(fullEntryData),
      ]
    );

    return NextResponse.json(fullEntryData, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/rollnwrite:", error);
    return NextResponse.json(
      { error: "Failed to create roll & write entry" },
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
        "SELECT r.*, u.name as user_name FROM rollnwrite r LEFT JOIN users u ON r.user_email = u.email WHERE r.user_email = ? AND JSON_EXTRACT(r.json, '$.slug') = ?";
      params = [userEmail, slug];
    } else if (id) {
      query =
        "SELECT r.*, u.name as user_name FROM rollnwrite r LEFT JOIN users u ON r.user_email = u.email WHERE r.user_email = ? AND r.id = ?";
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
        { error: "Roll & Write entry not found" },
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
      "UPDATE rollnwrite SET json = ?, is_public = ?, shared_family = ? WHERE id = ?",
      [
        JSON.stringify(updatedEntry),
        updates.is_public !== undefined ? updates.is_public : row.is_public,
        updates.shared_family !== undefined
          ? updates.shared_family
          : row.shared_family,
        row.id,
      ]
    );

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error("Error in PUT /api/rollnwrite:", error);
    return NextResponse.json(
      { error: "Failed to update roll & write entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Entry ID is required" },
        { status: 400 }
      );
    }

    // Delete from database
    const [result] = await pool.execute("DELETE FROM rollnwrite WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Roll & Write entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Roll & Write entry deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/rollnwrite:", error);
    return NextResponse.json(
      { error: "Failed to delete roll & write entry" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const { favorite } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Entry ID is required" },
        { status: 400 }
      );
    }

    if (favorite === undefined) {
      return NextResponse.json(
        { error: "Favorite count is required" },
        { status: 400 }
      );
    }

    // Update the favorite count in the database
    const [result] = await pool.execute(
      "UPDATE rollnwrite SET favorite = ? WHERE id = ?",
      [favorite, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Roll & Write entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Favorite count updated successfully",
      favorite: favorite,
    });
  } catch (error) {
    console.error("Error in PATCH /api/rollnwrite:", error);
    return NextResponse.json(
      { error: "Failed to update favorite count" },
      { status: 500 }
    );
  }
}
