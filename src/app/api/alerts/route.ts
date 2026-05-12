import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { email, keywords, location, minExp, maxExp, frequency } = await req.json();
  if (!email || !keywords) return NextResponse.json({ error: "email and keywords required" }, { status: 400 });

  try {
    await prisma.alert.upsert({
      where: { email_keywords: { email, keywords } },
      update: { location, minExp, maxExp, frequency: frequency || "daily", isActive: true },
      create: { email, keywords, location, minExp, maxExp, frequency: frequency || "daily" },
    });
    return NextResponse.json({ success: true, message: "Alert created! You'll receive updates " + (frequency || "daily") + "." });
  } catch {
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
  }
}
