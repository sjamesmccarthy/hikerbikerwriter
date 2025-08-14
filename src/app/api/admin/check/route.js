import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../pages/api/auth/[...nextauth]";
import pool from "@/lib/db";

// Check if user is admin - lightweight endpoint for frontend
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ isAdmin: false }, { status: 200 });
    }

    // Check if user is admin
    const [adminCheck] = await pool.execute(
      'SELECT is_admin FROM users WHERE email = ? AND oauth = "GOOGLE"',
      [session.user.email]
    );

    const isAdmin =
      Array.isArray(adminCheck) &&
      adminCheck.length > 0 &&
      adminCheck[0].is_admin === 1;

    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error("Admin check error:", error);
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }
}
