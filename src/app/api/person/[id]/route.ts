import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const url = new URL(request.url);
    const userEmail = url.searchParams.get("email");
    const params = await context.params;
    const personId = params.id;

    console.log("Person API called with:", { userEmail, personId });

    if (!userEmail) {
      console.log("Missing email parameter");
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    if (!personId) {
      console.log("Missing person ID parameter");
      return NextResponse.json(
        { error: "Person ID is required" },
        { status: 400 }
      );
    }

    // First, verify that the requesting user has access to this person
    // by checking if this person is in their family
    const [familyRows] = await pool.query(
      `SELECT f.json 
       FROM familyline f 
       JOIN users u ON f.person_id = u.person_id 
       WHERE u.email = ?`,
      [userEmail]
    );

    if (!Array.isArray(familyRows) || familyRows.length === 0) {
      return NextResponse.json(
        { error: "No family data found for user" },
        { status: 404 }
      );
    }

    const familyData = familyRows[0] as { json: string };
    let familyJson;

    try {
      familyJson =
        typeof familyData.json === "string"
          ? JSON.parse(familyData.json)
          : familyData.json;
    } catch {
      return NextResponse.json(
        { error: "Invalid family data format" },
        { status: 500 }
      );
    }

    // Check if the requested person is in the user's family
    const people = familyJson.people || [];
    const person = people.find(
      (p: { person_id: string }) => p.person_id === personId
    );

    if (!person) {
      return NextResponse.json(
        { error: "Person not found in your family" },
        { status: 404 }
      );
    }

    // Return the person data
    return NextResponse.json({
      person_id: person.person_id,
      name: person.name,
      relation: person.relation,
      network_level: person.network_level,
      gender: person.gender,
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
