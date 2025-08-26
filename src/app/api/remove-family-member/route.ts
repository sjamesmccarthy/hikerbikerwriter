import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface RequestBody {
  personIdToRemove: string;
  userEmail: string;
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
  person_id: string;
}

interface FamilyLine extends RowDataPacket {
  id: string;
  uuid: string;
  json: string;
  person_id: string;
}

async function getFamilyLine(userEmail: string): Promise<FamilyLine | null> {
  const [rows] = await pool.execute<FamilyLine[]>(
    "SELECT f.* FROM familyline f JOIN users u ON f.person_id = u.person_id WHERE u.email = ?",
    [userEmail]
  );
  return rows.length ? rows[0] : null;
}

async function getUser(personId: string): Promise<User | null> {
  const [rows] = await pool.execute<User[]>(
    "SELECT * FROM users WHERE person_id = ?",
    [personId]
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

async function removeFamilyMember(
  familyline: FamilyLine,
  personIdToRemove: string
): Promise<FamilyData> {
  const familyData = parseFamilyData(familyline.json);

  console.log("=== REMOVE FAMILY MEMBER DEBUG ===");
  console.log("Target familyline person_id:", familyline.person_id);
  console.log("Person to remove:", personIdToRemove);
  console.log("Current family members:");
  familyData.people.forEach((person, index) => {
    console.log(
      `  ${index}: ${person.name} (${person.email}) [${person.person_id}] - ${person.relation}`
    );
  });

  // Find and remove the person
  const originalCount = familyData.people.length;
  familyData.people = familyData.people.filter(
    (person) => person.person_id !== personIdToRemove
  );

  const removedCount = originalCount - familyData.people.length;
  console.log(`Removed ${removedCount} family member(s)`);

  if (removedCount === 0) {
    throw new Error("Person not found in family");
  }

  return familyData;
}

export async function DELETE(request: Request) {
  try {
    console.log("Received remove-family-member request");
    const requestBody = (await request.json()) as RequestBody;
    console.log("Request body:", requestBody);

    if (!requestBody.personIdToRemove || !requestBody.userEmail) {
      return NextResponse.json(
        { error: "Missing required fields: personIdToRemove or userEmail" },
        { status: 400 }
      );
    }

    // Get the person to remove and their details
    const personToRemove = await getUser(requestBody.personIdToRemove);
    if (!personToRemove) {
      return NextResponse.json(
        { error: "Person to remove not found" },
        { status: 404 }
      );
    }
    console.log(
      "Person to remove found:",
      personToRemove.name,
      personToRemove.email
    );

    // Get logged-in user's familyline
    const loggedInUserFamilyline = await getFamilyLine(requestBody.userEmail);
    if (!loggedInUserFamilyline) {
      return NextResponse.json(
        { error: "No familyline found for logged in user" },
        { status: 404 }
      );
    }
    console.log("Logged-in user familyline found:", loggedInUserFamilyline.id);

    // Get person to remove's familyline
    const personToRemoveFamilyline = await getFamilyLine(personToRemove.email);
    if (!personToRemoveFamilyline) {
      return NextResponse.json(
        { error: "No familyline found for person to remove" },
        { status: 404 }
      );
    }
    console.log(
      "Person to remove familyline found:",
      personToRemoveFamilyline.id
    );

    // Get logged-in user details for reverse removal
    const loggedInUser = await getUser(loggedInUserFamilyline.person_id);
    if (!loggedInUser) {
      return NextResponse.json(
        { error: "Could not find logged in user details" },
        { status: 404 }
      );
    }
    console.log("Logged-in user found:", loggedInUser.name, loggedInUser.email);

    try {
      // Remove person from logged-in user's family
      console.log("Removing person from logged-in user's family...");
      const updatedLoggedInUserFamily = await removeFamilyMember(
        loggedInUserFamilyline,
        requestBody.personIdToRemove
      );

      // Remove logged-in user from person's family (bidirectional removal)
      console.log("Removing logged-in user from person's family...");
      const updatedPersonFamily = await removeFamilyMember(
        personToRemoveFamilyline,
        loggedInUser.person_id
      );

      // Update both familylines
      console.log("Updating both familylines...");
      await Promise.all([
        updateFamilyLine(loggedInUserFamilyline, updatedLoggedInUserFamily),
        updateFamilyLine(personToRemoveFamilyline, updatedPersonFamily),
      ]);
      console.log("Successfully updated both familylines");

      return NextResponse.json({
        success: true,
        message: "Family member removed successfully",
        removedPerson: {
          person_id: personToRemove.person_id,
          name: personToRemove.name,
          email: personToRemove.email,
        },
      });
    } catch (error) {
      console.error("Error in removal process:", error);
      if (
        error instanceof Error &&
        error.message === "Person not found in family"
      ) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error removing family member (main catch):", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Failed to remove family member" },
      { status: 500 }
    );
  }
}
