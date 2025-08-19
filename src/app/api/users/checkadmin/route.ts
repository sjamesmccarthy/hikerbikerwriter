import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../pages/api/auth/[...nextauth]";
import pool from "@/lib/db";

// Lightweight admin check for users area
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ isAdmin: false }, { status: 200 });
    }

    const [rows] = await pool.execute(
      'SELECT is_admin FROM users WHERE email = ? AND oauth = "GOOGLE"',
      [session.user.email]
    );

    const adminCheck = rows as Array<{ is_admin?: number }>;

    const isAdmin =
      Array.isArray(adminCheck) &&
      adminCheck.length > 0 &&
      adminCheck[0].is_admin === 1;

    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error("users/checkadmin error:", error);
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }
}
