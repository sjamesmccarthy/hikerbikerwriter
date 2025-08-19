import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const [rows] = await pool.query(
      "SELECT person_id, familylineid, is_admin, created FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = rows[0];
    return NextResponse.json({
      person_id: user.person_id,
      familylineid: user.familylineid,
      is_admin: Boolean(user.is_admin),
      created: user.created,
    });
  } catch (err) {
    console.error("Error in GET /api/userinfo:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
