import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { UserSkillEntry } from "@/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log("[/api/submit] Request received, session:", session?.user?.email);
    
    if (!session?.user?.id) {
      console.log("[/api/submit] Unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { problemSlug, code, language } = await req.json();
    console.log("[/api/submit] Parsed request:", { problemSlug, language, codeLength: code?.length });

    // Fetch problem with test cases
    const problem = await prisma.problem.findUnique({
      where: { slug: problemSlug },
    });

    if (!problem) {
      console.log("[/api/submit] Problem not found:", problemSlug);
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    console.log("[/api/submit] Found problem, calling backend at", `${BACKEND_URL}/judge/submit`);

    // Send to FastAPI backend for execution
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
      console.error("[/api/submit] Backend error:", response.status, err);
      return NextResponse.json({ error: `Execution failed: ${err}` }, { status: 500 });
    }

    const result = await response.json();
    console.log("[/api/submit] Backend response received:", result.status);

    // Store submission in DB
    const submission = await prisma.submission.create({
      data: {
        userId: session.user.id,
        problemId: problem.id,
        code,
        language,
        status: result.status,
        runtime: result.runtime,
        memory: result.memory,
        errorOutput: result.error_output,
        testsPassed: result.tests_passed,
        totalTests: result.total_tests,
      },
    });

    // Update problem stats
    await prisma.problem.update({
      where: { id: problem.id },
      data: {
        totalSubmissions: { increment: 1 },
        ...(result.status === "Accepted" && { acceptedSubmissions: { increment: 1 } }),
      },
    });

    // If accepted, update user solved problems & XP
    if (result.status === "Accepted") {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { solvedProblems: true, xp: true, skills: true },
      });

      if (user && !user.solvedProblems.includes(problem.id)) {
        const xpGain = problem.difficulty === "Easy" ? 50 : problem.difficulty === "Medium" ? 100 : 200;
        const currentSkills = (user.skills as UserSkillEntry[] | null) ?? [];

        // Update skill progress
        const updatedSkills = updateSkills(currentSkills, problem.tags, problem.id);

        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            solvedProblems: { push: problem.id },
            xp: { increment: xpGain },
            totalSolved: { increment: 1 },
            skills: updatedSkills as unknown as Prisma.InputJsonValue,
          },
        });
      }
    }

    console.log("[/api/submit] Submission stored successfully, returning to client");
    return NextResponse.json({ ...result, submissionId: submission.id });
  } catch (error) {
    console.error("[/api/submit] Unhandled error:", error);
    return NextResponse.json({ error: "Submission failed", details: String(error) }, { status: 500 });
  }
}

function updateSkills(
  currentSkills: UserSkillEntry[],
  problemTags: string[],
  _problemId: string
): UserSkillEntry[] {
  const skillMap = new Map(currentSkills.map((s) => [s.name, s]));

  for (const tag of problemTags) {
    const existing = skillMap.get(tag) || { name: tag, level: 0, unlocked: false, solvedCount: 0 };
    existing.solvedCount = (existing.solvedCount || 0) + 1;

    // Level up logic: every 3 solves = 1 level
    const newLevel = Math.floor((existing.solvedCount ?? 0) / 3);
    if (newLevel > (existing.level ?? 0)) {
      existing.level = newLevel;
      existing.unlocked = true;
    }

    skillMap.set(tag, existing);
  }

  return Array.from(skillMap.values());
}
