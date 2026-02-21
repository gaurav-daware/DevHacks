import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/pair - Create a new pair programming session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { problemId } = await req.json();

    if (!problemId) {
      return NextResponse.json({ error: "Problem ID required" }, { status: 400 });
    }

    // Verify problem exists
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      select: { id: true, starterCode: true },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    const session_data = await prisma.pairSession.create({
      data: {
        problemId,
        hostId: session.user.id,
        status: "WAITING",
        sharedCode: (problem.starterCode as Record<string, string>)?.python || "",
        sharedLanguage: "python",
      },
    });

    return NextResponse.json(session_data);
  } catch (error) {
    console.error("Pair session POST error:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}

// GET /api/pair - Get user's pair sessions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await prisma.pairSession.findMany({
      where: {
        OR: [
          { hostId: session.user.id },
          { partnerId: session.user.id },
        ],
      },
      include: {
        host: { select: { id: true, name: true, image: true } },
        partner: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch problems separately and merge
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        const problem = await prisma.problem.findUnique({
          where: { id: session.problemId },
          select: { id: true, title: true, slug: true, difficulty: true },
        });
        return { ...session, problem };
      })
    );

    return NextResponse.json(enrichedSessions);
  } catch (error) {
    console.error("Pair sessions GET error:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}
