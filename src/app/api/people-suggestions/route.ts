import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface FamilyPerson extends RowDataPacket {
  person_id: string;
  name: string;
  email: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const familylineId = searchParams.get("familylineId");

    console.log("Request params:", { email, familylineId });

    if (!email || !familylineId) {
      return NextResponse.json(
        { error: "Email and familylineId are required" },
        { status: 400 }
      );
    }

    // Simple query to get users with the same familylineid
    const query = `
      SELECT name, email, person_id 
      FROM users 
      WHERE familylineid = ?`;

    console.log("Executing query:", { query, params: [familylineId] });

    const [rows] = await pool.execute<FamilyPerson[]>(query, [familylineId]);
    console.log("Query results:", JSON.stringify(rows, null, 2));

    return NextResponse.json(rows);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error in people suggestions API:", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
