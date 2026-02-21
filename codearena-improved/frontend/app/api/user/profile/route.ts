import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        submissions: {
          orderBy: { submittedAt: "desc" },
          take: 10,
          include: {
            problem: { select: { title: true, slug: true, difficulty: true } },
          },
        },
        duelsAsP1: {
          where: { status: "FINISHED" },
          take: 5,
          include: {
            problem: { select: { title: true } },
            player2: { select: { name: true, image: true } },
            winner: { select: { id: true } },
          },
          orderBy: { endedAt: "desc" },
        },
        duelsAsP2: {
          where: { status: "FINISHED" },
          take: 5,
          include: {
            problem: { select: { title: true } },
            player1: { select: { name: true, image: true } },
            winner: { select: { id: true } },
          },
          orderBy: { endedAt: "desc" },
        },
      },
    });

    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
