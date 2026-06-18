import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // In current Next.js, params is a Promise — you must await it.
  const { id } = await params;

  const appliance = await prisma.appliance.findUnique({
    where: { id },
    include: {
      readings: {
        orderBy: { recordedAt: "desc" }, // newest first
        take: 20,                        // only the latest 20
      },
    },
  });

  if (!appliance) {
    return NextResponse.json({ error: "Appliance not found" }, { status: 404 });
  }

  return NextResponse.json(appliance);
}
