import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// POST /api/pair/[id]/submit - Submit solution from pair session
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
    const { code, language } = await req.json();

    const pairSession = await prisma.pairSession.findUnique({
      where: { id },
    });

    if (!pairSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const problem = await prisma.problem.findUnique({
      where: { id: pairSession.problemId },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Verify user is participant
    const isHost = pairSession.hostId === session.user.id;
    const isPartner = pairSession.partnerId === session.user.id;

    if (!isHost && !isPartner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Submit to Judge0
    const response = await fetch(`${BACKEND_URL}/judge/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problem_id: problem.id,
        code: code || pairSession.sharedCode,
        language: language || pairSession.sharedLanguage,
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

    // Update session status if accepted
    if (result.status === "Accepted") {
      await prisma.pairSession.update({
        where: { id },
        data: {
          status: "FINISHED",
          endedAt: new Date(),
        },
      });

      // Call AI analysis endpoint
      try {
        const analysisResponse = await fetch(`${BACKEND_URL}/ai/analyze-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_data: {
              host_id: pairSession.hostId,
              partner_id: pairSession.partnerId,
              problem_id: pairSession.problemId,
              duration: pairSession.startedAt
                ? Math.floor((new Date().getTime() - pairSession.startedAt.getTime()) / 1000)
                : 0,
            },
          }),
        });

        if (analysisResponse.ok) {
          const analysis = await analysisResponse.json();
          await prisma.pairSession.update({
            where: { id },
            data: { aiAnalysis: analysis },
          });
        }
      } catch {
        // Ignore analysis errors
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Pair submit error:", error);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
