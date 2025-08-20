import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  console.log("Fetching user info for email:", email);

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  console.log("Fetching user info for email:", email);

  try {
    // First get the user's basic info
    // First check if user has a familyline as owner
    const [userRows] = await pool.execute<RowDataPacket[]>(
      `SELECT u.id, u.name, u.email, u.is_admin,
              COALESCE(f_owner.id, f_member.familylineid) as familyline_id
       FROM users u 
       LEFT JOIN familyline f_owner ON u.id = f_owner.owner_id
       LEFT JOIN (
         SELECT DISTINCT JSON_UNQUOTE(JSON_EXTRACT(json, '$.people[*].person_id')) as person_id,
                        id as familylineid
         FROM familyline,
              JSON_TABLE(json, '$.people[*]' COLUMNS (
                person_id VARCHAR(255) PATH '$.person_id'
              )) as jt
       ) f_member ON u.id = f_member.person_id
       WHERE u.email = ?`,
      [email]
    );

    console.log("User query result:", userRows);

    if (!userRows.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userRows[0];

    // Return user info including familyline_id
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      is_admin: Boolean(user.is_admin),
      person_id: user.id,
      familyline_id: user.familyline_id,
    });
  } catch (error) {
    console.error("Error fetching user info:", error);
    return NextResponse.json(
      { error: "Failed to fetch user info" },
      { status: 500 }
    );
  }
}
