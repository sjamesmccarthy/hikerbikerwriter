import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  try {
    // Get the user's familyline data
    const [familyRows] = await pool.query(
      `SELECT f.json
      FROM familyline f
      JOIN users u ON f.person_id = u.person_id
      WHERE u.email = ?`,
      [email]
    );

    if (!familyRows.length) {
      return NextResponse.json({ error: "No family found" }, { status: 404 });
    }

    // Parse the JSON data to get family members
    let familyData = familyRows[0].json;
    if (typeof familyData === "string") {
      familyData = JSON.parse(familyData);
    }

    // Extract just the names of family members
    const familyMembers = familyData?.people || [];
    const memberNames = familyMembers.map((member) => ({
      name: member.name,
      email: member.email,
      relationship: member.relationship,
    }));

    return NextResponse.json(memberNames);
  } catch (err) {
    console.error("Error fetching family members:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
