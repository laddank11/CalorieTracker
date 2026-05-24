import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { GameProvider } from "@/contexts/GameContext";
import RewardToasts from "@/components/game/RewardToast";

export const metadata: Metadata = {
  title: "NutriTrack",
  description: "Track your daily calories and macros.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <GameProvider>
            {children}
            <RewardToasts />
          </GameProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
