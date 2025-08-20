import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get("q");
  const personId = searchParams.get("personId");

  if (!searchTerm) {
    return NextResponse.json(
      { error: "Search term is required" },
      { status: 400 }
    );
  }

  try {
    // Search for users by name or email, excluding the logged-in user
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, name, email 
       FROM users 
       WHERE (LOWER(name) LIKE ? OR LOWER(email) = ?)
       AND person_id != ?
       LIMIT 10`,
      [
        `%${searchTerm.toLowerCase()}%`,
        searchTerm.toLowerCase(),
        personId || 0, // Use 0 if no personId provided, as it won't match any valid ID
      ]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
