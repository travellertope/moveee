
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

export interface GeminiCrosswordClue {
  direction: "across" | "down";
  answer:    string;
  clue:      string;
}

export interface GeminiCrosswordResponse {
  title: string;
  grid:  string[];
  clues: GeminiCrosswordClue[];
}

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

export async function generateCrosswordWithGemini(): Promise<GeminiCrosswordResponse | null> {
  const model = ai.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    safetySettings: SAFETY_SETTINGS,
  });

  const prompt = `You are a crossword master specializing in African and Black diaspora culture.
Generate a high-quality 7x7 mini crossword puzzle.

Return ONLY a raw JSON object — no markdown, no backticks, no explanation.

Expected JSON Format:
{
  "title": "A sharp, catchy title for the puzzle",
  "grid": [
    "ABC....",
    "D......",
    "E.FGHIJ",
    ".......",
    ".......",
    ".......",
    "......."
  ],
  "clues": [
    { "direction": "across", "answer": "ABC", "clue": "The hint for ABC" },
    { "direction": "across", "answer": "FGHIJ", "clue": "The hint for FGHIJ" },
    { "direction": "down", "answer": "ADE", "clue": "The hint for ADE" }
  ]
}

RULES:
1. The grid MUST be exactly 7x7 (7 strings, each exactly 7 characters).
2. Use '.' for black cells and UPPERCASE letters for letters.
3. Every word must be at least 3 letters long.
4. IMPORTANT: Every clue in your 'clues' list MUST be physically present in your 'grid' string array.
5. All words and clues must relate to African/Black diaspora culture (people, places, food, music, history, traditions).
6. Ensure the puzzle is solvable and interconnected (words should overlap where possible).
7. Return ONLY the JSON object.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from potential markdown wrappers
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in Gemini response");
    
    const parsed = JSON.parse(jsonMatch[0]) as GeminiCrosswordResponse;
    
    // Basic validation
    if (!parsed.grid || parsed.grid.length !== 7) throw new Error("Invalid grid size");
    if (!parsed.clues || !Array.isArray(parsed.clues)) throw new Error("Invalid clues format");
    
    return parsed;
  } catch (error) {
    console.error("[crossword-gemini] Error generating crossword:", error);
    return null;
  }
}
