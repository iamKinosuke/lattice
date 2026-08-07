import type { Camera, Color, Point, StrokePoint } from "./canvas";

export type PresenceUser = {
  id: string;
  name: string;
  avatarUrl: string | null;
  color: string;
};

export type Presence = {
  cursor: Point | null;
  selection: string[];
  pencilDraft: StrokePoint[] | null;
  penColor: Color | null;
  penSize: number | null;
  camera: Camera | null;
};

export type AwarenessState = {
  user: PresenceUser;
  presence: Presence;
};

export const INITIAL_PRESENCE: Presence = {
  cursor: null,
  selection: [],
  pencilDraft: null,
  penColor: null,
  penSize: null,
  camera: null,
};

export const USER_COLORS = [
  "#DC2626",
  "#EA580C",
  "#059669",
  "#0891B2",
  "#7C3AED",
  "#DB2777",
] as const;

export function userIdToColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length]!;
}
