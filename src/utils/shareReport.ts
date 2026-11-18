/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FarmLog, FormulatedRation, LiveShareReport, Pen } from '../types/sheep';

export const DEFAULT_SHARED_APP_URL =
  'https://ais-pre-qrjdvrntkqves6dcxlicos-821895887617.asia-northeast1.run.app';

/**
 * Ensures QR codes and share links never point to the developer-only `ais-dev-*` preview URL,
 * automatically mapping it to the shareable `ais-pre-*` public app origin.
 */
export function resolvePublicShareOrigin(
  currentOrigin?: string,
  fallbackUrl: string = DEFAULT_SHARED_APP_URL
): string {
  if (!currentOrigin) return fallbackUrl;
  if (currentOrigin.includes('://ais-dev-')) {
    return currentOrigin.replace('://ais-dev-', '://ais-pre-');
  }
  return currentOrigin;
}

interface CompactSharePayloadV1 {
  v: 1;
  s: 'f' | 'h';
  id: string;
  u: string;
  fn: string;
  on: string;
  l: string;
  c: [number, number, number, number];
  p: Array<[string, string, number, number, number]>;
  r: Array<[string, number, number, number, number]>;
  g: Array<[string, string, string]>;
  ov?: [
    number,
    number,
    number,
    Array<[string, string, number]>,
  ];
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(b64u: string): Uint8Array {
  const b64 = b64u.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const binary = atob(b64 + pad);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

async function compressDeflateRaw(bytes: Uint8Array): Promise<Uint8Array | null> {
  if (typeof CompressionStream === 'undefined') return null;
  try {
    const stream = new Blob([new Uint8Array(bytes)]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    const buf = await new Response(stream).arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

async function decompressDeflateRaw(bytes: Uint8Array): Promise<Uint8Array | null> {
  if (typeof DecompressionStream === 'undefined') return null;
  try {
    const stream = new Blob([new Uint8Array(bytes)]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    const buf = await new Response(stream).arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

export async function encodeCompactSharePayload(report: LiveShareReport): Promise<string> {
  const compact: CompactSharePayloadV1 = {
    v: 1,
    s: report.scope === 'hub' ? 'h' : 'f',
    id: report.shareId,
    u: report.updatedAt,
    fn: report.farmName,
    on: report.ownerName,
    l: report.location,
    c: [report.totalSheep, report.totalIngredients, report.totalRations, report.totalLogs],
    p: (report.pens || []).slice(0, 6).map(pen => [
      pen.code,
      pen.code,
      pen.sheepCount,
      pen.averageWeightKg,
      pen.averageAdgGrams,
    ]),
    r: [],
    g: [],
  };

  if (report.publicOverview) {
    compact.ov = [
      report.publicOverview.totalFarms,
      report.publicOverview.totalNetworkSheep,
      report.publicOverview.onlysheepsCount,
      report.publicOverview.farmDirectory.slice(0, 8).map(d => [d.farmName, d.location, d.sheepCount]),
    ];
  }

  const rawBytes = new TextEncoder().encode(JSON.stringify(compact));
  const deflated = await compressDeflateRaw(rawBytes);
  if (deflated && deflated.length < rawBytes.length) {
    return `z.${bytesToBase64Url(deflated)}`;
  }
  return `u.${bytesToBase64Url(rawBytes)}`;
}

export async function decodeCompactSharePayload(encoded: string): Promise<LiveShareReport | null> {
  if (!encoded) return null;
  try {
    let jsonStr = '';
    if (encoded.startsWith('z.')) {
      const bytes = base64UrlToBytes(encoded.slice(2));
      const decompressed = await decompressDeflateRaw(bytes);
      if (!decompressed) return null;
      jsonStr = new TextDecoder().decode(decompressed);
    } else if (encoded.startsWith('u.')) {
      const bytes = base64UrlToBytes(encoded.slice(2));
      jsonStr = new TextDecoder().decode(bytes);
    } else {
      return null;
    }

    const compact = JSON.parse(jsonStr) as CompactSharePayloadV1;
    if (!compact || compact.v !== 1) return null;

    const pens: Pen[] = (compact.p || []).map((p, idx) => ({
      id: `pen-${idx}`,
      code: p[0],
      name: p[1],
      ageRange: '',
      sheepCount: p[2],
      averageWeightKg: p[3],
      dailyFeedKg: 0,
      averageAdgGrams: p[4],
      purpose: '',
    }));

    const rations: FormulatedRation[] = (compact.r || []).map((r, idx) => ({
      id: `ration-${idx}`,
      name: r[0],
      description: '',
      targetStage: 'wool_maintenance',
      recommendedForWeight: 60,
      items: [],
      totalAsFedKg: r[3],
      totalDmKg: 0,
      calculatedCpPercent: r[1],
      calculatedTdnPercent: r[2],
      calculatedCaPercent: 0,
      calculatedPPercent: 0,
      roughagePercent: 50,
      concentratePercent: 50,
      costPerKgMix: 0,
      costPerHeadPerDay: r[4],
      createdAt: compact.u,
    }));

    const recentLogs: FarmLog[] = (compact.g || []).map((lg, idx) => ({
      id: `log-${idx}`,
      date: lg[0],
      type: 'weight',
      title: lg[1],
      recordedBy: lg[2],
    }));

    return {
      shareId: compact.id,
      scope: compact.s === 'h' ? 'hub' : 'farm',
      updatedAt: compact.u,
      farmName: compact.fn,
      ownerName: compact.on,
      location: compact.l,
      totalSheep: compact.c?.[0] ?? 0,
      totalIngredients: compact.c?.[1] ?? 0,
      totalRations: compact.c?.[2] ?? 0,
      totalLogs: compact.c?.[3] ?? 0,
      pens,
      rations,
      ingredients: [],
      recentLogs,
      publicOverview: compact.ov
        ? {
            totalFarms: compact.ov[0],
            totalNetworkSheep: compact.ov[1],
            onlysheepsCount: compact.ov[2],
            farmDirectory: (compact.ov[3] || []).map((d, idx) => ({
              farmId: `farm-${idx}`,
              username: '',
              farmName: d[0],
              location: d[1],
              breedFocus: '',
              sheepCount: d[2],
            })),
          }
        : undefined,
    };
  } catch {
    return null;
  }
}

export function extractSharePayloadFromUrlHash(hashStr: string, searchStr?: string): string | null {
  if (hashStr && hashStr.startsWith('#')) {
    const params = new URLSearchParams(hashStr.slice(1));
    const fromHash = params.get('p');
    if (fromHash) return fromHash;
  }
  if (searchStr) {
    const params = new URLSearchParams(searchStr);
    const fromSearch = params.get('p');
    if (fromSearch) return fromSearch;
  }
  return null;
}
