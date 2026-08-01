export type ApiErrorBody = {
  error: string;
  details?: Record<string, string[]>;
};

export const AUTH_COOKIE = "lattice_token";

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

export type RegisterBody = {
  email: string;
  password: string;
  name: string;
};

export type LoginBody = {
  email: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  user: PublicUser;
};

export type TokenClaims = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
};

export type WorkspaceRole = "owner" | "admin" | "member";

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
  memberCount: number;
  createdAt: string;
};

export type CreateWorkspaceBody = {
  name: string;
};

export type WorkspaceListResponse = {
  workspaces: Workspace[];
};

export type Board = {
  id: string;
  workspaceId: string;
  title: string;
  thumbnailUrl: string | null;
  createdBy: string;
  createdByName: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateBoardBody = {
  workspaceId: string;
  title?: string;
};

export type RenameBoardBody = {
  title: string;
};

export type BoardFilter = "recent" | "owned" | "shared" | "favorites";

export type BoardListResponse = {
  boards: Board[];
};
