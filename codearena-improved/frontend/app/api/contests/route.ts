import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/contests - List all contests
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // "upcoming" | "active" | "past"

    const now = new Date();
    let where: any = {};

    if (status === "upcoming") {
      where.startTime = { gt: now };
    } else if (status === "active") {
      where.startTime = { lte: now };
      where.endTime = { gte: now };
    } else if (status === "past") {
      where.endTime = { lt: now };
    }

    const contests = await prisma.contest.findMany({
      where,
      orderBy: { startTime: "desc" },
      include: {
        standings: {
          take: 10,
          orderBy: [{ score: "desc" }, { penalty: "asc" }],
          include: {
            contest: false,
          },
        },
        _count: {
          select: { standings: true },
        },
      },
    });

    return NextResponse.json(contests);
  } catch (error) {
    console.error("Contests GET error:", error);
    return NextResponse.json({ error: "Failed to fetch contests" }, { status: 500 });
  }
}

// POST /api/contests - Create a new contest (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, startTime, endTime, problemIds } = await req.json();

    if (!title || !startTime || !endTime || !problemIds || !Array.isArray(problemIds)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify problems exist
    const problems = await prisma.problem.findMany({
      where: { id: { in: problemIds } },
      select: { id: true },
    });

    if (problems.length !== problemIds.length) {
      return NextResponse.json({ error: "Some problems not found" }, { status: 400 });
    }

    const contest = await prisma.contest.create({
      data: {
        title,
        description: description || "",
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        problemIds,
        isActive: false,
      },
    });

    return NextResponse.json(contest);
  } catch (error) {
    console.error("Contest POST error:", error);
    return NextResponse.json({ error: "Failed to create contest" }, { status: 500 });
  }
}
