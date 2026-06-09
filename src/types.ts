export type ColleagueGroup = "Visionary" | "Lead" | "Builder" | "Connector" | "Pragmatist" | "Skeptic";

export const COLLEAGUE_GROUPS: ColleagueGroup[] = [
  "Visionary",
  "Lead",
  "Builder",
  "Connector",
  "Pragmatist",
  "Skeptic"
];

export interface WishRecord {
  id: string;
  email: string;
  username: string;
  wish: string; // Storing the "Goal" text
  photoUrl: string;
  createdAt: string; // ISO String format
  group?: ColleagueGroup; // Defaults to "Builder" if missing from old database
}

export type Language = "en" | "zh" | "ja";
