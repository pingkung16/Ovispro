import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  mergeCloudDatabases,
  type CloudSyncDatabaseSnapshot,
  type CloudSyncFarmRecord,
} from './cloudMerge.ts';
import type { OnlysheepsListing, Pen, Sheep } from '../types/sheep.ts';

function makePen(id = 'pen-a'): Pen {
  return {
    id,
    code: 'คอก A',
    name: 'คอกหลัก',
    ageRange: '12-24 เดือน',
    sheepCount: 0,
    averageWeightKg: 50,
    dailyFeedKg: 2,
    averageAdgGrams: 180,
    purpose: 'บำรุงพันธุ์',
  };
}

function makeSheep(id: string, name: string): Sheep {
  return {
    id,
    earTag: `TAG-${id}`,
    name,
    breed: 'เมอริโน (Merino)',
    gender: 'female',
    birthDate: '2025-01-01',
    ageMonths: 14,
    weightKg: 52,
    currentAdgGrams: 180,
    stage: 'wool_maintenance',
    bcs: 3.5,
    penId: 'pen-a',
    pen: 'คอก A',
    healthStatus: 'healthy',
  };
}

function makeFarm(
  farmId: string,
  farmName: string,
  sheepCount: number,
  updatedAt: string
): CloudSyncFarmRecord {
  const sheepList = Array.from({ length: sheepCount }, (_, i) =>
    makeSheep(`${farmId}-s-${i + 1}`, `แกะ ${i + 1}`)
  );
  return {
    profile: {
      farmId,
      username: farmId,
      farmName,
      ownerName: 'เจ้าของฟาร์ม',
      location: 'เชียงใหม่',
      contact: '081-000-0000',
      breedFocus: 'Merino',
      isSeedFarm: false,
      updatedAt,
    },
    passwordSalt: 'salt',
    passwordHash: 'hash',
    pens: [makePen()],
    sheepList,
    ingredients: [],
    rations: [],
    logs: [],
    matches: [],
    updatedAt,
  };
}

function makeListing(listingId: string, farmId: string, name: string): OnlysheepsListing {
  return {
    ...makeSheep(`os-${listingId}`, name),
    listingId,
    ownerFarmId: farmId,
    publishedAt: '2026-11-18',
    farmName: farmId,
  };
}

describe('mergeCloudDatabases cross-origin & multi-device sync', () => {
  it('unions distinct farms registered concurrently on different instances (ais-dev & ais-pre)', () => {
    const localDb: CloudSyncDatabaseSnapshot = {
      version: 3,
      globalRevision: 5,
      farms: {
        'farm-a': makeFarm('farm-a', 'ฟาร์มเหนือ', 4, '2026-11-18T10:00:00.000Z'),
      },
      onlysheepsListings: [makeListing('os-1', 'farm-a', 'เมอริโน่ A')],
    };

    const remoteDb: CloudSyncDatabaseSnapshot = {
      version: 3,
      globalRevision: 6,
      farms: {
        'farm-b': makeFarm('farm-b', 'ฟาร์มใต้', 7, '2026-11-18T10:01:00.000Z'),
      },
      onlysheepsListings: [makeListing('os-2', 'farm-b', 'แรมบูเยต์ B')],
    };

    const result = mergeCloudDatabases(localDb, remoteDb);

    assert.equal(result.changed, true);
    assert.equal(result.publicOverviewChanged, true);
    assert.equal(result.onlysheepsChanged, true);
    assert.equal(Object.keys(result.merged.farms).length, 2);
    assert.ok(result.merged.farms['farm-a']);
    assert.ok(result.merged.farms['farm-b']);
    assert.deepEqual(result.addedFarmNames, ['ฟาร์มใต้']);
    assert.equal(result.merged.onlysheepsListings.length, 2);
    assert.equal(result.merged.globalRevision, 7);
  });

  it('picks the newer timestamp when the same farm is updated on another device', () => {
    const localDb: CloudSyncDatabaseSnapshot = {
      version: 3,
      globalRevision: 3,
      farms: {
        'farm-a': makeFarm('farm-a', 'ฟาร์มเดิม', 3, '2026-11-18T09:00:00.000Z'),
      },
      onlysheepsListings: [],
    };

    const remoteDb: CloudSyncDatabaseSnapshot = {
      version: 3,
      globalRevision: 4,
      farms: {
        'farm-a': makeFarm('farm-a', 'ฟาร์มเดิม', 6, '2026-11-18T09:05:00.000Z'),
      },
      onlysheepsListings: [],
    };

    const result = mergeCloudDatabases(localDb, remoteDb);
    assert.equal(result.changed, true);
    assert.equal(result.publicOverviewChanged, true);
    assert.deepEqual(result.changedFarmIds, ['farm-a']);
    assert.equal(result.merged.farms['farm-a'].sheepList.length, 6);
  });

  it('respects deletedListingIds tombstones so removed Onlysheeps entries do not reappear', () => {
    const localDb: CloudSyncDatabaseSnapshot = {
      version: 3,
      globalRevision: 5,
      farms: {},
      onlysheepsListings: [makeListing('os-1', 'farm-a', 'แกะ 1')],
      deletedListingIds: [],
    };

    const remoteDb: CloudSyncDatabaseSnapshot = {
      version: 3,
      globalRevision: 6,
      farms: {},
      onlysheepsListings: [],
      deletedListingIds: ['os-1'],
    };

    const result = mergeCloudDatabases(localDb, remoteDb);
    assert.equal(result.changed, true);
    assert.equal(result.onlysheepsChanged, true);
    assert.equal(result.merged.onlysheepsListings.length, 0);
    assert.deepEqual(result.merged.deletedListingIds, ['os-1']);
  });

  it('is idempotent when merging identical states repeatedly', () => {
    const localDb: CloudSyncDatabaseSnapshot = {
      version: 3,
      globalRevision: 8,
      farms: {
        'farm-a': makeFarm('farm-a', 'ฟาร์ม A', 5, '2026-11-18T10:00:00.000Z'),
      },
      onlysheepsListings: [makeListing('os-1', 'farm-a', 'แกะ 1')],
      deletedListingIds: ['os-old'],
    };

    const result = mergeCloudDatabases(localDb, localDb);
    assert.equal(result.changed, false);
    assert.equal(result.publicOverviewChanged, false);
    assert.equal(result.onlysheepsChanged, false);
    assert.equal(result.merged.globalRevision, 8);
  });

  it('unions webFormRecords submitted on different instances newest-first without duplicates', () => {
    const localDb: CloudSyncDatabaseSnapshot = {
      version: 3,
      globalRevision: 10,
      farms: {},
      onlysheepsListings: [],
      webFormRecords: [
        {
          id: 'wf-1',
          submittedAt: '2026-11-18T08:00:00.000Z',
          farmName: 'ฟาร์มเหนือ',
          recorderName: 'สมชาย',
          province: 'เชียงใหม่',
          sheepEarTag: 'CNX-01',
          sheepName: 'ปุยนุ่น',
          breed: 'เมอริโน (Merino)',
          gender: 'female',
          ageMonths: 18,
          weightKg: 54,
          woolMicron: 18.4,
          dailyFeedKg: 2.1,
          syncedToSheet: true,
        },
      ],
    };

    const remoteDb: CloudSyncDatabaseSnapshot = {
      version: 3,
      globalRevision: 11,
      farms: {},
      onlysheepsListings: [],
      webFormRecords: [
        localDb.webFormRecords![0],
        {
          id: 'wf-2',
          submittedAt: '2026-11-18T09:15:00.000Z',
          farmName: 'ฟาร์มใต้',
          recorderName: 'สมหญิง',
          province: 'นครปฐม',
          sheepEarTag: 'NPT-02',
          sheepName: 'มาร์ชเมลโล่',
          breed: 'ดอร์เซท (Dorset)',
          gender: 'male',
          ageMonths: 24,
          weightKg: 76,
          woolMicron: 24.5,
          dailyFeedKg: 2.8,
          syncedToSheet: false,
        },
      ],
    };

    const result = mergeCloudDatabases(localDb, remoteDb);
    assert.equal(result.changed, true);
    assert.equal(result.ownerChanged, true);
    assert.equal(result.merged.webFormRecords?.length, 2);
    assert.equal(result.merged.webFormRecords?.[0].id, 'wf-2');
    assert.equal(result.merged.webFormRecords?.[1].id, 'wf-1');
  });
});

