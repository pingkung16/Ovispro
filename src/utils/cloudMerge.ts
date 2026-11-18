/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  FarmGoogleSheetConfig,
  FarmLog,
  FarmProfile,
  FeedIngredient,
  FormulatedRation,
  OnlysheepsListing,
  OnlysheepsMatchRecord,
  Pen,
  Sheep,
  WebFormSubmission,
} from '../types/sheep';

export interface CloudSyncFarmRecord {
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

export interface CloudShareSnapshotIndex {
  shareId: string;
  scope: 'farm' | 'hub';
  farmId?: string;
  updatedAt: string;
}

export interface CloudSyncDatabaseSnapshot {
  version: number;
  globalRevision?: number;
  updatedAt?: string;
  farms: Record<string, CloudSyncFarmRecord>;
  onlysheepsListings: OnlysheepsListing[];
  deletedListingIds?: string[];
  shareSnapshots?: Record<string, CloudShareSnapshotIndex>;
  ownerConfig?: FarmGoogleSheetConfig;
  webFormRecords?: WebFormSubmission[];
}

export interface MergeCloudDatabasesResult {
  merged: CloudSyncDatabaseSnapshot;
  changed: boolean;
  publicOverviewChanged: boolean;
  onlysheepsChanged: boolean;
  webFormsChanged: boolean;
  ownerChanged: boolean;
  changedFarmIds: string[];
  addedFarmNames: string[];
}

function parseEpochMs(iso?: string): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

function getFarmEpochMs(farm: CloudSyncFarmRecord): number {
  return parseEpochMs(farm.updatedAt || farm.profile?.updatedAt);
}

function getFarmRichnessScore(farm: CloudSyncFarmRecord): number {
  return (
    (farm.sheepList?.length || 0) * 10 +
    (farm.pens?.length || 0) * 3 +
    (farm.logs?.length || 0) * 2 +
    (farm.rations?.length || 0) * 2 +
    (farm.ingredients?.length || 0) +
    (farm.matches?.length || 0)
  );
}

function mergeSheetConfig(
  localCfg?: FarmGoogleSheetConfig,
  remoteCfg?: FarmGoogleSheetConfig
): FarmGoogleSheetConfig | undefined {
  if (!localCfg && !remoteCfg) return undefined;
  if (!localCfg) return { ...remoteCfg };
  if (!remoteCfg) return { ...localCfg };

  const localSyncTs = parseEpochMs(localCfg.lastSyncedAt);
  const remoteSyncTs = parseEpochMs(remoteCfg.lastSyncedAt);
  const preferRemote = remoteSyncTs > localSyncTs;

  return {
    sheetUrl: (preferRemote ? remoteCfg.sheetUrl : localCfg.sheetUrl) || localCfg.sheetUrl || remoteCfg.sheetUrl,
    appsScriptWebhookUrl:
      (preferRemote ? remoteCfg.appsScriptWebhookUrl : localCfg.appsScriptWebhookUrl) ||
      localCfg.appsScriptWebhookUrl ||
      remoteCfg.appsScriptWebhookUrl,
    lastSyncedAt: preferRemote ? remoteCfg.lastSyncedAt : localCfg.lastSyncedAt || remoteCfg.lastSyncedAt,
  };
}

function haveFarmContentsDiffered(a: CloudSyncFarmRecord, b: CloudSyncFarmRecord): boolean {
  if (a.profile.farmName !== b.profile.farmName) return true;
  if (a.profile.ownerName !== b.profile.ownerName) return true;
  if (a.profile.location !== b.profile.location) return true;
  if ((a.sheepList?.length || 0) !== (b.sheepList?.length || 0)) return true;
  if ((a.pens?.length || 0) !== (b.pens?.length || 0)) return true;
  if ((a.ingredients?.length || 0) !== (b.ingredients?.length || 0)) return true;
  if ((a.rations?.length || 0) !== (b.rations?.length || 0)) return true;
  if ((a.logs?.length || 0) !== (b.logs?.length || 0)) return true;
  if ((a.matches?.length || 0) !== (b.matches?.length || 0)) return true;
  if (getFarmEpochMs(a) !== getFarmEpochMs(b)) return true;
  return JSON.stringify(a) !== JSON.stringify(b);
}

export function mergeFarmRecords(
  localFarm: CloudSyncFarmRecord,
  remoteFarm: CloudSyncFarmRecord
): { record: CloudSyncFarmRecord; pickedRemote: boolean } {
  const localTs = getFarmEpochMs(localFarm);
  const remoteTs = getFarmEpochMs(remoteFarm);

  let pickedRemote = false;
  if (remoteTs > localTs) {
    pickedRemote = true;
  } else if (remoteTs === localTs) {
    const localScore = getFarmRichnessScore(localFarm);
    const remoteScore = getFarmRichnessScore(remoteFarm);
    if (remoteScore > localScore) {
      pickedRemote = true;
    }
  }

  const winner = pickedRemote ? remoteFarm : localFarm;
  const mergedConfig = mergeSheetConfig(
    localFarm.profile?.googleSheetConfig,
    remoteFarm.profile?.googleSheetConfig
  );

  const record: CloudSyncFarmRecord = {
    ...winner,
    profile: {
      ...winner.profile,
      ...(mergedConfig ? { googleSheetConfig: mergedConfig } : {}),
      updatedAt: winner.updatedAt || winner.profile.updatedAt,
    },
    pens: winner.pens || [],
    sheepList: winner.sheepList || [],
    ingredients: winner.ingredients || [],
    rations: winner.rations || [],
    logs: winner.logs || [],
    matches: winner.matches || [],
  };

  return { record, pickedRemote };
}

export function mergeCloudDatabases(
  localState: CloudSyncDatabaseSnapshot,
  remoteState: CloudSyncDatabaseSnapshot | null | undefined
): MergeCloudDatabasesResult {
  if (!remoteState || typeof remoteState !== 'object' || !remoteState.farms) {
    return {
      merged: localState,
      changed: false,
      publicOverviewChanged: false,
      onlysheepsChanged: false,
      webFormsChanged: false,
      ownerChanged: false,
      changedFarmIds: [],
      addedFarmNames: [],
    };
  }

  const localFarms = localState.farms || {};
  const remoteFarms = remoteState.farms || {};
  const allFarmIds = new Set([...Object.keys(localFarms), ...Object.keys(remoteFarms)]);

  const mergedFarms: Record<string, CloudSyncFarmRecord> = {};
  const changedFarmIds: string[] = [];
  const addedFarmNames: string[] = [];
  let publicOverviewChanged = false;

  for (const farmId of allFarmIds) {
    const localFarm = localFarms[farmId];
    const remoteFarm = remoteFarms[farmId];

    if (localFarm && !remoteFarm) {
      mergedFarms[farmId] = localFarm;
    } else if (!localFarm && remoteFarm) {
      mergedFarms[farmId] = remoteFarm;
      changedFarmIds.push(farmId);
      addedFarmNames.push(remoteFarm.profile.farmName);
      publicOverviewChanged = true;
    } else if (localFarm && remoteFarm) {
      const { record, pickedRemote } = mergeFarmRecords(localFarm, remoteFarm);
      mergedFarms[farmId] = record;
      if (pickedRemote && haveFarmContentsDiffered(localFarm, record)) {
        changedFarmIds.push(farmId);
        if (
          (localFarm.sheepList?.length || 0) !== (record.sheepList?.length || 0) ||
          localFarm.profile.farmName !== record.profile.farmName
        ) {
          publicOverviewChanged = true;
        }
      }
    }
  }

  // Tombstone-aware union of Onlysheeps listings
  const tombstoneSet = new Set<string>([
    ...(localState.deletedListingIds || []),
    ...(remoteState.deletedListingIds || []),
  ]);
  const deletedListingIds = Array.from(tombstoneSet).slice(-400);

  const listingMap = new Map<string, OnlysheepsListing>();
  for (const item of remoteState.onlysheepsListings || []) {
    if (item?.listingId && !tombstoneSet.has(item.listingId)) {
      listingMap.set(item.listingId, item);
    }
  }
  for (const item of localState.onlysheepsListings || []) {
    if (item?.listingId && !tombstoneSet.has(item.listingId)) {
      // Local latest state preserves order preference if present in both
      if (!listingMap.has(item.listingId)) {
        listingMap.set(item.listingId, item);
      } else {
        listingMap.set(item.listingId, item);
      }
    }
  }

  // Keep newest publishedAt / existing ordering cleanly without duplicates
  const seenIds = new Set<string>();
  const mergedListings: OnlysheepsListing[] = [];
  for (const item of localState.onlysheepsListings || []) {
    if (item?.listingId && !tombstoneSet.has(item.listingId) && !seenIds.has(item.listingId)) {
      seenIds.add(item.listingId);
      mergedListings.push(listingMap.get(item.listingId) || item);
    }
  }
  for (const item of remoteState.onlysheepsListings || []) {
    if (item?.listingId && !tombstoneSet.has(item.listingId) && !seenIds.has(item.listingId)) {
      seenIds.add(item.listingId);
      mergedListings.push(listingMap.get(item.listingId) || item);
    }
  }

  const localListingIds = (localState.onlysheepsListings || []).map(l => l.listingId);
  const mergedListingIds = mergedListings.map(l => l.listingId);
  const onlysheepsChanged =
    localListingIds.length !== mergedListingIds.length ||
    localListingIds.some((id, idx) => id !== mergedListingIds[idx]);

  if (onlysheepsChanged) {
    publicOverviewChanged = true;
  }

  // Merge shareSnapshots
  const mergedSnapshots: Record<string, CloudShareSnapshotIndex> = {
    ...(remoteState.shareSnapshots || {}),
    ...(localState.shareSnapshots || {}),
  };
  for (const [shareId, snap] of Object.entries(remoteState.shareSnapshots || {})) {
    const localSnap = localState.shareSnapshots?.[shareId];
    if (!localSnap || parseEpochMs(snap.updatedAt) > parseEpochMs(localSnap.updatedAt)) {
      mergedSnapshots[shareId] = snap;
    }
  }

  const mergedOwnerConfig = mergeSheetConfig(localState.ownerConfig, remoteState.ownerConfig);

  // Union webFormRecords cleanly by id, newest submittedAt first
  const localForms = localState.webFormRecords || [];
  const remoteForms = remoteState.webFormRecords || [];
  const formMap = new Map<string, WebFormSubmission>();
  for (const rec of remoteForms) {
    if (rec?.id) {
      formMap.set(rec.id, rec);
    }
  }
  for (const rec of localForms) {
    if (rec?.id) {
      const existing = formMap.get(rec.id);
      if (!existing || parseEpochMs(rec.submittedAt) >= parseEpochMs(existing.submittedAt)) {
        formMap.set(rec.id, rec);
      }
    }
  }
  const mergedWebFormRecords = Array.from(formMap.values())
    .sort((a, b) => parseEpochMs(b.submittedAt) - parseEpochMs(a.submittedAt))
    .slice(0, 500);
  const localFormIds = new Set(localForms.map(r => r.id));
  const webFormsChanged =
    mergedWebFormRecords.length !== localForms.length ||
    mergedWebFormRecords.some(r => !localFormIds.has(r.id));

  const ownerChanged =
    changedFarmIds.length > 0 ||
    onlysheepsChanged ||
    webFormsChanged ||
    JSON.stringify(localState.ownerConfig || {}) !== JSON.stringify(mergedOwnerConfig || {});

  const tombstonesChanged =
    (localState.deletedListingIds?.length || 0) !== deletedListingIds.length ||
    deletedListingIds.some(id => !(localState.deletedListingIds || []).includes(id));

  const changed =
    changedFarmIds.length > 0 || onlysheepsChanged || ownerChanged || tombstonesChanged || webFormsChanged;

  const baseRev = Math.max(localState.globalRevision || 0, remoteState.globalRevision || 0);
  const nextRev = changed ? baseRev + 1 : baseRev;

  const merged: CloudSyncDatabaseSnapshot = {
    version: Math.max(localState.version || 3, remoteState.version || 3),
    globalRevision: nextRev,
    updatedAt: changed
      ? new Date().toISOString()
      : localState.updatedAt || remoteState.updatedAt || new Date().toISOString(),
    farms: mergedFarms,
    onlysheepsListings: mergedListings,
    deletedListingIds,
    shareSnapshots: mergedSnapshots,
    ownerConfig: mergedOwnerConfig,
    ...(mergedWebFormRecords.length > 0 ||
    localState.webFormRecords !== undefined ||
    remoteState.webFormRecords !== undefined
      ? { webFormRecords: mergedWebFormRecords }
      : {}),
  };

  return {
    merged,
    changed,
    publicOverviewChanged,
    onlysheepsChanged,
    webFormsChanged,
    ownerChanged,
    changedFarmIds,
    addedFarmNames,
  };
}
