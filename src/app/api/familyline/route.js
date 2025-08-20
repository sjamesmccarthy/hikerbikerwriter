import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }
  try {
    // Get family info with user details
    const [familyRows] = await pool.query(
      `SELECT u.name, u.email, u.person_id, f.json
      FROM familyline f
      JOIN users u ON f.person_id = u.person_id
      WHERE u.email = ?`,
      [email]
    );
    if (!familyRows.length) {
      return NextResponse.json({ error: "No family found" }, { status: 404 });
    }
    return NextResponse.json(familyRows[0]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
