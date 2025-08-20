import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import networksData from "@/data/people-networks.json";

export async function POST(request: Request) {
  try {
    const { userId, familylineId, userEmail, relationship, network } =
      await request.json();

    if (!userId || !familylineId || !userEmail || !relationship || !network) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // First, get the user information
    const [userRows] = await pool.execute<RowDataPacket[]>(
      "SELECT name, email FROM users WHERE id = ?",
      [userId]
    );

    if (!userRows.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userRows[0];

    // Get the current family data
    const [familyRows] = await pool.execute<RowDataPacket[]>(
      "SELECT json FROM familyline WHERE id = ?",
      [familylineId]
    );

    if (!familyRows.length) {
      return NextResponse.json(
        { error: "Family line not found" },
        { status: 404 }
      );
    }

    let familyData;
    try {
      familyData = JSON.parse(familyRows[0].json || "{}");
    } catch {
      familyData = {};
    }

    // Define a type for people
    type FamilyPerson = {
      person_id: number | string;
      name: string;
      email: string;
      relation: string;
      network_degree: number;
      shared_data: {
        roll_and_write: number;
        field_notes: number;
        recipes: number;
      };
    };

    // Initialize people array if it doesn't exist
    if (!familyData.people) {
      familyData.people = [];
    }

    // Check if user is already in the family
    if (
      (familyData.people as FamilyPerson[]).some((p) => p.email === user.email)
    ) {
      return NextResponse.json(
        { error: "User is already in the family" },
        { status: 400 }
      );
    }

    // Add the new person to the family
    familyData.people.push({
      person_id: userId,
      name: user.name,
      email: user.email,
      relation: relationship,
      network_degree:
        networksData.network.find((n) => n.type === network)?.level || 2,
      shared_data: {
        roll_and_write: 0,
        field_notes: 0,
        recipes: 0,
      },
    });

    // Update the family data in the database
    await pool.execute("UPDATE familyline SET json = ? WHERE id = ?", [
      JSON.stringify(familyData),
      familylineId,
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding family member:", error);
    return NextResponse.json(
      { error: "Failed to add family member" },
      { status: 500 }
    );
  }
}
