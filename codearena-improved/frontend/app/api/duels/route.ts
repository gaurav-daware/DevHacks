import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// POST /api/duels - Join matchmaking queue
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, rating: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Add to matchmaking queue via backend
    const response = await fetch(`${BACKEND_URL}/duels/queue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, rating: user.rating }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Duel queue error:", error);
    return NextResponse.json({ error: "Queue failed" }, { status: 500 });
  }
}

// GET /api/duels - Get user's duel history
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const duels = await prisma.duel.findMany({
      where: {
        OR: [
          { player1Id: session.user.id },
          { player2Id: session.user.id },
        ],
        status: "FINISHED",
      },
      include: {
        problem: { select: { title: true, difficulty: true, slug: true } },
        player1: { select: { name: true, image: true, rating: true } },
        player2: { select: { name: true, image: true, rating: true } },
        winner: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(duels);
  } catch (error) {
    console.error("Duels GET error:", error);
    return NextResponse.json({ error: "Failed to fetch duels" }, { status: 500 });
  }
}
