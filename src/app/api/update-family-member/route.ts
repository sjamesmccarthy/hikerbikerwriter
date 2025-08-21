import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import networksData from "@/data/people-networks.json";

interface RequestBody {
  personId: string;
  userEmail: string;
  relationship: string;
  network: string;
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

interface FamilyLine extends RowDataPacket {
  id: string;
  uuid: string;
  json: string;
  person_id: string;
}

async function validateRequest(requestBody: RequestBody): Promise<string[]> {
  const requiredFields: (keyof RequestBody)[] = [
    "personId",
    "userEmail",
    "relationship",
    "network",
  ];
  return requiredFields.filter((field) => !requestBody[field]);
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

async function updateFamilyLine(
  familyline: FamilyLine,
  familyData: FamilyData
): Promise<void> {
  await pool.execute("UPDATE familyline SET json = ? WHERE id = ?", [
    JSON.stringify(familyData),
    familyline.id,
  ]);
}

export async function POST(request: Request) {
  try {
    console.log("Received update-family-member request");
    const requestBody = (await request.json()) as RequestBody;
    console.log("Request body:", requestBody);

    // Validate request
    const missingFields = await validateRequest(requestBody);
    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Get logged-in user's familyline
    const familyline = await getFamilyLine(requestBody.userEmail);
    if (!familyline) {
      return NextResponse.json(
        { error: "No familyline found for user" },
        { status: 404 }
      );
    }

    // Parse current family data
    const familyData = parseFamilyData(familyline.json);

    // Find the person to update
    const personIndex = familyData.people.findIndex(
      (person) => person.person_id === requestBody.personId
    );

    if (personIndex === -1) {
      return NextResponse.json(
        { error: "Person not found in family" },
        { status: 404 }
      );
    }

    // Get network level from network type
    const networkLevel =
      networksData.network.find((n) => n.type === requestBody.network)?.level ||
      1;

    // Update the person's relationship and network level
    familyData.people[personIndex] = {
      ...familyData.people[personIndex],
      relation: requestBody.relationship,
      network_level: networkLevel,
    };

    // Update the familyline in the database
    await updateFamilyLine(familyline, familyData);

    return NextResponse.json({
      success: true,
      message: "Family member updated successfully",
      familyData,
    });
  } catch (error) {
    console.error("Error updating family member:", error);
    return NextResponse.json(
      { error: "Failed to update family member" },
      { status: 500 }
    );
  }
}
