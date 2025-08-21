import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../pages/api/auth/[...nextauth]";
import pool from "../../../lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID
    const [userRows] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [session.user.email]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userRows[0].id;

    // Get all job searches for this user
    const [jobRows] = await pool.execute(
      "SELECT * FROM jobs WHERE user_id = ? ORDER BY created DESC",
      [userId]
    );

    // Parse JSON data and group by search_id
    const searchesMap = new Map();

    jobRows.forEach((row) => {
      const searchId = row.search_id || "default";
      const data = JSON.parse(row.json);

      if (!searchesMap.has(searchId)) {
        searchesMap.set(searchId, {
          id: searchId,
          name: data.searchName || "Job Search",
          isActive: !row.closed,
          opportunities: [],
          recruiters: [],
          resources: [],
          created: row.created,
        });
      }

      const search = searchesMap.get(searchId);

      // Add data based on type
      if (data.opportunities) {
        search.opportunities.push(...data.opportunities);
      }
      if (data.recruiters) {
        search.recruiters.push(...data.recruiters);
      }
      if (data.resources) {
        search.resources.push(...data.resources);
      }
    });

    const searches = Array.from(searchesMap.values());

    return NextResponse.json({ searches });
  } catch (error) {
    console.error("Error fetching job data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Get user ID
    const [userRows] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [session.user.email]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userRows[0].id;

    // Prepare job data
    const jobData = {
      searchName: body.name,
      opportunities: body.opportunities || [],
      recruiters: body.recruiters || [],
      resources: body.resources || [],
    };

    // Check if a record already exists for this user_id and search_id
    const [existingRows] = await pool.execute(
      "SELECT id FROM jobs WHERE user_id = ? AND search_id = ?",
      [userId, body.id]
    );

    if (existingRows.length > 0) {
      // Update existing record
      await pool.execute(
        "UPDATE jobs SET json = ?, closed = ?, last_modified = NOW() WHERE user_id = ? AND search_id = ?",
        [JSON.stringify(jobData), body.isActive ? 0 : 1, userId, body.id]
      );
    } else {
      // Insert new record
      await pool.execute(
        "INSERT INTO jobs (user_id, search_id, json, closed) VALUES (?, ?, ?, ?)",
        [userId, body.id, JSON.stringify(jobData), body.isActive ? 0 : 1]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving job data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Get user ID
    const [userRows] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [session.user.email]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userRows[0].id;

    // Update the closed status for the specific search
    const result = await pool.execute(
      "UPDATE jobs SET closed = ?, last_modified = NOW() WHERE user_id = ? AND search_id = ?",
      [body.closed, userId, body.id]
    );

    if (result[0].affectedRows === 0) {
      return NextResponse.json(
        { error: "Job search not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating job data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Get user ID
    const [userRows] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [session.user.email]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userRows[0].id;

    // Delete the job search record for the specific search_id
    const result = await pool.execute(
      "DELETE FROM jobs WHERE user_id = ? AND search_id = ?",
      [userId, body.id]
    );

    if (result[0].affectedRows === 0) {
      return NextResponse.json(
        { error: "Job search not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting job data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
