import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface FamilyLine extends RowDataPacket {
  id: string;
  uuid: string;
  json: string;
  person_id: string;
}

interface FamilyMember {
  name: string;
  gender: string;
  relation: string;
  person_id: string;
  familylineid: string;
  network_level: number;
  email: string;
}

interface FamilyData {
  people: FamilyMember[];
  [key: string]: unknown;
}

async function getFamilyLine(userEmail: string): Promise<FamilyLine | null> {
  const [rows] = await pool.execute<FamilyLine[]>(
    "SELECT f.* FROM familyline f JOIN users u ON f.person_id = u.person_id WHERE u.email = ?",
    [userEmail]
  );
  return rows.length ? rows[0] : null;
}

function parseFamilyData(jsonData: string | object): FamilyData {
  try {
    const parsedJson =
      typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;
    const familyData =
      typeof parsedJson === "string" ? JSON.parse(parsedJson) : parsedJson;
    return { people: familyData?.people || [] };
  } catch (error) {
    console.error("Error parsing family data:", error);
    return { people: [] };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "Missing email parameter" },
      { status: 400 }
    );
  }

  try {
    const familyline = await getFamilyLine(email);
    if (!familyline) {
      return NextResponse.json(
        { error: "No familyline found" },
        { status: 404 }
      );
    }

    const familyData = parseFamilyData(familyline.json);

    return NextResponse.json({
      familyline_id: familyline.id,
      uuid: familyline.uuid,
      owner_person_id: familyline.person_id,
      family_members: familyData.people.map((person) => ({
        name: person.name,
        email: person.email,
        person_id: person.person_id,
        relation: person.relation,
        network_level: person.network_level,
        familylineid: person.familylineid,
      })),
    });
  } catch (error) {
    console.error("Error fetching family data:", error);
    return NextResponse.json(
      { error: "Failed to fetch family data" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const userEmail = searchParams.get("userEmail");
  const personIdToRemove = searchParams.get("personId");

  if (!userEmail || !personIdToRemove) {
    return NextResponse.json(
      {
        error: "Missing userEmail or personId parameter",
      },
      { status: 400 }
    );
  }

  try {
    const familyline = await getFamilyLine(userEmail);
    if (!familyline) {
      return NextResponse.json(
        { error: "No familyline found" },
        { status: 404 }
      );
    }

    const familyData = parseFamilyData(familyline.json);

    // Remove the person from the family
    const originalCount = familyData.people.length;
    familyData.people = familyData.people.filter(
      (person) => person.person_id !== personIdToRemove
    );

    if (familyData.people.length === originalCount) {
      return NextResponse.json(
        {
          error: "Person not found in family",
        },
        { status: 404 }
      );
    }

    // Update the familyline
    await pool.execute("UPDATE familyline SET json = ? WHERE id = ?", [
      JSON.stringify(familyData),
      familyline.id,
    ]);

    return NextResponse.json({
      success: true,
      message: "Person removed from family",
      removed_person_id: personIdToRemove,
      remaining_members: familyData.people.length,
    });
  } catch (error) {
    console.error("Error removing family member:", error);
    return NextResponse.json(
      { error: "Failed to remove family member" },
      { status: 500 }
    );
  }
}
