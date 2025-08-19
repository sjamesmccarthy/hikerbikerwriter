import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET() {
  try {
    // Simple test query
    const [result] = await pool.execute<RowDataPacket[]>("SELECT 1 as test");
    console.log("Database connection test:", result);

    // Test familyline table
    const [familyResults] = await pool.execute<RowDataPacket[]>(
      'SHOW TABLES LIKE "familyline"'
    );
    console.log("Familyline table check:", familyResults);

    if (familyResults && familyResults[0]) {
      // Test a real query
      const [sample] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM familyline LIMIT 1"
      );
      console.log("Sample familyline record:", sample);
    }

    return NextResponse.json({
      status: "success",
      connection: true,
      familylineExists: familyResults && familyResults[0] ? true : false,
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json(
      {
        error: "Database connection error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
