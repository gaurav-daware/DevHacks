import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/contests/[id]/standings - Get contest leaderboard
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const standings = await prisma.contestStanding.findMany({
      where: { contestId: id },
      orderBy: [{ score: "desc" }, { penalty: "asc" }],
      include: {
        contest: false,
      },
    });

    // Enrich with user info
    const enriched = await Promise.all(
      standings.map(async (standing) => {
        const user = await prisma.user.findUnique({
          where: { id: standing.userId },
          select: { id: true, name: true, image: true, rating: true },
        });
        return {
          ...standing,
          user,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Standings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch standings" }, { status: 500 });
  }
}
