/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PrivateFarmWorkspacePayload } from './realtime';
import { computeLivePens } from './nutrition';

const PENDING_KEY_PREFIX = 'ovispro_pending_farm_sync_v2:';
const LEGACY_PENDING_KEY = 'ovispro_pending_farm_sync_v1';
const VAULT_KEY_PREFIX = 'ovispro_farm_vault_v1:';
const LAST_FARM_ID_KEY = 'ovispro_last_active_farm_id_v1';

export interface StoredFarmVaultEntry {
  farmId: string;
  savedAt: number;
  workspace: PrivateFarmWorkspacePayload;
}

export function getLastActiveFarmId(): string | null {
  try {
    return localStorage.getItem(LAST_FARM_ID_KEY);
  } catch {
    return null;
  }
}

export function setLastActiveFarmId(farmId: string | null): void {
  try {
    if (farmId) {
      localStorage.setItem(LAST_FARM_ID_KEY, farmId);
    } else {
      localStorage.removeItem(LAST_FARM_ID_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function readFarmPendingBackup(farmId: string): PrivateFarmWorkspacePayload | null {
  try {
    const raw = localStorage.getItem(`${PENDING_KEY_PREFIX}${farmId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.farmId === farmId && parsed.payload) {
        return parsed.payload as PrivateFarmWorkspacePayload;
      }
    }
    const legacyRaw = localStorage.getItem(LEGACY_PENDING_KEY);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw);
      if (parsed && parsed.farmId === farmId && parsed.payload) {
        return parsed.payload as PrivateFarmWorkspacePayload;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function writeFarmPendingBackup(
  farmId: string,
  payload: PrivateFarmWorkspacePayload | null
): void {
  try {
    if (!payload) {
      localStorage.removeItem(`${PENDING_KEY_PREFIX}${farmId}`);
      const legacyRaw = localStorage.getItem(LEGACY_PENDING_KEY);
      if (legacyRaw) {
        const parsed = JSON.parse(legacyRaw);
        if (parsed?.farmId === farmId) {
          localStorage.removeItem(LEGACY_PENDING_KEY);
        }
      }
    } else {
      localStorage.setItem(
        `${PENDING_KEY_PREFIX}${farmId}`,
        JSON.stringify({ farmId, savedAt: Date.now(), payload })
      );
    }
  } catch {
    // ignore storage quota errors
  }
}

export function readFarmLocalVault(farmId: string): StoredFarmVaultEntry | null {
  try {
    const raw = localStorage.getItem(`${VAULT_KEY_PREFIX}${farmId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredFarmVaultEntry;
    if (parsed && parsed.farmId === farmId && parsed.workspace?.profile?.farmId === farmId) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export function writeFarmLocalVault(
  farmId: string,
  workspace: PrivateFarmWorkspacePayload
): void {
  try {
    const entry: StoredFarmVaultEntry = {
      farmId,
      savedAt: Date.now(),
      workspace,
    };
    localStorage.setItem(`${VAULT_KEY_PREFIX}${farmId}`, JSON.stringify(entry));
    localStorage.setItem(LAST_FARM_ID_KEY, farmId);
  } catch {
    // ignore storage quota errors
  }
}

export function reconcileWorkspaceAfterLoad(
  serverWorkspace: PrivateFarmWorkspacePayload,
  pendingBackup: PrivateFarmWorkspacePayload | null
): {
  workspace: PrivateFarmWorkspacePayload;
  needsServerPush: boolean;
} {
  if (!pendingBackup) {
    return { workspace: serverWorkspace, needsServerPush: false };
  }
  const restoredPens =
    pendingBackup.pens && pendingBackup.pens.length > 0
      ? pendingBackup.pens
      : serverWorkspace.pens;
  return {
    workspace: {
      ...pendingBackup,
      pens: computeLivePens(restoredPens, pendingBackup.sheepList),
    },
    needsServerPush: true,
  };
}
