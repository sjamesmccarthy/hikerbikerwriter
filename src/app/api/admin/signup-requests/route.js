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

// GET - Fetch all signup requests
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
    const filter = searchParams.get("filter") || "all";

    let query =
      "SELECT id, name, email, status, requested_at, processed_at, processed_by, notes FROM signup_requests";
    let params = [];

    // Add status filter
    if (filter === "pending") {
      query += " WHERE status = 'pending'";
    } else if (filter === "approved") {
      query += " WHERE status = 'approved'";
    } else if (filter === "rejected") {
      query += " WHERE status = 'rejected'";
    }

    // Add search filter
    if (search) {
      if (filter !== "all") {
        query += " AND (email LIKE ? OR name LIKE ?)";
      } else {
        query += " WHERE (email LIKE ? OR name LIKE ?)";
      }
      params = [`%${search}%`, `%${search}%`];
    }

    // Add ordering
    if (filter === "newest") {
      query += " ORDER BY requested_at DESC";
    } else if (filter === "oldest") {
      query += " ORDER BY requested_at ASC";
    } else {
      query += " ORDER BY requested_at DESC";
    }

    const [signupRequests] = await pool.execute(query, params);

    return NextResponse.json({ signupRequests });
  } catch (error) {
    console.error("Error fetching signup requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch signup requests" },
      { status: 500 }
    );
  }
}

// PUT - Approve or reject signup request
export async function PUT(request) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { requestId, action, notes, person_id } = await request.json();

    if (!requestId || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Missing requestId or invalid action" },
        { status: 400 }
      );
    }

    if (action === "approve" && !person_id) {
      return NextResponse.json(
        { error: "person_id is required when approving a request" },
        { status: 400 }
      );
    }

    const currentUser = authResult.user;
    const status = action === "approve" ? "approved" : "rejected";

    // Get the signup request details
    const [signupRequest] = await pool.execute(
      "SELECT name, email FROM signup_requests WHERE id = ? AND status = 'pending'",
      [requestId]
    );

    if (signupRequest.length === 0) {
      return NextResponse.json(
        { error: "Signup request not found or already processed" },
        { status: 404 }
      );
    }

    const { name, email } = signupRequest[0];

    // If approving, create user account
    if (action === "approve") {
      try {
        console.log("Creating new user with:", { name, email, person_id });
        await pool.execute(
          "INSERT INTO users (name, email, oauth, is_admin, person_id) VALUES (?, ?, 'GOOGLE', 0, ?)",
          [name, email, person_id]
        );
        console.log("User created successfully");
      } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
          return NextResponse.json(
            { error: "User with this email already exists" },
            { status: 400 }
          );
        }
        throw error;
      }
    }

    // Update signup request status
    await pool.execute(
      "UPDATE signup_requests SET status = ?, processed_at = NOW(), processed_by = ?, notes = ? WHERE id = ?",
      [status, currentUser.email, notes || null, requestId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing signup request:", error);
    // Send back more specific error message
    const errorMessage = error.message || "Failed to process signup request";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE - Delete signup request
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
    const requestId = searchParams.get("id");

    if (!requestId) {
      return NextResponse.json(
        { error: "Missing request ID" },
        { status: 400 }
      );
    }

    await pool.execute("DELETE FROM signup_requests WHERE id = ?", [requestId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting signup request:", error);
    return NextResponse.json(
      { error: "Failed to delete signup request" },
      { status: 500 }
    );
  }
}
