/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  FarmProfile,
  FarmGoogleSheetConfig,
  Pen,
  Sheep,
  FeedIngredient,
  FormulatedRation,
  FarmLog,
  LiveShareReport,
  OnlysheepsListing,
  OnlysheepsMatchRecord,
  OwnerMasterSheetData,
  PublicPlatformOverview,
  SyncStateResponse,
  WebFormSubmission,
} from '../types/sheep';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  makeSupabaseSessionToken,
  parseSupabaseFarmIdFromToken,
  sbCreateOrRefreshShareSnapshot,
  sbDeleteOnlysheepsListing,
  sbFetchFarmWorkspace,
  sbFetchLiveShareReport,
  sbFetchOnlysheepsFeed,
  sbFetchOwnerMasterSheet,
  sbFetchPublicOverview,
  sbFetchWebFormRecords,
  sbLoginFarmAccount,
  sbPublishToOnlysheeps,
  sbRegisterFarmAccount,
  sbResetFarmData,
  sbSaveFarmWorkspace,
  sbSubmitWebFormRecord,
} from './supabaseDb';

const AUTH_TOKEN_KEY = 'ovispro_farm_auth_token_v1';

const CLIENT_SESSION_ID = (() => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `tab-${crypto.randomUUID()}`;
  }
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
})();

export function getClientSessionId(): string {
  return CLIENT_SESSION_ID;
}

export function getStoredAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // ignore storage quota errors
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Ovispro-Client-Id': CLIENT_SESSION_ID,
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    cache: 'no-store',
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error || `Request failed (${res.status})`, res.status);
  }
  return data as T;
}

export interface FarmWorkspaceData {
  profile: FarmProfile;
  pens: Pen[];
  sheepList: Sheep[];
  ingredients: FeedIngredient[];
  rations: FormulatedRation[];
  logs: FarmLog[];
  matches: OnlysheepsMatchRecord[];
}

function getAuthenticatedSupabaseFarmId(): string {
  const farmId = parseSupabaseFarmIdFromToken(getStoredAuthToken());
  if (!farmId) {
    throw new ApiError('กรุณาเข้าสู่ระบบฟาร์มของคุณก่อนดูหรือบันทึกข้อมูลส่วนตัว', 401);
  }
  return farmId;
}

export async function fetchPublicOverview(): Promise<PublicPlatformOverview> {
  if (isSupabaseConfigured()) {
    return sbFetchPublicOverview();
  }
  return apiFetch<PublicPlatformOverview>('/api/public/overview');
}

export async function fetchSyncState(sinceRevision?: number): Promise<SyncStateResponse> {
  const ownerToken = getStoredOwnerToken();
  const headers: Record<string, string> = {};
  if (ownerToken) {
    headers['X-Owner-Authorization'] = `Bearer ${ownerToken}`;
  }
  const query =
    typeof sinceRevision === 'number' && sinceRevision > 0
      ? `?since=${encodeURIComponent(String(sinceRevision))}`
      : '';
  return apiFetch<SyncStateResponse>(`/api/public/sync-state${query}`, { headers });
}

export function isPayloadWithinKeepaliveLimit(payload: unknown): boolean {
  try {
    const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
    if (typeof Blob !== 'undefined') {
      return new Blob([serialized]).size <= 60000;
    }
    return serialized.length <= 50000;
  } catch {
    return false;
  }
}

export async function loginFarmAccount(
  username: string,
  password: string
): Promise<{ token: string; profile: FarmProfile; workspace?: FarmWorkspaceData }> {
  if (isSupabaseConfigured()) {
    const res = await sbLoginFarmAccount(username, password);
    setStoredAuthToken(res.token);
    return res;
  }
  const res = await apiFetch<{ token: string; profile: FarmProfile; workspace?: FarmWorkspaceData }>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }
  );
  setStoredAuthToken(res.token);
  return res;
}

export async function registerFarmAccount(payload: {
  username: string;
  password: string;
  farmName: string;
  ownerName: string;
  location: string;
  contact: string;
  breedFocus: string;
}): Promise<{ token: string; profile: FarmProfile; workspace?: FarmWorkspaceData }> {
  if (isSupabaseConfigured()) {
    const res = await sbRegisterFarmAccount(payload);
    setStoredAuthToken(res.token);
    return res;
  }
  const res = await apiFetch<{ token: string; profile: FarmProfile; workspace?: FarmWorkspaceData }>(
    '/api/auth/register',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  setStoredAuthToken(res.token);
  return res;
}

export async function restoreMissingFarmSession(
  farmId: string,
  workspace: FarmWorkspaceData
): Promise<{ token: string; workspace: FarmWorkspaceData }> {
  if (isSupabaseConfigured()) {
    try {
      const existing = await sbFetchFarmWorkspace(farmId);
      const token = makeSupabaseSessionToken(farmId);
      setStoredAuthToken(token);
      return { token, workspace: existing };
    } catch {
      throw new ApiError('ไม่พบบัญชีฟาร์มในระบบ กรุณาเข้าสู่ระบบใหม่', 401);
    }
  }
  const res = await apiFetch<{ token: string; workspace: FarmWorkspaceData }>(
    '/api/farm/restore-session',
    {
      method: 'POST',
      body: JSON.stringify({ farmId, workspace }),
    }
  );
  setStoredAuthToken(res.token);
  return res;
}

export async function logoutFarmAccount(): Promise<void> {
  if (!isSupabaseConfigured()) {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
  }
  setStoredAuthToken(null);
}

export async function fetchMyFarmData(): Promise<FarmWorkspaceData> {
  if (isSupabaseConfigured()) {
    const farmId = getAuthenticatedSupabaseFarmId();
    try {
      return await sbFetchFarmWorkspace(farmId);
    } catch (err) {
      throw new ApiError(
        err instanceof Error ? err.message : 'ไม่พบบัญชีฟาร์มในระบบ',
        401
      );
    }
  }
  return apiFetch<FarmWorkspaceData>('/api/farm/data');
}

export async function saveMyFarmData(
  payload: {
    profile?: Partial<FarmProfile>;
    pens?: Pen[];
    sheepList?: Sheep[];
    ingredients?: FeedIngredient[];
    rations?: FormulatedRation[];
    logs?: FarmLog[];
    matches?: OnlysheepsMatchRecord[];
  },
  options: { keepalive?: boolean } = {}
): Promise<{ ok: boolean; profile: FarmProfile; pens: Pen[] }> {
  if (isSupabaseConfigured()) {
    const farmId = getAuthenticatedSupabaseFarmId();
    return sbSaveFarmWorkspace(farmId, payload);
  }
  const serialized = JSON.stringify(payload);
  const useKeepalive = Boolean(options.keepalive) && isPayloadWithinKeepaliveLimit(serialized);
  return apiFetch('/api/farm/data', {
    method: 'PUT',
    body: serialized,
    keepalive: useKeepalive,
  });
}

export async function resetMyFarmData(): Promise<FarmWorkspaceData> {
  if (isSupabaseConfigured()) {
    const farmId = getAuthenticatedSupabaseFarmId();
    return sbResetFarmData(farmId);
  }
  return apiFetch<FarmWorkspaceData>('/api/farm/reset', {
    method: 'POST',
  });
}

export async function fetchOnlysheepsFeed(): Promise<OnlysheepsListing[]> {
  if (isSupabaseConfigured()) {
    return sbFetchOnlysheepsFeed();
  }
  const res = await apiFetch<{ listings: OnlysheepsListing[] }>('/api/onlysheeps/feed');
  return res.listings;
}

export async function publishToOnlysheeps(
  listingPayload: Partial<Sheep> & { name: string }
): Promise<OnlysheepsListing> {
  if (isSupabaseConfigured()) {
    const farmId = getAuthenticatedSupabaseFarmId();
    return sbPublishToOnlysheeps(farmId, listingPayload);
  }
  const res = await apiFetch<{ listing: OnlysheepsListing }>('/api/onlysheeps/listings', {
    method: 'POST',
    body: JSON.stringify(listingPayload),
  });
  return res.listing;
}

export async function deleteOnlysheepsListing(listingId: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const farmId = getAuthenticatedSupabaseFarmId();
    await sbDeleteOnlysheepsListing(farmId, listingId);
    return;
  }
  await apiFetch(`/api/onlysheeps/listings/${encodeURIComponent(listingId)}`, {
    method: 'DELETE',
  });
}

export async function syncFarmToGoogleSheet(payload: {
  sheetUrl?: string;
  appsScriptWebhookUrl: string;
}): Promise<{ ok: boolean; lastSyncedAt: string; syncedTabs: number; profile: FarmProfile }> {
  if (isSupabaseConfigured()) {
    const farmId = getAuthenticatedSupabaseFarmId();
    const lastSyncedAt = new Date().toISOString();
    const res = await sbSaveFarmWorkspace(farmId, {
      profile: {
        googleSheetConfig: {
          sheetUrl: payload.sheetUrl,
          appsScriptWebhookUrl: payload.appsScriptWebhookUrl,
          lastSyncedAt,
        },
      },
    });
    return {
      ok: true,
      lastSyncedAt,
      syncedTabs: 5,
      profile: res.profile,
    };
  }
  return apiFetch('/api/farm/sheets-sync', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createOrRefreshShareSnapshot(payload?: {
  sheepList?: Sheep[];
  ingredients?: FeedIngredient[];
  rations?: FormulatedRation[];
  logs?: FarmLog[];
}): Promise<{ shareId: string; updatedAt: string; report: LiveShareReport }> {
  if (isSupabaseConfigured()) {
    const farmId = parseSupabaseFarmIdFromToken(getStoredAuthToken());
    return sbCreateOrRefreshShareSnapshot(farmId, payload);
  }
  return apiFetch('/api/share/snapshot', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function fetchLiveShareReport(shareId: string): Promise<LiveShareReport> {
  if (isSupabaseConfigured()) {
    return sbFetchLiveShareReport(shareId);
  }
  const res = await apiFetch<{ report: LiveShareReport }>(
    `/api/share/${encodeURIComponent(shareId)}`
  );
  return res.report;
}

const OWNER_TOKEN_KEY = 'ovispro_app_owner_session_token_v1';

export function getStoredOwnerToken(): string | null {
  try {
    return sessionStorage.getItem(OWNER_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredOwnerToken(token: string | null): void {
  try {
    if (token) {
      sessionStorage.setItem(OWNER_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(OWNER_TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

async function ownerFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredOwnerToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers['X-Owner-Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    cache: 'no-store',
    ...options,
    headers,
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Owner request failed (${res.status})`);
  }
  return data as T;
}

export async function loginAppOwner(
  email: string,
  password: string
): Promise<{ token: string; ownerEmail: string }> {
  const res = await ownerFetch<{ token: string; ownerEmail: string }>('/api/owner/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setStoredOwnerToken(res.token);
  return res;
}

export async function logoutAppOwner(): Promise<void> {
  try {
    await ownerFetch('/api/owner/logout', { method: 'POST' });
  } catch {
    // ignore
  }
  setStoredOwnerToken(null);
}

export async function fetchOwnerMasterSheet(): Promise<OwnerMasterSheetData> {
  if (isSupabaseConfigured()) {
    if (!getStoredOwnerToken()) {
      throw new Error('พื้นที่นี้สงวนสิทธิ์เฉพาะเจ้าของแอปพลิเคชันเท่านั้น (App Owner Only)');
    }
    return sbFetchOwnerMasterSheet('tierraporn.oga@student.mahidol.edu');
  }
  return ownerFetch<OwnerMasterSheetData>('/api/owner/master-sheet');
}

export async function saveOwnerSheetConfig(payload: {
  sheetUrl?: string;
  appsScriptWebhookUrl?: string;
}): Promise<{ ok: boolean; ownerSheetConfig: FarmGoogleSheetConfig }> {
  return ownerFetch('/api/owner/sheet-config', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function syncOwnerMasterSheet(payload: {
  sheetUrl?: string;
  appsScriptWebhookUrl?: string;
}): Promise<{
  ok: boolean;
  lastSyncedAt: string;
  syncedTabs: number;
  ownerSheetConfig: FarmGoogleSheetConfig;
}> {
  return ownerFetch('/api/owner/sheets-sync', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchWebFormRecords(): Promise<{
  records: WebFormSubmission[];
  sheetSyncConfigured: boolean;
  apiKeyConfigured: boolean;
}> {
  if (isSupabaseConfigured()) {
    return sbFetchWebFormRecords();
  }
  return apiFetch('/api/forms/records');
}

export async function submitWebFormRecord(payload: {
  farmName: string;
  recorderName: string;
  province: string;
  sheepEarTag?: string;
  sheepName: string;
  breed: string;
  gender: 'male' | 'female';
  ageMonths: number;
  weightKg: number;
  woolMicron: number;
  dailyFeedKg: number;
  notes?: string;
}): Promise<{
  record: WebFormSubmission;
  sheetSyncConfigured: boolean;
  sheetError?: string;
}> {
  if (isSupabaseConfigured()) {
    return sbSubmitWebFormRecord(payload);
  }
  return apiFetch('/api/forms/records', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}


