/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { computeLivePens } from './utils/nutrition';
import { applyActivityLogToSheepList } from './utils/activityHelpers';
import { Header } from './components/Header';
import { HomeLanding } from './components/HomeLanding';
import { BreedsCatalog } from './components/BreedsCatalog';
import { SheepDirectory } from './components/SheepDirectory';
import { FeedCalculator } from './components/FeedCalculator';
import { IngredientsManager } from './components/IngredientsManager';
import { FarmLogs } from './components/FarmLogs';
import { DashboardView } from './components/DashboardView';
import { OnlysheepsView } from './components/OnlysheepsView';
import { AppSheetSimulator } from './components/AppSheetSimulator';
import { LabGuideModal } from './components/LabGuideModal';
import { SharePublicModal } from './components/SharePublicModal';
import { FarmAuthPanel } from './components/FarmAuthPanel';
import { FarmGoogleSheetModal } from './components/FarmGoogleSheetModal';
import { LiveShareReportView } from './components/LiveShareReportView';
import {
  DEFAULT_PENS_TEMPLATE,
  DEFAULT_INGREDIENTS_TEMPLATE,
  DEFAULT_RATIONS_TEMPLATE,
} from './data/multiFarmSeed';
import type {
  FeedIngredient,
  FormulatedRation,
  FarmLog,
  Sheep,
  Pen,
  FarmProfile,
  PublicPlatformOverview,
  OnlysheepsListing,
  OnlysheepsMatchRecord,
} from './types/sheep';
import {
  ApiError,
  type FarmWorkspaceData,
  fetchPublicOverview,
  fetchMyFarmData,
  saveMyFarmData,
  resetMyFarmData,
  fetchOnlysheepsFeed,
  publishToOnlysheeps,
  deleteOnlysheepsListing,
  logoutFarmAccount,
  restoreMissingFarmSession,
  isPayloadWithinKeepaliveLimit,
  getClientSessionId,
  getStoredAuthToken,
  setStoredAuthToken,
} from './utils/api';
import {
  getLastActiveFarmId,
  setLastActiveFarmId,
  readFarmPendingBackup,
  writeFarmPendingBackup,
  readFarmLocalVault,
  writeFarmLocalVault,
  reconcileWorkspaceAfterLoad,
} from './utils/farmStorage';
import {
  mergeOnlysheepsListingCreated,
  mergeOnlysheepsListingDeleted,
  shouldNotifyForEvent,
} from './utils/realtime';
import { useRealtimeSync } from './utils/useRealtimeSync';
import { RealtimeToastStack, type RealtimeToastItem } from './components/RealtimeToastStack';
import { Globe, Sparkles, X } from 'lucide-react';

const PUBLIC_APP_URL = 'https://ovispro-fawn.vercel.app/';
const GUEST_MATCHES_KEY = 'onlysheeps_guest_matches_v2';

export default function App() {
  // Public hub state (never contains private farm records)
  const [publicOverview, setPublicOverview] = useState<PublicPlatformOverview | null>(null);
  const [onlysheepsListings, setOnlysheepsListings] = useState<OnlysheepsListing[]>([]);

  // Authenticated private farm state (strictly isolated per farmId)
  const [activeFarmProfile, setActiveFarmProfile] = useState<FarmProfile | null>(null);
  const [farmPens, setFarmPens] = useState<Pen[]>(DEFAULT_PENS_TEMPLATE);
  const [sheepList, setSheepList] = useState<Sheep[]>([]);
  const [ingredients, setIngredients] = useState<FeedIngredient[]>(DEFAULT_INGREDIENTS_TEMPLATE);
  const [rations, setRations] = useState<FormulatedRation[]>(DEFAULT_RATIONS_TEMPLATE);
  const [logs, setLogs] = useState<FarmLog[]>([]);
  const [farmMatches, setFarmMatches] = useState<OnlysheepsMatchRecord[]>([]);

  // Guest matches (when swiping Onlysheeps before signing into a farm)
  const [guestMatches, setGuestMatches] = useState<OnlysheepsMatchRecord[]>(() => {
    try {
      const saved = sessionStorage.getItem(GUEST_MATCHES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // App UI States
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [isAppSheetMode, setIsAppSheetMode] = useState<boolean>(false);
  const [selectedSheepForCalc, setSelectedSheepForCalc] = useState<Sheep | null>(null);
  const [selectedRationForCalc, setSelectedRationForCalc] = useState<FormulatedRation | null>(null);
  const [initialAddBreed, setInitialAddBreed] = useState<string | null>(null);
  const [initialOpenAddModal, setInitialOpenAddModal] = useState<boolean>(false);
  const [isLabGuideOpen, setIsLabGuideOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isGoogleSheetModalOpen, setIsGoogleSheetModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isHydratingFarm, setIsHydratingFarm] = useState<boolean>(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'saving' | 'pending'>('synced');
  const [realtimeToasts, setRealtimeToasts] = useState<RealtimeToastItem[]>([]);
  const toastTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [activeShareId, setActiveShareId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const fromQuery = new URLSearchParams(window.location.search).get('share');
    if (fromQuery) return fromQuery;
    if (window.location.hash.includes('p=')) return 'embedded-live';
    return null;
  });

  const skipNextSaveRef = useRef<boolean>(false);
  const saveSeqRef = useRef<number>(0);
  const flushedSeqRef = useRef<number>(0);
  const isFlushingRef = useRef<boolean>(false);
  const retryCountRef = useRef<number>(0);
  const saveRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestPayloadRef = useRef<FarmWorkspaceData | null>(null);
  const prevOverviewRef = useRef<PublicPlatformOverview | null>(null);
  const lastLocalMutationAtRef = useRef<number>(0);

  const dismissToast = useCallback((id: string) => {
    const existingTimer = toastTimersRef.current.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      toastTimersRef.current.delete(id);
    }
    setRealtimeToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<RealtimeToastItem, 'id'> & { dedupeKey?: string }) => {
      const id = toast.dedupeKey || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const existingTimer = toastTimersRef.current.get(id);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      setRealtimeToasts(prev => {
        const filtered = prev.filter(t => t.id !== id);
        return [...filtered.slice(-2), { id, title: toast.title, subtitle: toast.subtitle, tone: toast.tone }];
      });

      const timer = setTimeout(() => {
        dismissToast(id);
      }, 4200);
      toastTimersRef.current.set(id, timer);
    },
    [dismissToast]
  );

  useEffect(() => {
    return () => {
      for (const timer of toastTimersRef.current.values()) {
        clearTimeout(timer);
      }
      toastTimersRef.current.clear();
      if (saveRetryTimerRef.current !== null) {
        clearTimeout(saveRetryTimerRef.current);
      }
    };
  }, []);

  const refreshPublicHub = useCallback(async () => {
    try {
      const [overview, feed] = await Promise.all([
        fetchPublicOverview(),
        fetchOnlysheepsFeed(),
      ]);
      prevOverviewRef.current = overview;
      setPublicOverview(overview);
      setOnlysheepsListings(feed);
    } catch (err) {
      console.error('Failed to load public hub:', err);
    }
  }, []);

  const applyWorkspaceToState = useCallback((workspace: FarmWorkspaceData) => {
    skipNextSaveRef.current = true;
    const computedPens = computeLivePens(workspace.pens, workspace.sheepList);
    const normalized: FarmWorkspaceData = {
      ...workspace,
      pens: computedPens,
      matches: workspace.matches || [],
    };
    setActiveFarmProfile(normalized.profile);
    setFarmPens(computedPens);
    setSheepList(normalized.sheepList);
    setIngredients(normalized.ingredients);
    setRations(normalized.rations);
    setLogs(normalized.logs);
    setFarmMatches(normalized.matches);
    latestPayloadRef.current = normalized;
    writeFarmLocalVault(normalized.profile.farmId, normalized);
  }, []);

  const flushFarmSaveRef = useRef<(options?: { keepalive?: boolean }) => Promise<void>>(async () => {});

  const { sendFarmSaveOverSocket, cloudSyncConfigured } = useRealtimeSync({
    activeFarmId: activeFarmProfile?.farmId ?? null,
    isOwnerAuthenticated: false,
    onPublicInit: useCallback(
      (overview, feed) => {
        const prev = prevOverviewRef.current;
        prevOverviewRef.current = overview;
        setPublicOverview(overview);
        setOnlysheepsListings(feed);

        if (prev && Date.now() - lastLocalMutationAtRef.current > 2500) {
          if (overview.totalFarms > prev.totalFarms) {
            const prevIds = new Set(prev.farmDirectory.map(f => f.farmId));
            const newestFarm = overview.farmDirectory.find(f => !prevIds.has(f.farmId));
            pushToast({
              dedupeKey: `farm-reg-${newestFarm?.farmId || overview.totalFarms}`,
              tone: 'farm',
              title: 'มีฟาร์มใหม่เข้าร่วมแพลตฟอร์ม',
              subtitle: newestFarm
                ? `${newestFarm.farmName} เข้าร่วมเครือข่ายแล้ว (${overview.totalFarms} ฟาร์ม)`
                : `อัปเดตเครือข่ายเป็น ${overview.totalFarms} ฟาร์ม`,
            });
          } else if (overview.totalNetworkSheep !== prev.totalNetworkSheep) {
            pushToast({
              dedupeKey: 'public-herd-sync',
              tone: 'farm',
              title: 'อัปเดตข้อมูลเครือข่ายฟาร์มล่าสุด',
              subtitle: `แกะรวมในเครือข่าย ${overview.totalNetworkSheep} ตัว`,
            });
          }
        }
      },
      [pushToast]
    ),
    onPublicOverviewUpdated: useCallback(
      (overview, meta) => {
        prevOverviewRef.current = overview;
        setPublicOverview(overview);
        const myClientId = getClientSessionId();
        if (!shouldNotifyForEvent(meta.originClientId, myClientId)) return;

        if (meta.reason === 'farm_registered') {
          pushToast({
            dedupeKey: `farm-reg-${meta.farmName || 'new'}`,
            tone: 'farm',
            title: 'มีฟาร์มใหม่เข้าร่วมแพลตฟอร์ม',
            subtitle: meta.farmName
              ? `${meta.farmName} เข้าร่วมเครือข่ายแล้ว (${overview.totalFarms} ฟาร์ม)`
              : `อัปเดตเครือข่ายเป็น ${overview.totalFarms} ฟาร์ม`,
          });
        } else if (
          (meta.reason === 'herd_updated' || meta.reason === 'farm_reset') &&
          meta.farmName !== activeFarmProfile?.farmName
        ) {
          pushToast({
            dedupeKey: 'public-herd-sync',
            tone: 'farm',
            title: 'อัปเดตข้อมูลเครือข่ายฟาร์มล่าสุด',
            subtitle: meta.farmName
              ? `${meta.farmName} อัปเดตจำนวนฝูงแกะรวม ${overview.totalNetworkSheep} ตัว`
              : `แกะรวมในเครือข่าย ${overview.totalNetworkSheep} ตัว`,
          });
        }
      },
      [activeFarmProfile?.farmName, pushToast]
    ),
    onOnlysheepsCreated: useCallback(
      (listing, meta) => {
        setOnlysheepsListings(prev => mergeOnlysheepsListingCreated(prev, listing));
        const myClientId = getClientSessionId();
        if (!shouldNotifyForEvent(meta.originClientId, myClientId)) return;

        pushToast({
          dedupeKey: `os-add-${listing.listingId}`,
          tone: 'pink',
          title: `Onlysheeps: โปรไฟล์ใหม่ "${listing.name}"`,
          subtitle: listing.farmName ? `จาก ${listing.farmName} พร้อมจับคู่แล้ว` : undefined,
        });
      },
      [pushToast]
    ),
    onOnlysheepsDeleted: useCallback(
      (listingId, meta) => {
        setOnlysheepsListings(prev => mergeOnlysheepsListingDeleted(prev, listingId));
        const myClientId = getClientSessionId();
        if (!shouldNotifyForEvent(meta.originClientId, myClientId)) return;

        pushToast({
          dedupeKey: `os-del-${listingId}`,
          tone: 'pink',
          title: `Onlysheeps: นำโปรไฟล์ "${meta.listingName || 'แกะ'}" ออกแล้ว`,
          subtitle: meta.farmName ? `อัปเดตฟีดจาก ${meta.farmName}` : undefined,
        });
      },
      [pushToast]
    ),
    onOnlysheepsReplaced: useCallback(listings => {
      setOnlysheepsListings(listings);
    }, []),
    onFarmWorkspaceUpdated: useCallback(
      (workspace, meta) => {
        if (!activeFarmProfile || meta.farmId !== activeFarmProfile.farmId) return;
        const myClientId = getClientSessionId();
        if (meta.originClientId && meta.originClientId === myClientId) return;

        applyWorkspaceToState(workspace);
        flushedSeqRef.current = saveSeqRef.current;
        writeFarmPendingBackup(workspace.profile.farmId, null);

        if (shouldNotifyForEvent(meta.originClientId, myClientId)) {
          pushToast({
            dedupeKey: `farm-sync-${workspace.profile.farmId}`,
            tone: 'sync',
            title: 'ซิงค์ข้อมูลภายในฟาร์มจากอีกเครื่องแล้ว',
            subtitle: `${workspace.profile.farmName} · ${workspace.sheepList.length} ตัว`,
          });
        }
      },
      [activeFarmProfile, applyWorkspaceToState, pushToast]
    ),
    onFarmSaveAck: useCallback(
      ack => {
        if (!activeFarmProfile || ack.farmId !== activeFarmProfile.farmId) return;
        if (typeof ack.seq === 'number' && ack.seq > flushedSeqRef.current) {
          flushedSeqRef.current = ack.seq;
          if (saveSeqRef.current === flushedSeqRef.current) {
            writeFarmPendingBackup(ack.farmId, null);
          }
        }
      },
      [activeFarmProfile]
    ),
    onReconnectResync: useCallback(() => {
      if (saveSeqRef.current > flushedSeqRef.current) {
        void flushFarmSaveRef.current();
      }
      void refreshPublicHub();
    }, [refreshPublicHub]),
  });

  const flushFarmSave = useCallback(
    async (options: { keepalive?: boolean } = {}) => {
      const initialPayload = latestPayloadRef.current;
      if (!initialPayload || saveSeqRef.current <= flushedSeqRef.current) return;

      // On unload/tab-switch, flush immediately over WebSocket (bypasses 64KB keepalive cap)
      // plus keepalive HTTP if payload fits within 60KB.
      if (options.keepalive) {
        const targetSeq = saveSeqRef.current;
        writeFarmPendingBackup(initialPayload.profile.farmId, initialPayload);
        writeFarmLocalVault(initialPayload.profile.farmId, initialPayload);
        const sentOverWs = sendFarmSaveOverSocket(initialPayload, targetSeq);
        if (!sentOverWs || isPayloadWithinKeepaliveLimit(initialPayload)) {
          try {
            await saveMyFarmData(initialPayload, { keepalive: true });
            if (targetSeq > flushedSeqRef.current) {
              flushedSeqRef.current = targetSeq;
            }
            if (saveSeqRef.current === flushedSeqRef.current) {
              writeFarmPendingBackup(initialPayload.profile.farmId, null);
            }
          } catch {
            // Pending backup remains safely in localStorage for automatic recovery next open
          }
        }
        return;
      }

      // Single-flight serialized save loop so rapid edits never race out-of-order
      if (isFlushingRef.current) return;
      isFlushingRef.current = true;
      setCloudSyncStatus('saving');
      if (saveRetryTimerRef.current !== null) {
        clearTimeout(saveRetryTimerRef.current);
        saveRetryTimerRef.current = null;
      }

      try {
        while (latestPayloadRef.current && saveSeqRef.current > flushedSeqRef.current) {
          const payload = latestPayloadRef.current;
          const targetSeq = saveSeqRef.current;
          lastLocalMutationAtRef.current = Date.now();
          try {
            await saveMyFarmData(payload);
          } catch (saveErr) {
            // Auto-recover if another Cloud Run instance lacks this newly created farm
            if (
              saveErr instanceof ApiError &&
              saveErr.status === 401 &&
              !payload.profile.isSeedFarm
            ) {
              const restored = await restoreMissingFarmSession(payload.profile.farmId, payload);
              writeFarmLocalVault(payload.profile.farmId, restored.workspace);
            } else {
              throw saveErr;
            }
          }
          flushedSeqRef.current = Math.max(flushedSeqRef.current, targetSeq);
          retryCountRef.current = 0;
          writeFarmLocalVault(payload.profile.farmId, payload);
          if (saveSeqRef.current === flushedSeqRef.current) {
            writeFarmPendingBackup(payload.profile.farmId, null);
          }
        }
        setCloudSyncStatus('synced');
        void refreshPublicHub();
      } catch (err) {
        console.error('Failed to save farm data:', err);
        setCloudSyncStatus('pending');
        const isAuthError = err instanceof ApiError && (err.status === 401 || err.status === 403);
        if (!isAuthError && retryCountRef.current < 3) {
          const delayMs = [800, 2000, 4500][retryCountRef.current] ?? 4500;
          retryCountRef.current += 1;
          saveRetryTimerRef.current = setTimeout(() => {
            saveRetryTimerRef.current = null;
            void flushFarmSaveRef.current();
          }, delayMs);
        } else if (retryCountRef.current >= 3) {
          pushToast({
            dedupeKey: 'farm-save-warning',
            tone: 'sync',
            title: 'บันทึกข้อมูลสำรองในเครื่องแล้ว',
            subtitle: 'สัญญาณเซิร์ฟเวอร์ขาดช่วง ระบบจะซิงค์อัปเดตให้อัตโนมัติทันทีที่เชื่อมต่อได้',
          });
        }
      } finally {
        isFlushingRef.current = false;
      }
    },
    [pushToast, refreshPublicHub, sendFarmSaveOverSocket]
  );

  flushFarmSaveRef.current = flushFarmSave;

  const loadAuthenticatedFarmWorkspace = useCallback(async () => {
    setIsHydratingFarm(true);
    try {
      const data = await fetchMyFarmData();
      const pendingBackup = readFarmPendingBackup(data.profile.farmId);
      const { workspace, needsServerPush } = reconcileWorkspaceAfterLoad(data, pendingBackup);

      applyWorkspaceToState(workspace);
      setLastActiveFarmId(workspace.profile.farmId);

      if (needsServerPush) {
        saveSeqRef.current += 1;
        await saveMyFarmData(workspace);
        flushedSeqRef.current = saveSeqRef.current;
        writeFarmPendingBackup(workspace.profile.farmId, null);
        void refreshPublicHub();
      } else {
        flushedSeqRef.current = saveSeqRef.current;
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        const lastFarmId = getLastActiveFarmId();
        const vaultEntry = lastFarmId ? readFarmLocalVault(lastFarmId) : null;
        const pending = lastFarmId ? readFarmPendingBackup(lastFarmId) : null;

        if (vaultEntry && lastFarmId && !vaultEntry.workspace.profile.isSeedFarm) {
          try {
            const { workspace: mergedWorkspace } = reconcileWorkspaceAfterLoad(
              vaultEntry.workspace,
              pending
            );
            const restored = await restoreMissingFarmSession(lastFarmId, mergedWorkspace);
            applyWorkspaceToState(restored.workspace);
            setLastActiveFarmId(restored.workspace.profile.farmId);
            flushedSeqRef.current = saveSeqRef.current;
            writeFarmPendingBackup(lastFarmId, null);
            void refreshPublicHub();
            pushToast({
              dedupeKey: `farm-restored-${lastFarmId}`,
              tone: 'farm',
              title: 'กู้คืนข้อมูลฟาร์มและฝูงแกะเรียบร้อยแล้ว',
              subtitle: `${restored.workspace.profile.farmName} · ${restored.workspace.sheepList.length} ตัว`,
            });
            return;
          } catch {
            // Farm still exists on server (e.g. 409) or network unavailable; reset invalid token cleanly
          }
        }

        setStoredAuthToken(null);
        setLastActiveFarmId(null);
        setActiveFarmProfile(null);
        setSheepList([]);
        setLogs([]);
        setFarmMatches([]);
      }
    } finally {
      setIsHydratingFarm(false);
    }
  }, [applyWorkspaceToState, pushToast, refreshPublicHub]);

  // Initial app hydration
  useEffect(() => {
    refreshPublicHub();
    if (getStoredAuthToken()) {
      loadAuthenticatedFarmWorkspace();
    } else {
      // Fallback recovery: if token vanished/cleared unexpectedly while non-seed vault exists
      const lastFarmId = getLastActiveFarmId();
      const vaultEntry = lastFarmId ? readFarmLocalVault(lastFarmId) : null;
      if (vaultEntry && lastFarmId && !vaultEntry.workspace.profile.isSeedFarm) {
        void loadAuthenticatedFarmWorkspace();
      }
    }
  }, [refreshPublicHub, loadAuthenticatedFarmWorkspace]);

  // Persist guest matches only in ephemeral sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(GUEST_MATCHES_KEY, JSON.stringify(guestMatches));
    } catch {
      // ignore
    }
  }, [guestMatches]);

  // Immediately persist private farm changes & retain pending sync mirror until confirmed
  useEffect(() => {
    if (!activeFarmProfile) {
      latestPayloadRef.current = null;
      return;
    }
    const snapshot: FarmWorkspaceData = {
      profile: activeFarmProfile,
      pens: farmPens,
      sheepList,
      ingredients,
      rations,
      logs,
      matches: farmMatches,
    };
    latestPayloadRef.current = snapshot;
    writeFarmLocalVault(activeFarmProfile.farmId, snapshot);

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    saveSeqRef.current += 1;
    writeFarmPendingBackup(activeFarmProfile.farmId, snapshot);

    const timer = setTimeout(() => {
      void flushFarmSave();
    }, 60);

    return () => clearTimeout(timer);
  }, [activeFarmProfile, farmPens, sheepList, ingredients, rations, logs, farmMatches, flushFarmSave]);

  // Ensure any unsaved mutation flushes via WebSocket + keepalive when user exits/closes/switches tab
  useEffect(() => {
    const handleFlushOnLeave = () => {
      if (saveSeqRef.current > flushedSeqRef.current && latestPayloadRef.current) {
        writeFarmPendingBackup(latestPayloadRef.current.profile.farmId, latestPayloadRef.current);
        writeFarmLocalVault(latestPayloadRef.current.profile.farmId, latestPayloadRef.current);
        void flushFarmSave({ keepalive: true });
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        handleFlushOnLeave();
      }
    };
    window.addEventListener('pagehide', handleFlushOnLeave);
    window.addEventListener('beforeunload', handleFlushOnLeave);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('pagehide', handleFlushOnLeave);
      window.removeEventListener('beforeunload', handleFlushOnLeave);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [flushFarmSave]);

  const handleAuthenticated = async (profile: FarmProfile, workspace?: FarmWorkspaceData) => {
    lastLocalMutationAtRef.current = Date.now();
    setLastActiveFarmId(profile.farmId);
    if (workspace) {
      const pendingBackup = readFarmPendingBackup(profile.farmId);
      const { workspace: merged, needsServerPush } = reconcileWorkspaceAfterLoad(
        workspace,
        pendingBackup
      );
      applyWorkspaceToState(merged);
      if (needsServerPush) {
        saveSeqRef.current += 1;
        await flushFarmSave();
      } else {
        flushedSeqRef.current = saveSeqRef.current;
      }
    } else {
      await loadAuthenticatedFarmWorkspace();
    }
    await refreshPublicHub();
    setIsAuthModalOpen(false);
  };

  const handleLogout = async () => {
    if (saveRetryTimerRef.current !== null) {
      clearTimeout(saveRetryTimerRef.current);
      saveRetryTimerRef.current = null;
    }
    await flushFarmSave();
    if (activeFarmProfile && flushedSeqRef.current >= saveSeqRef.current) {
      writeFarmPendingBackup(activeFarmProfile.farmId, null);
    }
    setLastActiveFarmId(null);
    latestPayloadRef.current = null;
    saveSeqRef.current = 0;
    flushedSeqRef.current = 0;
    await logoutFarmAccount();
    setActiveFarmProfile(null);
    setFarmPens(DEFAULT_PENS_TEMPLATE);
    setSheepList([]);
    setIngredients(DEFAULT_INGREDIENTS_TEMPLATE);
    setRations(DEFAULT_RATIONS_TEMPLATE);
    setLogs([]);
    setFarmMatches([]);
    setSelectedSheepForCalc(null);
    setSelectedRationForCalc(null);
    setIsAppSheetMode(false);
    setCurrentTab('home');
  };

  const livePens = useMemo(() => computeLivePens(farmPens, sheepList), [farmPens, sheepList]);

  // Farm private entity handlers
  const handleAddSheep = (newSheepData: Omit<Sheep, 'id'>) => {
    const newSheep: Sheep = {
      ...newSheepData,
      id: `sheep-${Date.now()}`,
      farmName: activeFarmProfile?.farmName,
      farmLocation: activeFarmProfile?.location,
      ownerContact: activeFarmProfile?.contact,
    };
    setSheepList(prev => [newSheep, ...prev]);

    const regLog: FarmLog = {
      id: `log-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'weight',
      sheepId: newSheep.id,
      sheepEarTag: `${newSheep.earTag} (${newSheep.name})`,
      penId: newSheep.penId,
      penName: newSheep.pen,
      title: `ลงทะเบียนแกะใหม่: ${newSheep.name}`,
      weightKg: newSheep.weightKg,
      recordedBy: activeFarmProfile?.ownerName || 'ผู้จัดการฟาร์ม',
      notes: `พันธุ์ ${newSheep.breed}, ระยะ ${newSheep.stage}`,
    };
    setLogs(prev => [regLog, ...prev]);
  };

  const handleUpdateSheep = (updated: Sheep) => {
    setSheepList(prev => prev.map(s => (s.id === updated.id ? updated : s)));
  };

  const handleDeleteSheep = (id: string) => {
    setSheepList(prev => prev.filter(s => s.id !== id));
  };

  const handleAddPen = (newPenData: {
    code: string;
    name: string;
    ageRange: string;
    averageWeightKg: number;
    dailyFeedKg: number;
    averageAdgGrams: number;
    purpose: string;
    notes?: string;
  }): Pen => {
    const codeClean = newPenData.code.trim();
    const slug = codeClean
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-|-$/g, '');
    const newPen: Pen = {
      id: `pen-${slug || 'custom'}-${Date.now()}`,
      code: codeClean,
      name: newPenData.name.trim() || codeClean,
      ageRange: newPenData.ageRange.trim() || 'ทุกช่วงอายุ',
      sheepCount: 0,
      averageWeightKg: Number(newPenData.averageWeightKg) || 50,
      dailyFeedKg: Number(newPenData.dailyFeedKg) || 2.0,
      averageAdgGrams: Number(newPenData.averageAdgGrams) || 175,
      purpose: newPenData.purpose.trim() || 'จัดการฝูงแกะตามกลุ่มเป้าหมายของฟาร์ม',
      notes: newPenData.notes?.trim() || '',
    };
    setFarmPens(prev => [...prev, newPen]);
    return newPen;
  };

  const handleDeletePen = (penId: string) => {
    if (farmPens.length <= 1) return;
    if (sheepList.some(s => s.penId === penId)) return;
    setFarmPens(prev => prev.filter(p => p.id !== penId));
  };

  const handleAddIngredient = (newIngData: Omit<FeedIngredient, 'id'>): FeedIngredient => {
    const newIng: FeedIngredient = {
      ...newIngData,
      id: `ing-${Date.now()}`,
    };
    setIngredients(prev => [...prev, newIng]);
    return newIng;
  };

  const handleUpdateIngredient = (updated: FeedIngredient) => {
    setIngredients(prev => prev.map(i => (i.id === updated.id ? updated : i)));
  };

  const handleDeleteIngredient = (id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id));
  };

  const handleSaveRation = (
    newRation: FormulatedRation,
    assignment?: { sheepId?: string; penId?: string }
  ) => {
    setRations(prev => {
      const idx = prev.findIndex(r => r.id === newRation.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newRation;
        return copy;
      }
      return [newRation, ...prev];
    });

    const today = new Date().toISOString().split('T')[0];

    if (assignment?.sheepId) {
      setSheepList(prev =>
        prev.map(s => (s.id === assignment.sheepId ? { ...s, assignedRationId: newRation.id } : s))
      );

      const targetSheep = sheepList.find(s => s.id === assignment.sheepId);
      if (targetSheep) {
        const feedLog: FarmLog = {
          id: `log-${Date.now()}`,
          date: today,
          type: 'feeding',
          sheepId: targetSheep.id,
          sheepEarTag: `${targetSheep.earTag} (${targetSheep.name})`,
          penId: targetSheep.penId,
          penName: targetSheep.pen,
          title: `กำหนดสูตรอาหารรายตัว: ${newRation.name}`,
          feedRationName: newRation.name,
          feedAmountKg: newRation.totalAsFedKg,
          recordedBy: activeFarmProfile?.ownerName || 'ผู้ดูแลฟาร์ม',
          notes: `โปรตีน CP ${newRation.calculatedCpPercent}%, TDN ${newRation.calculatedTdnPercent}%, ต้นทุน ${newRation.costPerHeadPerDay.toFixed(1)} ฿/วัน`,
        };
        setLogs(prev => [feedLog, ...prev]);
      }
    } else if (assignment?.penId) {
      const targetPen = livePens.find(p => p.id === assignment.penId);
      const penSheepCount = sheepList.filter(s => s.penId === assignment.penId).length;

      setSheepList(prev =>
        prev.map(s => (s.penId === assignment.penId ? { ...s, assignedRationId: newRation.id } : s))
      );

      if (targetPen) {
        const totalPenFeedKg = Number((newRation.totalAsFedKg * Math.max(1, penSheepCount)).toFixed(1));
        const feedLog: FarmLog = {
          id: `log-${Date.now()}`,
          date: today,
          type: 'feeding',
          penId: targetPen.id,
          penName: targetPen.code,
          title: `กำหนดสูตรอาหารทั้ง ${targetPen.code} (${penSheepCount} ตัว): ${newRation.name}`,
          feedRationName: newRation.name,
          feedAmountKg: totalPenFeedKg,
          recordedBy: activeFarmProfile?.ownerName || 'ผู้ดูแลฟาร์ม',
          notes: `เฉลี่ย ${newRation.totalAsFedKg.toFixed(2)} กก./ตัว/วัน · รวม ${totalPenFeedKg} กก./คอก · CP ${newRation.calculatedCpPercent}% · TDN ${newRation.calculatedTdnPercent}%`,
        };
        setLogs(prev => [feedLog, ...prev]);
      }
    }
  };

  const handleAddLog = (
    newLogData: Omit<FarmLog, 'id'>,
    syncMeta?: {
      sheepId?: string;
      newWeight?: number;
      assignedRationId?: string;
      markPregnantOnBreeding?: boolean;
    }
  ) => {
    const newLog: FarmLog = {
      ...newLogData,
      feedRationId: syncMeta?.assignedRationId || newLogData.feedRationId,
      id: `log-${Date.now()}`,
    };
    setLogs(prev => [newLog, ...prev]);

    setSheepList(prev =>
      applyActivityLogToSheepList(prev, newLog, {
        assignedRationId: syncMeta?.assignedRationId || newLog.feedRationId,
        markPregnantOnBreeding: syncMeta?.markPregnantOnBreeding ?? true,
        previousLogs: logs,
      })
    );
  };

  const handleDeleteLog = (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  const handleSelectSheepForFormulation = (sheep: Sheep) => {
    setSelectedSheepForCalc(sheep);
    setCurrentTab('calculator');
    setIsAppSheetMode(false);
  };

  const handleSelectRationToEdit = (ration: FormulatedRation) => {
    setSelectedSheepForCalc(null);
    setSelectedRationForCalc(ration);
    setCurrentTab('calculator');
    setIsAppSheetMode(false);
  };

  const handleSelectBreedForRegistration = (breedName: string) => {
    setInitialAddBreed(breedName);
    setInitialOpenAddModal(true);
    setCurrentTab('sheep');
    setIsAppSheetMode(false);
  };

  const handleSelectBreedForFormulation = (_breedName: string) => {
    setSelectedSheepForCalc(null);
    setCurrentTab('calculator');
    setIsAppSheetMode(false);
  };

  // Onlysheeps public listing actions
  const handlePublishListing = async (payload: Partial<Sheep> & { name: string }) => {
    lastLocalMutationAtRef.current = Date.now();
    const created = await publishToOnlysheeps(payload);
    setOnlysheepsListings(prev => [created, ...prev]);
    refreshPublicHub();
  };

  const handleDeleteListing = async (listingId: string) => {
    lastLocalMutationAtRef.current = Date.now();
    await deleteOnlysheepsListing(listingId);
    setOnlysheepsListings(prev => prev.filter(l => l.listingId !== listingId));
    refreshPublicHub();
  };

  // Backup / Reset for active farm only
  const handleImportData = (data: {
    sheep: Sheep[];
    ingredients: FeedIngredient[];
    rations: FormulatedRation[];
    logs: FarmLog[];
  }) => {
    if (!activeFarmProfile) return;
    if (data.sheep) setSheepList(data.sheep);
    if (data.ingredients) setIngredients(data.ingredients);
    if (data.rations) setRations(data.rations);
    if (data.logs) setLogs(data.logs);
  };

  const handleResetToDemoData = async () => {
    if (!activeFarmProfile) return;
    const data = await resetMyFarmData();
    skipNextSaveRef.current = true;
    setFarmPens(data.pens);
    setSheepList(data.sheepList);
    setIngredients(data.ingredients);
    setRations(data.rations);
    setLogs(data.logs);
    refreshPublicHub();
  };

  const handleClearAllData = () => {
    if (!activeFarmProfile) return;
    setSheepList([]);
    setLogs([]);
  };

  const handleUpdateFarmName = (newName: string) => {
    setActiveFarmProfile(prev => (prev ? { ...prev, farmName: newName } : prev));
  };

  const handleUpdateFarmOwner = (newOwner: string) => {
    setActiveFarmProfile(prev => (prev ? { ...prev, ownerName: newOwner } : prev));
  };

  const isPrivateTab = ['sheep', 'calculator', 'ingredients', 'logs', 'dashboard'].includes(currentTab);
  const effectiveMatches = activeFarmProfile ? farmMatches : guestMatches;
  const handleUpdateMatches = (nextMatches: OnlysheepsMatchRecord[]) => {
    if (activeFarmProfile) {
      setFarmMatches(nextMatches);
    } else {
      setGuestMatches(nextMatches);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#24201B] flex flex-col font-sans selection:bg-[#1E3F2B] selection:text-[#FAF6EE] relative overflow-x-hidden">
      {/* Subtle Botanical Leaf & Vine Framing Accents */}
      <svg
        viewBox="0 0 220 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="pointer-events-none select-none hidden xl:block fixed top-36 left-0 w-44 h-44 text-[#1E3F2B] opacity-[0.07] z-0"
      >
        <path d="M-8 32C42 46 78 86 98 148C105 170 118 190 132 204" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M36 52C62 32 92 38 96 66C70 72 48 66 36 52Z" fill="#2E6B47" />
        <path d="M62 96C34 94 22 118 38 140C60 132 70 116 62 96Z" fill="currentColor" />
        <path d="M88 128C118 112 146 122 148 150C120 154 98 144 88 128Z" fill="#2E6B47" />
        <path d="M108 174C82 178 74 198 88 214C106 206 114 190 108 174Z" fill="#4A321F" />
      </svg>

      <svg
        viewBox="0 0 220 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="pointer-events-none select-none hidden xl:block fixed bottom-16 right-0 w-48 h-48 text-[#1E3F2B] opacity-[0.07] z-0"
      >
        <path d="M228 188C178 172 140 132 118 72C110 50 96 30 82 16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M182 166C156 186 126 180 122 152C148 146 170 152 182 166Z" fill="#2E6B47" />
        <path d="M156 122C184 124 196 100 180 78C158 86 148 102 156 122Z" fill="currentColor" />
        <path d="M128 88C98 104 70 94 68 66C96 62 118 72 128 88Z" fill="#2E6B47" />
        <path d="M106 44C132 40 140 20 126 4C108 12 100 28 106 44Z" fill="#4A321F" />
      </svg>

      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isAppSheetMode={isAppSheetMode}
        setIsAppSheetMode={setIsAppSheetMode}
        onOpenLabGuide={() => setIsLabGuideOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        activeFarmProfile={activeFarmProfile}
        totalFarmsCount={publicOverview?.totalFarms ?? 6}
        sheepCount={sheepList.length}
        ingredientCount={ingredients.length}
        rationCount={rations.length}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenGoogleSheet={() => setIsGoogleSheetModalOpen(true)}
      />

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-5 sm:px-8 lg:px-10 py-8 sm:py-10">
        {activeShareId ? (
          <LiveShareReportView
            shareId={activeShareId}
            livePublicOverview={publicOverview}
            onExitShareView={() => {
              setActiveShareId(null);
              if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                url.searchParams.delete('share');
                url.searchParams.delete('v');
                url.searchParams.delete('p');
                url.hash = '';
                window.history.replaceState({}, '', url.pathname + url.search);
              }
            }}
          />
        ) : isHydratingFarm ? (
          <div className="bg-[#FFFDF9] rounded-3xl border border-[#DFCBB3] p-12 text-center space-y-2 max-w-lg mx-auto">
            <p className="text-base font-semibold text-[#1E3F2B]">กำลังเปิดพื้นที่ส่วนตัวของฟาร์ม...</p>
            <p className="text-xs text-[#6E6254]">ตรวจสอบสิทธิ์การเข้าถึงข้อมูลอย่างปลอดภัย</p>
          </div>
        ) : isAppSheetMode ? (
          activeFarmProfile ? (
            <AppSheetSimulator
              sheepList={sheepList}
              ingredients={ingredients}
              rations={rations}
              logs={logs}
              onAddSheep={() => {
                setIsAppSheetMode(false);
                setCurrentTab('sheep');
              }}
              onSelectSheep={handleSelectSheepForFormulation}
              onSelectRation={handleSelectRationToEdit}
            />
          ) : (
            <div className="max-w-4xl mx-auto space-y-5">
              <div className="bg-[#FFF9EB] border border-[#E5D3B3] rounded-2xl p-4 text-xs sm:text-sm text-[#6E4826] flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>โหมดเข้าคอกช่วยให้ดูและจดข้อมูลฟาร์มบนมือถือได้สะดวก กรุณาเข้าสู่ระบบฟาร์มของคุณก่อน</span>
              </div>
              <FarmAuthPanel
                farmDirectory={publicOverview?.farmDirectory ?? []}
                onAuthenticated={handleAuthenticated}
              />
            </div>
          )
        ) : (
          <>
            {currentTab === 'home' && (
              <HomeLanding
                activeFarmProfile={activeFarmProfile}
                publicOverview={publicOverview}
                ownSheepCount={sheepList.length}
                ingredientsCount={ingredients.length}
                logsCount={logs.length}
                cloudSyncStatus={cloudSyncStatus}
                cloudSyncConfigured={cloudSyncConfigured}
                onRetryCloudSync={() => void flushFarmSave()}
                onNavigateTab={setCurrentTab}
                onAuthenticated={handleAuthenticated}
                onLogout={handleLogout}
                onOpenGoogleSheet={() => setIsGoogleSheetModalOpen(true)}
              />
            )}

            {currentTab === 'breeds' && (
              <BreedsCatalog
                onSelectBreedForRegistration={handleSelectBreedForRegistration}
                onSelectBreedForFormulation={handleSelectBreedForFormulation}
              />
            )}

            {currentTab === 'onlysheeps' && (
              <OnlysheepsView
                activeFarmProfile={activeFarmProfile}
                ownSheepList={sheepList}
                onlysheepsListings={onlysheepsListings}
                matches={effectiveMatches}
                onUpdateMatches={handleUpdateMatches}
                onPublishListing={handlePublishListing}
                onDeleteListing={handleDeleteListing}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
              />
            )}

            {/* STRICT PRIVATE FARM WORKSPACE GATE */}
            {isPrivateTab && !activeFarmProfile && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-[#FAF6EE] border-2 border-[#4A321F]/35 rounded-2xl p-5 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[#1E3F2B] shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-[#5C5346]">
                    <strong className="text-[#1E3F2B] block text-sm sm:text-base">
                      เข้าสู่ระบบฟาร์มของคุณเพื่อจัดการข้อมูลในหมวดนี้
                    </strong>
                    เข้าสู่ระบบด้วยบัญชีฟาร์มของคุณ หรือสมัครเปิดฟาร์มใหม่ได้ทันทีด้านล่าง เพื่อบันทึกทะเบียนแกะ สูตรอาหาร และต้นทุนฟาร์ม
                  </div>
                </div>

                <FarmAuthPanel
                  farmDirectory={publicOverview?.farmDirectory ?? []}
                  onAuthenticated={handleAuthenticated}
                />
              </div>
            )}

            {currentTab === 'sheep' && activeFarmProfile && (
              <SheepDirectory
                farmName={activeFarmProfile.farmName}
                pens={livePens}
                sheepList={sheepList}
                rations={rations}
                onAddSheep={handleAddSheep}
                onUpdateSheep={handleUpdateSheep}
                onDeleteSheep={handleDeleteSheep}
                onAddPen={handleAddPen}
                onDeletePen={handleDeletePen}
                onSelectSheepForFormulation={handleSelectSheepForFormulation}
                onOpenOnlysheeps={() => {
                  setCurrentTab('onlysheeps');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                initialAddBreed={initialAddBreed}
                initialOpenAddModal={initialOpenAddModal}
              />
            )}

            {currentTab === 'calculator' && activeFarmProfile && (
              <FeedCalculator
                pens={livePens}
                sheepList={sheepList}
                ingredients={ingredients}
                rations={rations}
                selectedSheepForCalc={selectedSheepForCalc}
                selectedRationToEdit={selectedRationForCalc}
                onClearSelectedSheep={() => setSelectedSheepForCalc(null)}
                onClearSelectedRation={() => setSelectedRationForCalc(null)}
                onAddIngredientAndUse={handleAddIngredient}
                onSaveRation={handleSaveRation}
              />
            )}

            {currentTab === 'ingredients' && activeFarmProfile && (
              <IngredientsManager
                ingredients={ingredients}
                onAddIngredient={handleAddIngredient}
                onUpdateIngredient={handleUpdateIngredient}
                onDeleteIngredient={handleDeleteIngredient}
              />
            )}

            {currentTab === 'logs' && activeFarmProfile && (
              <FarmLogs
                logs={logs}
                sheepList={sheepList}
                pens={livePens}
                rations={rations}
                onAddLog={handleAddLog}
                onDeleteLog={handleDeleteLog}
              />
            )}

            {currentTab === 'dashboard' && activeFarmProfile && (
              <DashboardView
                pens={livePens}
                sheepList={sheepList}
                rations={rations}
                onSelectRationToEdit={handleSelectRationToEdit}
                onNavigateToTab={setCurrentTab}
              />
            )}
          </>
        )}
      </main>

      {/* Farm Login / Register Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#24201B]/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-4xl w-full relative max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-[#FAF6EE] hover:bg-[#EFE6D5] text-[#24201B] border border-[#DFCBB3] flex items-center justify-center cursor-pointer"
              aria-label="ปิดหน้าต่างเข้าสู่ระบบ"
            >
              <X className="w-4 h-4" />
            </button>
            <FarmAuthPanel
              farmDirectory={publicOverview?.farmDirectory ?? []}
              onAuthenticated={handleAuthenticated}
            />
          </div>
        </div>
      )}

      <SharePublicModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        publicUrl={PUBLIC_APP_URL}
        cloudSyncConfigured={cloudSyncConfigured}
        farmName={activeFarmProfile?.farmName || 'Ovispro Multi-Farm Hub'}
        setFarmName={handleUpdateFarmName}
        farmOwner={activeFarmProfile?.ownerName || 'ผู้จัดการฟาร์ม'}
        setFarmOwner={handleUpdateFarmOwner}
        sheepList={sheepList}
        ingredients={ingredients}
        rations={rations}
        logs={logs}
        onImportData={handleImportData}
        onResetToDemoData={handleResetToDemoData}
        onClearAllData={handleClearAllData}
      />

      <LabGuideModal
        isOpen={isLabGuideOpen}
        onClose={() => setIsLabGuideOpen(false)}
      />

      {activeFarmProfile && (
        <FarmGoogleSheetModal
          isOpen={isGoogleSheetModalOpen}
          onClose={() => setIsGoogleSheetModalOpen(false)}
          farmProfile={activeFarmProfile}
          sheepList={sheepList}
          ingredients={ingredients}
          rations={rations}
          logs={logs}
          onProfileUpdated={updated => {
            setActiveFarmProfile(updated);
          }}
        />
      )}

      <RealtimeToastStack toasts={realtimeToasts} onDismiss={dismissToast} />

      <footer className="bg-[#F3ECE0] text-[#5C5346] text-xs py-7 px-6 border-t border-[#E5DEC9]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <img
              src="/assets/logo/ovispro_playful_logo.jpg"
              alt="Ovispro"
              className="w-8 h-8 rounded-full object-cover border border-[#DFCBB3]"
            />
            <div>
              <span className="font-brand italic font-semibold text-[#1E3F2B] text-base tracking-wide">
                Ovispro
              </span>
              <span className="text-[#6E6254] ml-2">
                — แพลตฟอร์มจัดการฟาร์มแกะขนครบวงจร คำนวณอาหารแม่นยำ พร้อมเครือข่าย Onlysheeps
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[#6E6254] text-xs">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="text-[#1E3F2B] hover:text-[#9C6B3F] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>แชร์ลิงก์ / QR Code</span>
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsLabGuideOpen(true)}
              className="text-[#1E3F2B] hover:text-[#9C6B3F] font-semibold cursor-pointer transition-colors"
            >
              คู่มือโภชนาการแกะ
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
