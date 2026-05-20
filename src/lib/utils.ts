/**
 * USDA FoodData Central returns food names in ALL CAPS.
 * This normalizes them to Title Case for display.
 */
export function formatFoodName(name: string): string {
  const letters = name.replace(/[^A-Za-z]/g, "");
  if (letters.length > 2 && letters === letters.toUpperCase()) {
    return name.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
  }
  return name;
}
