import { NextRequest, NextResponse } from "next/server";
import { NutritionAnalysis } from "@/types";
import {
  geminiUrl,
  parseJsonFromGemini,
  NUTRITION_ANALYSIS_SCHEMA,
  EMPTY_ANALYSIS,
} from "@/lib/gemini";

const PROMPT = (description: string) => `You are a precise nutrition analyst. A user ate: "${description}"

Identify each distinct food item or component. For each, estimate a realistic serving size and macros. Then compute the totals by summing all items.

Return ONLY a JSON object — no markdown, no explanation — exactly matching this shape:
${NUTRITION_ANALYSIS_SCHEMA}

Rules:
- Use evidence-based values, not rough guesses
- quantity is the number of servings (usually 1, but 2 for "two eggs" etc.)
- calories/protein/carbs/fat are per single serving (before multiplying by quantity)
- totalCalories and other totals must equal the sum of (item.calories × item.quantity) across all items
- summary must name the meal and state how many items were identified
- Return ONLY the JSON object, nothing else`;

export async function POST(req: NextRequest) {
  let description: string;
  try {
    const body = await req.json();
    description = (body.description ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!description) {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }

  try {
    const res = await fetch(geminiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT(description) }] }],
        generationConfig: { temperature: 0.1 },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini text error:", err);
      return NextResponse.json(EMPTY_ANALYSIS);
    }

    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const parsed = parseJsonFromGemini(text) as NutritionAnalysis;

    if (!parsed.items || !Array.isArray(parsed.items)) {
      return NextResponse.json(EMPTY_ANALYSIS);
    }

    return NextResponse.json(parsed);
  } catch (e) {
    console.error("AI text route error:", e);
    return NextResponse.json(EMPTY_ANALYSIS);
  }
}
