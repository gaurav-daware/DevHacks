import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const duel = await prisma.duel.findUnique({
      where: { id: params.id },
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
    const myStateRaw = isPlayer1 ? duel.player1State : duel.player2State;
    const opStateRaw = isPlayer1 ? duel.player2State : duel.player1State;

    const myState = {
      ...(me as any),
      ...((myStateRaw as any) || {}),
    };
    const opponentState = {
      ...(opponent as any),
      ...((opStateRaw as any) || {}),
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
