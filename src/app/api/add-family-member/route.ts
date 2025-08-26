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
  person_id: string;
}

interface FamilyLine extends RowDataPacket {
  id: string;
  uuid: string;
  json: string;
  person_id: string;
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
    "SELECT * FROM users WHERE person_id = ?",
    [userId]
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

function createFamilyMember(
  user: User,
  relationship: string,
  familylineUuid: string,
  networkType: string
): FamilyMember {
  return {
    name: user.name || "",
    gender: "",
    relation: relationship,
    person_id: user.person_id,
    familylineid: familylineUuid,
    network_level:
      networksData.network.find((n) => n.type === networkType)?.level || 1,
    email: user.email || "",
  };
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

async function processFamilyUpdate(
  userToAdd: User,
  requestBody: RequestBody,
  targetFamilyline: FamilyLine,
  userSourceFamilyline: FamilyLine
): Promise<FamilyData> {
  const familyData = parseFamilyData(targetFamilyline.json);

  // Debug logging to understand the issue
  console.log("=== PROCESS FAMILY UPDATE DEBUG ===");
  console.log("Target familyline person_id:", targetFamilyline.person_id);
  console.log("User to add:", {
    person_id: userToAdd.person_id,
    name: userToAdd.name,
    email: userToAdd.email,
  });
  console.log("Relationship being added:", requestBody.relationship);
  console.log("Current family members:");
  familyData.people.forEach((person, index) => {
    console.log(
      `  ${index}: ${person.name} (${person.email}) [${person.person_id}] - ${person.relation}`
    );
  });

  // Normalize emails for comparison (trim whitespace and convert to lowercase)
  const userEmailNormalized = userToAdd.email.trim().toLowerCase();
  const existingMember = familyData.people.find(
    (p: FamilyMember) => p.email.trim().toLowerCase() === userEmailNormalized
  );

  if (existingMember) {
    console.log("Found existing member:", existingMember);
    console.log(
      `Updating existing relationship from '${existingMember.relation}' to '${requestBody.relationship}'`
    );

    // Update the existing member's relationship instead of throwing an error
    existingMember.relation = requestBody.relationship;
    existingMember.network_level =
      networksData.network.find((n) => n.type === requestBody.network)?.level ||
      1;

    return familyData;
  }

  // Always use the source familyline's uuid - this is the familyline that the person being added belongs to
  const newPerson = createFamilyMember(
    userToAdd,
    requestBody.relationship,
    userSourceFamilyline.uuid,
    requestBody.network
  );
  familyData.people.push(newPerson);

  return familyData;
}

export async function POST(request: Request) {
  try {
    console.log("Received add-family-member request");
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

    console.log("Getting user to add...");
    // Get user to add and their familyline
    const userToAdd = await getUser(requestBody.userId);
    if (!userToAdd?.person_id) {
      console.error("User to add not found:", requestBody.userId);
      return NextResponse.json(
        { error: "User to add not found or missing person_id" },
        { status: 404 }
      );
    }
    console.log("User to add found:", userToAdd.name, userToAdd.email);

    console.log("Getting added person's familyline...");
    const addedPersonFamilyline = await getFamilyLine(userToAdd.email);
    if (!addedPersonFamilyline) {
      console.error("No familyline found for user to add:", userToAdd.email);
      return NextResponse.json(
        { error: "No familyline found for user to add" },
        { status: 404 }
      );
    }
    console.log("Added person familyline found:", addedPersonFamilyline.id);

    console.log("Getting logged-in user familyline...");
    // Get logged-in user and their familyline
    const familyline = await getFamilyLine(requestBody.userEmail);
    if (!familyline) {
      console.error(
        "No familyline found for logged in user:",
        requestBody.userEmail
      );
      return NextResponse.json(
        { error: "No familyline found for logged in user" },
        { status: 404 }
      );
    }
    console.log("Logged-in user familyline found:", familyline.id);

    const loggedInUser = await getUser(familyline.person_id);
    if (!loggedInUser) {
      console.error(
        "Could not find logged in user details for person_id:",
        familyline.person_id
      );
      return NextResponse.json(
        { error: "Could not find logged in user details" },
        { status: 404 }
      );
    }
    console.log("Logged-in user found:", loggedInUser.name, loggedInUser.email);

    // Check if user is trying to add themselves
    if (userToAdd.email === requestBody.userEmail) {
      console.error("User trying to add themselves");
      return NextResponse.json(
        { error: "Cannot add yourself to your own family" },
        { status: 400 }
      );
    }

    // Additional debug logging
    console.log("Logged in user:", loggedInUser.email);
    console.log("User to add:", userToAdd.email);
    console.log("Logged in user familyline ID:", familyline.id);
    console.log("User to add familyline ID:", addedPersonFamilyline.id);

    try {
      console.log(
        "Starting processFamilyUpdate for logged-in user's family..."
      );
      // Add person to logged-in user's family - using the person's familyline uuid
      const familyData = await processFamilyUpdate(
        userToAdd,
        requestBody,
        familyline,
        addedPersonFamilyline
      );
      console.log("Completed processFamilyUpdate for logged-in user's family");

      console.log("Starting processFamilyUpdate for added person's family...");
      // Add logged-in user to person's family - using logged-in user's familyline uuid and "unknown" relationship
      const modifiedRequestBody = {
        ...requestBody,
        relationship: "unknown", // Override the relationship to "unknown" for the reverse connection
      };
      const addedPersonFamilyData = await processFamilyUpdate(
        loggedInUser,
        modifiedRequestBody,
        addedPersonFamilyline,
        familyline
      );
      console.log("Completed processFamilyUpdate for added person's family");

      console.log("Updating both familylines...");
      // Update both familylines
      await Promise.all([
        updateFamilyLine(familyline, familyData),
        updateFamilyLine(addedPersonFamilyline, addedPersonFamilyData),
      ]);
      console.log("Successfully updated both familylines");

      return NextResponse.json({
        success: true,
        message: "Family member added successfully",
        familyData,
      });
    } catch (error) {
      console.error("Error in processFamilyUpdate section:", error);
      if (
        error instanceof Error &&
        error.message.startsWith("User is already in the family")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error adding family member (main catch):", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Failed to add family member" },
      { status: 500 }
    );
  }
}
