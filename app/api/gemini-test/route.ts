/**
 * GET /api/gemini-test
 * Diagnostic endpoint — lists available models and tests each text model.
 * Remove this file once the seeder is confirmed working.
 */
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

const TEXT_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 503 });
  }

  const ai = new GoogleGenAI({ apiKey });

  // ── List all models available on this key ────────────────────────────────
  let allModels: any[] = [];
  try {
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=200`
    );
    const listData = await listRes.json();
    allModels = listData.models ?? [];
  } catch (err: any) {
    allModels = [{ error: err?.message }];
  }

  // Filter to models that support generateContent and mention "image" in name.
  const imageCapableModels = allModels
    .filter((m: any) =>
      Array.isArray(m.supportedGenerationMethods) &&
      m.supportedGenerationMethods.includes("generateContent") &&
      m.name?.toLowerCase().includes("image")
    )
    .map((m: any) => ({ name: m.name, displayName: m.displayName }));

  // Also list ALL generateContent-capable models for reference.
  const allGenerateModels = allModels
    .filter((m: any) =>
      Array.isArray(m.supportedGenerationMethods) &&
      m.supportedGenerationMethods.includes("generateContent")
    )
    .map((m: any) => m.name);

  // ── Test text generation on known models ─────────────────────────────────
  const textResults: Record<string, any> = {};
  for (const model of TEXT_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: 'Say "hello" in exactly one word.',
      });
      const text =
        response.text ??
        (response as any).candidates?.[0]?.content?.parts?.[0]?.text ??
        null;
      textResults[model] = { ok: true, text };
    } catch (err: any) {
      textResults[model] = { ok: false, error: err?.message };
    }
  }

  return NextResponse.json({
    apiKeyPrefix: apiKey.slice(0, 8) + "…",
    imageCapableModels,
    allGenerateContentModels: allGenerateModels,
    textResults,
  });
}
