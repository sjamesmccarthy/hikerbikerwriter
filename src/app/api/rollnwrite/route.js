import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail");

    let query, params;

    if (userEmail) {
      // Logged in user - get their entries
      query =
        "SELECT * FROM rollnwrite WHERE user_email = ? ORDER BY created DESC";
      params = [userEmail];
    } else {
      // Not logged in - get public entries only
      query =
        "SELECT * FROM rollnwrite WHERE is_public = 1 ORDER BY created DESC";
      params = [];
    }

    // Get rollnwrite entries from database based on login status
    const [rows] = await pool.execute(query, params);

    // Parse the JSON data and add any missing fields for frontend compatibility
    const entries = rows.map((row) => {
      // Check if row.json is already an object or needs parsing
      const entry =
        typeof row.json === "string" ? JSON.parse(row.json) : row.json;
      return {
        ...entry,
        id: row.id.toString(),
        createdAt: row.created,
        is_public: row.is_public,
        shared_family: Boolean(row.shared_family),
        favorite: row.favorite || 0,
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
      by: userName || userEmail,
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

    // Find the entry by slug or id
    let query, params;
    if (slug) {
      query =
        "SELECT * FROM rollnwrite WHERE user_email = ? AND JSON_EXTRACT(json, '$.slug') = ?";
      params = [userEmail, slug];
    } else if (id) {
      query = "SELECT * FROM rollnwrite WHERE user_email = ? AND id = ?";
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
      by: userName || existingEntry.by || userEmail,
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
