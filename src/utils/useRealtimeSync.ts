/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  OnlysheepsListing,
  OwnerMasterSheetData,
  PublicPlatformOverview,
  WebFormSubmission,
} from '../types/sheep';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import {
  getLastSupabaseLocalWriteAt,
  sbFetchFarmWorkspace,
  sbFetchOnlysheepsFeed,
  sbFetchPublicOverview,
  sbFetchWebFormRecords,
} from './supabaseDb';
import {
  fetchSyncState,
  getClientSessionId,
  getStoredAuthToken,
  getStoredOwnerToken,
} from './api';
import {
  shouldApplyRevision,
  type PrivateFarmWorkspacePayload,
  type PublicOverviewChangeReason,
  type RealtimeClientMessage,
  type RealtimeServerEvent,
} from './realtime';

interface UseRealtimeSyncOptions {
  activeFarmId: string | null;
  isOwnerAuthenticated?: boolean;
  onPublicInit: (
    overview: PublicPlatformOverview,
    onlysheepsListings: OnlysheepsListing[]
  ) => void;
  onPublicOverviewUpdated: (
    overview: PublicPlatformOverview,
    meta: {
      reason: PublicOverviewChangeReason;
      farmName?: string;
      originClientId?: string;
    }
  ) => void;
  onOnlysheepsCreated: (
    listing: OnlysheepsListing,
    meta: { originClientId?: string }
  ) => void;
  onOnlysheepsDeleted: (
    listingId: string,
    meta: {
      listingName?: string;
      farmName?: string;
      originClientId?: string;
    }
  ) => void;
  onOnlysheepsReplaced?: (listings: OnlysheepsListing[]) => void;
  onFarmWorkspaceUpdated: (
    workspace: PrivateFarmWorkspacePayload,
    meta: {
      farmId: string;
      updatedAt: string;
      originClientId?: string;
    }
  ) => void;
  onFarmSaveAck?: (ack: { farmId: string; seq?: number; updatedAt: string }) => void;
  onOwnerMasterUpdated?: (data: OwnerMasterSheetData) => void;
  onWebFormRecordsSync?: (records: WebFormSubmission[]) => void;
  onWebFormRecordCreated?: (record: WebFormSubmission) => void;
  onReconnectResync?: () => void;
}

export function useRealtimeSync(options: UseRealtimeSyncOptions): {
  sendFarmSaveOverSocket: (
    payload: Partial<PrivateFarmWorkspacePayload>,
    seq?: number
  ) => boolean;
  isWsConnected: boolean;
  cloudSyncConfigured: boolean;
} {
  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  const supabaseEnabled = isSupabaseConfigured();
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [cloudSyncConfigured, setCloudSyncConfigured] = useState(supabaseEnabled);

  const wsRef = useRef<WebSocket | null>(null);
  const lastPublicRevRef = useRef<number>(0);
  const lastOnlysheepsRevRef = useRef<number>(0);
  const lastFarmRevRef = useRef<number>(0);
  const lastOwnerRevRef = useRef<number>(0);
  const lastKnownServerRevRef = useRef<number>(0);
  const hasConnectedOnceRef = useRef<boolean>(false);

  const sendSocketMessage = useCallback((msg: RealtimeClientMessage): boolean => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
      return true;
    }
    return false;
  }, []);

  const sendFarmSaveOverSocket = useCallback(
    (payload: Partial<PrivateFarmWorkspacePayload>, seq?: number): boolean => {
      if (supabaseEnabled) return false;
      const token = getStoredAuthToken();
      if (!token) return false;
      return sendSocketMessage({
        type: 'farm:save',
        token,
        clientId: getClientSessionId(),
        seq,
        payload,
      });
    },
    [sendSocketMessage, supabaseEnabled]
  );

  // =========================================================================
  // SUPABASE REALTIME SUBSCRIPTIONS (Public Hub + Active Private Farm)
  // =========================================================================
  useEffect(() => {
    if (!supabaseEnabled || typeof window === 'undefined') return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setCloudSyncConfigured(true);
    let disposed = false;
    let publicRefreshTimer: ReturnType<typeof setTimeout> | null = null;
    let farmRefreshTimer: ReturnType<typeof setTimeout> | null = null;

    const schedulePublicRefresh = (
      reason: PublicOverviewChangeReason,
      farmName?: string
    ) => {
      if (publicRefreshTimer) clearTimeout(publicRefreshTimer);
      publicRefreshTimer = setTimeout(async () => {
        if (disposed) return;
        try {
          const overview = await sbFetchPublicOverview();
          if (disposed) return;
          const isLocalWrite = Date.now() - getLastSupabaseLocalWriteAt() < 1800;
          callbacksRef.current.onPublicOverviewUpdated(overview, {
            reason,
            farmName,
            originClientId: isLocalWrite ? getClientSessionId() : undefined,
          });
        } catch {
          // ignore transient errors
        }
      }, 250);
    };

    const publicChannel = supabase
      .channel('ovispro-public-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'farms' },
        payload => {
          if (disposed) return;
          const row = (payload.new || payload.old) as { farm_name?: string } | null;
          const reason: PublicOverviewChangeReason =
            payload.eventType === 'INSERT' ? 'farm_registered' : 'herd_updated';
          schedulePublicRefresh(reason, row?.farm_name);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'onlysheeps_listings' },
        payload => {
          if (disposed) return;
          const isLocalWrite = Date.now() - getLastSupabaseLocalWriteAt() < 1800;
          const originClientId = isLocalWrite ? getClientSessionId() : undefined;

          if (payload.eventType === 'INSERT' && payload.new) {
            const rec = payload.new as { payload?: OnlysheepsListing };
            if (rec.payload) {
              callbacksRef.current.onOnlysheepsCreated(rec.payload, { originClientId });
            }
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const oldRec = payload.old as {
              listing_id?: string;
              payload?: OnlysheepsListing;
            };
            if (oldRec.listing_id) {
              callbacksRef.current.onOnlysheepsDeleted(oldRec.listing_id, {
                listingName: oldRec.payload?.name,
                farmName: oldRec.payload?.farmName,
                originClientId,
              });
            }
          } else {
            void sbFetchOnlysheepsFeed()
              .then(list => {
                if (!disposed) callbacksRef.current.onOnlysheepsReplaced?.(list);
              })
              .catch(() => {});
          }
          schedulePublicRefresh('onlysheeps_changed');
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'web_form_submissions' },
        () => {
          if (disposed) return;
          void sbFetchWebFormRecords()
            .then(res => {
              if (!disposed) callbacksRef.current.onWebFormRecordsSync?.(res.records);
            })
            .catch(() => {});
        }
      )
      .subscribe(status => {
        if (!disposed) {
          setIsWsConnected(status === 'SUBSCRIBED');
        }
      });

    const activeFarmId = options.activeFarmId;
    const scheduleFarmRefresh = () => {
      if (!activeFarmId) return;
      if (Date.now() - getLastSupabaseLocalWriteAt() < 1800) {
        return;
      }
      if (farmRefreshTimer) clearTimeout(farmRefreshTimer);
      farmRefreshTimer = setTimeout(async () => {
        if (disposed || !activeFarmId) return;
        if (Date.now() - getLastSupabaseLocalWriteAt() < 1800) return;
        try {
          const workspace = await sbFetchFarmWorkspace(activeFarmId);
          if (disposed) return;
          callbacksRef.current.onFarmWorkspaceUpdated(workspace, {
            farmId: activeFarmId,
            updatedAt: workspace.profile.updatedAt || new Date().toISOString(),
          });
        } catch {
          // ignore transient sync error
        }
      }, 350);
    };

    const farmChannel = activeFarmId
      ? supabase
          .channel(`ovispro-farm-realtime:${activeFarmId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'sheep',
              filter: `farm_id=eq.${activeFarmId}`,
            },
            scheduleFarmRefresh
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'farm_logs',
              filter: `farm_id=eq.${activeFarmId}`,
            },
            scheduleFarmRefresh
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'farm_pens',
              filter: `farm_id=eq.${activeFarmId}`,
            },
            scheduleFarmRefresh
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'feed_ingredients',
              filter: `farm_id=eq.${activeFarmId}`,
            },
            scheduleFarmRefresh
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'formulated_rations',
              filter: `farm_id=eq.${activeFarmId}`,
            },
            scheduleFarmRefresh
          )
          .subscribe()
      : null;

    const handleVisibilityOrOnline = () => {
      if (document.visibilityState === 'visible') {
        callbacksRef.current.onReconnectResync?.();
        if (activeFarmId) scheduleFarmRefresh();
      }
    };
    window.addEventListener('online', handleVisibilityOrOnline);
    document.addEventListener('visibilitychange', handleVisibilityOrOnline);

    return () => {
      disposed = true;
      if (publicRefreshTimer) clearTimeout(publicRefreshTimer);
      if (farmRefreshTimer) clearTimeout(farmRefreshTimer);
      window.removeEventListener('online', handleVisibilityOrOnline);
      document.removeEventListener('visibilitychange', handleVisibilityOrOnline);
      void supabase.removeChannel(publicChannel);
      if (farmChannel) {
        void supabase.removeChannel(farmChannel);
      }
    };
  }, [supabaseEnabled, options.activeFarmId]);

  // Adaptive HTTP Fallback Sync (handles mobile/LINE WebViews & cross-instance polling when not using Supabase)
  useEffect(() => {
    if (supabaseEnabled || typeof window === 'undefined') return;

    let disposed = false;
    let inFlight = false;

    const pollSyncState = async () => {
      if (disposed || inFlight) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      inFlight = true;
      try {
        const res = await fetchSyncState(lastKnownServerRevRef.current);
        if (disposed) return;

        if (typeof res.cloudSyncConfigured === 'boolean') {
          setCloudSyncConfigured(res.cloudSyncConfigured);
        }

        if (!res.changed || !res.overview) {
          if (typeof res.revision === 'number' && res.revision > lastKnownServerRevRef.current) {
            lastKnownServerRevRef.current = res.revision;
          }
          return;
        }

        const nextRev = res.revision;
        lastKnownServerRevRef.current = nextRev;
        if (nextRev > lastPublicRevRef.current) {
          lastPublicRevRef.current = nextRev;
        }
        if (nextRev > lastOnlysheepsRevRef.current) {
          lastOnlysheepsRevRef.current = nextRev;
        }

        callbacksRef.current.onPublicInit(res.overview, res.onlysheepsListings || []);
        if (res.onlysheepsListings) {
          callbacksRef.current.onOnlysheepsReplaced?.(res.onlysheepsListings);
        }

        if (res.workspace && nextRev > lastFarmRevRef.current) {
          lastFarmRevRef.current = nextRev;
          callbacksRef.current.onFarmWorkspaceUpdated(res.workspace, {
            farmId: res.workspace.profile.farmId,
            updatedAt: res.updatedAt || new Date().toISOString(),
          });
        }

        if (res.ownerData && nextRev > lastOwnerRevRef.current) {
          lastOwnerRevRef.current = nextRev;
          callbacksRef.current.onOwnerMasterUpdated?.(res.ownerData);
        }

        if (Array.isArray(res.webFormRecords)) {
          callbacksRef.current.onWebFormRecordsSync?.(res.webFormRecords);
        }
      } catch {
        // Ignore transient network errors; next adaptive interval retries automatically
      } finally {
        inFlight = false;
      }
    };

    // Fast 4s fallback when WebSocket is down/blocked; 12s cross-instance safety net when WS is open
    const intervalMs = isWsConnected ? 12000 : 4000;
    const pollTimer = setInterval(() => {
      void pollSyncState();
    }, intervalMs);

    // Run an immediate HTTP sync check when WS is not connected
    if (!isWsConnected) {
      void pollSyncState();
    }

    return () => {
      disposed = true;
      clearInterval(pollTimer);
    };
  }, [isWsConnected, supabaseEnabled]);

  // Manage WebSocket connection lifecycle, heartbeat, exponential backoff, and online/visibility resync
  useEffect(() => {
    if (supabaseEnabled || typeof window === 'undefined') return;

    let disposed = false;
    let reconnectAttempt = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

    const clientId = getClientSessionId();

    const clearHeartbeat = () => {
      if (heartbeatTimer !== null) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
    };

    const requestResyncIfConnected = () => {
      const socket = wsRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      socket.send(
        JSON.stringify({
          type: 'sync:request',
          token: getStoredAuthToken(),
          ownerToken: getStoredOwnerToken(),
          clientId,
        } satisfies RealtimeClientMessage)
      );
      callbacksRef.current.onReconnectResync?.();
    };

    const connect = () => {
      if (disposed) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (disposed) {
          socket.close();
          return;
        }
        setIsWsConnected(true);
        const isReconnect = hasConnectedOnceRef.current;
        hasConnectedOnceRef.current = true;
        reconnectAttempt = 0;

        const token = getStoredAuthToken();
        if (token) {
          socket.send(
            JSON.stringify({
              type: 'auth:farm',
              token,
              clientId,
            } satisfies RealtimeClientMessage)
          );
        }

        const ownerToken = getStoredOwnerToken();
        if (ownerToken) {
          socket.send(
            JSON.stringify({
              type: 'auth:owner',
              token: ownerToken,
              clientId,
            } satisfies RealtimeClientMessage)
          );
        }

        // On reconnect, request full public + authenticated private/owner state snapshot
        if (isReconnect) {
          socket.send(
            JSON.stringify({
              type: 'sync:request',
              token,
              ownerToken,
              clientId,
            } satisfies RealtimeClientMessage)
          );
          callbacksRef.current.onReconnectResync?.();
        }

        clearHeartbeat();
        heartbeatTimer = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(
              JSON.stringify({
                type: 'ping',
                ts: Date.now(),
              } satisfies RealtimeClientMessage)
            );
          }
        }, 25000);
      };

      socket.onmessage = event => {
        if (disposed || typeof event.data !== 'string') return;
        let parsed: RealtimeServerEvent;
        try {
          parsed = JSON.parse(event.data) as RealtimeServerEvent;
        } catch {
          return;
        }

        if ('revision' in parsed && typeof parsed.revision === 'number') {
          lastKnownServerRevRef.current = Math.max(
            lastKnownServerRevRef.current,
            parsed.revision
          );
        }

        switch (parsed.type) {
          case 'realtime:init': {
            lastPublicRevRef.current = parsed.revision;
            lastOnlysheepsRevRef.current = parsed.revision;
            if (parsed.revision < lastFarmRevRef.current) {
              lastFarmRevRef.current = 0;
            }
            if (parsed.revision < lastOwnerRevRef.current) {
              lastOwnerRevRef.current = 0;
            }
            callbacksRef.current.onPublicInit(
              parsed.overview,
              parsed.onlysheepsListings
            );
            if (Array.isArray(parsed.webFormRecords)) {
              callbacksRef.current.onWebFormRecordsSync?.(parsed.webFormRecords);
            }
            break;
          }

          case 'public:overview_updated': {
            if (!shouldApplyRevision(lastPublicRevRef.current, parsed.revision)) {
              return;
            }
            lastPublicRevRef.current = parsed.revision;
            callbacksRef.current.onPublicOverviewUpdated(parsed.overview, {
              reason: parsed.reason,
              farmName: parsed.farmName,
              originClientId: parsed.originClientId,
            });
            break;
          }

          case 'onlysheeps:listing_created': {
            if (!shouldApplyRevision(lastOnlysheepsRevRef.current, parsed.revision)) {
              return;
            }
            lastOnlysheepsRevRef.current = parsed.revision;
            callbacksRef.current.onOnlysheepsCreated(parsed.listing, {
              originClientId: parsed.originClientId,
            });
            break;
          }

          case 'onlysheeps:listing_deleted': {
            if (!shouldApplyRevision(lastOnlysheepsRevRef.current, parsed.revision)) {
              return;
            }
            lastOnlysheepsRevRef.current = parsed.revision;
            callbacksRef.current.onOnlysheepsDeleted(parsed.listingId, {
              listingName: parsed.listingName,
              farmName: parsed.farmName,
              originClientId: parsed.originClientId,
            });
            break;
          }

          case 'farm:workspace_updated': {
            if (!shouldApplyRevision(lastFarmRevRef.current, parsed.revision)) {
              return;
            }
            lastFarmRevRef.current = parsed.revision;
            callbacksRef.current.onFarmWorkspaceUpdated(parsed.workspace, {
              farmId: parsed.farmId,
              updatedAt: parsed.updatedAt,
              originClientId: parsed.originClientId,
            });
            break;
          }

          case 'farm:save_ack': {
            callbacksRef.current.onFarmSaveAck?.({
              farmId: parsed.farmId,
              seq: parsed.seq,
              updatedAt: parsed.updatedAt,
            });
            break;
          }

          case 'owner:master_updated': {
            if (!shouldApplyRevision(lastOwnerRevRef.current, parsed.revision)) {
              return;
            }
            lastOwnerRevRef.current = parsed.revision;
            callbacksRef.current.onOwnerMasterUpdated?.(parsed.data);
            break;
          }

          case 'forms:record_created': {
            callbacksRef.current.onWebFormRecordCreated?.(parsed.record);
            break;
          }

          case 'auth:ok':
          case 'auth:owner_ok':
          case 'auth:error':
          case 'pong':
            break;
        }
      };

      socket.onclose = () => {
        clearHeartbeat();
        setIsWsConnected(false);
        if (wsRef.current === socket) {
          wsRef.current = null;
        }
        if (disposed) return;
        const delayMs = Math.min(15000, 1000 * 2 ** reconnectAttempt);
        reconnectAttempt += 1;
        reconnectTimer = setTimeout(connect, delayMs);
      };

      socket.onerror = () => {
        // Error will trigger onclose which handles backoff reconnection cleanly
      };
    };

    connect();

    const handleOnline = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        requestResyncIfConnected();
      } else {
        callbacksRef.current.onReconnectResync?.();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        requestResyncIfConnected();
        callbacksRef.current.onReconnectResync?.();
      }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      disposed = true;
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearHeartbeat();
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [supabaseEnabled]);

  // Re-bind private farm room authentication immediately on farm login / logout
  useEffect(() => {
    if (supabaseEnabled) return;
    const clientId = getClientSessionId();
    const token = getStoredAuthToken();
    lastKnownServerRevRef.current = 0;

    if (options.activeFarmId && token) {
      sendSocketMessage({
        type: 'auth:farm',
        token,
        clientId,
      });
    } else {
      lastFarmRevRef.current = 0;
      sendSocketMessage({
        type: 'auth:logout',
      });
    }
  }, [options.activeFarmId, sendSocketMessage, supabaseEnabled]);

  // Re-bind App Owner room authentication immediately on owner login / logout
  useEffect(() => {
    if (supabaseEnabled) return;
    const clientId = getClientSessionId();
    const ownerToken = getStoredOwnerToken();
    lastKnownServerRevRef.current = 0;

    if (options.isOwnerAuthenticated && ownerToken) {
      sendSocketMessage({
        type: 'auth:owner',
        token: ownerToken,
        clientId,
      });
    } else if (options.isOwnerAuthenticated === false) {
      lastOwnerRevRef.current = 0;
      sendSocketMessage({
        type: 'auth:owner_logout',
      });
    }
  }, [options.isOwnerAuthenticated, sendSocketMessage]);

  return { sendFarmSaveOverSocket, isWsConnected, cloudSyncConfigured };
}
