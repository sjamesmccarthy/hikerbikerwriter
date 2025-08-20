import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get("q");
  const personId = searchParams.get("personId");
  const excludeIds = searchParams.get("excludeIds");

  if (!searchTerm) {
    return NextResponse.json(
      { error: "Search term is required" },
      { status: 400 }
    );
  }

  try {
    // Split the comma-separated string into an array, filter out any empty strings
    const excludePersonIds = excludeIds
      ? excludeIds.split(",").filter(Boolean)
      : [];

    console.log("Excluding person IDs:", excludePersonIds);
    // Create the placeholder string for the IN clause
    const placeholders = excludePersonIds.length
      ? Array(excludePersonIds.length).fill("?").join(",")
      : "'0'";

    // Build the query and parameters
    const query = `SELECT id, name, email, person_id 
       FROM users 
       WHERE (LOWER(name) LIKE ? OR LOWER(email) = ?)
       AND person_id != ?
       AND person_id NOT IN (${placeholders})
       LIMIT 10`;

    const params = [
      `%${searchTerm.toLowerCase()}%`,
      searchTerm.toLowerCase(),
      personId || 0,
      ...excludePersonIds,
    ];

    // console.log("SQL Query:", query);
    // console.log("SQL Parameters:", params);

    // Execute the query
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
