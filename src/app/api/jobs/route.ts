import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface User extends RowDataPacket {
  id: number;
  email: string;
}

interface Opportunity {
  status: string;
  [key: string]: unknown;
}

interface JobData extends RowDataPacket {
  id: number;
  closed: number;
  status: string;
  company?: string;
  title?: string;
  json: string;
  created: string; // Database created timestamp
  opportunities?: Opportunity[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail");

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    // First get the user_id
    const [users] = await pool.query<User[]>(
      `SELECT id FROM users WHERE email = ?`,
      [userEmail]
    );

    console.log(`Looking for user with email: ${userEmail}`);
    console.log("Found users:", users);

    if (!users || users.length === 0) {
      console.log("No user found, returning empty array");
      return NextResponse.json([]);
    }

    const userId = users[0].id;
    console.log(`Using user_id: ${userId}`);

    // Get all jobs for the user
    const [jobs] = await pool.query<JobData[]>(
      `SELECT id, json, closed, created
       FROM jobs
       WHERE user_id = ?`,
      [userId]
    );

    console.log(`Found ${jobs.length} jobs for user_id ${userId}`);
    console.log("Raw jobs:", jobs);

    // Parse the JSON data for each job
    const parsedJobs = jobs
      .map((job) => {
        try {
          const jobData = JSON.parse(job.json);
          return {
            id: job.id,
            closed: job.closed,
            status: jobData.status || "",
            opportunities: jobData.opportunities || [],
            ...jobData,
            created: job.created, // Use database created timestamp instead of JSON
          };
        } catch (e) {
          console.error("Error parsing job JSON:", e);
          return null;
        }
      })
      .filter(Boolean);

    console.log("Final parsed jobs:", parsedJobs);

    // Calculate aggregated stats for the frontend
    let totalOpportunities = 0;
    let appliedCount = 0;

    parsedJobs.forEach((job) => {
      if (job.opportunities && Array.isArray(job.opportunities)) {
        totalOpportunities += job.opportunities.length;
        appliedCount += job.opportunities.filter(
          (opp: Opportunity) => opp.status === "applied"
        ).length;
      }
    });

    const hasActiveSearch = parsedJobs.some((job) => job.closed === 0);

    console.log("Calculated stats:", {
      totalOpportunities,
      appliedCount,
      hasActiveSearch,
      jobsWithClosedZero: parsedJobs.filter((job) => job.closed === 0).length,
    });

    // Return the jobs data with aggregated stats for easier frontend consumption
    return NextResponse.json({
      jobs: parsedJobs,
      stats: {
        total: totalOpportunities,
        applied: appliedCount,
        hasActiveSearch,
      },
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, jobData } = body;

    if (!userEmail || !jobData) {
      return NextResponse.json(
        { error: "User email and job data are required" },
        { status: 400 }
      );
    }

    // First get the user_id
    const [users] = await pool.query<User[]>(
      `SELECT id FROM users WHERE email = ?`,
      [userEmail]
    );

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = users[0].id;

    // Check if this is an update to an existing job or a new job
    if (jobData.id && jobData.id !== "new") {
      // Update existing job
      await pool.query(
        `UPDATE jobs SET json = ?, closed = ? WHERE id = ? AND user_id = ?`,
        [JSON.stringify(jobData), jobData.closed || 0, jobData.id, userId]
      );
    } else {
      // Insert new job
      await pool.query(
        `INSERT INTO jobs (user_id, json, closed) VALUES (?, ?, ?)`,
        [userId, JSON.stringify(jobData), jobData.closed || 0]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving job data:", error);
    return NextResponse.json(
      { error: "Failed to save job data" },
      { status: 500 }
    );
  }
}
