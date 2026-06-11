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

export interface PosterTemplate {
  group: ColleagueGroup;
  background: string; // Base64 or Empty
  photoX: number; // percentage
  photoY: number; // percentage
  photoSize: number; // pixels
  nameX: number; // percentage
  nameY: number; // percentage
  nameColor: string; // hex
  nameSize: number; // pixels
  emailX: number; // percentage
  emailY: number; // percentage
  emailColor: string; // hex
  emailSize: number; // pixels
  groupX: number; // percentage
  groupY: number; // percentage
  groupColor: string; // hex
  groupSize: number; // pixels
  groupVisible: boolean; // boolean
  goalX: number; // percentage
  goalY: number; // percentage
  goalWidth: number; // percentage of poster width
  goalColor: string; // hex
  goalSize: number; // pixels
  goalAlign?: "left" | "center" | "right"; // text alignment
  goalBgVisible?: boolean; // whether to show the background box wrapper
  goalPaddingTop?: number;
  goalPaddingBottom?: number;
  goalPaddingLeft?: number;
  goalPaddingRight?: number;
  nameAlign?: "left" | "center" | "right";
  groupAlign?: "left" | "center" | "right";
  emailAlign?: "left" | "center" | "right";
}
