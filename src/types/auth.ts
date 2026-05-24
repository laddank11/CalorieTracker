export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  profileImage: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  userId: string;
  calorie_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fat_goal: number;
  water_goal: number;
  weight: number | null;
  height: number | null;
  activity_level: ActivityLevel;
  goal_type: GoalType;
}

export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active"
  | "extremely_active";

export type GoalType = "lose_weight" | "maintain_weight" | "gain_weight";

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}
