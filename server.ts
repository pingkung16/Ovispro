import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import {
  SEED_FARMS,
  ONLYSHEEPS_INITIAL_LISTINGS,
  DEFAULT_PENS_TEMPLATE,
  DEFAULT_INGREDIENTS_TEMPLATE,
  DEFAULT_RATIONS_TEMPLATE,
} from './src/data/multiFarmSeed.ts';
import { getBreedPhoto } from './src/data/breedPhotos.ts';
import { buildFarmSheetTabs, buildOwnerMasterSheetTabs } from './src/utils/sheetExport.ts';
import {
  mergeCloudDatabases,
  type CloudSyncDatabaseSnapshot,
} from './src/utils/cloudMerge.ts';
import type {
  PrivateFarmWorkspacePayload,
  PublicOverviewChangeReason,
  RealtimeClientMessage,
  RealtimeServerEvent,
} from './src/utils/realtime.ts';
import type {
  FarmGoogleSheetConfig,
  FarmProfile,
  Sheep,
  Pen,
  FeedIngredient,
  FormulatedRation,
  FarmLog,
  LiveShareReport,
  OnlysheepsListing,
  OnlysheepsMatchRecord,
  OwnerMasterSheetData,
  PublicPlatformOverview,
  WebFormSubmission,
} from './src/types/sheep.ts';

interface StoredFarmRecord {
  profile: FarmProfile;
  passwordSalt: string;
  passwordHash: string;
  pens: Pen[];
  sheepList: Sheep[];
  ingredients: FeedIngredient[];
  rations: FormulatedRation[];
  logs: FarmLog[];
  matches: OnlysheepsMatchRecord[];
  updatedAt?: string;
}

interface ShareSnapshotIndex {
  shareId: string;
  scope: 'farm' | 'hub';
  farmId?: string;
  updatedAt: string;
}

interface DatabaseSchema {
  version: number;
  globalRevision?: number;
  updatedAt?: string;
  farms: Record<string, StoredFarmRecord>;
  onlysheepsListings: OnlysheepsListing[];
  deletedListingIds?: string[];
  shareSnapshots?: Record<string, ShareSnapshotIndex>;
  ownerConfig?: FarmGoogleSheetConfig;
  webFormRecords?: WebFormSubmission[];
}

interface AuthedRequest extends Request {
  farmId?: string;
  ownerEmail?: string;
}

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'server-data');
const DB_FILE = path.join(DATA_DIR, 'farms-db.json');
const DB_BACKUP_FILE = path.join(DATA_DIR, 'farms-db.backup.json');
const SECRET_FILE = path.join(DATA_DIR, 'session-secret.key');
const DB_VERSION = 3;
const APP_OWNER_EMAIL = (process.env.APP_OWNER_EMAIL || 'tierraporn.oga@student.mahidol.edu')
  .trim()
  .toLowerCase();
const APP_OWNER_PASSWORD = process.env.APP_OWNER_PASSWORD || 'Ovis1234';

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getSessionSecret(): string {
  ensureDataDir();
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    return process.env.SESSION_SECRET;
  }
  if (fs.existsSync(SECRET_FILE)) {
    return fs.readFileSync(SECRET_FILE, 'utf8').trim();
  }
  const generated = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(SECRET_FILE, generated, 'utf8');
  return generated;
}

const SESSION_SECRET = getSessionSecret();

function hashPassword(password: string, existingSalt?: string): { salt: string; hash: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const candidate = crypto.scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(storedHash, 'hex');
  if (candidate.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(candidate, storedBuf);
}

function signSessionToken(farmId: string): string {
  const payload = {
    farmId,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

function verifySessionToken(token: string | undefined | null): string | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');
  const sigBuf = Buffer.from(sigB64);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!parsed.farmId || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    return parsed.farmId as string;
  } catch {
    return null;
  }
}

function signOwnerToken(email: string): string {
  const payload = {
    role: 'app_owner',
    ownerEmail: email.trim().toLowerCase(),
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

function verifyOwnerToken(token: string | undefined | null): string | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');
  const sigBuf = Buffer.from(sigB64);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (
      parsed.role !== 'app_owner' ||
      typeof parsed.ownerEmail !== 'string' ||
      parsed.ownerEmail.toLowerCase() !== APP_OWNER_EMAIL ||
      typeof parsed.exp !== 'number' ||
      parsed.exp < Date.now()
    ) {
      return null;
    }
    return parsed.ownerEmail as string;
  } catch {
    return null;
  }
}

function buildSeedFarmRecord(seed: (typeof SEED_FARMS)[number]): StoredFarmRecord {
  const { salt, hash } = hashPassword(seed.passwordPlain);
  const seedTs = '2026-01-01T00:00:00.000Z';
  return {
    profile: { ...seed.profile, updatedAt: seedTs },
    passwordSalt: salt,
    passwordHash: hash,
    pens: seed.pens.map(p => ({ ...p })),
    sheepList: seed.sheepList.map(s => ({ ...s })),
    ingredients: seed.ingredients.map(i => ({ ...i })),
    rations: seed.rations.map(r => ({ ...r })),
    logs: seed.logs.map(l => ({ ...l })),
    matches: [],
    updatedAt: seedTs,
  };
}

function buildSeedDatabase(): DatabaseSchema {
  const farms: Record<string, StoredFarmRecord> = {};
  for (const seed of SEED_FARMS) {
    farms[seed.profile.farmId] = buildSeedFarmRecord(seed);
  }
  return {
    version: DB_VERSION,
    globalRevision: 1,
    updatedAt: new Date().toISOString(),
    farms,
    onlysheepsListings: ONLYSHEEPS_INITIAL_LISTINGS.map(item => ({ ...item })),
    deletedListingIds: [],
    webFormRecords: [],
  };
}

function migrateDatabaseV2ToV3(db: DatabaseSchema): DatabaseSchema {
  // Preserve all existing farms' sheep, pens, ingredients, rations, logs, and matches!
  // Only apply each seed farm's dedicated private password and insert Ovisfarm (farm #6) if absent.
  for (const seed of SEED_FARMS) {
    const existing = db.farms[seed.profile.farmId];
    if (existing) {
      const { salt, hash } = hashPassword(seed.passwordPlain);
      existing.passwordSalt = salt;
      existing.passwordHash = hash;
    } else {
      db.farms[seed.profile.farmId] = buildSeedFarmRecord(seed);
    }
  }

  const existingIds = new Set((db.onlysheepsListings || []).map(l => l.listingId));
  const missingListings = ONLYSHEEPS_INITIAL_LISTINGS.filter(l => !existingIds.has(l.listingId)).map(
    l => ({ ...l })
  );
  db.onlysheepsListings = [...(db.onlysheepsListings || []), ...missingListings];
  db.version = DB_VERSION;
  return db;
}

function parseAndMigrateDbRaw(raw: string): DatabaseSchema | null {
  try {
    const parsed = JSON.parse(raw) as DatabaseSchema;
    if (parsed && parsed.version === 2 && parsed.farms) {
      return migrateDatabaseV2ToV3(parsed);
    }
    if (parsed && parsed.version === DB_VERSION && parsed.farms) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

let lastKnownDbMtimeMs = 0;

function getCurrentDbMtimeMs(): number {
  try {
    return fs.existsSync(DB_FILE) ? fs.statSync(DB_FILE).mtimeMs : 0;
  } catch {
    return 0;
  }
}

function loadDatabase(): DatabaseSchema {
  ensureDataDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      const stat = fs.statSync(DB_FILE);
      lastKnownDbMtimeMs = stat.mtimeMs;
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = parseAndMigrateDbRaw(raw);
      if (parsed) {
        if (typeof parsed.globalRevision !== 'number') {
          parsed.globalRevision = 1;
        }
        if (!Array.isArray(parsed.deletedListingIds)) {
          parsed.deletedListingIds = [];
        }
        if (!Array.isArray(parsed.webFormRecords)) {
          parsed.webFormRecords = [];
        }
        return parsed;
      }
    } catch {
      // fall through to backup recovery
    }
  }

  if (fs.existsSync(DB_BACKUP_FILE)) {
    try {
      const backupRaw = fs.readFileSync(DB_BACKUP_FILE, 'utf8');
      const recovered = parseAndMigrateDbRaw(backupRaw);
      if (recovered) {
        saveDatabase(recovered);
        return recovered;
      }
    } catch {
      // fall through to fresh seed
    }
  }

  const initial = buildSeedDatabase();
  saveDatabase(initial);
  return initial;
}

function saveDatabase(db: DatabaseSchema, options: { preserveRevision?: boolean } = {}): void {
  ensureDataDir();
  if (!options.preserveRevision) {
    db.globalRevision = (typeof db.globalRevision === 'number' ? db.globalRevision : 0) + 1;
  } else if (typeof db.globalRevision !== 'number') {
    db.globalRevision = 1;
  }
  db.updatedAt = new Date().toISOString();
  if (!Array.isArray(db.deletedListingIds)) {
    db.deletedListingIds = [];
  }
  const serialized = JSON.stringify(db, null, 2);
  const tmpFile = `${DB_FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpFile, serialized, 'utf8');
  if (fs.existsSync(DB_FILE)) {
    try {
      fs.copyFileSync(DB_FILE, DB_BACKUP_FILE);
    } catch {
      // ignore backup copy error
    }
  }
  fs.renameSync(tmpFile, DB_FILE);
  lastKnownDbMtimeMs = getCurrentDbMtimeMs();
}

function parseAllowedGoogleScriptUrl(rawUrl: string | undefined | null): URL | null {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) return null;
  try {
    const parsed = new URL(rawUrl.trim());
    const allowed =
      parsed.protocol === 'https:' &&
      ((parsed.hostname === 'script.google.com' && parsed.pathname.startsWith('/macros/s/')) ||
        parsed.hostname === 'script.googleusercontent.com');
    return allowed ? parsed : null;
  } catch {
    return null;
  }
}

function getCentralCloudSyncUrl(db: DatabaseSchema): string | null {
  const fromEnv = parseAllowedGoogleScriptUrl(process.env.CLOUD_SYNC_WEBHOOK_URL);
  if (fromEnv) return fromEnv.toString();
  const fromOwner = parseAllowedGoogleScriptUrl(db.ownerConfig?.appsScriptWebhookUrl);
  return fromOwner ? fromOwner.toString() : null;
}

function getSheetApiKey(): string | undefined {
  const raw = process.env.OVISPRO_SHEET_API_KEY;
  return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : undefined;
}

function appendApiKeyQueryIfNeeded(targetUrl: string): string {
  const apiKey = getSheetApiKey();
  if (!apiKey) return targetUrl;
  const parsed = new URL(targetUrl);
  parsed.searchParams.set('apiKey', apiKey);
  return parsed.toString();
}

function extractToken(req: Request, cookieName: string = 'ovispro_session'): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader
      .split(';')
      .map(c => c.trim())
      .find(c => c.startsWith(`${cookieName}=`));
    if (match) {
      return decodeURIComponent(match.slice(`${cookieName}=`.length));
    }
  }
  return null;
}

function requireFarmAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const token = extractToken(req, 'ovispro_session');
  const farmId = verifySessionToken(token);
  if (!farmId) {
    res.status(401).json({ error: 'กรุณาเข้าสู่ระบบฟาร์มของคุณก่อนดูหรือบันทึกข้อมูลส่วนตัว' });
    return;
  }
  const db = loadDatabase();
  if (!db.farms[farmId]) {
    res.status(401).json({ error: 'ไม่พบบัญชีฟาร์มในระบบ กรุณาเข้าสู่ระบบใหม่อีกครั้ง' });
    return;
  }
  req.farmId = farmId;
  next();
}

function requireAppOwner(req: AuthedRequest, res: Response, next: NextFunction): void {
  const ownerHeader = req.headers['x-owner-authorization'];
  const headerToken =
    typeof ownerHeader === 'string' && ownerHeader.startsWith('Bearer ')
      ? ownerHeader.slice(7).trim()
      : null;
  const token = headerToken || extractToken(req, 'ovispro_owner_session');
  const ownerEmail = verifyOwnerToken(token);
  if (!ownerEmail) {
    res.status(403).json({
      error: 'พื้นที่นี้สงวนสิทธิ์เฉพาะเจ้าของแอปพลิเคชันเท่านั้น (App Owner Only)',
    });
    return;
  }
  req.ownerEmail = ownerEmail;
  next();
}

function recomputePensWithCounts(pens: Pen[], sheepList: Sheep[]): Pen[] {
  return pens.map(pen => {
    const inPen = sheepList.filter(s => s.penId === pen.id);
    const avgW =
      inPen.length > 0
        ? Number((inPen.reduce((sum, s) => sum + (s.weightKg || 0), 0) / inPen.length).toFixed(1))
        : pen.averageWeightKg;
    const avgAdg =
      inPen.length > 0
        ? Math.round(inPen.reduce((sum, s) => sum + (s.currentAdgGrams || 0), 0) / inPen.length)
        : pen.averageAdgGrams;
    return {
      ...pen,
      sheepCount: inPen.length,
      averageWeightKg: avgW,
      averageAdgGrams: avgAdg,
    };
  });
}

function buildPublicOverview(db: DatabaseSchema): PublicPlatformOverview {
  const farmValues = Object.values(db.farms);
  const farmDirectory = farmValues.map(f => ({
    farmId: f.profile.farmId,
    username: f.profile.username,
    farmName: f.profile.farmName,
    location: f.profile.location,
    breedFocus: f.profile.breedFocus,
    sheepCount: f.sheepList.length,
  }));
  const totalNetworkSheep = farmValues.reduce((sum, f) => sum + f.sheepList.length, 0);

  return {
    totalFarms: farmValues.length,
    totalNetworkSheep,
    onlysheepsCount: db.onlysheepsListings.length,
    farmDirectory,
  };
}

function extractOriginClientId(req: Request): string | undefined {
  const raw = req.headers['x-ovispro-client-id'];
  if (typeof raw === 'string' && raw.trim().length > 0 && raw.trim().length <= 128) {
    return raw.trim();
  }
  return undefined;
}

function buildFarmWorkspacePayload(farm: StoredFarmRecord): PrivateFarmWorkspacePayload {
  return {
    profile: farm.profile,
    pens: recomputePensWithCounts(farm.pens, farm.sheepList),
    sheepList: farm.sheepList,
    ingredients: farm.ingredients,
    rations: farm.rations,
    logs: farm.logs,
    matches: farm.matches || [],
  };
}

function buildOwnerMasterResponse(db: DatabaseSchema): OwnerMasterSheetData {
  const farms = Object.values(db.farms);
  const tabs = buildOwnerMasterSheetTabs(farms, db.onlysheepsListings, db.webFormRecords || []);
  return {
    ownerEmail: APP_OWNER_EMAIL,
    generatedAt: new Date().toISOString(),
    ownerSheetConfig: db.ownerConfig || {},
    summary: {
      totalFarms: farms.length,
      totalSheep: farms.reduce((s, f) => s + f.sheepList.length, 0),
      totalIngredients: farms.reduce((s, f) => s + f.ingredients.length, 0),
      totalRations: farms.reduce((s, f) => s + f.rations.length, 0),
      totalLogs: farms.reduce((s, f) => s + f.logs.length, 0),
      totalOnlysheeps: db.onlysheepsListings.length,
    },
    tabs,
  };
}

function applyFarmWorkspacePatch(
  farm: StoredFarmRecord,
  body: Record<string, unknown>
): void {
  if (body.profile && typeof body.profile === 'object') {
    const profilePatch = body.profile as Record<string, unknown>;
    const rawSheetConfig =
      profilePatch.googleSheetConfig && typeof profilePatch.googleSheetConfig === 'object'
        ? (profilePatch.googleSheetConfig as Record<string, unknown>)
        : null;

    const nextSheetConfig = rawSheetConfig
      ? {
          sheetUrl:
            typeof rawSheetConfig.sheetUrl === 'string'
              ? rawSheetConfig.sheetUrl.trim()
              : farm.profile.googleSheetConfig?.sheetUrl,
          appsScriptWebhookUrl:
            typeof rawSheetConfig.appsScriptWebhookUrl === 'string'
              ? rawSheetConfig.appsScriptWebhookUrl.trim()
              : farm.profile.googleSheetConfig?.appsScriptWebhookUrl,
          lastSyncedAt:
            typeof rawSheetConfig.lastSyncedAt === 'string'
              ? rawSheetConfig.lastSyncedAt
              : farm.profile.googleSheetConfig?.lastSyncedAt,
        }
      : farm.profile.googleSheetConfig;

    farm.profile = {
      ...farm.profile,
      farmName:
        typeof profilePatch.farmName === 'string' && profilePatch.farmName.trim()
          ? profilePatch.farmName.trim()
          : farm.profile.farmName,
      ownerName:
        typeof profilePatch.ownerName === 'string' && profilePatch.ownerName.trim()
          ? profilePatch.ownerName.trim()
          : farm.profile.ownerName,
      location:
        typeof profilePatch.location === 'string' && profilePatch.location.trim()
          ? profilePatch.location.trim()
          : farm.profile.location,
      contact:
        typeof profilePatch.contact === 'string' && profilePatch.contact.trim()
          ? profilePatch.contact.trim()
          : farm.profile.contact,
      breedFocus:
        typeof profilePatch.breedFocus === 'string' && profilePatch.breedFocus.trim()
          ? profilePatch.breedFocus.trim()
          : farm.profile.breedFocus,
      googleSheetConfig: nextSheetConfig,
    };
  }

  if (Array.isArray(body.pens) && body.pens.length > 0) {
    const sanitizedPens: Pen[] = body.pens
      .filter((p: unknown): p is Record<string, unknown> => Boolean(p && typeof p === 'object'))
      .map((p: Record<string, unknown>, idx: number) => ({
        id: typeof p.id === 'string' && p.id.trim() ? p.id.trim() : `pen-custom-${Date.now()}-${idx}`,
        code: typeof p.code === 'string' && p.code.trim() ? p.code.trim() : `คอก ${idx + 1}`,
        name: typeof p.name === 'string' && p.name.trim() ? p.name.trim() : `คอก ${idx + 1}`,
        ageRange: typeof p.ageRange === 'string' && p.ageRange.trim() ? p.ageRange.trim() : 'ทุกช่วงอายุ',
        sheepCount: Number(p.sheepCount) || 0,
        averageWeightKg: Number(p.averageWeightKg) || 50,
        dailyFeedKg: Number(p.dailyFeedKg) || 2.0,
        averageAdgGrams: Number(p.averageAdgGrams) || 175,
        purpose:
          typeof p.purpose === 'string' && p.purpose.trim()
            ? p.purpose.trim()
            : 'จัดการฝูงแกะตามกลุ่มเป้าหมายของฟาร์ม',
        notes: typeof p.notes === 'string' ? p.notes : undefined,
      }));
    if (sanitizedPens.length > 0) {
      farm.pens = recomputePensWithCounts(sanitizedPens, farm.sheepList);
    }
  }

  if (Array.isArray(body.sheepList)) {
    farm.sheepList = body.sheepList as Sheep[];
    farm.pens = recomputePensWithCounts(farm.pens, farm.sheepList);
  }
  if (Array.isArray(body.ingredients)) {
    farm.ingredients = body.ingredients as FeedIngredient[];
  }
  if (Array.isArray(body.rations)) {
    farm.rations = body.rations as FormulatedRation[];
  }
  if (Array.isArray(body.logs)) {
    farm.logs = body.logs as FarmLog[];
  }
  if (Array.isArray(body.matches)) {
    farm.matches = body.matches as OnlysheepsMatchRecord[];
  }
  const nowIso = new Date().toISOString();
  farm.updatedAt = nowIso;
  farm.profile.updatedAt = nowIso;
}

async function startServer(): Promise<void> {
  const bootDb = loadDatabase();
  const app = express();
  app.use(express.json({ limit: '5mb' }));
  app.use('/api', (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  interface WsClientMeta {
    clientId?: string;
    farmId?: string;
    isOwner?: boolean;
    isAlive: boolean;
  }

  const wsClientMeta = new Map<WebSocket, WsClientMeta>();
  let serverRevision = Math.max(1, bootDb.globalRevision || 1);
  let knownDiskMtime = lastKnownDbMtimeMs;
  const nextRevision = (): number => {
    serverRevision += 1;
    return serverRevision;
  };
  const syncServerRevisionWithDisk = (): DatabaseSchema => {
    const currentMtime = getCurrentDbMtimeMs();
    const db = loadDatabase();
    if (currentMtime > knownDiskMtime) {
      knownDiskMtime = currentMtime;
      serverRevision = Math.max(serverRevision + 1, db.globalRevision || 1);
    }
    return db;
  };

  const sendEvent = (socket: WebSocket, event: RealtimeServerEvent): void => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(event));
    }
  };

  const broadcastPublicEvent = (event: RealtimeServerEvent): void => {
    const serialized = JSON.stringify(event);
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(serialized);
      }
    }
  };

  const broadcastPublicOverviewUpdate = (
    db: DatabaseSchema,
    reason: PublicOverviewChangeReason,
    originClientId?: string,
    farmName?: string
  ): void => {
    broadcastPublicEvent({
      type: 'public:overview_updated',
      revision: nextRevision(),
      originClientId,
      reason,
      farmName,
      overview: buildPublicOverview(db),
    });
  };

  const broadcastFarmWorkspaceUpdate = (
    farm: StoredFarmRecord,
    originClientId?: string
  ): void => {
    const farmId = farm.profile.farmId;
    const event: RealtimeServerEvent = {
      type: 'farm:workspace_updated',
      revision: nextRevision(),
      originClientId,
      farmId,
      updatedAt: new Date().toISOString(),
      workspace: buildFarmWorkspacePayload(farm),
    };
    const serialized = JSON.stringify(event);

    for (const [client, meta] of wsClientMeta.entries()) {
      if (client.readyState !== WebSocket.OPEN) continue;
      if (meta.farmId !== farmId) continue;
      if (originClientId && meta.clientId === originClientId) continue;
      client.send(serialized);
    }
  };

  const broadcastOwnerMasterUpdate = (db: DatabaseSchema): void => {
    let hasOwnerSockets = false;
    for (const [client, meta] of wsClientMeta.entries()) {
      if (meta.isOwner && client.readyState === WebSocket.OPEN) {
        hasOwnerSockets = true;
        break;
      }
    }
    if (!hasOwnerSockets) return;

    const event: RealtimeServerEvent = {
      type: 'owner:master_updated',
      revision: nextRevision(),
      data: buildOwnerMasterResponse(db),
    };
    const serialized = JSON.stringify(event);
    for (const [client, meta] of wsClientMeta.entries()) {
      if (meta.isOwner && client.readyState === WebSocket.OPEN) {
        client.send(serialized);
      }
    }
  };

  // =========================================================================
  // 2-WAY CENTRAL CLOUD SYNC ENGINE (GOOGLE APPS SCRIPT SHARED RELAY)
  // =========================================================================
  let isPullingCloud = false;
  let isPushingCloud = false;
  let lastCloudPullMs = 0;
  let cloudPushTimer: ReturnType<typeof setTimeout> | null = null;

  const pullAndMergeFromCentralCloud = async (
    overrideWebhookUrl?: string
  ): Promise<{ synced: boolean; changed: boolean; error?: string }> => {
    const localDb = loadDatabase();
    const targetUrl = overrideWebhookUrl || getCentralCloudSyncUrl(localDb);
    if (!targetUrl) {
      return { synced: false, changed: false };
    }
    if (isPullingCloud) {
      return { synced: false, changed: false };
    }
    isPullingCloud = true;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9000);
      const response = await fetch(appendApiKeyQueryIfNeeded(targetUrl), {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return { synced: false, changed: false, error: `HTTP ${response.status}` };
      }
      const data = (await response.json().catch(() => null)) as {
        ok?: boolean;
        cloudState?: unknown;
      } | null;
      lastCloudPullMs = Date.now();

      if (!data || data.ok !== true || !data.cloudState) {
        return { synced: true, changed: false };
      }

      const remoteSnapshot =
        typeof data.cloudState === 'string'
          ? (JSON.parse(data.cloudState) as CloudSyncDatabaseSnapshot)
          : (data.cloudState as CloudSyncDatabaseSnapshot);

      const latestLocal = loadDatabase();
      const mergeResult = mergeCloudDatabases(
        latestLocal as unknown as CloudSyncDatabaseSnapshot,
        remoteSnapshot
      );

      if (mergeResult.changed) {
        const mergedDb = mergeResult.merged as unknown as DatabaseSchema;
        saveDatabase(mergedDb, { preserveRevision: true });
        knownDiskMtime = lastKnownDbMtimeMs;
        nextRevision();

        if (mergeResult.onlysheepsChanged || mergeResult.webFormsChanged) {
          broadcastPublicEvent({
            type: 'realtime:init',
            revision: serverRevision,
            overview: buildPublicOverview(mergedDb),
            onlysheepsListings: mergedDb.onlysheepsListings,
            webFormRecords: mergedDb.webFormRecords || [],
          });
        } else if (mergeResult.publicOverviewChanged) {
          broadcastPublicOverviewUpdate(
            mergedDb,
            mergeResult.addedFarmNames.length > 0 ? 'farm_registered' : 'herd_updated',
            undefined,
            mergeResult.addedFarmNames[0]
          );
        }

        for (const farmId of mergeResult.changedFarmIds) {
          const updatedFarm = mergedDb.farms[farmId];
          if (updatedFarm) {
            broadcastFarmWorkspaceUpdate(updatedFarm);
          }
        }

        if (mergeResult.ownerChanged || mergeResult.publicOverviewChanged || mergeResult.onlysheepsChanged) {
          broadcastOwnerMasterUpdate(mergedDb);
        }
      }

      return { synced: true, changed: mergeResult.changed };
    } catch (err) {
      return {
        synced: false,
        changed: false,
        error: err instanceof Error ? err.message : 'Cloud pull error',
      };
    } finally {
      isPullingCloud = false;
    }
  };

  const pushToCentralCloud = async (
    overrideWebhookUrl?: string
  ): Promise<{ ok: boolean; syncedTabs?: number; lastSyncedAt?: string; error?: string }> => {
    const localDb = loadDatabase();
    const targetUrl = overrideWebhookUrl || getCentralCloudSyncUrl(localDb);
    if (!targetUrl) {
      return { ok: false, error: 'ไม่ได้ตั้งค่า Apps Script URL' };
    }
    if (isPushingCloud) {
      return { ok: false, error: 'กำลังซิงค์ข้อมูลอยู่' };
    }
    isPushingCloud = true;
    try {
      // Pull & merge concurrent remote changes first so neither origin clobbers the other
      if (Date.now() - lastCloudPullMs > 1500) {
        await pullAndMergeFromCentralCloud(targetUrl);
      }

      const freshDb = loadDatabase();
      const farms = Object.values(freshDb.farms);
      const tabs = buildOwnerMasterSheetTabs(
        farms,
        freshDb.onlysheepsListings,
        freshDb.webFormRecords || []
      );
      const syncedAt = new Date().toISOString();
      const sheetApiKey = getSheetApiKey();

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const syncResponse = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(sheetApiKey ? { apiKey: sheetApiKey } : {}),
          farmId: 'app-owner-master',
          farmName: `Ovispro Master Backend (${APP_OWNER_EMAIL})`,
          syncedAt,
          globalRevision: freshDb.globalRevision || 1,
          tabs,
          cloudState: JSON.stringify(freshDb),
        }),
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!syncResponse.ok) {
        return {
          ok: false,
          error: `Google Apps Script ตอบกลับสถานะ ${syncResponse.status}`,
        };
      }

      return { ok: true, syncedTabs: tabs.length, lastSyncedAt: syncedAt };
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : 'ไม่สามารถเชื่อมต่อ Google Apps Script ได้ กรุณาตรวจสอบ URL และสิทธิ์ Deploy (Anyone)',
      };
    } finally {
      isPushingCloud = false;
    }
  };

  const scheduleCentralCloudPush = (): void => {
    const db = loadDatabase();
    if (!getCentralCloudSyncUrl(db)) return;
    if (cloudPushTimer !== null) {
      clearTimeout(cloudPushTimer);
    }
    cloudPushTimer = setTimeout(() => {
      cloudPushTimer = null;
      void pushToCentralCloud();
    }, 600);
  };

  wss.on('connection', socket => {
    wsClientMeta.set(socket, { isAlive: true });

    const db = loadDatabase();
    sendEvent(socket, {
      type: 'realtime:init',
      revision: serverRevision,
      overview: buildPublicOverview(db),
      onlysheepsListings: db.onlysheepsListings,
      webFormRecords: db.webFormRecords || [],
    });

    socket.on('pong', () => {
      const meta = wsClientMeta.get(socket);
      if (meta) meta.isAlive = true;
    });

    socket.on('message', raw => {
      let msg: RealtimeClientMessage;
      try {
        msg = JSON.parse(raw.toString()) as RealtimeClientMessage;
      } catch {
        return;
      }

      const meta = wsClientMeta.get(socket);
      if (!meta) return;

      if (msg.type === 'ping') {
        sendEvent(socket, { type: 'pong', ts: msg.ts });
        return;
      }

      if (msg.type === 'auth:logout') {
        meta.farmId = undefined;
        return;
      }

      if (msg.type === 'auth:owner_logout') {
        meta.isOwner = false;
        return;
      }

      if (msg.type === 'auth:owner') {
        if (typeof msg.clientId === 'string' && msg.clientId.trim()) {
          meta.clientId = msg.clientId.trim();
        }
        const verifiedOwner = verifyOwnerToken(msg.token);
        if (verifiedOwner) {
          meta.isOwner = true;
          sendEvent(socket, { type: 'auth:owner_ok', ownerEmail: verifiedOwner });
          const latestDb = loadDatabase();
          sendEvent(socket, {
            type: 'owner:master_updated',
            revision: nextRevision(),
            data: buildOwnerMasterResponse(latestDb),
          });
        } else {
          meta.isOwner = false;
          sendEvent(socket, {
            type: 'auth:error',
            error: 'สิทธิ์เจ้าของแอปหมดอายุหรือรหัสโทเคนไม่ถูกต้อง',
          });
        }
        return;
      }

      if (msg.type === 'auth:farm') {
        if (typeof msg.clientId === 'string' && msg.clientId.trim()) {
          meta.clientId = msg.clientId.trim();
        }
        const verifiedFarmId = verifySessionToken(msg.token);
        const latestDb = loadDatabase();
        if (verifiedFarmId && latestDb.farms[verifiedFarmId]) {
          meta.farmId = verifiedFarmId;
          sendEvent(socket, { type: 'auth:ok', farmId: verifiedFarmId });
        } else {
          meta.farmId = undefined;
          sendEvent(socket, { type: 'auth:error', error: 'เซสชันฟาร์มหมดอายุหรือสิทธิ์ไม่ถูกต้อง' });
        }
        return;
      }

      if (msg.type === 'farm:save') {
        if (typeof msg.clientId === 'string' && msg.clientId.trim()) {
          meta.clientId = msg.clientId.trim();
        }
        const verifiedFarmId = verifySessionToken(msg.token);
        const latestDb = loadDatabase();
        if (!verifiedFarmId || !latestDb.farms[verifiedFarmId]) {
          sendEvent(socket, { type: 'auth:error', error: 'เซสชันฟาร์มหมดอายุหรือสิทธิ์ไม่ถูกต้อง' });
          return;
        }
        if (msg.payload && typeof msg.payload === 'object') {
          const farm = latestDb.farms[verifiedFarmId];
          applyFarmWorkspacePatch(farm, msg.payload as Record<string, unknown>);
          saveDatabase(latestDb);
          knownDiskMtime = lastKnownDbMtimeMs;
          const updatedAt = farm.updatedAt || new Date().toISOString();
          sendEvent(socket, {
            type: 'farm:save_ack',
            farmId: verifiedFarmId,
            seq: msg.seq,
            updatedAt,
          });
          const originClientId = meta.clientId;
          broadcastPublicOverviewUpdate(
            latestDb,
            'herd_updated',
            originClientId,
            farm.profile.farmName
          );
          broadcastFarmWorkspaceUpdate(farm, originClientId);
          broadcastOwnerMasterUpdate(latestDb);
          scheduleCentralCloudPush();
        }
        return;
      }

      if (msg.type === 'sync:request') {
        if (typeof msg.clientId === 'string' && msg.clientId.trim()) {
          meta.clientId = msg.clientId.trim();
        }
        const latestDb = loadDatabase();
        sendEvent(socket, {
          type: 'realtime:init',
          revision: serverRevision,
          overview: buildPublicOverview(latestDb),
          onlysheepsListings: latestDb.onlysheepsListings,
          webFormRecords: latestDb.webFormRecords || [],
        });

        const tokenFarmId = msg.token ? verifySessionToken(msg.token) : meta.farmId;
        if (tokenFarmId && latestDb.farms[tokenFarmId]) {
          meta.farmId = tokenFarmId;
          sendEvent(socket, {
            type: 'farm:workspace_updated',
            revision: nextRevision(),
            farmId: tokenFarmId,
            updatedAt: new Date().toISOString(),
            workspace: buildFarmWorkspacePayload(latestDb.farms[tokenFarmId]),
          });
        }

        const ownerFromToken = msg.ownerToken ? verifyOwnerToken(msg.ownerToken) : null;
        if (ownerFromToken) {
          meta.isOwner = true;
        }
        if (meta.isOwner) {
          sendEvent(socket, {
            type: 'owner:master_updated',
            revision: nextRevision(),
            data: buildOwnerMasterResponse(latestDb),
          });
        }
      }
    });

    socket.on('close', () => {
      wsClientMeta.delete(socket);
    });
  });

  const heartbeatInterval = setInterval(() => {
    for (const [socket, meta] of wsClientMeta.entries()) {
      if (!meta.isAlive) {
        wsClientMeta.delete(socket);
        socket.terminate();
        continue;
      }
      meta.isAlive = false;
      socket.ping();
    }
  }, 30000);
  const cloudPollInterval = setInterval(() => {
    void pullAndMergeFromCentralCloud();
  }, 4500);
  wss.on('close', () => {
    clearInterval(heartbeatInterval);
    clearInterval(cloudPollInterval);
  });

  // =========================================================================
  // 1. PUBLIC PLATFORM OVERVIEW & HTTP SYNC-STATE FALLBACK
  // =========================================================================
  app.get('/api/public/overview', (_req: Request, res: Response) => {
    const db = syncServerRevisionWithDisk();
    res.json(buildPublicOverview(db));
  });

  app.get('/api/public/sync-state', (req: Request, res: Response) => {
    const db = syncServerRevisionWithDisk();
    const sinceRaw = req.query.since;
    const sinceRev = typeof sinceRaw === 'string' && sinceRaw.trim() !== '' ? Number(sinceRaw) : NaN;
    const cloudSyncConfigured = Boolean(getCentralCloudSyncUrl(db));

    if (Number.isFinite(sinceRev) && sinceRev > 0 && sinceRev === serverRevision) {
      res.json({
        changed: false,
        revision: serverRevision,
        globalRevision: db.globalRevision || 1,
        cloudSyncConfigured,
      });
      return;
    }

    const farmToken = extractToken(req, 'ovispro_session');
    const verifiedFarmId = verifySessionToken(farmToken);

    const ownerHeader = req.headers['x-owner-authorization'];
    const ownerHeaderToken =
      typeof ownerHeader === 'string' && ownerHeader.startsWith('Bearer ')
        ? ownerHeader.slice(7).trim()
        : null;
    const ownerToken = ownerHeaderToken || extractToken(req, 'ovispro_owner_session');
    const verifiedOwner = verifyOwnerToken(ownerToken);

    res.json({
      changed: true,
      revision: serverRevision,
      globalRevision: db.globalRevision || 1,
      updatedAt: db.updatedAt || new Date().toISOString(),
      cloudSyncConfigured,
      overview: buildPublicOverview(db),
      onlysheepsListings: db.onlysheepsListings,
      webFormRecords: db.webFormRecords || [],
      workspace:
        verifiedFarmId && db.farms[verifiedFarmId]
          ? buildFarmWorkspacePayload(db.farms[verifiedFarmId])
          : undefined,
      ownerData: verifiedOwner ? buildOwnerMasterResponse(db) : undefined,
    });
  });

  // =========================================================================
  // 1B. STRUCTURED WEB FORM -> SERVER DB & GOOGLE APPS SCRIPT SHEET APPEND
  // =========================================================================
  app.get('/api/forms/records', (_req: Request, res: Response) => {
    const db = syncServerRevisionWithDisk();
    res.json({
      records: db.webFormRecords || [],
      sheetSyncConfigured: Boolean(getCentralCloudSyncUrl(db)),
      apiKeyConfigured: Boolean(getSheetApiKey()),
    });
  });

  app.post('/api/forms/records', async (req: Request, res: Response) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const farmName = typeof body.farmName === 'string' ? body.farmName.trim() : '';
    const recorderName = typeof body.recorderName === 'string' ? body.recorderName.trim() : '';
    const province = typeof body.province === 'string' ? body.province.trim() : '';
    const rawEarTag = typeof body.sheepEarTag === 'string' ? body.sheepEarTag.trim() : '';
    const sheepName = typeof body.sheepName === 'string' ? body.sheepName.trim() : '';
    const breed = typeof body.breed === 'string' ? body.breed.trim() : '';
    const gender: 'male' | 'female' = body.gender === 'male' ? 'male' : 'female';
    const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 500) : '';

    const ageMonths = Number(body.ageMonths);
    const weightKg = Number(body.weightKg);
    const woolMicron = Number(body.woolMicron);
    const dailyFeedKg = Number(body.dailyFeedKg);

    if (farmName.length < 2 || farmName.length > 100) {
      res.status(400).json({ error: 'กรุณาระบุชื่อฟาร์ม (2–100 ตัวอักษร)' });
      return;
    }
    if (recorderName.length < 2 || recorderName.length > 80) {
      res.status(400).json({ error: 'กรุณาระบุชื่อผู้บันทึก (2–80 ตัวอักษร)' });
      return;
    }
    if (province.length < 2 || province.length > 60) {
      res.status(400).json({ error: 'กรุณาระบุจังหวัดที่ตั้งฟาร์ม (2–60 ตัวอักษร)' });
      return;
    }
    if (sheepName.length < 1 || sheepName.length > 80) {
      res.status(400).json({ error: 'กรุณาระบุชื่อแกะ (1–80 ตัวอักษร)' });
      return;
    }
    if (breed.length < 2 || breed.length > 80) {
      res.status(400).json({ error: 'กรุณาระบุสายพันธุ์แกะ' });
      return;
    }
    if (!Number.isFinite(ageMonths) || ageMonths < 0 || ageMonths > 240) {
      res.status(400).json({ error: 'อายุแกะต้องอยู่ระหว่าง 0 – 240 เดือน' });
      return;
    }
    if (!Number.isFinite(weightKg) || weightKg < 1 || weightKg > 250) {
      res.status(400).json({ error: 'น้ำหนักแกะต้องอยู่ระหว่าง 1 – 250 กก.' });
      return;
    }
    if (!Number.isFinite(woolMicron) || woolMicron < 10 || woolMicron > 60) {
      res.status(400).json({ error: 'ค่าความละเอียดขน (ไมครอน) ต้องอยู่ระหว่าง 10 – 60 µm' });
      return;
    }
    if (!Number.isFinite(dailyFeedKg) || dailyFeedKg < 0 || dailyFeedKg > 15) {
      res.status(400).json({ error: 'ปริมาณอาหารต่อวันต้องอยู่ระหว่าง 0 – 15 กก.' });
      return;
    }

    const nowIso = new Date().toISOString();
    const recordId = `wf-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const sheepEarTag =
      rawEarTag.length > 0 ? rawEarTag.slice(0, 40) : `WF-${Date.now().toString().slice(-4)}`;

    const newRecord: WebFormSubmission = {
      id: recordId,
      submittedAt: nowIso,
      farmName,
      recorderName,
      province,
      sheepEarTag,
      sheepName,
      breed,
      gender,
      ageMonths: Number(ageMonths.toFixed(1)),
      weightKg: Number(weightKg.toFixed(1)),
      woolMicron: Number(woolMicron.toFixed(1)),
      dailyFeedKg: Number(dailyFeedKg.toFixed(2)),
      ...(notes ? { notes } : {}),
      syncedToSheet: false,
    };

    const dbSnapshot = loadDatabase();
    const sheetWebhookUrl = getCentralCloudSyncUrl(dbSnapshot);
    let sheetError: string | undefined;

    if (sheetWebhookUrl) {
      try {
        const sheetApiKey = getSheetApiKey();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const sheetRes = await fetch(sheetWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(sheetApiKey ? { apiKey: sheetApiKey } : {}),
            action: 'append_form_row',
            record: {
              ...newRecord,
              genderLabel: newRecord.gender === 'male' ? 'เพศผู้' : 'เพศเมีย',
            },
          }),
          redirect: 'follow',
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (sheetRes.ok) {
          const parsedRes = (await sheetRes.json().catch(() => null)) as {
            ok?: boolean;
            error?: string;
          } | null;
          if (!parsedRes || parsedRes.ok !== false) {
            newRecord.syncedToSheet = true;
          } else {
            sheetError = parsedRes.error || 'Apps Script ปฏิเสธการบันทึก';
          }
        } else {
          sheetError = `Google Apps Script HTTP ${sheetRes.status}`;
        }
      } catch (err) {
        sheetError =
          err instanceof Error ? err.message : 'ไม่สามารถส่งแถวเข้า Google Sheet ได้';
      }
    }

    const freshDb = loadDatabase();
    freshDb.webFormRecords = [newRecord, ...(freshDb.webFormRecords || [])].slice(0, 500);
    saveDatabase(freshDb);
    knownDiskMtime = lastKnownDbMtimeMs;

    const originClientId = extractOriginClientId(req);
    broadcastPublicEvent({
      type: 'forms:record_created',
      revision: nextRevision(),
      originClientId,
      record: newRecord,
    });
    broadcastOwnerMasterUpdate(freshDb);
    scheduleCentralCloudPush();

    res.status(201).json({
      record: newRecord,
      sheetSyncConfigured: Boolean(sheetWebhookUrl),
      ...(sheetError ? { sheetError } : {}),
    });
  });

  // =========================================================================
  // 2. FARM AUTHENTICATION (LOGIN / REGISTER / ME / LOGOUT)
  // =========================================================================
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'กรุณากรอกชื่อบัญชีฟาร์มและรหัสผ่าน' });
      return;
    }

    const normalizedUser = username.trim().toLowerCase();
    const db = loadDatabase();
    const farmRecord = Object.values(db.farms).find(
      f => f.profile.username.toLowerCase() === normalizedUser
    );

    if (!farmRecord || !verifyPassword(password, farmRecord.passwordSalt, farmRecord.passwordHash)) {
      res.status(401).json({ error: 'ชื่อบัญชีฟาร์มหรือรหัสผ่านไม่ถูกต้อง' });
      return;
    }

    const token = signSessionToken(farmRecord.profile.farmId);
    res.setHeader(
      'Set-Cookie',
      `ovispro_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=604800`
    );
    res.json({
      token,
      profile: farmRecord.profile,
      workspace: buildFarmWorkspacePayload(farmRecord),
    });
  });

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { username, password, farmName, ownerName, location, contact, breedFocus } = req.body || {};

    if (
      typeof username !== 'string' ||
      username.trim().length < 3 ||
      typeof password !== 'string' ||
      password.length < 4 ||
      typeof farmName !== 'string' ||
      farmName.trim().length < 2
    ) {
      res.status(400).json({
        error: 'กรุณากรอกชื่อผู้ใช้ (อย่างน้อย 3 ตัวอักษร), รหัสผ่าน (อย่างน้อย 4 ตัวอักษร) และชื่อฟาร์ม',
      });
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (cleanUsername.length < 3) {
      res.status(400).json({ error: 'ชื่อผู้ใช้ฟาร์มควรใช้ภาษาอังกฤษหรือตัวเลขอย่างน้อย 3 ตัวอักษร (a-z, 0-9)' });
      return;
    }

    const db = loadDatabase();
    const exists = Object.values(db.farms).some(
      f => f.profile.username.toLowerCase() === cleanUsername
    );
    if (exists) {
      res.status(409).json({ error: `ชื่อผู้ใช้ "${cleanUsername}" ถูกใช้แล้ว กรุณาใช้ชื่ออื่น` });
      return;
    }

    const farmId = `farm-${cleanUsername}-${Date.now()}`;
    const { salt, hash } = hashPassword(password);

    const regTimestamp = new Date().toISOString();
    const newProfile: FarmProfile = {
      farmId,
      username: cleanUsername,
      farmName: farmName.trim(),
      ownerName: typeof ownerName === 'string' && ownerName.trim() ? ownerName.trim() : 'เจ้าของฟาร์ม',
      location: typeof location === 'string' && location.trim() ? location.trim() : 'ประเทศไทย',
      contact: typeof contact === 'string' && contact.trim() ? contact.trim() : 'ติดต่อผ่านระบบ Ovispro',
      breedFocus:
        typeof breedFocus === 'string' && breedFocus.trim()
          ? breedFocus.trim()
          : 'Merino · Hampshire · Dorset',
      isSeedFarm: false,
      updatedAt: regTimestamp,
    };

    const newFarmRecord: StoredFarmRecord = {
      profile: newProfile,
      passwordSalt: salt,
      passwordHash: hash,
      pens: DEFAULT_PENS_TEMPLATE.map(p => ({ ...p, sheepCount: 0 })),
      sheepList: [],
      ingredients: DEFAULT_INGREDIENTS_TEMPLATE.map(i => ({ ...i })),
      rations: DEFAULT_RATIONS_TEMPLATE.map(r => ({ ...r })),
      logs: [],
      matches: [],
      updatedAt: regTimestamp,
    };
    db.farms[farmId] = newFarmRecord;
    saveDatabase(db);
    knownDiskMtime = lastKnownDbMtimeMs;
    broadcastPublicOverviewUpdate(
      db,
      'farm_registered',
      extractOriginClientId(req),
      newProfile.farmName
    );
    broadcastOwnerMasterUpdate(db);
    scheduleCentralCloudPush();

    const token = signSessionToken(farmId);
    res.setHeader(
      'Set-Cookie',
      `ovispro_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=604800`
    );
    res.status(201).json({
      token,
      profile: newProfile,
      workspace: buildFarmWorkspacePayload(newFarmRecord),
    });
  });

  app.post('/api/farm/restore-session', (req: Request, res: Response) => {
    const { farmId, workspace } = req.body || {};
    if (
      typeof farmId !== 'string' ||
      !farmId.startsWith('farm-') ||
      SEED_FARMS.some(s => s.profile.farmId === farmId) ||
      !workspace ||
      typeof workspace !== 'object' ||
      !workspace.profile ||
      workspace.profile.farmId !== farmId
    ) {
      res.status(400).json({ error: 'ข้อมูลสำรองฟาร์มไม่ถูกต้องสำหรับกู้คืนเซสชัน' });
      return;
    }

    const rawUsername = String(workspace.profile.username || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const rawFarmName = String(workspace.profile.farmName || '').trim();
    if (rawUsername.length < 3 || rawFarmName.length < 2) {
      res.status(400).json({ error: 'ชื่อบัญชีหรือชื่อฟาร์มในข้อมูลสำรองไม่สมบูรณ์' });
      return;
    }

    const db = loadDatabase();
    if (db.farms[farmId]) {
      res.status(409).json({ error: 'ฟาร์มนี้มีอยู่ในระบบแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านเดิม' });
      return;
    }
    const usernameTaken = Object.values(db.farms).some(
      f => f.profile.username.toLowerCase() === rawUsername
    );
    if (usernameTaken) {
      res.status(409).json({ error: 'ชื่อบัญชีฟาร์มนี้มีผู้ใช้งานอยู่แล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านเดิม' });
      return;
    }

    const { salt, hash } = hashPassword(crypto.randomBytes(24).toString('hex'));
    const restoredRecord: StoredFarmRecord = {
      profile: {
        farmId,
        username: rawUsername,
        farmName: rawFarmName,
        ownerName:
          typeof workspace.profile.ownerName === 'string' && workspace.profile.ownerName.trim()
            ? workspace.profile.ownerName.trim()
            : 'เจ้าของฟาร์ม',
        location:
          typeof workspace.profile.location === 'string' && workspace.profile.location.trim()
            ? workspace.profile.location.trim()
            : 'ประเทศไทย',
        contact:
          typeof workspace.profile.contact === 'string' && workspace.profile.contact.trim()
            ? workspace.profile.contact.trim()
            : 'ติดต่อผ่านระบบ Ovispro',
        breedFocus:
          typeof workspace.profile.breedFocus === 'string' && workspace.profile.breedFocus.trim()
            ? workspace.profile.breedFocus.trim()
            : 'Merino · Hampshire · Dorset',
        isSeedFarm: false,
        googleSheetConfig: workspace.profile.googleSheetConfig,
      },
      passwordSalt: salt,
      passwordHash: hash,
      pens: DEFAULT_PENS_TEMPLATE.map(p => ({ ...p, sheepCount: 0 })),
      sheepList: [],
      ingredients: DEFAULT_INGREDIENTS_TEMPLATE.map(i => ({ ...i })),
      rations: DEFAULT_RATIONS_TEMPLATE.map(r => ({ ...r })),
      logs: [],
      matches: [],
    };
    applyFarmWorkspacePatch(restoredRecord, workspace as Record<string, unknown>);
    db.farms[farmId] = restoredRecord;
    saveDatabase(db);
    knownDiskMtime = lastKnownDbMtimeMs;

    const originClientId = extractOriginClientId(req);
    broadcastPublicOverviewUpdate(db, 'farm_registered', originClientId, restoredRecord.profile.farmName);
    broadcastOwnerMasterUpdate(db);
    scheduleCentralCloudPush();

    const token = signSessionToken(farmId);
    res.setHeader(
      'Set-Cookie',
      `ovispro_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=604800`
    );
    res.status(201).json({
      token,
      workspace: buildFarmWorkspacePayload(restoredRecord),
    });
  });

  app.get('/api/auth/me', requireFarmAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDatabase();
    const farm = db.farms[req.farmId!];
    res.json({ profile: farm.profile });
  });

  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    res.setHeader(
      'Set-Cookie',
      'ovispro_session=; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=0'
    );
    res.json({ ok: true });
  });

  // =========================================================================
  // 3. STRICTLY ISOLATED PRIVATE FARM WORKSPACE API
  // =========================================================================
  app.get('/api/farm/data', requireFarmAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDatabase();
    const farm = db.farms[req.farmId!];
    const pens = recomputePensWithCounts(farm.pens, farm.sheepList);
    res.json({
      profile: farm.profile,
      pens,
      sheepList: farm.sheepList,
      ingredients: farm.ingredients,
      rations: farm.rations,
      logs: farm.logs,
      matches: farm.matches || [],
    });
  });

  app.put('/api/farm/data', requireFarmAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDatabase();
    const farm = db.farms[req.farmId!];
    const body = (req.body || {}) as Record<string, unknown>;

    applyFarmWorkspacePatch(farm, body);

    saveDatabase(db);
    knownDiskMtime = lastKnownDbMtimeMs;
    const originClientId = extractOriginClientId(req);
    broadcastPublicOverviewUpdate(db, 'herd_updated', originClientId, farm.profile.farmName);
    broadcastFarmWorkspaceUpdate(farm, originClientId);
    broadcastOwnerMasterUpdate(db);
    scheduleCentralCloudPush();

    res.json({
      ok: true,
      profile: farm.profile,
      pens: farm.pens,
    });
  });

  app.post('/api/farm/sheets-sync', requireFarmAuth, async (req: AuthedRequest, res: Response) => {
    const db = loadDatabase();
    const farm = db.farms[req.farmId!];
    const { sheetUrl, appsScriptWebhookUrl } = req.body || {};

    if (typeof appsScriptWebhookUrl !== 'string' || !appsScriptWebhookUrl.trim()) {
      res.status(400).json({ error: 'กรุณากรอก Google Apps Script Web App URL ก่อนซิงค์' });
      return;
    }

    let parsedWebhook: URL;
    try {
      parsedWebhook = new URL(appsScriptWebhookUrl.trim());
    } catch {
      res.status(400).json({ error: 'รูปแบบ Apps Script Web App URL ไม่ถูกต้อง' });
      return;
    }

    const isAllowedGoogleScriptHost =
      parsedWebhook.protocol === 'https:' &&
      ((parsedWebhook.hostname === 'script.google.com' &&
        parsedWebhook.pathname.startsWith('/macros/s/')) ||
        parsedWebhook.hostname === 'script.googleusercontent.com');

    if (!isAllowedGoogleScriptHost) {
      res.status(400).json({
        error: 'อนุญาตเฉพาะ URL ของ Google Apps Script Web App (https://script.google.com/macros/s/...) เท่านั้น',
      });
      return;
    }

    let cleanSheetUrl = farm.profile.googleSheetConfig?.sheetUrl || '';
    if (typeof sheetUrl === 'string') {
      const trimmedSheet = sheetUrl.trim();
      if (trimmedSheet && !trimmedSheet.startsWith('https://docs.google.com/spreadsheets/')) {
        res.status(400).json({
          error: 'ลิงก์ Google Sheet ต้องขึ้นต้นด้วย https://docs.google.com/spreadsheets/',
        });
        return;
      }
      cleanSheetUrl = trimmedSheet;
    }

    const tabs = buildFarmSheetTabs({
      profile: farm.profile,
      sheepList: farm.sheepList,
      ingredients: farm.ingredients,
      rations: farm.rations,
      logs: farm.logs,
    });

    try {
      const sheetApiKey = getSheetApiKey();
      const syncResponse = await fetch(parsedWebhook.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(sheetApiKey ? { apiKey: sheetApiKey } : {}),
          farmId: farm.profile.farmId,
          farmName: farm.profile.farmName,
          syncedAt: new Date().toISOString(),
          tabs,
        }),
        redirect: 'follow',
      });

      if (!syncResponse.ok) {
        res.status(502).json({
          error: `Google Apps Script ตอบกลับสถานะ ${syncResponse.status} กรุณาตรวจสอบสิทธิ์ Deploy (Anyone)`,
        });
        return;
      }

      const lastSyncedAt = new Date().toISOString();
      const freshDb = loadDatabase();
      const freshFarm = freshDb.farms[req.farmId!];
      if (!freshFarm) {
        res.status(404).json({ error: 'ไม่พบบัญชีฟาร์มในระบบ' });
        return;
      }
      freshFarm.profile.googleSheetConfig = {
        sheetUrl: cleanSheetUrl,
        appsScriptWebhookUrl: parsedWebhook.toString(),
        lastSyncedAt,
      };
      saveDatabase(freshDb);
      broadcastFarmWorkspaceUpdate(freshFarm, extractOriginClientId(req));
      broadcastOwnerMasterUpdate(freshDb);

      res.json({
        ok: true,
        lastSyncedAt,
        syncedTabs: tabs.length,
        profile: freshFarm.profile,
      });
    } catch {
      res.status(502).json({
        error: 'ไม่สามารถเชื่อมต่อ Google Apps Script ได้ในขณะนี้ กรุณาตรวจสอบ URL และสิทธิ์การเข้าถึง',
      });
    }
  });

  app.post('/api/farm/reset', requireFarmAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDatabase();
    const farm = db.farms[req.farmId!];
    const seedMatch = SEED_FARMS.find(s => s.profile.farmId === req.farmId);

    if (seedMatch) {
      farm.pens = seedMatch.pens.map(p => ({ ...p }));
      farm.sheepList = seedMatch.sheepList.map(s => ({ ...s }));
      farm.ingredients = seedMatch.ingredients.map(i => ({ ...i }));
      farm.rations = seedMatch.rations.map(r => ({ ...r }));
      farm.logs = seedMatch.logs.map(l => ({ ...l }));
    } else {
      farm.pens = DEFAULT_PENS_TEMPLATE.map(p => ({ ...p, sheepCount: 0 }));
      farm.sheepList = [];
      farm.logs = [];
    }

    const resetTs = new Date().toISOString();
    farm.updatedAt = resetTs;
    farm.profile.updatedAt = resetTs;
    saveDatabase(db);
    knownDiskMtime = lastKnownDbMtimeMs;
    const originClientId = extractOriginClientId(req);
    broadcastPublicOverviewUpdate(db, 'farm_reset', originClientId, farm.profile.farmName);
    broadcastFarmWorkspaceUpdate(farm, originClientId);
    broadcastOwnerMasterUpdate(db);
    scheduleCentralCloudPush();

    res.json({
      profile: farm.profile,
      pens: recomputePensWithCounts(farm.pens, farm.sheepList),
      sheepList: farm.sheepList,
      ingredients: farm.ingredients,
      rations: farm.rations,
      logs: farm.logs,
      matches: farm.matches || [],
    });
  });

  // =========================================================================
  // 4. ONLYSHEEPS PUBLIC CROSS-FARM MATCHMAKING FEED
  // =========================================================================
  app.get('/api/onlysheeps/feed', (_req: Request, res: Response) => {
    const db = loadDatabase();
    res.json({ listings: db.onlysheepsListings });
  });

  app.post('/api/onlysheeps/listings', requireFarmAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDatabase();
    const farm = db.farms[req.farmId!];
    const body = req.body || {};

    if (!body.name || typeof body.name !== 'string') {
      res.status(400).json({ error: 'กรุณาระบุชื่อแกะสำหรับโปรไฟล์ Onlysheeps' });
      return;
    }

    const breed = typeof body.breed === 'string' ? body.breed : 'เมอริโน (Merino)';
    const micronNum = Number(body.woolMicron) || 19.2;

    const newListing: OnlysheepsListing = {
      id: body.id || `sheep-os-${Date.now()}`,
      listingId: `os-${farm.profile.farmId}-${Date.now()}`,
      ownerFarmId: farm.profile.farmId,
      publishedAt: new Date().toISOString().split('T')[0],
      earTag: (typeof body.earTag === 'string' && body.earTag.trim()) || `OS-${Date.now().toString().slice(-3)}`,
      name: body.name.trim(),
      breed,
      bloodPercentage: body.bloodPercentage || `${breed} สายเลือดแท้คัดเกรด 100%`,
      gender: body.gender === 'female' ? 'female' : 'male',
      birthDate: body.birthDate || '2024-09-14',
      ageMonths: Number(body.ageMonths) || 24,
      weightKg: Number(body.weightKg) || 72,
      currentAdgGrams: Number(body.currentAdgGrams) || (body.gender === 'female' ? 190 : 230),
      stage: body.gender === 'female' ? 'wool_maintenance' : 'wool_ram',
      bcs: Number(body.bcs) || 3.5,
      penId: 'partner',
      pen: 'ฟาร์มสมาชิก Onlysheeps',
      healthStatus: 'healthy',
      photoUrl: body.photoUrl || getBreedPhoto(breed),
      vaccineName: body.vaccineName || 'วัคซีนป้องกันโรคปากและเท้าเปื่อย (FMD) + โรคแท้งติดต่อ',
      vaccineLastDate: body.vaccineLastDate || new Date().toISOString().split('T')[0],
      dewormName: body.dewormName || 'Ivermectin (ไอเวอร์เมกติน 1%)',
      dewormLastDate: body.dewormLastDate || new Date().toISOString().split('T')[0],
      woolGrade: body.woolGrade || (micronNum <= 19 ? `ซูเปอร์ไฟน์ (${micronNum} µm)` : `ไฟน์-มีเดียม (${micronNum} µm)`),
      woolMicron: micronNum,
      woolStapleLengthCm: Number(body.woolStapleLengthCm) || 10.6,
      fleeceYieldKg: Number(body.fleeceYieldKg) || 6.2,
      lastShearingDate: body.lastShearingDate || '2026-03-15',
      woolColor: body.woolColor || 'ขาวนวลธรรมชาติ',
      crimpPerInch: Number(body.crimpPerInch) || 12,
      fleeceQualityRating: 5,
      isPartnerFarm: true,
      farmName: farm.profile.farmName,
      farmLocation: farm.profile.location,
      ownerContact: (typeof body.ownerContact === 'string' && body.ownerContact.trim()) || farm.profile.contact,
      lambingRatePct:
        (typeof body.lambingRatePct === 'string' && body.lambingRatePct.trim()) ||
        'ความสมบูรณ์พันธุ์สูง พร้อมผสม',
      breedingHighlight:
        (typeof body.breedingHighlight === 'string' && body.breedingHighlight.trim()) ||
        'คัดเกรดพ่อแม่พันธุ์คุณภาพ ถ่ายทอดเส้นใยขนและโครงสร้างแข็งแรง',
      romanticBio:
        (typeof body.romanticBio === 'string' && body.romanticBio.trim()) ||
        `น้อง${body.name.trim()} จาก${farm.profile.farmName} พร้อมส่งหัวใจสีชมพูและจุ้บหวานๆ ให้คู่แท้ทุกฟาร์ม 🐑😘💘`,
    };

    db.onlysheepsListings = [newListing, ...db.onlysheepsListings];
    db.deletedListingIds = (db.deletedListingIds || []).filter(id => id !== newListing.listingId);
    saveDatabase(db);
    knownDiskMtime = lastKnownDbMtimeMs;

    const originClientId = extractOriginClientId(req);
    broadcastPublicEvent({
      type: 'onlysheeps:listing_created',
      revision: nextRevision(),
      originClientId,
      listing: newListing,
    });
    broadcastPublicOverviewUpdate(db, 'onlysheeps_changed', originClientId, farm.profile.farmName);
    broadcastOwnerMasterUpdate(db);
    scheduleCentralCloudPush();

    res.status(201).json({ listing: newListing });
  });

  app.delete('/api/onlysheeps/listings/:listingId', requireFarmAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDatabase();
    const { listingId } = req.params;
    const target = db.onlysheepsListings.find(l => l.listingId === listingId);
    if (!target) {
      res.status(404).json({ error: 'ไม่พบโปรไฟล์แกะรายการนี้บน Onlysheeps' });
      return;
    }
    if (target.ownerFarmId !== req.farmId) {
      res.status(403).json({ error: 'ไม่อนุญาตให้ลบโปรไฟล์แกะของฟาร์มอื่น' });
      return;
    }
    db.onlysheepsListings = db.onlysheepsListings.filter(l => l.listingId !== listingId);
    db.deletedListingIds = Array.from(new Set([...(db.deletedListingIds || []), listingId])).slice(-400);
    saveDatabase(db);
    knownDiskMtime = lastKnownDbMtimeMs;

    const originClientId = extractOriginClientId(req);
    broadcastPublicEvent({
      type: 'onlysheeps:listing_deleted',
      revision: nextRevision(),
      originClientId,
      listingId,
      listingName: target.name,
      farmName: target.farmName,
    });
    broadcastPublicOverviewUpdate(db, 'onlysheeps_changed', originClientId, target.farmName);
    broadcastOwnerMasterUpdate(db);
    scheduleCentralCloudPush();

    res.json({ ok: true });
  });

  // =========================================================================
  // 5. LIVE REAL-TIME QR SHARE SNAPSHOTS (ALWAYS UP TO DATE)
  // =========================================================================
  const buildLiveShareReportForFarm = (
    shareId: string,
    farm: StoredFarmRecord,
    updatedAt: string
  ): LiveShareReport => ({
    shareId,
    scope: 'farm',
    updatedAt,
    farmName: farm.profile.farmName,
    ownerName: farm.profile.ownerName,
    location: farm.profile.location,
    totalSheep: farm.sheepList.length,
    totalIngredients: farm.ingredients.length,
    totalRations: farm.rations.length,
    totalLogs: farm.logs.length,
    pens: recomputePensWithCounts(farm.pens, farm.sheepList),
    rations: farm.rations,
    ingredients: farm.ingredients,
    recentLogs: farm.logs.slice(0, 15),
  });

  app.post('/api/share/snapshot', (req: Request, res: Response) => {
    const db = loadDatabase();
    db.shareSnapshots = db.shareSnapshots || {};
    const token = extractToken(req, 'ovispro_session');
    const farmId = verifySessionToken(token);
    const nowIso = new Date().toISOString();

    if (farmId && db.farms[farmId]) {
      const farm = db.farms[farmId];
      const body = req.body || {};

      // Flush latest client edits immediately so QR report always matches current state
      if (Array.isArray(body.sheepList)) {
        farm.sheepList = body.sheepList;
        farm.pens = recomputePensWithCounts(farm.pens, farm.sheepList);
      }
      if (Array.isArray(body.ingredients)) {
        farm.ingredients = body.ingredients;
      }
      if (Array.isArray(body.rations)) {
        farm.rations = body.rations;
      }
      if (Array.isArray(body.logs)) {
        farm.logs = body.logs;
      }

      const shareId = `live-${farmId}`;
      db.shareSnapshots[shareId] = {
        shareId,
        scope: 'farm',
        farmId,
        updatedAt: nowIso,
      };
      saveDatabase(db);
      const originClientId = extractOriginClientId(req);
      broadcastPublicOverviewUpdate(db, 'herd_updated', originClientId, farm.profile.farmName);
      broadcastFarmWorkspaceUpdate(farm, originClientId);
      broadcastOwnerMasterUpdate(db);

      res.json({
        shareId,
        updatedAt: nowIso,
        report: buildLiveShareReportForFarm(shareId, farm, nowIso),
      });
      return;
    }

    const hubShareId = 'live-public-hub';
    db.shareSnapshots[hubShareId] = {
      shareId: hubShareId,
      scope: 'hub',
      updatedAt: nowIso,
    };
    saveDatabase(db);

    const farmValues = Object.values(db.farms);
    const overview: PublicPlatformOverview = {
      totalFarms: farmValues.length,
      totalNetworkSheep: farmValues.reduce((sum, f) => sum + f.sheepList.length, 0),
      onlysheepsCount: db.onlysheepsListings.length,
      farmDirectory: farmValues.map(f => ({
        farmId: f.profile.farmId,
        username: f.profile.username,
        farmName: f.profile.farmName,
        location: f.profile.location,
        breedFocus: f.profile.breedFocus,
        sheepCount: f.sheepList.length,
      })),
    };

    const report: LiveShareReport = {
      shareId: hubShareId,
      scope: 'hub',
      updatedAt: nowIso,
      farmName: 'Ovispro Multi-Farm Hub',
      ownerName: 'เครือข่ายฟาร์มแกะขนประเทศไทย',
      location: 'ประเทศไทย',
      totalSheep: overview.totalNetworkSheep,
      totalIngredients: 0,
      totalRations: 0,
      totalLogs: 0,
      pens: [],
      rations: [],
      ingredients: [],
      recentLogs: [],
      publicOverview: overview,
    };

    res.json({ shareId: hubShareId, updatedAt: nowIso, report });
  });

  app.get('/api/share/:shareId', (req: Request, res: Response) => {
    const db = loadDatabase();
    const { shareId } = req.params;
    const entry = db.shareSnapshots?.[shareId];
    const nowIso = new Date().toISOString();

    const resolvedFarmId =
      entry?.farmId || (shareId.startsWith('live-farm-') ? shareId.slice('live-'.length) : undefined);

    if (resolvedFarmId && db.farms[resolvedFarmId]) {
      const farm = db.farms[resolvedFarmId];
      res.json({
        report: buildLiveShareReportForFarm(shareId, farm, entry?.updatedAt || nowIso),
      });
      return;
    }

    if (shareId === 'live-public-hub' || entry?.scope === 'hub') {
      const farmValues = Object.values(db.farms);
      const overview: PublicPlatformOverview = {
        totalFarms: farmValues.length,
        totalNetworkSheep: farmValues.reduce((sum, f) => sum + f.sheepList.length, 0),
        onlysheepsCount: db.onlysheepsListings.length,
        farmDirectory: farmValues.map(f => ({
          farmId: f.profile.farmId,
          username: f.profile.username,
          farmName: f.profile.farmName,
          location: f.profile.location,
          breedFocus: f.profile.breedFocus,
          sheepCount: f.sheepList.length,
        })),
      };
      const report: LiveShareReport = {
        shareId,
        scope: 'hub',
        updatedAt: entry?.updatedAt || nowIso,
        farmName: 'Ovispro Multi-Farm Hub',
        ownerName: 'เครือข่ายฟาร์มแกะขนประเทศไทย',
        location: 'ประเทศไทย',
        totalSheep: overview.totalNetworkSheep,
        totalIngredients: 0,
        totalRations: 0,
        totalLogs: 0,
        pens: [],
        rations: [],
        ingredients: [],
        recentLogs: [],
        publicOverview: overview,
      };
      res.json({ report });
      return;
    }

    res.status(404).json({ error: 'ไม่พบลิงก์รายงานที่แชร์นี้' });
  });

  // =========================================================================
  // 6. APP-OWNER-ONLY MASTER GOOGLE SHEET BACKEND (STRICTLY RESTRICTED)
  // =========================================================================
  app.post('/api/owner/login', (req: Request, res: Response) => {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'กรุณากรอกอีเมลเจ้าของแอปและรหัสผ่าน' });
      return;
    }

    const emailMatch = email.trim().toLowerCase() === APP_OWNER_EMAIL;
    const pwdInputBuf = Buffer.from(password);
    const pwdExpectedBuf = Buffer.from(APP_OWNER_PASSWORD);
    const pwdMatch =
      pwdInputBuf.length === pwdExpectedBuf.length &&
      crypto.timingSafeEqual(pwdInputBuf, pwdExpectedBuf);

    if (!emailMatch || !pwdMatch) {
      res.status(403).json({
        error: 'สิทธิ์ถูกจำกัดเฉพาะเจ้าของแอปพลิเคชันเท่านั้น อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      });
      return;
    }

    const token = signOwnerToken(APP_OWNER_EMAIL);
    res.setHeader(
      'Set-Cookie',
      `ovispro_owner_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=604800`
    );
    res.json({
      token,
      ownerEmail: APP_OWNER_EMAIL,
    });
  });

  app.post('/api/owner/logout', (_req: Request, res: Response) => {
    res.setHeader(
      'Set-Cookie',
      'ovispro_owner_session=; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=0'
    );
    res.json({ ok: true });
  });

  app.get('/api/owner/master-sheet', requireAppOwner, (_req: AuthedRequest, res: Response) => {
    const db = loadDatabase();
    res.json(buildOwnerMasterResponse(db));
  });

  app.put('/api/owner/sheet-config', requireAppOwner, async (req: AuthedRequest, res: Response) => {
    const db = loadDatabase();
    const { sheetUrl, appsScriptWebhookUrl } = req.body || {};

    const cleanSheet = typeof sheetUrl === 'string' ? sheetUrl.trim() : '';
    const cleanWebhook = typeof appsScriptWebhookUrl === 'string' ? appsScriptWebhookUrl.trim() : '';

    if (cleanSheet && !cleanSheet.startsWith('https://docs.google.com/spreadsheets/')) {
      res.status(400).json({
        error: 'ลิงก์ Google Sheet ต้องขึ้นต้นด้วย https://docs.google.com/spreadsheets/',
      });
      return;
    }

    if (cleanWebhook && !parseAllowedGoogleScriptUrl(cleanWebhook)) {
      res.status(400).json({
        error: 'อนุญาตเฉพาะ Google Apps Script Web App URL (https://script.google.com/macros/s/...) เท่านั้น',
      });
      return;
    }

    db.ownerConfig = {
      ...db.ownerConfig,
      sheetUrl: cleanSheet,
      appsScriptWebhookUrl: cleanWebhook,
    };
    saveDatabase(db);
    knownDiskMtime = lastKnownDbMtimeMs;
    if (cleanWebhook) {
      await pullAndMergeFromCentralCloud(cleanWebhook);
      scheduleCentralCloudPush();
    }
    const latest = loadDatabase();
    broadcastOwnerMasterUpdate(latest);
    res.json({ ok: true, ownerSheetConfig: latest.ownerConfig });
  });

  app.post('/api/owner/sheets-sync', requireAppOwner, async (req: AuthedRequest, res: Response) => {
    const db = loadDatabase();
    const { sheetUrl, appsScriptWebhookUrl } = req.body || {};
    const targetWebhook =
      typeof appsScriptWebhookUrl === 'string' && appsScriptWebhookUrl.trim()
        ? appsScriptWebhookUrl.trim()
        : db.ownerConfig?.appsScriptWebhookUrl || '';

    if (!targetWebhook) {
      res.status(400).json({ error: 'กรุณากรอก Google Apps Script Web App URL ของเจ้าของแอปก่อนซิงค์' });
      return;
    }

    const parsedWebhook = parseAllowedGoogleScriptUrl(targetWebhook);
    if (!parsedWebhook) {
      res.status(400).json({
        error: 'อนุญาตเฉพาะ URL ของ Google Apps Script Web App (https://script.google.com/macros/s/...) เท่านั้น',
      });
      return;
    }

    const cleanSheetUrl =
      typeof sheetUrl === 'string' ? sheetUrl.trim() : db.ownerConfig?.sheetUrl || '';
    if (cleanSheetUrl && !cleanSheetUrl.startsWith('https://docs.google.com/spreadsheets/')) {
      res.status(400).json({
        error: 'ลิงก์ Google Sheet ต้องขึ้นต้นด้วย https://docs.google.com/spreadsheets/',
      });
      return;
    }

    // 2-Way Pull + Merge before pushing so farms/sheep from ais-pre & ais-dev combine seamlessly
    await pullAndMergeFromCentralCloud(parsedWebhook.toString());
    const pushRes = await pushToCentralCloud(parsedWebhook.toString());

    if (!pushRes.ok) {
      res.status(502).json({
        error: pushRes.error || 'ไม่สามารถเชื่อมต่อ Google Apps Script ได้ กรุณาตรวจสอบ URL และสิทธิ์ Deploy (Anyone)',
      });
      return;
    }

    const lastSyncedAt = pushRes.lastSyncedAt || new Date().toISOString();
    const freshDb = loadDatabase();
    freshDb.ownerConfig = {
      sheetUrl: cleanSheetUrl,
      appsScriptWebhookUrl: parsedWebhook.toString(),
      lastSyncedAt,
    };
    saveDatabase(freshDb);
    knownDiskMtime = lastKnownDbMtimeMs;
    broadcastOwnerMasterUpdate(freshDb);

    res.json({
      ok: true,
      lastSyncedAt,
      syncedTabs: pushRes.syncedTabs || 6,
      ownerSheetConfig: freshDb.ownerConfig,
    });
  });

  // =========================================================================
  // 5. VITE DEV MIDDLEWARE OR PRODUCTION STATIC ASSETS
  // =========================================================================
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Ovispro Multi-Farm Hub + WebSocket server running at http://0.0.0.0:${PORT}`);
    // Non-blocking startup pull from Central Cloud Sync if configured
    void pullAndMergeFromCentralCloud();
  });
}

startServer().catch(err => {
  console.error('Failed to start Ovispro server:', err);
  process.exit(1);
});
