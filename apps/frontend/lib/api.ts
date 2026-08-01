import type {
  ApiErrorBody,
  AuthResponse,
  Board,
  BoardFilter,
  BoardListResponse,
  CreateBoardBody,
  LoginBody,
  PublicUser,
  RegisterBody,
  RenameBoardBody,
  WorkspaceListResponse,
} from "@lattice/shared";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:6001");

export function wsOrigin(): string {
  if (API_BASE) return API_BASE.replace(/^http/, "ws");

  const scheme = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${scheme}//${window.location.host}`;
}

export function assetUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE}${path}`;
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly details?: Record<string, string[]>;

  constructor(status: number, message: string, details?: Record<string, string[]>) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }

  fieldError(field: string): string | undefined {
    return this.details?.[field]?.[0];
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal } = options;

  let response: Response;

  try {
    response = await fetch(`${API_BASE}/api${path}`, {
      method,
      credentials: "include",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;

    throw new ApiClientError(
      0,
      "Could not reach the server. Check that the backend is running.",
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await readJson(response);

  if (!response.ok) {
    const error = payload as ApiErrorBody | null;

    throw new ApiClientError(
      response.status,
      error?.error ?? `Request failed with status ${response.status}`,
      error?.details,
    );
  }

  return payload as T;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    throw new ApiClientError(
      response.status,
      `Server returned a non-JSON response (${response.status}).`,
    );
  }
}

export const api = {
  register: (body: RegisterBody) =>
    request<AuthResponse>("/auth/register", { method: "POST", body }),

  login: (body: LoginBody) =>
    request<AuthResponse>("/auth/login", { method: "POST", body }),

  logout: () => request<void>("/auth/logout", { method: "POST" }),

  me: (signal?: AbortSignal) => request<PublicUser>("/auth/me", { signal }),

  workspaces: (signal?: AbortSignal) =>
    request<WorkspaceListResponse>("/workspaces", { signal }),

  boards: (
    params: { filter?: BoardFilter; workspaceId?: string } = {},
    signal?: AbortSignal,
  ) => {
    const query = new URLSearchParams();
    if (params.filter) query.set("filter", params.filter);
    if (params.workspaceId) query.set("workspaceId", params.workspaceId);

    const suffix = query.size > 0 ? `?${query}` : "";
    return request<BoardListResponse>(`/boards${suffix}`, { signal });
  },

  board: (boardId: string, signal?: AbortSignal) =>
    request<Board>(`/boards/${boardId}`, { signal }),

  createBoard: (body: CreateBoardBody) =>
    request<Board>("/boards", { method: "POST", body }),

  renameBoard: (boardId: string, body: RenameBoardBody) =>
    request<Board>(`/boards/${boardId}`, { method: "PATCH", body }),

  setFavorite: (boardId: string, favorite: boolean) =>
    request<void>(`/boards/${boardId}/favorite`, {
      method: "PUT",
      body: { favorite },
    }),

  deleteBoard: (boardId: string) =>
    request<void>(`/boards/${boardId}`, { method: "DELETE" }),
};
