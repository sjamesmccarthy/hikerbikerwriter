import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, name, email 
       FROM users 
       WHERE name LIKE ? OR email LIKE ?
       LIMIT 10`,
      [`%${query}%`, `%${query}%`]
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
