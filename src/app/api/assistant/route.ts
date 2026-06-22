// src/app/api/assistant/route.ts
// POST a question -> a grounded answer from Gemini, using the live fleet snapshot.
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@/auth";
import { buildFleetContext } from "@/lib/assistant";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are the SmartHQ Fleet assistant for GE appliance operations.
Answer ONLY from the fleet data provided in the user message. Be concise and specific:
reference appliances by name and cite the metric or reason. Never invent numbers. If asked
about costs and no business data is present, say that isn't available for this user's role.`;

export async function POST(req: Request) {
  // Defense in depth: the proxy already requires login, but we also need
  // the session here to decide what data the answer is allowed to see.
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { question } = await req.json();
  if (typeof question !== "string" || !question.trim()) {
    return NextResponse.json({ error: "Missing question" }, { status: 400 });
  }

  // EXEC users' context includes dollar figures; OPS users' does not.
  const context = await buildFleetContext(session.user.role === "EXEC");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${context}\n\nQuestion: ${question}`,
      config: { systemInstruction: SYSTEM_PROMPT },
    });
    return NextResponse.json({ answer: response.text });
  } catch (e) {
    console.error("Gemini error:", e);
    return NextResponse.json({ error: "Assistant unavailable" }, { status: 500 });
  }
}
