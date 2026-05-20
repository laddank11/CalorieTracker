import { NextRequest, NextResponse } from "next/server";
import { Food } from "@/types";

const USDA_BASE = "https://api.nal.usda.gov/fdc/v1/foods/search";
const NUTRIENT_IDS = {
  calories: [1008, 2047, 2048],
  protein:  [1003],
  carbs:    [1005],
  fat:      [1004],
};

function getNutrient(nutrients: { nutrientId: number; value: number }[], ids: number[]): number {
  const match = nutrients.find((n) => ids.includes(n.nutrientId));
  return match ? Math.round(match.value * 10) / 10 : 0;
}

// Convert ALL CAPS names to Title Case
function toTitleCase(str: string): string {
  if (str === str.toUpperCase()) {
    return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return str;
}

async function searchUSDA(query: string): Promise<Food[]> {
  const apiKey = process.env.USDA_API_KEY ?? "DEMO_KEY";
  const url = `${USDA_BASE}?query=${encodeURIComponent(query)}&pageSize=25&api_key=${apiKey}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return [];

  const data = await res.json();
  const seen = new Set<string>();

  return (data.foods ?? [])
    .filter((f: { foodNutrients?: unknown[] }) => Array.isArray(f.foodNutrients))
    .map((f: { fdcId: number; description: string; servingSize?: number; servingSizeUnit?: string; foodNutrients: { nutrientId: number; value: number }[] }) => ({
      id:          String(f.fdcId),
      name:        toTitleCase(f.description),
      calories:    getNutrient(f.foodNutrients, NUTRIENT_IDS.calories),
      protein:     getNutrient(f.foodNutrients, NUTRIENT_IDS.protein),
      carbs:       getNutrient(f.foodNutrients, NUTRIENT_IDS.carbs),
      fat:         getNutrient(f.foodNutrients, NUTRIENT_IDS.fat),
      servingSize: f.servingSize ? `${f.servingSize}${f.servingSizeUnit ?? "g"}` : "100g",
    }))
    .filter((f: Food) => {
      if (f.calories <= 0) return false;
      const key = f.name.toLowerCase().replace(/\s+/g, " ").trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);
}

async function searchGemini(query: string): Promise<Food[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];

  const prompt = `You are a nutrition database. Return JSON only — no markdown, no explanation.

For the food "${query}", return an array of 1 to 4 common variations with accurate nutrition data per typical serving.

Required JSON format:
[
  {
    "name": "Food Name",
    "calories": 200,
    "protein": 10.5,
    "carbs": 25.0,
    "fat": 6.0,
    "servingSize": "1 cup (240g)"
  }
]

Rules:
- Use realistic, evidence-based values (not estimates)
- servingSize must be a human-readable string
- All numeric fields must be numbers, not strings
- Return ONLY the JSON array, nothing else`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 },
      }),
    }
  );

  if (!res.ok) return [];

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  // Strip markdown code fences if present
  const json = text.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();

  try {
    const items = JSON.parse(json);
    if (!Array.isArray(items)) return [];
    return items
      .filter((item) => item.name && item.calories > 0)
      .map((item, i) => ({
        id:          `gemini-${i}-${Date.now()}`,
        name:        String(item.name),
        calories:    Number(item.calories),
        protein:     Number(item.protein ?? 0),
        carbs:       Number(item.carbs ?? 0),
        fat:         Number(item.fat ?? 0),
        servingSize: String(item.servingSize ?? "1 serving"),
      }));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Run both in parallel — USDA for accuracy, Gemini for fuzzy/international coverage
    const [usdaResults, geminiResults] = await Promise.all([
      searchUSDA(query),
      searchGemini(query),
    ]);

    // Merge: USDA first, then Gemini items not already covered by name
    const seen = new Set(usdaResults.map((f) => f.name.toLowerCase().trim()));
    const merged = [
      ...usdaResults,
      ...geminiResults.filter((f) => !seen.has(f.name.toLowerCase().trim())),
    ].slice(0, 12);

    return NextResponse.json({ results: merged });
  } catch {
    return NextResponse.json({ results: [], error: "Search unavailable" }, { status: 200 });
  }
}
