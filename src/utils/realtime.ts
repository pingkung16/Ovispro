/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  FarmLog,
  FarmProfile,
  FeedIngredient,
  FormulatedRation,
  OnlysheepsListing,
  OnlysheepsMatchRecord,
  Pen,
  PublicPlatformOverview,
  Sheep,
  WebFormSubmission,
} from '../types/sheep';

export type PublicOverviewChangeReason =
  | 'farm_registered'
  | 'herd_updated'
  | 'onlysheeps_changed'
  | 'farm_reset';

export interface PrivateFarmWorkspacePayload {
  profile: FarmProfile;
  pens: Pen[];
  sheepList: Sheep[];
  ingredients: FeedIngredient[];
  rations: FormulatedRation[];
  logs: FarmLog[];
  matches: OnlysheepsMatchRecord[];
}

export type RealtimeServerEvent =
  | {
      type: 'realtime:init';
      revision: number;
      overview: PublicPlatformOverview;
      onlysheepsListings: OnlysheepsListing[];
      webFormRecords?: WebFormSubmission[];
    }
  | {
      type: 'public:overview_updated';
      revision: number;
      originClientId?: string;
      reason: PublicOverviewChangeReason;
      farmName?: string;
      overview: PublicPlatformOverview;
    }
  | {
      type: 'onlysheeps:listing_created';
      revision: number;
      originClientId?: string;
      listing: OnlysheepsListing;
    }
  | {
      type: 'onlysheeps:listing_deleted';
      revision: number;
      originClientId?: string;
      listingId: string;
      listingName?: string;
      farmName?: string;
    }
  | {
      type: 'farm:workspace_updated';
      revision: number;
      originClientId?: string;
      farmId: string;
      updatedAt: string;
      workspace: PrivateFarmWorkspacePayload;
    }
  | {
      type: 'farm:save_ack';
      farmId: string;
      seq?: number;
      updatedAt: string;
    }
  | {
      type: 'owner:master_updated';
      revision: number;
      data: import('../types/sheep').OwnerMasterSheetData;
    }
  | {
      type: 'forms:record_created';
      revision: number;
      originClientId?: string;
      record: WebFormSubmission;
    }
  | {
      type: 'auth:ok';
      farmId: string;
    }
  | {
      type: 'auth:owner_ok';
      ownerEmail: string;
    }
  | {
      type: 'auth:error';
      error: string;
    }
  | {
      type: 'pong';
      ts: number;
    };

export type RealtimeClientMessage =
  | {
      type: 'auth:farm';
      token: string;
      clientId: string;
    }
  | {
      type: 'auth:logout';
    }
  | {
      type: 'auth:owner';
      token: string;
      clientId: string;
    }
  | {
      type: 'auth:owner_logout';
    }
  | {
      type: 'farm:save';
      token: string;
      clientId: string;
      seq?: number;
      payload: Partial<PrivateFarmWorkspacePayload>;
    }
  | {
      type: 'sync:request';
      token?: string | null;
      ownerToken?: string | null;
      clientId: string;
    }
  | {
      type: 'ping';
      ts: number;
    };

/**
 * Idempotent merge for `onlysheeps:listing_created`.
 * Guards against duplicate entries on reconnect races or duplicate broadcasts.
 */
export function mergeOnlysheepsListingCreated(
  current: OnlysheepsListing[],
  incoming: OnlysheepsListing
): OnlysheepsListing[] {
  const existingIdx = current.findIndex(item => item.listingId === incoming.listingId);
  if (existingIdx >= 0) {
    const next = [...current];
    next[existingIdx] = incoming;
    return next;
  }
  return [incoming, ...current];
}

/**
 * Idempotent removal for `onlysheeps:listing_deleted`.
 * Safely no-ops if listingId is already absent.
 */
export function mergeOnlysheepsListingDeleted(
  current: OnlysheepsListing[],
  listingId: string
): OnlysheepsListing[] {
  if (!current.some(item => item.listingId === listingId)) {
    return current;
  }
  return current.filter(item => item.listingId !== listingId);
}

/**
 * Ensures monotonic server revision ordering so stale out-of-order messages are ignored.
 */
export function shouldApplyRevision(
  lastAppliedRevision: number,
  incomingRevision: number
): boolean {
  if (typeof incomingRevision !== 'number' || Number.isNaN(incomingRevision)) {
    return false;
  }
  return incomingRevision > lastAppliedRevision;
}

/**
 * Determines whether a toast notification should be displayed to this browser tab.
 * Suppresses noisy notifications for mutations triggered by the current tab itself.
 */
export function shouldNotifyForEvent(
  originClientId: string | undefined,
  myClientId: string
): boolean {
  if (!originClientId) return true;
  return originClientId !== myClientId;
}
