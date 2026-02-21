import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { DuelPlayerStateJson } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const duel = await prisma.duel.findUnique({
      where: { id },
      include: {
        problem: true,
        player1: { select: { id: true, name: true, image: true, rating: true } },
        player2: { select: { id: true, name: true, image: true, rating: true } },
        winner: { select: { id: true, name: true } },
      },
    });

    if (!duel) return NextResponse.json({ error: "Duel not found" }, { status: 404 });

    // Check user is a participant
    const isPlayer1 = duel.player1Id === session.user.id;
    const isPlayer2 = duel.player2Id === session.user.id;
    if (!isPlayer1 && !isPlayer2) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const me = isPlayer1 ? duel.player1 : duel.player2;
    const opponent = isPlayer1 ? duel.player2 : duel.player1;
    const myStateRaw = (isPlayer1 ? duel.player1State : duel.player2State) as DuelPlayerStateJson | null;
    const opStateRaw = (isPlayer1 ? duel.player2State : duel.player1State) as DuelPlayerStateJson | null;

    const myState = {
      ...me,
      ...(myStateRaw ?? {}),
    };
    const opponentState = {
      ...opponent,
      ...(opStateRaw ?? {}),
    };

    return NextResponse.json({
      id: duel.id,
      status: duel.status,
      problem: duel.problem,
      myState,
      opponentState,
      winner: duel.winner,
      startedAt: duel.startedAt,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch duel" }, { status: 500 });
  }
}
