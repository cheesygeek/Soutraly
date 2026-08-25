import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "soutraly_token";

export const API_BASE_URL =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  "https://soutraly-production.up.railway.app";

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function parseErrorBody(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.error ?? `Erreur ${res.status}`;
  } catch {
    return `Erreur ${res.status}`;
  }
}

async function withAuthHeaders(extra?: HeadersInit): Promise<HeadersInit> {
  const token = await getToken();
  return {
    ...(extra ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: await withAuthHeaders() });
  if (!res.ok) throw new ApiError(res.status, await parseErrorBody(res));
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: await withAuthHeaders({ "Content-Type": "application/json" }),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorBody(res));
  return res.json() as Promise<T>;
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: await withAuthHeaders(),
    body: formData,
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorBody(res));
  return res.json() as Promise<T>;
}
