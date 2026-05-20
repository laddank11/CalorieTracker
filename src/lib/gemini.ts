export const GEMINI_MODEL = "gemini-2.5-flash-lite";
export const GEMINI_BASE = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export function geminiUrl(): string {
  const key = process.env.GEMINI_API_KEY ?? "";
  return `${GEMINI_BASE}?key=${key}`;
}

export function parseJsonFromGemini(text: string): unknown {
  const cleaned = text
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();
  return JSON.parse(cleaned);
}

export const NUTRITION_ANALYSIS_SCHEMA = `{
  "items": [
    {
      "name": "Food Name",
      "calories": 200,
      "protein": 10.5,
      "carbs": 25.0,
      "fat": 6.0,
      "servingSize": "1 cup (240g)",
      "quantity": 1
    }
  ],
  "totalCalories": 200,
  "totalProtein": 10.5,
  "totalCarbs": 25.0,
  "totalFat": 6.0,
  "summary": "Brief description — N items"
}`;

export const EMPTY_ANALYSIS = {
  items: [],
  totalCalories: 0,
  totalProtein: 0,
  totalCarbs: 0,
  totalFat: 0,
  summary: "Could not analyze",
};
