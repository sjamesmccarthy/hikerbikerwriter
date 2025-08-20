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

    // Query to get users who belong to the same family line
    const query = `
      SELECT u.name, u.email, u.person_id 
      FROM familyline f
      JOIN users u ON f.person_id = u.person_id
      WHERE f.uuid = ?`;

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
