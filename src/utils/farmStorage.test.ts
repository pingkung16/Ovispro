import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getLastActiveFarmId,
  setLastActiveFarmId,
  readFarmPendingBackup,
  writeFarmPendingBackup,
  readFarmLocalVault,
  writeFarmLocalVault,
  reconcileWorkspaceAfterLoad,
} from './farmStorage.ts';
import type { PrivateFarmWorkspacePayload } from './realtime.ts';

function installMockLocalStorage() {
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    removeItem(key: string) {
      store.delete(key);
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
  };
}

function makeWorkspace(farmId: string, sheepCount: number): PrivateFarmWorkspacePayload {
  const sheepList = Array.from({ length: sheepCount }, (_, idx) => ({
    id: `sheep-${idx + 1}`,
    earTag: `TAG-${idx + 1}`,
    name: `น้องขนทอง-${idx + 1}`,
    breed: 'เมอริโน (Merino)',
    gender: 'female' as const,
    birthDate: '2025-01-10',
    ageMonths: 12,
    weightKg: 48,
    currentAdgGrams: 185,
    stage: 'wool_growing' as const,
    bcs: 3.5,
    penId: 'pen-a',
    pen: 'คอก A',
    healthStatus: 'healthy' as const,
  }));

  return {
    profile: {
      farmId,
      username: 'testfarm',
      farmName: 'ฟาร์มทดสอบความเสถียร',
      ownerName: 'คุณทดสอบ',
      location: 'เชียงใหม่',
      contact: 'Line: @test',
      breedFocus: 'Merino',
      isSeedFarm: false,
    },
    pens: [
      {
        id: 'pen-a',
        code: 'คอก A',
        name: 'คอก A',
        ageRange: '12-24 เดือน',
        sheepCount: 0,
        averageWeightKg: 48,
        dailyFeedKg: 2.0,
        averageAdgGrams: 185,
        purpose: 'ทดสอบ',
      },
    ],
    sheepList,
    ingredients: [],
    rations: [],
    logs: [],
    matches: [],
  };
}

describe('farmStorage durability & reconciliation', () => {
  beforeEach(() => {
    installMockLocalStorage();
  });

  it('tracks last active farm id and clears on logout', () => {
    assert.equal(getLastActiveFarmId(), null);
    setLastActiveFarmId('farm-alpha-1');
    assert.equal(getLastActiveFarmId(), 'farm-alpha-1');
    setLastActiveFarmId(null);
    assert.equal(getLastActiveFarmId(), null);
  });

  it('persists and clears per-farm pending backups including legacy v1 key', () => {
    const payload = makeWorkspace('farm-beta-1', 2);
    writeFarmPendingBackup('farm-beta-1', payload);

    const loaded = readFarmPendingBackup('farm-beta-1');
    assert.ok(loaded);
    assert.equal(loaded.sheepList.length, 2);

    // Other farm should not collide
    assert.equal(readFarmPendingBackup('farm-other-2'), null);

    writeFarmPendingBackup('farm-beta-1', null);
    assert.equal(readFarmPendingBackup('farm-beta-1'), null);

    // Reads legacy v1 backup seamlessly when present
    localStorage.setItem(
      'ovispro_pending_farm_sync_v1',
      JSON.stringify({ farmId: 'farm-beta-1', savedAt: Date.now(), payload })
    );
    const legacyLoaded = readFarmPendingBackup('farm-beta-1');
    assert.ok(legacyLoaded);
    assert.equal(legacyLoaded.sheepList.length, 2);

    writeFarmPendingBackup('farm-beta-1', null);
    assert.equal(localStorage.getItem('ovispro_pending_farm_sync_v1'), null);
  });

  it('persists per-farm durable vault alongside last active farm id', () => {
    const ws = makeWorkspace('farm-vault-1', 3);
    writeFarmLocalVault('farm-vault-1', ws);

    const vault = readFarmLocalVault('farm-vault-1');
    assert.ok(vault);
    assert.equal(vault.farmId, 'farm-vault-1');
    assert.equal(vault.workspace.sheepList.length, 3);
    assert.equal(getLastActiveFarmId(), 'farm-vault-1');
  });

  it('reconciles server workspace with pending backup without losing unsaved sheep or pens', () => {
    const serverWs = makeWorkspace('farm-reconcile-1', 1);
    const pendingWs = makeWorkspace('farm-reconcile-1', 3);

    const noPending = reconcileWorkspaceAfterLoad(serverWs, null);
    assert.equal(noPending.needsServerPush, false);
    assert.equal(noPending.workspace.sheepList.length, 1);

    const withPending = reconcileWorkspaceAfterLoad(serverWs, pendingWs);
    assert.equal(withPending.needsServerPush, true);
    assert.equal(withPending.workspace.sheepList.length, 3);
    assert.equal(withPending.workspace.pens[0].sheepCount, 3);
  });
});
