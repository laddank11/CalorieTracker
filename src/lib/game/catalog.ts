export type Category = "outfit" | "accessory" | "hat" | "shoes" | "background" | "animation" | "emote";
export type Rarity   = "common" | "rare" | "epic" | "legendary";

export interface CosmeticItem {
  id:          string;
  name:        string;
  category:    Category;
  rarity:      Rarity;
  cost:        number;
  emoji:       string;
  description: string;
}

export const RARITY_COLORS: Record<Rarity, string> = {
  common:    "text-slate-500 bg-slate-100 border-slate-200",
  rare:      "text-blue-600  bg-blue-50   border-blue-200",
  epic:      "text-violet-600 bg-violet-50 border-violet-200",
  legendary: "text-amber-600 bg-amber-50  border-amber-300",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  outfit:     "Outfits",
  accessory:  "Accessories",
  hat:        "Hats",
  shoes:      "Shoes",
  background: "Backgrounds",
  animation:  "Animations",
  emote:      "Emotes",
};

export const COSMETICS: CosmeticItem[] = [
  // ── Outfits ────────────────────────────────────────────────────────────────
  { id: "sports_outfit",    name: "Sports Outfit",    category: "outfit",     rarity: "common",    cost: 100,  emoji: "⚽", description: "Ready to break a sweat!" },
  { id: "fitness_outfit",   name: "Fitness Outfit",   category: "outfit",     rarity: "common",    cost: 150,  emoji: "🏋️", description: "Gym mode activated" },
  { id: "chef_outfit",      name: "Chef Outfit",      category: "outfit",     rarity: "common",    cost: 200,  emoji: "👨‍🍳", description: "Cooking up healthy meals" },
  { id: "ninja_outfit",     name: "Ninja Outfit",     category: "outfit",     rarity: "rare",      cost: 500,  emoji: "🥷", description: "Silent but nutritious" },
  { id: "superhero_outfit", name: "Superhero Outfit", category: "outfit",     rarity: "rare",      cost: 600,  emoji: "🦸", description: "Nutrition is your superpower" },
  { id: "scientist_outfit", name: "Scientist Outfit", category: "outfit",     rarity: "rare",      cost: 700,  emoji: "🔬", description: "Analyzing every macro" },
  { id: "astronaut_suit",   name: "Astronaut Suit",   category: "outfit",     rarity: "epic",      cost: 1200, emoji: "👨‍🚀", description: "Fueling for liftoff" },
  // ── Accessories ───────────────────────────────────────────────────────────
  { id: "glasses",          name: "Glasses",          category: "accessory",  rarity: "common",    cost: 100,  emoji: "👓", description: "Seeing nutrition clearly" },
  { id: "scarf",            name: "Scarf",            category: "accessory",  rarity: "common",    cost: 150,  emoji: "🧣", description: "Warm and well-fed" },
  { id: "sunglasses",       name: "Sunglasses",       category: "accessory",  rarity: "common",    cost: 150,  emoji: "🕶️", description: "Too cool for empty calories" },
  { id: "headphones",       name: "Headphones",       category: "accessory",  rarity: "common",    cost: 200,  emoji: "🎧", description: "Listening to healthy beats" },
  { id: "backpack",         name: "Backpack",         category: "accessory",  rarity: "rare",      cost: 500,  emoji: "🎒", description: "Packed with nutrients" },
  { id: "watch",            name: "Watch",            category: "accessory",  rarity: "rare",      cost: 600,  emoji: "⌚", description: "Time to eat right" },
  { id: "wings",            name: "Wings",            category: "accessory",  rarity: "legendary", cost: 3000, emoji: "🪽", description: "Fly high on good nutrition" },
  // ── Hats ──────────────────────────────────────────────────────────────────
  { id: "baseball_cap",     name: "Baseball Cap",     category: "hat",        rarity: "common",    cost: 100,  emoji: "🧢", description: "Classic and clean" },
  { id: "beanie",           name: "Beanie",           category: "hat",        rarity: "common",    cost: 150,  emoji: "🎩", description: "Cozy nutrition vibes" },
  { id: "wizard_hat",       name: "Wizard Hat",       category: "hat",        rarity: "epic",      cost: 1000, emoji: "🧙", description: "Mastering the art of macros" },
  { id: "space_helmet",     name: "Space Helmet",     category: "hat",        rarity: "epic",      cost: 1500, emoji: "🪖", description: "Nutrition: The Final Frontier" },
  { id: "crown",            name: "Crown",            category: "hat",        rarity: "legendary", cost: 5000, emoji: "👑", description: "Nutrition royalty" },
  // ── Shoes ─────────────────────────────────────────────────────────────────
  { id: "sneakers",         name: "Sneakers",         category: "shoes",      rarity: "common",    cost: 100,  emoji: "👟", description: "Comfortable and active" },
  { id: "boots",            name: "Boots",            category: "shoes",      rarity: "common",    cost: 200,  emoji: "👢", description: "Built for the long haul" },
  { id: "running_shoes",    name: "Running Shoes",    category: "shoes",      rarity: "rare",      cost: 500,  emoji: "🏃", description: "Always on the move" },
  { id: "rocket_shoes",     name: "Rocket Shoes",     category: "shoes",      rarity: "legendary", cost: 4000, emoji: "🚀", description: "Zero-gravity nutrition" },
  // ── Backgrounds ───────────────────────────────────────────────────────────
  { id: "healthy_forest",   name: "Healthy Forest",   category: "background", rarity: "common",    cost: 0,    emoji: "🌳", description: "Your natural habitat" },
  { id: "gym_arena",        name: "Gym Arena",        category: "background", rarity: "rare",      cost: 600,  emoji: "🏋️", description: "Where champions train" },
  { id: "beach",            name: "Beach",            category: "background", rarity: "rare",      cost: 700,  emoji: "🏖️", description: "Balanced like the tides" },
  { id: "space_station",    name: "Space Station",    category: "background", rarity: "epic",      cost: 1200, emoji: "🛸", description: "Nutrition knows no gravity" },
  { id: "wellness_city",    name: "Wellness City",    category: "background", rarity: "epic",      cost: 1500, emoji: "🏙️", description: "Urban health hub" },
  { id: "nutrition_lab",    name: "Nutrition Lab",    category: "background", rarity: "legendary", cost: 2500, emoji: "🔭", description: "Where science meets flavor" },
  // ── Animations ────────────────────────────────────────────────────────────
  { id: "jump",             name: "Jump",             category: "animation",  rarity: "common",    cost: 200,  emoji: "⬆️", description: "Bounce with energy!" },
  { id: "run",              name: "Run",              category: "animation",  rarity: "common",    cost: 300,  emoji: "💨", description: "Never stop moving" },
  { id: "dance",            name: "Dance",            category: "animation",  rarity: "rare",      cost: 500,  emoji: "💃", description: "Celebrate every healthy choice" },
  { id: "victory_pose",     name: "Victory Pose",     category: "animation",  rarity: "rare",      cost: 600,  emoji: "🏆", description: "You crushed your goals" },
  { id: "celebration",      name: "Celebration",      category: "animation",  rarity: "epic",      cost: 1000, emoji: "🎉", description: "The ultimate win dance" },
  // ── Emotes ────────────────────────────────────────────────────────────────
  { id: "smile",            name: "Smile",            category: "emote",      rarity: "common",    cost: 100,  emoji: "😊", description: "Happiness is homemade" },
  { id: "flex",             name: "Flex",             category: "emote",      rarity: "common",    cost: 150,  emoji: "💪", description: "Protein-powered pride" },
  { id: "fire_emote",       name: "Fire",             category: "emote",      rarity: "rare",      cost: 500,  emoji: "🔥", description: "You're on fire!" },
  { id: "muscle_pose",      name: "Muscle Pose",      category: "emote",      rarity: "rare",      cost: 500,  emoji: "🦾", description: "Maximum strength achieved" },
];

// ── Mood ─────────────────────────────────────────────────────────────────────

export type Mood = "happy" | "celebrating" | "dancing" | "energetic" | "glowing" | "sleepy" | "disappointed";

export const MOOD_CONFIG: Record<Mood, { emoji: string; label: string; color: string }> = {
  happy:        { emoji: "😊", label: "Happy",        color: "text-emerald-600" },
  celebrating:  { emoji: "🥳", label: "Celebrating!",  color: "text-pink-600"    },
  dancing:      { emoji: "💃", label: "Dancing!",      color: "text-violet-600"  },
  energetic:    { emoji: "⚡", label: "Energetic!",    color: "text-amber-500"   },
  glowing:      { emoji: "✨", label: "Glowing!",      color: "text-yellow-500"  },
  sleepy:       { emoji: "😴", label: "Sleepy",        color: "text-slate-400"   },
  disappointed: { emoji: "😔", label: "Disappointed",  color: "text-slate-500"   },
};

export const BACKGROUND_GRADIENTS: Record<string, string> = {
  healthy_forest: "from-emerald-400 via-green-500 to-teal-600",
  gym_arena:      "from-slate-600 via-slate-700 to-slate-800",
  beach:          "from-sky-300 via-cyan-400 to-blue-500",
  space_station:  "from-violet-900 via-purple-800 to-indigo-900",
  wellness_city:  "from-rose-400 via-pink-500 to-fuchsia-500",
  nutrition_lab:  "from-cyan-500 via-teal-500 to-emerald-600",
};

// ── Reward config (unchanged) ─────────────────────────────────────────────────

export const REWARD_CONFIG = {
  calorie_goal:   { points: 50,   label: "Calorie Goal",      emoji: "🔥" },
  protein_goal:   { points: 25,   label: "Protein Goal",      emoji: "💪" },
  carbs_goal:     { points: 15,   label: "Carbs Goal",        emoji: "🌾" },
  fat_goal:       { points: 15,   label: "Fat Goal",          emoji: "🥑" },
  macro_complete: { points: 40,   label: "All Macros",        emoji: "⚖️" },
  all_goals:      { points: 100,  label: "Perfect Day Bonus", emoji: "🏆" },
  streak_3:       { points: 50,   label: "3-Day Streak",      emoji: "🔥" },
  streak_7:       { points: 150,  label: "7-Day Streak",      emoji: "⚡" },
  streak_30:      { points: 1000, label: "30-Day Streak",     emoji: "👑" },
} as const;

export type RewardType = keyof typeof REWARD_CONFIG;

export function totalXpForLevel(level: number): number { return level * (level - 1) * 50; }

export function levelFromXp(xp: number): number {
  let lv = 1;
  while (xp >= totalXpForLevel(lv + 1)) lv++;
  return lv;
}

export function xpProgress(xp: number) {
  const level  = levelFromXp(xp);
  const cur    = xp - totalXpForLevel(level);
  const needed = totalXpForLevel(level + 1) - totalXpForLevel(level);
  return { level, current: cur, needed, pct: Math.round((cur / needed) * 100) };
}

export function getDailyEvents(dateStr: string) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  hash = Math.abs(hash);
  const events: { type: string; emoji: string; label: string; multiplier: number; bonus: number }[] = [];
  if (hash % 7  === 0) events.push({ type: "double_points", emoji: "🌟", label: "Double Points Day!",           multiplier: 2,   bonus: 0  });
  if (hash % 11 === 0) events.push({ type: "meteor_shower", emoji: "☄️", label: "Meteor Shower! +25 bonus pts", multiplier: 1,   bonus: 25 });
  if (hash % 13 === 0) events.push({ type: "streak_boost",  emoji: "⚡", label: "Streak Boost Weekend! ×1.5",   multiplier: 1.5, bonus: 0  });
  if (hash % 19 === 0) events.push({ type: "treasure",      emoji: "💰", label: "Hidden Treasure! +50 bonus",   multiplier: 1,   bonus: 50 });
  return events;
}
