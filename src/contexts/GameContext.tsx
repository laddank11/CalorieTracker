"use client";

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";

export interface RewardToast {
  id: string;
  emoji: string;
  label: string;
  points: number;
}

interface GameStatus {
  totalPoints: number;
  lifetimePoints: number;
  streak: number;
  longestStreak: number;
  level: number;
  experience: number;
  claimedToday: { reward_type: string; points_awarded: number }[];
  events: { type: string; emoji: string; label: string; multiplier: number; bonus: number }[];
}

interface GameContextValue {
  status: GameStatus | null;
  toasts: RewardToast[];
  levelUpPending: boolean;
  newLevel: number;
  loadStatus: () => Promise<void>;
  claimRewards: () => Promise<{ awarded: { type: string; points: number; label: string; emoji: string }[] }>;
  dismissLevelUp: () => void;
  dismissToast: (id: string) => void;
}

const GameContext = createContext<GameContextValue>({
  status: null,
  toasts: [],
  levelUpPending: false,
  newLevel: 1,
  loadStatus: async () => {},
  claimRewards: async () => ({ awarded: [] }),
  dismissLevelUp: () => {},
  dismissToast: () => {},
});

export function GameProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GameStatus | null>(null);
  const [toasts, setToasts] = useState<RewardToast[]>([]);
  const [levelUpPending, setLevelUpPending] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const toastIdRef = useRef(0);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/rewards/status");
      if (res.ok) setStatus(await res.json());
    } catch { /* ignore */ }
  }, []);

  const claimRewards = useCallback(async () => {
    try {
      const res = await fetch("/api/rewards/claim", { method: "POST" });
      if (!res.ok) return { awarded: [] };
      const data = await res.json();

      if (data.awarded?.length > 0) {
        // Show toasts
        for (const r of data.awarded) {
          const id = String(++toastIdRef.current);
          setToasts(prev => [...prev, { id, emoji: r.emoji, label: r.label, points: r.points }]);
          setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
        }

        // Level up
        if (data.leveledUp) {
          setNewLevel(data.newLevel);
          setLevelUpPending(true);
        }

        // Refresh status
        setStatus(prev => prev ? {
          ...prev,
          totalPoints: data.totalPoints,
          lifetimePoints: data.lifetimePoints,
          streak: data.streak,
        } : prev);
      }
      return { awarded: data.awarded ?? [] };
    } catch {
      return { awarded: [] };
    }
  }, []);

  const dismissLevelUp = useCallback(() => setLevelUpPending(false), []);
  const dismissToast   = useCallback((id: string) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  return (
    <GameContext.Provider value={{ status, toasts, levelUpPending, newLevel, loadStatus, claimRewards, dismissLevelUp, dismissToast }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() { return useContext(GameContext); }
