import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }
  try {
    // Get user and their familylineid
    const [userRows] = await pool.query(
      "SELECT familylineid FROM users WHERE email = ?",
      [email]
    );
    if (!userRows.length || !userRows[0].familylineid) {
      return NextResponse.json(
        { error: "No familylineid found" },
        { status: 404 }
      );
    }
    const familylineid = userRows[0].familylineid;
    // Get family info
    const [familyRows] = await pool.query(
      "SELECT * FROM familyline WHERE uuid = ?",
      [familylineid]
    );
    if (!familyRows.length) {
      return NextResponse.json({ error: "No family found" }, { status: 404 });
    }
    return NextResponse.json(familyRows[0]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
