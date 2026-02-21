import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/pair/[id] - Get pair session details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const pairSession = await prisma.pairSession.findUnique({
      where: { id },
      include: {
        host: { select: { id: true, name: true, image: true, rating: true } },
        partner: { select: { id: true, name: true, image: true, rating: true } },
      },
    });

    if (!pairSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get problem separately
    const problem = await prisma.problem.findUnique({
      where: { id: pairSession.problemId },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Check if user is participant
    const isHost = pairSession.hostId === session.user.id;
    const isPartner = pairSession.partnerId === session.user.id;

    if (!isHost && !isPartner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ ...pairSession, problem });
  } catch (error) {
    console.error("Pair session GET error:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

// PATCH /api/pair/[id] - Join session or update code
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { action, code, language } = await req.json();

    const pairSession = await prisma.pairSession.findUnique({
      where: { id },
    });

    if (!pairSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (action === "join") {
      if (pairSession.partnerId) {
        return NextResponse.json({ error: "Session is full" }, { status: 400 });
      }
      if (pairSession.hostId === session.user.id) {
        return NextResponse.json({ error: "Cannot join your own session" }, { status: 400 });
      }

      const updated = await prisma.pairSession.update({
        where: { id },
        data: {
          partnerId: session.user.id,
          status: "ACTIVE",
          startedAt: new Date(),
        },
      });

      return NextResponse.json(updated);
    }

    if (action === "update_code") {
      // Verify user is participant
      const isHost = pairSession.hostId === session.user.id;
      const isPartner = pairSession.partnerId === session.user.id;

      if (!isHost && !isPartner) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const updated = await prisma.pairSession.update({
        where: { id },
        data: {
          sharedCode: code || pairSession.sharedCode,
          sharedLanguage: language || pairSession.sharedLanguage,
        },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Pair session PATCH error:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}
