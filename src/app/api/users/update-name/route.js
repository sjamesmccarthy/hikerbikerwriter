import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "Missing email or name" },
        { status: 400 }
      );
    }

    // Validate name (basic validation)
    if (name.trim().length === 0 || name.length > 100) {
      return NextResponse.json(
        { error: "Name must be between 1 and 100 characters" },
        { status: 400 }
      );
    }

    console.log("Updating user name:", { email, name: name.trim() });

    // Update the user's name in the database
    const [result] = await pool.query(
      "UPDATE users SET name = ? WHERE email = ?",
      [name.trim(), email]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Name updated successfully",
      name: name.trim(),
    });
  } catch (err) {
    console.error("Error in POST /api/users/update-name:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
