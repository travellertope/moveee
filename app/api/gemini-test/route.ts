/**
 * GET /api/gemini-test
 * Diagnostic endpoint — tests each model and reports what it returns.
 * Remove this file once the seeder is confirmed working.
 */
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

const MODELS = [
  "gemini-2.5-flash-preview-04-17",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash-002",
  "gemini-1.5-pro-002",
];

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 503 });
  }

  const ai = new GoogleGenAI({ apiKey });
  const results: Record<string, any> = {};

  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: 'Say "hello" in exactly one word.',
      });
      const text =
        response.text ??
        (response as any).candidates?.[0]?.content?.parts?.[0]?.text ??
        null;
      results[model] = { ok: true, text };
    } catch (err: any) {
      results[model] = { ok: false, error: err?.message };
    }
  }

  return NextResponse.json({ apiKeyPrefix: apiKey.slice(0, 8) + "…", results });
}
