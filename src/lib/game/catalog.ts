export type Rarity = "common" | "uncommon" | "rare" | "legendary";

export interface Creature {
  id: string;
  name: string;
  rarity: Rarity;
  type: string;
  emoji: string;
  unlockCost: number;
  description: string;
  trait: string;
}

export interface Environment {
  id: string;
  name: string;
  emoji: string;
  requiredLevel: number;
  unlockCost: number;
  description: string;
  gradient: string;
}

export interface EggTier {
  id: string;
  name: string;
  cost: number;
  emoji: string;
  color: string;
  probs: { common: number; uncommon: number; rare: number; legendary: number };
}

export const CREATURES: Creature[] = [
  { id: "energy_bunny",   name: "Energy Bunny",    rarity: "common",    type: "energy",    emoji: "🐰", unlockCost: 75,   description: "A bouncy companion that fuels your mornings",        trait: "+5 pts on any meal logged before 9am"        },
  { id: "vitamin_owl",    name: "Vitamin Owl",     rarity: "common",    type: "vitamin",   emoji: "🦉", unlockCost: 100,  description: "A wise owl that guards your micronutrients",         trait: "Calorie goal rewards +5 pts"                 },
  { id: "fiber_fox",      name: "Fiber Fox",       rarity: "uncommon",  type: "fiber",     emoji: "🦊", unlockCost: 200,  description: "A swift fox that loves leafy greens",                trait: "All-goals bonus +10 pts"                     },
  { id: "iron_golem",     name: "Iron Golem",      rarity: "uncommon",  type: "mineral",   emoji: "🗿", unlockCost: 300,  description: "A sturdy guardian forged from pure minerals",        trait: "Streak milestone bonus +15 pts"              },
  { id: "water_spirit",   name: "Water Spirit",    rarity: "rare",      type: "hydration", emoji: "💧", unlockCost: 500,  description: "A mystical spirit born from the purest spring",      trait: "Streak never resets on 1-day miss"           },
  { id: "omega_fish",     name: "Omega Fish",      rarity: "rare",      type: "fat",       emoji: "🐟", unlockCost: 600,  description: "A magical fish rich in omega-3 fatty acids",         trait: "Fat goal rewards +10 pts"                    },
  { id: "carb_cheetah",   name: "Carb Cheetah",    rarity: "rare",      type: "carbs",     emoji: "🐆", unlockCost: 750,  description: "The fastest creature in the Nutriverse",             trait: "Streak bonus rewards +10%"                   },
  { id: "luna_wolf",      name: "Luna Wolf",       rarity: "rare",      type: "balance",   emoji: "🐺", unlockCost: 800,  description: "A moonlit wolf that howls at nutritional balance",   trait: "All-goals bonus +20 pts"                     },
  { id: "protein_dragon", name: "Protein Dragon",  rarity: "legendary", type: "protein",   emoji: "🐉", unlockCost: 2000, description: "A mighty dragon powered by pure protein",            trait: "Protein goal rewards doubled"                },
  { id: "calorie_phoenix",name: "Calorie Phoenix", rarity: "legendary", type: "energy",    emoji: "🔥", unlockCost: 3000, description: "A blazing phoenix reborn from burned calories",       trait: "+50 pts on any perfect day"                  },
  { id: "cosmos_unicorn", name: "Cosmos Unicorn",  rarity: "legendary", type: "cosmic",    emoji: "🦄", unlockCost: 5000, description: "A unicorn that traverses the nutrition cosmos",       trait: "All daily rewards +25%"                      },
  { id: "thunder_bear",   name: "Thunder Bear",    rarity: "uncommon",  type: "strength",  emoji: "🐻", unlockCost: 250,  description: "A powerful bear crackling with nutritional energy",  trait: "Carbs goal rewards +10 pts"                  },
  { id: "golden_turtle",  name: "Golden Turtle",   rarity: "rare",      type: "endurance", emoji: "🐢", unlockCost: 650,  description: "An ancient turtle carrying centuries of nutrition wisdom", trait: "7-day streak bonus +25 pts"            },
];

export const ENVIRONMENTS: Environment[] = [
  { id: "healthy_forest",  name: "Healthy Forest",   emoji: "🌳", requiredLevel: 1,  unlockCost: 0,     description: "A lush forest teeming with nutritious life",          gradient: "from-emerald-400 via-green-500 to-teal-600"        },
  { id: "hydration_lake",  name: "Hydration Lake",   emoji: "🏞️", requiredLevel: 5,  unlockCost: 1000,  description: "A serene lake that nourishes all who drink from it",   gradient: "from-blue-400 via-cyan-500 to-sky-600"              },
  { id: "macro_mountains", name: "Macro Mountains",  emoji: "⛰️", requiredLevel: 10, unlockCost: 2500,  description: "Towering peaks built from perfectly balanced macros",  gradient: "from-amber-400 via-orange-500 to-yellow-600"        },
  { id: "protein_plains",  name: "Protein Plains",   emoji: "🌾", requiredLevel: 15, unlockCost: 5000,  description: "Vast plains where protein creatures roam free",         gradient: "from-yellow-400 via-lime-500 to-green-600"          },
  { id: "wellness_galaxy", name: "Wellness Galaxy",  emoji: "🌌", requiredLevel: 20, unlockCost: 10000, description: "A cosmic realm where nutrition transcends the physical", gradient: "from-violet-600 via-purple-700 to-indigo-800"      },
];

export const EGG_TIERS: EggTier[] = [
  {
    id: "common",
    name: "Common Egg",
    cost: 100,
    emoji: "🥚",
    color: "from-slate-200 to-slate-400",
    probs: { common: 0.70, uncommon: 0.20, rare: 0.09, legendary: 0.01 },
  },
  {
    id: "rare",
    name: "Rare Egg",
    cost: 500,
    emoji: "🪺",
    color: "from-blue-300 to-violet-500",
    probs: { common: 0.35, uncommon: 0.35, rare: 0.25, legendary: 0.05 },
  },
  {
    id: "legendary",
    name: "Legendary Egg",
    cost: 1000,
    emoji: "🌟",
    color: "from-yellow-300 to-orange-500",
    probs: { common: 0.15, uncommon: 0.30, rare: 0.40, legendary: 0.15 },
  },
];

export const RARITY_COLORS: Record<Rarity, string> = {
  common:    "text-slate-500 bg-slate-100 border-slate-200",
  uncommon:  "text-green-600 bg-green-50  border-green-200",
  rare:      "text-blue-600  bg-blue-50   border-blue-200",
  legendary: "text-amber-600 bg-amber-50  border-amber-300",
};

export const RARITY_GLOW: Record<Rarity, string> = {
  common:    "",
  uncommon:  "shadow-green-200",
  rare:      "shadow-blue-300",
  legendary: "shadow-amber-300 shadow-lg",
};

// XP required to REACH a given level (total accumulated)
export function totalXpForLevel(level: number): number {
  return level * (level - 1) * 50;
}

// Current level given total XP
export function levelFromXp(xp: number): number {
  let lv = 1;
  while (xp >= totalXpForLevel(lv + 1)) lv++;
  return lv;
}

export function xpProgress(xp: number) {
  const level = levelFromXp(xp);
  const cur = xp - totalXpForLevel(level);
  const needed = totalXpForLevel(level + 1) - totalXpForLevel(level);
  return { level, current: cur, needed, pct: Math.round((cur / needed) * 100) };
}

export const REWARD_CONFIG = {
  calorie_goal:  { points: 50,   label: "Calorie Goal",      emoji: "🔥" },
  protein_goal:  { points: 25,   label: "Protein Goal",      emoji: "💪" },
  carbs_goal:    { points: 15,   label: "Carbs Goal",        emoji: "🌾" },
  fat_goal:      { points: 15,   label: "Fat Goal",          emoji: "🥑" },
  macro_complete:{ points: 40,   label: "All Macros",        emoji: "⚖️" },
  all_goals:     { points: 100,  label: "Perfect Day Bonus", emoji: "🏆" },
  streak_3:      { points: 50,   label: "3-Day Streak",      emoji: "🔥" },
  streak_7:      { points: 150,  label: "7-Day Streak",      emoji: "⚡" },
  streak_30:     { points: 1000, label: "30-Day Streak",     emoji: "👑" },
} as const;

export type RewardType = keyof typeof REWARD_CONFIG;

// Deterministic daily events from date hash
export function getDailyEvents(dateStr: string): Array<{ type: string; emoji: string; label: string; multiplier: number; bonus: number }> {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  hash = Math.abs(hash);

  const events = [];
  if (hash % 7 === 0)  events.push({ type: "double_points",    emoji: "🌟", label: "Double Points Day!",           multiplier: 2,   bonus: 0  });
  if (hash % 11 === 0) events.push({ type: "meteor_shower",    emoji: "☄️", label: "Meteor Shower! +25 bonus pts", multiplier: 1,   bonus: 25 });
  if (hash % 13 === 0) events.push({ type: "streak_boost",     emoji: "⚡", label: "Streak Boost Weekend! ×1.5",   multiplier: 1.5, bonus: 0  });
  if (hash % 17 === 0) events.push({ type: "rare_appearance",  emoji: "✨", label: "Rare Creature Sighted!",       multiplier: 1,   bonus: 0  });
  if (hash % 19 === 0) events.push({ type: "treasure",         emoji: "💰", label: "Hidden Treasure! +50 bonus",   multiplier: 1,   bonus: 50 });
  return events;
}
