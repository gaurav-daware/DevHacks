import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/contests/[id] - Get contest details with standings
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const contest = await prisma.contest.findUnique({
      where: { id },
      include: {
        standings: {
          orderBy: [{ score: "desc" }, { penalty: "asc" }],
          include: {
            contest: false,
          },
        },
      },
    });

    if (!contest) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    // Get problems
    const problems = await prisma.problem.findMany({
      where: { id: { in: contest.problemIds } },
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        tags: true,
      },
    });

    // Get user's standing if authenticated
    let userStanding = null;
    if (session?.user?.id) {
      userStanding = await prisma.contestStanding.findUnique({
        where: {
          contestId_userId: {
            contestId: id,
            userId: session.user.id,
          },
        },
      });
    }

    return NextResponse.json({
      ...contest,
      problems,
      userStanding,
    });
  } catch (error) {
    console.error("Contest GET error:", error);
    return NextResponse.json({ error: "Failed to fetch contest" }, { status: 500 });
  }
}
