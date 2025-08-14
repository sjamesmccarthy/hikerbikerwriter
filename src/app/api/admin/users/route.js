import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../pages/api/auth/[...nextauth]";
import pool from "@/lib/db";

// Check if user is admin
async function checkAdminAuth() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return { error: "Not authenticated", status: 401 };
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

    if (!isAdmin) {
      return { error: "Admin access required", status: 403 };
    }

    return { success: true, user: session.user };
  } catch (error) {
    console.error("Admin auth error:", error);
    return { error: "Authentication error", status: 500 };
  }
}

// GET - Fetch all users
export async function GET(request) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    let query = "SELECT id, name, email, oauth, created, is_admin FROM users";
    let params = [];

    if (search) {
      query += " WHERE email LIKE ? OR name LIKE ?";
      params = [`%${search}%`, `%${search}%`];
    }

    query += " ORDER BY created DESC";

    const [users] = await pool.execute(query, params);

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// PUT - Update user (mainly for is_admin toggle)
export async function PUT(request) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { userId, is_admin } = await request.json();

    if (!userId || is_admin === undefined) {
      return NextResponse.json(
        { error: "Missing userId or is_admin value" },
        { status: 400 }
      );
    }

    await pool.execute("UPDATE users SET is_admin = ? WHERE id = ?", [
      is_admin ? 1 : 0,
      userId,
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(request) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    // Prevent users from deleting themselves
    const currentUser = authResult.user;
    const [userCheck] = await pool.execute(
      "SELECT email FROM users WHERE id = ?",
      [userId]
    );

    if (userCheck.length > 0 && userCheck[0].email === currentUser.email) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    await pool.execute("DELETE FROM users WHERE id = ?", [userId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
