import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// POST /api/contests/[id]/submit - Submit solution during contest
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { problemId, code, language } = await req.json();

    // Verify contest is active
    const contest = await prisma.contest.findUnique({
      where: { id },
    });

    if (!contest) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    const now = new Date();
    if (now < contest.startTime || now > contest.endTime) {
      return NextResponse.json({ error: "Contest is not active" }, { status: 400 });
    }

    if (!contest.problemIds.includes(problemId)) {
      return NextResponse.json({ error: "Problem not in contest" }, { status: 400 });
    }

    // Get problem
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Submit to Judge0
    const response = await fetch(`${BACKEND_URL}/judge/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problem_id: problem.id,
        code,
        language,
        test_cases: problem.testCases,
        time_limit: problem.timeLimit,
        memory_limit: problem.memoryLimit,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `Execution failed: ${err}` }, { status: 500 });
    }

    const result = await response.json();

    // Update contest standing
    const existingStanding = await prisma.contestStanding.findUnique({
      where: {
        contestId_userId: {
          contestId: id,
          userId: session.user.id,
        },
      },
      select: { solvedAt: true, score: true },
    });

    const solvedAtData = (existingStanding?.solvedAt as Record<string, string>) || {};
    if (result.status === "Accepted" && !solvedAtData[problemId]) {
      solvedAtData[problemId] = now.toISOString();
    }

    const standing = await prisma.contestStanding.upsert({
      where: {
        contestId_userId: {
          contestId: id,
          userId: session.user.id,
        },
      },
      create: {
        contestId: id,
        userId: session.user.id,
        score: result.status === "Accepted" ? 1 : 0,
        penalty: result.status === "Accepted" ? Math.floor((now.getTime() - contest.startTime.getTime()) / 1000) : 0,
        solvedAt: solvedAtData,
      },
      update: {
        ...(result.status === "Accepted" && {
          score: existingStanding?.score && solvedAtData[problemId] ? undefined : { increment: 1 },
          solvedAt: solvedAtData,
          penalty: existingStanding?.score && solvedAtData[problemId] ? undefined : {
            increment: Math.floor((now.getTime() - contest.startTime.getTime()) / 1000),
          },
        }),
      },
    });

    return NextResponse.json({ ...result, standing });
  } catch (error) {
    console.error("Contest submit error:", error);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
