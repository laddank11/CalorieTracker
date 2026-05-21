import { NextRequest, NextResponse } from "next/server";
import { NutritionAnalysis } from "@/types";
import {
  geminiUrl,
  parseJsonFromGemini,
  NUTRITION_ANALYSIS_SCHEMA,
  EMPTY_ANALYSIS,
} from "@/lib/gemini";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// Normalise to a MIME type Gemini accepts
function resolveGeminiMime(rawType: string): string {
  const t = rawType.toLowerCase();
  if (t === "image/jpg" || t === "image/jpeg" || t === "") return "image/jpeg";
  if (t === "image/png")  return "image/png";
  if (t === "image/webp") return "image/webp";
  if (t === "image/heic" || t === "image/heif") return "image/heic";
  if (t === "image/avif") return "image/avif";
  if (t === "image/gif")  return "image/gif";
  if (t.startsWith("image/")) return "image/jpeg"; // best-effort for other image/* types
  return "";
}

const PROMPT = `You are a precise nutrition analyst. Look at this meal photo carefully.

Identify every visible food item. Use visual cues — plate size, utensils, food proportions — to estimate portion sizes. When in doubt, assume a smaller portion rather than a larger one.

Return ONLY a JSON object — no markdown, no explanation — exactly matching this shape:
${NUTRITION_ANALYSIS_SCHEMA}

Rules:
- Use USDA standard serving sizes as your baseline — do NOT assume restaurant-sized portions
- Err on the conservative (lower) side when estimating calories — it is better to slightly undercount than overcount
- A typical dinner plate holds 400–700 kcal of a balanced meal, not 1000+
- quantity MUST match exactly what is visibly countable in the photo — default to 1 if you cannot clearly count more than one
- Never guess quantity > 1 for flat or stacked foods (roti, bread, pancakes, slices) unless multiple are unambiguously visible and separated
- calories/protein/carbs/fat are per single serving (before multiplying by quantity)
- totalCalories and other totals must equal the sum of (item.calories × item.quantity) across all items
- summary must briefly describe what you see and state how many items were identified
- If the image is not a food photo, return items: [] with summary: "No food detected"
- Return ONLY the JSON object, nothing else`;

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = formData.get("image");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "image field is required" }, { status: 400 });
  }

  const mimeType = resolveGeminiMime(file.type);
  if (!mimeType) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type}. Please upload an image.` },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 10 MB" }, { status: 400 });
  }

  try {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    const res = await fetch(geminiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT },
              { inlineData: { mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: { temperature: 0.2 },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini image error:", errText);
      // Surface format errors explicitly so the user knows to try a different format
      const isFormatError = errText.includes("INVALID_ARGUMENT") || errText.includes("unsupported");
      return NextResponse.json({
        ...EMPTY_ANALYSIS,
        summary: isFormatError
          ? "Image format not supported by AI. Try saving as JPEG or PNG and upload again."
          : "AI could not analyze this image. Try a clearer photo.",
      });
    }

    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const parsed = parseJsonFromGemini(text) as NutritionAnalysis;

    if (!parsed.items || !Array.isArray(parsed.items)) {
      return NextResponse.json(EMPTY_ANALYSIS);
    }

    return NextResponse.json(parsed);
  } catch (e) {
    console.error("AI image route error:", e);
    return NextResponse.json(EMPTY_ANALYSIS);
  }
}
