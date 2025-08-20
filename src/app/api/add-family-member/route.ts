import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import networksData from "@/data/people-networks.json";

interface RequestBody {
  userId: string;
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

interface User extends RowDataPacket {
  name: string;
  email: string;
}

interface FamilyLine extends RowDataPacket {
  id: string;
  json: string;
}

async function validateRequest(requestBody: RequestBody): Promise<string[]> {
  const requiredFields: (keyof RequestBody)[] = [
    "userId",
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

async function getUser(userId: string): Promise<User | null> {
  const [rows] = await pool.execute<User[]>(
    "SELECT name, email FROM users WHERE person_id = ?",
    [userId]
  );
  return rows.length ? rows[0] : null;
}

export async function POST(request: Request) {
  try {
    console.log("Received add-family-member request");

    const requestBody = (await request.json()) as RequestBody;
    console.log("Request body:", requestBody);

    // Validate the request
    const missingFields = await validateRequest(requestBody);
    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Get user information
    const userToAdd = await getUser(requestBody.userId);
    if (!userToAdd) {
      return NextResponse.json(
        { error: "User to add not found" },
        { status: 404 }
      );
    }
    console.log("Got user information for person to add:", userToAdd);

    // Get familyline information
    console.log("Looking up familyline for user:", requestBody.userEmail);
    const familyline = await getFamilyLine(requestBody.userEmail);
    if (!familyline) {
      return NextResponse.json(
        { error: "No familyline found for logged in user" },
        { status: 404 }
      );
    }
    console.log("Found familyline:", familyline);

    // Parse and validate the existing family data
    let familyData: FamilyData;
    try {
      // Handle the case where json might be a string of an already stringified JSON
      const parsedJson =
        typeof familyline.json === "string"
          ? JSON.parse(familyline.json)
          : familyline.json;

      // If it's still a string (double stringified), parse again
      familyData =
        typeof parsedJson === "string" ? JSON.parse(parsedJson) : parsedJson;

      // Ensure we have a people array
      if (!familyData?.people) {
        familyData = { people: [] };
      }
    } catch (error) {
      console.error("Error parsing family data:", error);
      familyData = { people: [] };
    }
    console.log("Current family data:", familyData);

    // Check if user is already in the family
    if (
      familyData.people.some((p: FamilyMember) => p.email === userToAdd.email)
    ) {
      return NextResponse.json(
        { error: "User is already in the family" },
        { status: 400 }
      );
    }

    // Add the new person to the family
    const newPerson: FamilyMember = {
      name: userToAdd.name || "",
      gender: "", // We don't have this data yet
      relation: requestBody.relationship,
      person_id: requestBody.userId,
      familylineid: familyline.id,
      network_level:
        networksData.network.find((n) => n.type === requestBody.network)
          ?.level || 1,
      email: userToAdd.email || "",
    };

    familyData.people.push(newPerson);
    console.log("Adding new person to family:", newPerson);

    // Update the family data in the database
    try {
      await pool.execute("UPDATE familyline SET json = ? WHERE id = ?", [
        JSON.stringify(familyData),
        familyline.id,
      ]);
      console.log("Successfully updated familyline data");
    } catch (error) {
      console.error("Error updating familyline:", error);
      return NextResponse.json(
        { error: "Failed to update family data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Family member added successfully",
      familyData,
    });
  } catch (error) {
    console.error("Error adding family member:", error);
    return NextResponse.json(
      { error: "Failed to add family member" },
      { status: 500 }
    );
  }
}
