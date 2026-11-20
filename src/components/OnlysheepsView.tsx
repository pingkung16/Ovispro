/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Heart,
  X,
  RotateCcw,
  Star,
  Sparkles,
  MapPin,
  Phone,
  Plus,
  Dna,
  Scissors,
  ShieldCheck,
  Info,
  Flame,
  MessageCircleHeart,
  CheckCircle2,
  Trash2,
  LogIn,
} from 'lucide-react';
import type {
  FarmProfile,
  OnlysheepsListing,
  OnlysheepsMatchRecord,
  Sheep,
} from '../types/sheep';
import { getBreedPhoto } from '../data/breedPhotos';
import onlysheepsCupidLogo from '../assets/images/onlysheeps_cupid_logo_1794824689407.jpg';

interface OnlysheepsViewProps {
  activeFarmProfile: FarmProfile | null;
  ownSheepList: Sheep[];
  onlysheepsListings: OnlysheepsListing[];
  matches: OnlysheepsMatchRecord[];
  onUpdateMatches: (nextMatches: OnlysheepsMatchRecord[]) => void;
  onPublishListing: (payload: Partial<Sheep> & { name: string }) => Promise<void>;
  onDeleteListing: (listingId: string) => Promise<void>;
  onOpenAuthModal: () => void;
}

const DecorativeRoseVine: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 160 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M8 104C40 84 68 46 112 28C128 21 142 14 152 6"
      stroke="#BE185D"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <circle cx="38" cy="76" r="14" fill="#F43F5E" fillOpacity="0.82" />
    <circle cx="38" cy="76" r="8" fill="#FB7185" />
    <circle cx="38" cy="76" r="4" fill="#FFE4E6" />
    <circle cx="96" cy="36" r="16" fill="#DB2777" fillOpacity="0.85" />
    <circle cx="96" cy="36" r="9" fill="#F472B6" />
    <circle cx="96" cy="36" r="4.5" fill="#FDF2F8" />
    <path d="M56 54C52 38 66 28 76 38C70 50 62 54 56 54Z" fill="#EC4899" fillOpacity="0.55" />
    <path d="M114 48C128 48 136 60 124 70C114 64 112 54 114 48Z" fill="#F43F5E" fillOpacity="0.45" />
    <path
      d="M136 16C136 11.5 142 10 144.5 13.5C147 10 153 11.5 153 16C153 21.5 144.5 26 144.5 26C144.5 26 136 21.5 136 16Z"
      fill="#E11D48"
    />
  </svg>
);

const getQualitativeSynergyNote = (sheep: OnlysheepsListing): string => {
  if (sheep.breed.includes('เมอริโน')) {
    return 'โดดเด่นด้านยีนส์ขนละเอียดพิเศษ (<19 µm) เหมาะจับคู่เพื่อยกระดับความนุ่มละเอียดของขนรุ่นลูก F1';
  }
  if (sheep.breed.includes('แฮมป์เชียร์')) {
    return 'โดดเด่นด้านโครงสร้างใหญ่และการเจริญเติบโตไว (ADG สูง) เหมาะผสมข้ามสายเพิ่มน้ำหนักตัวและปริมาณขน';
  }
  return 'เด่นเรื่องความสมบูรณ์พันธุ์ ผสมได้ตลอดทั้งปีไม่จำกัดฤดู และถ่ายทอดลักษณะเลี้ยงลูกเก่ง-ขนขาวสะอาด';
};

const getRomanticBioForSheep = (sheep: OnlysheepsListing): string => {
  if (sheep.romanticBio) return sheep.romanticBio;
  if (sheep.gender === 'male') {
    return `พ่อพันธุ์สาย${sheep.breed.split(' ')[0]} ขนสวย${sheep.woolMicron ? ` ${sheep.woolMicron} µm` : ''} พร้อมส่งความอบอุ่นและทายาทคุณภาพให้แม่พันธุ์คนพิเศษนะครับ 🐑😘💘`;
  }
  return `สาวน้อย${sheep.breed.split(' ')[0]} ขนนุ่มชวนหลงใหล สุขภาพดีแข็งแรง มองหาพ่อพันธุ์คุณภาพมาร่วมสร้างคอกแสนหวานด้วยกันค่ะ 🌹💋`;
};

const getBreedingHighlightForSheep = (sheep: OnlysheepsListing): string => {
  if (sheep.breedingHighlight) return sheep.breedingHighlight;
  if (sheep.gender === 'male') {
    return `จ่ายลูกโครงสร้างสมส่วน ADG เฉลี่ย +${sheep.currentAdgGrams || 195} ก./วัน เส้นขนสม่ำเสมอ`;
  }
  return `แม่พันธุ์สุขภาพดี BCS ${sheep.bcs.toFixed(1)} พร้อมรับการผสมพันธุ์และให้นมลูกสมบูรณ์`;
};

export const OnlysheepsView: React.FC<OnlysheepsViewProps> = ({
  activeFarmProfile,
  ownSheepList,
  onlysheepsListings,
  matches,
  onUpdateMatches,
  onPublishListing,
  onDeleteListing,
  onOpenAuthModal,
}) => {
  const [subTab, setSubTab] = useState<'swipe' | 'matches' | 'my_listings'>('swipe');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [breedFilter, setBreedFilter] = useState<string>('all');
  const [deletingListingId, setDeletingListingId] = useState<string | null>(null);

  const [passedIds, setPassedIds] = useState<string[]>([]);
  const [historyStack, setHistoryStack] = useState<
    Array<{ sheep: OnlysheepsListing; action: 'pass' | 'like' | 'super_kiss' }>
  >([]);
  const [showMobileDossier, setShowMobileDossier] = useState(false);

  // Match celebration modal
  const [celebratingMatch, setCelebratingMatch] = useState<OnlysheepsMatchRecord | null>(null);
  const [matchNoteDraft, setMatchNoteDraft] = useState('');
  const [savedToast, setSavedToast] = useState<string | null>(null);

  // Publish Sheep Modal (Onlysheeps Hub)
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [selectedOwnSheepId, setSelectedOwnSheepId] = useState<string>('custom');
  const [pName, setPName] = useState('');
  const [pEarTag, setPEarTag] = useState('');
  const [pBreed, setPBreed] = useState('เมอริโน (Merino)');
  const [pGender, setPGender] = useState<'male' | 'female'>('male');
  const [pAgeMonths, setPAgeMonths] = useState(24);
  const [pWeightKg, setPWeightKg] = useState(78);
  const [pMicron, setPMicron] = useState(18.5);
  const [pFleeceKg, setPFleeceKg] = useState(6.8);
  const [pLambingPct, setPLambingPct] = useState('ผสมติดง่าย · ลูกแฝดแข็งแรง');
  const [pOwnerContact, setPOwnerContact] = useState('');
  const [pBreedingHighlight, setPBreedingHighlight] = useState('');
  const [pRomanticBio, setPRomanticBio] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // Pointer drag state for Tinder physics
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [flyOutDir, setFlyOutDir] = useState<'left' | 'right' | 'up' | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 3500);
  };

  // Pre-fill selected sheep from current farm's private flock
  const handleSelectOwnSheep = (sheepId: string) => {
    setSelectedOwnSheepId(sheepId);
    if (sheepId === 'custom') return;
    const found = ownSheepList.find(s => s.id === sheepId);
    if (found) {
      setPName(found.name);
      setPEarTag(found.earTag);
      setPBreed(found.breed);
      setPGender(found.gender);
      setPAgeMonths(found.ageMonths);
      setPWeightKg(found.weightKg);
      setPMicron(found.woolMicron || 19.5);
      setPFleeceKg(found.fleeceYieldKg || 6.0);
      setPOwnerContact(activeFarmProfile?.contact || '');
    }
  };

  const swipedOutIds = useMemo(() => {
    const matchIds = new Set(matches.map(m => m.sheep.listingId));
    const passSet = new Set(passedIds);
    return new Set([...matchIds, ...passSet]);
  }, [matches, passedIds]);

  const myListings = useMemo(() => {
    if (!activeFarmProfile) return [];
    return onlysheepsListings.filter(item => item.ownerFarmId === activeFarmProfile.farmId);
  }, [onlysheepsListings, activeFarmProfile]);

  // Never show own farm's sheep in the swipe/match deck
  const deck = useMemo(() => {
    return onlysheepsListings.filter(item => {
      if (swipedOutIds.has(item.listingId)) return false;
      if (activeFarmProfile && item.ownerFarmId === activeFarmProfile.farmId) return false;
      if (genderFilter !== 'all' && item.gender !== genderFilter) return false;
      if (breedFilter !== 'all' && !item.breed.includes(breedFilter)) return false;
      return true;
    });
  }, [onlysheepsListings, swipedOutIds, activeFarmProfile, genderFilter, breedFilter]);

  const topSheep = deck[0] || null;
  const secondSheep = deck[1] || null;
  const thirdSheep = deck[2] || null;

  const commitSwipe = useCallback(
    (direction: 'left' | 'right' | 'up') => {
      if (!topSheep || flyOutDir) return;
      const target = topSheep;
      setFlyOutDir(direction);
      setIsDragging(false);

      setTimeout(() => {
        if (direction === 'left') {
          setPassedIds(prev => [...prev, target.listingId]);
          setHistoryStack(prev => [...prev, { sheep: target, action: 'pass' }]);
        } else {
          const matchType = direction === 'up' ? 'super_kiss' : 'like';
          const newMatch: OnlysheepsMatchRecord = {
            id: `match-${Date.now()}-${target.listingId}`,
            sheep: target,
            matchedAt: new Date().toLocaleDateString('th-TH', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }),
            matchType,
            synergyNote: getQualitativeSynergyNote(target),
          };
          onUpdateMatches([newMatch, ...matches]);
          setHistoryStack(prev => [...prev, { sheep: target, action: matchType }]);

          const shouldCelebrate =
            direction === 'up' || target.listingId.charCodeAt(target.listingId.length - 1) % 2 === 0;
          if (shouldCelebrate) {
            setMatchNoteDraft('');
            setCelebratingMatch(newMatch);
          }
        }

        setFlyOutDir(null);
        setDragOffset({ x: 0, y: 0 });
        setShowMobileDossier(false);
      }, 240);
    },
    [topSheep, flyOutDir, matches, onUpdateMatches]
  );

  const handleRewind = useCallback(() => {
    if (historyStack.length === 0 || flyOutDir) return;
    const last = historyStack[historyStack.length - 1];
    setHistoryStack(prev => prev.slice(0, -1));
    if (last.action === 'pass') {
      setPassedIds(prev => prev.filter(id => id !== last.sheep.listingId));
    } else {
      onUpdateMatches(matches.filter(m => m.sheep.listingId !== last.sheep.listingId));
    }
    setDragOffset({ x: 0, y: 0 });
  }, [historyStack, flyOutDir, matches, onUpdateMatches]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        subTab !== 'swipe' ||
        isPublishModalOpen ||
        celebratingMatch ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName || '')
      ) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        commitSwipe('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        commitSwipe('right');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        commitSwipe('up');
      } else if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleRewind();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [subTab, isPublishModalOpen, celebratingMatch, commitSwipe, handleRewind]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (flyOutDir || !topSheep) return;
    if ((e.target as HTMLElement).closest('button')) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current || flyOutDir) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setDragOffset({ x: dx, y: dy });
  };

  const handlePointerUp = () => {
    if (!isDragging || !dragStartRef.current) return;
    const elapsed = Date.now() - dragStartRef.current.time;
    const velocityX = Math.abs(dragOffset.x) / Math.max(elapsed, 1);

    if (dragOffset.x > 105 || (dragOffset.x > 55 && velocityX > 0.45)) {
      commitSwipe('right');
    } else if (dragOffset.x < -105 || (dragOffset.x < -55 && velocityX > 0.45)) {
      commitSwipe('left');
    } else if (dragOffset.y < -110) {
      commitSwipe('up');
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleResetPasses = () => {
    setPassedIds([]);
    setHistoryStack([]);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleRemoveMatch = (matchId: string) => {
    onUpdateMatches(matches.filter(m => m.id !== matchId));
  };

  const handleSaveScheduledNote = () => {
    if (!celebratingMatch) return;
    const noteToSave =
      matchNoteDraft.trim() || 'สนใจนัดดูพ่อ/แม่พันธุ์เพื่อจับคู่ผสมพันธุ์ข้ามฟาร์ม 🌹';
    onUpdateMatches(
      matches.map(m => (m.id === celebratingMatch.id ? { ...m, scheduledNote: noteToSave } : m))
    );
    setCelebratingMatch(null);
    showToast(`บันทึกการนัดหมายรักกับ "${celebratingMatch.sheep.name}" เรียบร้อยแล้ว 💘`);
  };

  const handleOpenPublishModal = () => {
    if (!activeFarmProfile) {
      onOpenAuthModal();
      return;
    }
    setSelectedOwnSheepId('custom');
    setPName('');
    setPEarTag('');
    setPOwnerContact(activeFarmProfile.contact || '');
    setPBreedingHighlight('');
    setPRomanticBio('');
    setIsPublishModalOpen(true);
  };

  const handleWithdrawListing = async (listing: OnlysheepsListing) => {
    setDeletingListingId(listing.listingId);
    try {
      await onDeleteListing(listing.listingId);
      showToast(`นำ "${listing.name}" ออกจาก Onlysheeps แล้ว`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'ไม่สามารถนำแกะออกจากรายการได้');
    } finally {
      setDeletingListingId(null);
    }
  };

  const handleSubmitPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim() || !activeFarmProfile) return;
    setIsPublishing(true);
    try {
      await onPublishListing({
        name: pName.trim(),
        earTag: pEarTag.trim() || undefined,
        breed: pBreed,
        gender: pGender,
        ageMonths: Number(pAgeMonths) || 24,
        weightKg: Number(pWeightKg) || 72,
        woolMicron: Number(pMicron) || 19.2,
        fleeceYieldKg: Number(pFleeceKg) || 6.2,
        lambingRatePct: pLambingPct.trim(),
        ownerContact: pOwnerContact.trim() || activeFarmProfile.contact,
        breedingHighlight: pBreedingHighlight.trim(),
        romanticBio: pRomanticBio.trim(),
      });
      setGenderFilter('all');
      setBreedFilter('all');
      setSubTab('my_listings');
      setIsPublishModalOpen(false);
      showToast(`ส่ง "${pName.trim()}" ของ${activeFarmProfile.farmName} ขึ้นการ์ด Onlysheeps แล้ว 🐑😘💘`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'ไม่สามารถลงประกาศได้');
    } finally {
      setIsPublishing(false);
    }
  };

  const cardTransformStyle = useMemo(() => {
    if (flyOutDir === 'right') {
      return {
        transform: 'translate3d(520px, 40px, 0) rotate(24deg)',
        opacity: 0,
        transition: 'transform 240ms ease-out, opacity 240ms ease-out',
      };
    }
    if (flyOutDir === 'left') {
      return {
        transform: 'translate3d(-520px, 40px, 0) rotate(-24deg)',
        opacity: 0,
        transition: 'transform 240ms ease-out, opacity 240ms ease-out',
      };
    }
    if (flyOutDir === 'up') {
      return {
        transform: 'translate3d(0, -520px, 0) scale(1.06)',
        opacity: 0,
        transition: 'transform 240ms ease-out, opacity 240ms ease-out',
      };
    }
    const rotate = dragOffset.x * 0.045;
    return {
      transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotate}deg)`,
      transition: isDragging ? 'none' : 'transform 280ms cubic-bezier(0.16, 1, 0.3, 1)',
    };
  }, [flyOutDir, dragOffset, isDragging]);

  const likeStampOpacity = flyOutDir === 'right' ? 1 : Math.min(1, Math.max(0, (dragOffset.x - 24) / 85));
  const nopeStampOpacity = flyOutDir === 'left' ? 1 : Math.min(1, Math.max(0, (-dragOffset.x - 24) / 85));
  const superStampOpacity = flyOutDir === 'up' ? 1 : Math.min(1, Math.max(0, (-dragOffset.y - 30) / 85));
  const dragProgress = Math.min(1, Math.hypot(dragOffset.x, dragOffset.y) / 140);

  const isTopMine = Boolean(topSheep && activeFarmProfile && topSheep.ownerFarmId === activeFarmProfile.farmId);

  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#FFF0F6] via-[#FFE2EF] to-[#FCE7F3] border-[3px] border-[#F472B6] shadow-2xl shadow-[#DB2777]/15 p-4 sm:p-8 lg:p-10 space-y-7 text-[#500724]">
      <DecorativeRoseVine className="pointer-events-none select-none absolute -top-2 -left-2 w-36 sm:w-44 opacity-80" />
      <DecorativeRoseVine className="pointer-events-none select-none absolute -top-2 -right-2 w-36 sm:w-44 opacity-80 -scale-x-100" />
      <div
        aria-hidden="true"
        className="pointer-events-none select-none hidden md:block absolute top-32 right-8 text-2xl opacity-45 onlysheeps-float"
      >
        💘
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none select-none hidden md:block absolute bottom-12 left-7 text-3xl opacity-45 onlysheeps-float"
      >
        🌹
      </div>

      {savedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#9D174D] text-white px-5 py-3.5 rounded-2xl shadow-xl border-2 border-[#FBCFE8] flex items-center gap-2.5 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-[#FBCFE8] shrink-0" />
          <span>{savedToast}</span>
        </div>
      )}

      {/* 1. ROMANTIC ONLYSHEEPS HEADER */}
      <section className="relative z-10 bg-white/85 backdrop-blur-md rounded-2xl border-2 border-[#F9A8D4] p-5 sm:p-6 shadow-md shadow-[#DB2777]/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-[3px] border-[#DB2777] shadow-lg shadow-[#DB2777]/30 shrink-0 bg-[#FFF0F6]">
              <img
                src={onlysheepsCupidLogo}
                alt="Onlysheeps Cupid Kissing Sheep Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#DB2777] to-[#E11D48] text-white px-3 py-1 rounded-full text-xs font-semibold shadow-xs">
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span>Onlysheeps · แกะส่งจุ้บ 🐑😘</span>
                </span>
                <span className="text-xs font-semibold text-[#9D174D]">
                  พื้นที่สาธารณะจับคู่ผสมพันธุ์ข้ามฟาร์ม 💘🌹
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-[#831843] tracking-tight mt-1.5 flex items-center gap-2">
                <span>ปัดขวาจับคู่รักแกะขน</span>
                <span className="text-2xl sm:text-3xl" aria-hidden="true">🐑😘💖</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#9D174D]/90 mt-0.5">
                ดูเฉพาะโปรไฟล์แกะที่แต่ละฟาร์มเลือกส่งขึ้นหาคู่ ({onlysheepsListings.length} ตัว) — ข้อมูลภายในอื่นของฟาร์มยังเป็นความลับ 100%
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-[#FCE7F3] p-1 rounded-xl border border-[#F472B6] flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setSubTab('swipe')}
                className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  subTab === 'swipe'
                    ? 'bg-[#DB2777] text-white shadow-sm'
                    : 'text-[#9D174D] hover:bg-white/60'
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>ปัดเลือกคู่ ({deck.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSubTab('matches')}
                className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  subTab === 'matches'
                    ? 'bg-[#DB2777] text-white shadow-sm'
                    : 'text-[#9D174D] hover:bg-white/60'
                }`}
              >
                <MessageCircleHeart className="w-4 h-4" />
                <span>คู่แมตช์หัวใจ ({matches.length})</span>
              </button>

              {activeFarmProfile && (
                <button
                  type="button"
                  onClick={() => setSubTab('my_listings')}
                  className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    subTab === 'my_listings'
                      ? 'bg-[#BE185D] text-white shadow-sm'
                      : 'text-[#9D174D] hover:bg-white/60'
                  }`}
                >
                  <Scissors className="w-4 h-4" />
                  <span>แกะฟาร์มเราที่ลงไว้ ({myListings.length})</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleOpenPublishModal}
              className="tactile-pink-btn min-h-[44px] bg-gradient-to-r from-[#E11D48] via-[#DB2777] to-[#EC4899] text-white px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              {activeFarmProfile ? <Plus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              <span>
                {activeFarmProfile
                  ? `ส่งแกะของ ${activeFarmProfile.farmName} ลง Onlysheeps`
                  : 'เข้าสู่ระบบฟาร์มเพื่อส่งแกะลง Onlysheeps'}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. SWIPE MODE */}
      {subTab === 'swipe' && (
        <div className="relative z-10 space-y-6">
          <div className="bg-white/80 backdrop-blur-xs rounded-2xl border border-[#F9A8D4] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-[#9D174D]">
                {activeFarmProfile
                  ? `คัดกรองเฉพาะแกะจากฟาร์มอื่น (${deck.length} ตัว — ซ่อนแกะของ ${activeFarmProfile.farmName} อัตโนมัติ)`
                  : `แกะหาคู่ทั้งหมดในเครือข่าย (${deck.length} ตัว)`}
              </span>
              {activeFarmProfile && myListings.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSubTab('my_listings')}
                  className="text-xs font-semibold text-[#BE185D] bg-[#FFF0F6] hover:bg-[#FCE7F3] border border-[#F472B6] px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                >
                  จัดการ/เอาแกะฟาร์มเราออก ({myListings.length}) →
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={genderFilter}
                onChange={e => setGenderFilter(e.target.value as 'all' | 'male' | 'female')}
                aria-label="กรองเพศแกะ"
                className="min-h-[36px] bg-[#FFF0F6] border border-[#F472B6] text-[#831843] rounded-xl px-3 py-1.5 font-semibold focus:outline-none focus:ring-2 focus:ring-[#DB2777]"
              >
                <option value="all">ทุกเพศ (♂ + ♀)</option>
                <option value="male">เฉพาะพ่อพันธุ์ ♂</option>
                <option value="female">เฉพาะแม่พันธุ์ ♀</option>
              </select>

              <select
                value={breedFilter}
                onChange={e => setBreedFilter(e.target.value)}
                aria-label="กรองสายพันธุ์แกะ"
                className="min-h-[36px] bg-[#FFF0F6] border border-[#F472B6] text-[#831843] rounded-xl px-3 py-1.5 font-semibold focus:outline-none focus:ring-2 focus:ring-[#DB2777]"
              >
                <option value="all">ทุกสายพันธุ์ขน</option>
                <option value="เมอริโน">เมอริโน (Merino)</option>
                <option value="แฮมป์เชียร์">แฮมป์เชียร์ (Hampshire)</option>
                <option value="ดอร์เซท">ดอร์เซท (Dorset)</option>
              </select>
            </div>
          </div>

          {topSheep ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-9 items-start">
              {/* LEFT: TINDER SWIPE DECK */}
              <div className="lg:col-span-6 xl:col-span-5 flex flex-col items-center">
                <div className="relative w-full max-w-[410px] h-[535px] sm:h-[560px] select-none">
                  {thirdSheep && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 rounded-3xl bg-white border-2 border-[#FBCFE8] shadow-md pointer-events-none"
                      style={{
                        transform: `translate3d(0, ${16 - dragProgress * 8}px, 0) scale(${0.92 + dragProgress * 0.04})`,
                        opacity: 0.72,
                      }}
                    />
                  )}

                  {secondSheep && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 rounded-3xl bg-white border-2 border-[#F9A8D4] shadow-lg overflow-hidden pointer-events-none"
                      style={{
                        transform: `translate3d(0, ${8 - dragProgress * 8}px, 0) scale(${0.96 + dragProgress * 0.04})`,
                        transition: isDragging ? 'none' : 'transform 220ms ease-out',
                      }}
                    >
                      <img
                        src={secondSheep.photoUrl || getBreedPhoto(secondSheep.breed)}
                        alt=""
                        className="w-full h-3/4 object-cover opacity-80"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  <div
                    ref={cardRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    style={cardTransformStyle}
                    className="absolute inset-0 rounded-3xl bg-white border-[3px] border-[#DB2777] shadow-2xl shadow-[#9D174D]/25 overflow-hidden flex flex-col cursor-grab active:cursor-grabbing touch-none"
                  >
                    <div className="relative h-[62%] w-full bg-[#FCE7F3] overflow-hidden shrink-0">
                      <img
                        src={topSheep.photoUrl || getBreedPhoto(topSheep.breed)}
                        alt={topSheep.name}
                        className="w-full h-full object-cover pointer-events-none"
                        referrerPolicy="no-referrer"
                        draggable={false}
                      />
                      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/45 to-transparent pointer-events-none" />
                      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#500724]/92 via-[#831843]/55 to-transparent pointer-events-none" />

                      <div
                        style={{ opacity: likeStampOpacity }}
                        className="pointer-events-none absolute top-7 left-5 -rotate-12 border-[4px] border-[#10B981] bg-[#ECFDF5]/92 text-[#047857] px-4 py-1.5 rounded-2xl font-extrabold text-xl tracking-wider shadow-lg"
                      >
                        LIKE 🐑😘💘
                      </div>

                      <div
                        style={{ opacity: nopeStampOpacity }}
                        className="pointer-events-none absolute top-7 right-5 rotate-12 border-[4px] border-[#E11D48] bg-[#FFF1F2]/92 text-[#BE123C] px-4 py-1.5 rounded-2xl font-extrabold text-xl tracking-wider shadow-lg"
                      >
                        NOPE 💔
                      </div>

                      <div
                        style={{ opacity: superStampOpacity }}
                        className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 -rotate-3 border-[4px] border-[#F59E0B] bg-gradient-to-r from-[#FDF2F8] to-[#FEF3C7] text-[#BE185D] px-5 py-1.5 rounded-2xl font-extrabold text-lg tracking-wider shadow-xl whitespace-nowrap"
                      >
                        SUPER KISS ★🐑😘
                      </div>

                      <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between gap-2">
                        <span
                          className={`px-3 py-1 rounded-xl text-xs font-bold backdrop-blur-md shadow-xs truncate max-w-[68%] ${
                            isTopMine
                              ? 'bg-[#FFFDF9]/95 text-[#1E3F2B] border border-[#1E3F2B]/30'
                              : 'bg-[#DB2777]/90 text-white border border-pink-200/60'
                          }`}
                        >
                          {isTopMine ? '🏡 ฟาร์มเรา · ' : '🌹 '}
                          {topSheep.farmName}
                        </span>

                        <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white/92 text-[#9D174D] shrink-0">
                          {topSheep.gender === 'male' ? '♂ พ่อพันธุ์' : '♀ แม่พันธุ์'}
                        </span>
                      </div>

                      <div className="absolute bottom-3.5 inset-x-4 flex items-end justify-between gap-3 text-white">
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <h2 className="text-xl sm:text-2xl font-bold truncate drop-shadow-sm">
                              {topSheep.name}
                            </h2>
                            <span className="font-mono text-base font-semibold text-[#FBCFE8] shrink-0">
                              {topSheep.ageMonths} ด.
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#FCE7F3] mt-0.5">
                            <span className="font-semibold">{topSheep.breed}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono">{topSheep.earTag}</span>
                            {topSheep.farmLocation && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3" />
                                  {topSheep.farmLocation}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowMobileDossier(prev => !prev)}
                          title="ดูข้อมูลคุณภาพเต็ม"
                          className="lg:hidden w-10 h-10 rounded-full bg-white/25 hover:bg-white/35 backdrop-blur-md border border-white/50 flex items-center justify-center text-white shrink-0 cursor-pointer"
                        >
                          <Info className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 p-4 sm:p-5 bg-gradient-to-b from-white to-[#FFF5F9] flex flex-col justify-between gap-2.5">
                      <div className="grid grid-cols-3 gap-2 text-center bg-[#FFF0F6] border border-[#FBCFE8] rounded-2xl py-2 px-2">
                        <div>
                          <span className="text-[11px] text-[#9D174D] block">ความละเอียดขน</span>
                          <strong className="font-mono text-sm font-bold text-[#BE185D]">
                            {topSheep.woolMicron ? `${topSheep.woolMicron} µm` : '19.5 µm'}
                          </strong>
                        </div>
                        <div className="border-x border-[#FBCFE8]">
                          <span className="text-[11px] text-[#9D174D] block">ขนตัดต่อปี</span>
                          <strong className="font-mono text-sm font-bold text-[#831843]">
                            {topSheep.fleeceYieldKg ? `${topSheep.fleeceYieldKg} กก.` : '6.0 กก.'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[11px] text-[#9D174D] block">น้ำหนักตัว</span>
                          <strong className="font-mono text-sm font-bold text-[#BE185D]">
                            {topSheep.weightKg} กก.
                          </strong>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-[#701A3C] leading-snug line-clamp-3 italic">
                        “{getRomanticBioForSheep(topSheep)}”
                      </p>

                      <div className="text-[11px] font-semibold text-[#9D174D] bg-[#FCE7F3]/80 border border-[#F9A8D4]/70 rounded-xl px-3 py-1.5 truncate">
                        💘 จุดเด่นผสมพันธุ์: {getBreedingHighlightForSheep(topSheep)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="mt-5 flex items-center justify-center gap-3.5 sm:gap-5">
                  <button
                    type="button"
                    onClick={handleRewind}
                    disabled={historyStack.length === 0}
                    title="ย้อนกลับตัวเมื่อกี้ (ปุ่ม Z)"
                    className="w-12 h-12 rounded-full bg-white border-2 border-[#F59E0B] text-[#D97706] shadow-md hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-transform cursor-pointer"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => commitSwipe('left')}
                    title="ขอผ่านก่อน (ปุ่มลูกศรซ้าย)"
                    className="w-16 h-16 rounded-full bg-white border-2 border-[#FB7185] text-[#E11D48] shadow-lg shadow-[#E11D48]/15 hover:scale-108 active:scale-95 flex items-center justify-center transition-transform cursor-pointer"
                  >
                    <X className="w-8 h-8 stroke-[2.75]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => commitSwipe('up')}
                    title="ส่ง Super Kiss แกะส่งจุ้บ 🐑😘 (ปุ่มลูกศรขึ้น)"
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-[#F472B6] to-[#DB2777] border-2 border-white text-white shadow-lg shadow-[#DB2777]/35 hover:scale-110 active:scale-95 flex flex-col items-center justify-center transition-transform cursor-pointer"
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>

                  <button
                    type="button"
                    onClick={() => commitSwipe('right')}
                    title="ถูกใจ! จับคู่ผสมพันธุ์ 💘 (ปุ่มลูกศรขวา)"
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-[#EC4899] to-[#E11D48] border-2 border-white text-white shadow-xl shadow-[#E11D48]/35 hover:scale-108 active:scale-95 flex items-center justify-center transition-transform cursor-pointer"
                  >
                    <Heart className="w-8 h-8 fill-current" />
                  </button>
                </div>

                <p className="text-xs text-[#9D174D]/85 mt-3 text-center">
                  ลากการ์ดซ้าย/ขวา หรือกดปุ่ม ♥ เพื่อจับคู่ · ปุ่ม ★ เพื่อส่ง <strong>Super Kiss 🐑😘</strong>
                </p>
              </div>

              {/* RIGHT: LIVE QUALITY DOSSIER (NO % MATCH SCORE) */}
              <div
                className={`lg:col-span-6 xl:col-span-7 space-y-5 ${
                  showMobileDossier ? 'block' : 'hidden lg:block'
                }`}
              >
                <div className="bg-white/92 backdrop-blur-md rounded-3xl border-2 border-[#F472B6] p-6 sm:p-7 shadow-xl shadow-[#DB2777]/10 space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#FCE7F3]">
                    <div>
                      <span className="text-xs font-bold text-[#DB2777] tracking-wide flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        <span>โปรไฟล์คุณภาพและจุดเด่นประจำตัว (พิจารณาตามคุณภาพจริง)</span>
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold text-[#831843] mt-1">
                        {topSheep.name} ({topSheep.earTag})
                      </h3>
                      <p className="text-xs sm:text-sm text-[#9D174D] mt-0.5">
                        {topSheep.bloodPercentage || `${topSheep.breed} 100%`} · อายุ {topSheep.ageMonths} เดือน
                      </p>
                    </div>

                    {isTopMine && (
                      <button
                        type="button"
                        onClick={() => onDeleteListing(topSheep.listingId)}
                        className="px-3 py-1.5 rounded-xl bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#BE123C] border border-[#FDA4AF] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบประกาศของฟาร์มเรา</span>
                      </button>
                    )}
                  </div>

                  {/* 1. Breeding & Fertility Highlights */}
                  <div className="bg-gradient-to-r from-[#FFF0F6] to-[#FCE7F3] rounded-2xl border border-[#F9A8D4] p-5 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#9D174D]">
                      <Dna className="w-4 h-4 text-[#DB2777]" />
                      <span>จุดเด่นด้านการผสมพันธุ์และพันธุกรรม 💘</span>
                    </div>
                    <p className="text-sm text-[#500724] leading-relaxed font-medium">
                      {getBreedingHighlightForSheep(topSheep)}
                    </p>
                    <p className="text-xs text-[#9D174D] leading-relaxed">
                      {getQualitativeSynergyNote(topSheep)}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#F9A8D4]/50 text-xs">
                      <div>
                        <span className="text-[#9D174D] block">ความสมบูรณ์พันธุ์ / แฝด</span>
                        <strong className="text-[#831843] font-semibold">
                          {topSheep.lambingRatePct || 'พร้อมผสมพันธุ์สม่ำเสมอ'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#9D174D] block">อัตราโตเฉลี่ย (ADG)</span>
                        <strong className="text-[#831843] font-mono font-semibold">
                          +{topSheep.currentAdgGrams || 185} ก./วัน
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#9D174D] block">สายเลือดพ่อ–แม่</span>
                        <strong className="text-[#831843] font-semibold">
                          {topSheep.sireName || 'สายพันธุ์คัดเกรด'} × {topSheep.damName || 'แม่พันธุ์ดี'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* 2. Wool Production Excellence */}
                  <div className="bg-[#FFFDF9] rounded-2xl border border-[#FBCFE8] p-5 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#9D174D]">
                      <Scissors className="w-4 h-4 text-[#DB2777]" />
                      <span>คุณภาพผลผลิตขนแกะ (Wool Performance) 🧶</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-[#FFF0F6] p-3 rounded-xl border border-[#FBCFE8]">
                        <span className="text-[#9D174D] block">เกรดไมครอน</span>
                        <strong className="font-mono text-base font-bold text-[#BE185D]">
                          {topSheep.woolMicron || 19.5} µm
                        </strong>
                      </div>
                      <div className="bg-[#FFF0F6] p-3 rounded-xl border border-[#FBCFE8]">
                        <span className="text-[#9D174D] block">ผลผลิตขน/ปี</span>
                        <strong className="font-mono text-base font-bold text-[#831843]">
                          {topSheep.fleeceYieldKg || 6.0} กก.
                        </strong>
                      </div>
                      <div className="bg-[#FFF0F6] p-3 rounded-xl border border-[#FBCFE8]">
                        <span className="text-[#9D174D] block">ความยาวใยขน</span>
                        <strong className="font-mono text-base font-bold text-[#831843]">
                          {topSheep.woolStapleLengthCm || 10.2} ซม.
                        </strong>
                      </div>
                      <div className="bg-[#FFF0F6] p-3 rounded-xl border border-[#FBCFE8]">
                        <span className="text-[#9D174D] block">ลอนคลื่น (Crimp)</span>
                        <strong className="font-mono text-base font-bold text-[#831843]">
                          {topSheep.crimpPerInch || 11} /นิ้ว
                        </strong>
                      </div>
                    </div>
                    <p className="text-xs text-[#701A3C]">
                      เกรดขน: <strong>{topSheep.woolGrade || 'ไฟน์วูลละเอียด'}</strong> · สีขน:{' '}
                      <strong>{topSheep.woolColor || 'ขาวนวลธรรมชาติ'}</strong>
                    </p>
                  </div>

                  {/* 3. Health & Farm Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-[#FFF5F9] rounded-2xl border border-[#FBCFE8] p-4 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-[#9D174D]">
                        <ShieldCheck className="w-4 h-4 text-[#DB2777]" />
                        <span>ประวัติวัคซีนและสุขภาพ</span>
                      </div>
                      <p className="text-[#500724]">
                        <strong>วัคซีน:</strong> {topSheep.vaccineName || 'FMD + แท้งติดต่อ'}
                      </p>
                      <p className="text-[#500724]">
                        <strong>ถ่ายพยาธิ:</strong> {topSheep.dewormName || 'Ivermectin'}
                      </p>
                    </div>

                    <div className="bg-[#FFF5F9] rounded-2xl border border-[#FBCFE8] p-4 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-[#9D174D]">
                        <Phone className="w-4 h-4 text-[#DB2777]" />
                        <span>ข้อมูลฟาร์มเจ้าของแกะ</span>
                      </div>
                      <p className="text-[#500724] font-semibold">{topSheep.farmName}</p>
                      <p className="text-[#701A3C]">📍 {topSheep.farmLocation || 'ประเทศไทย'}</p>
                      <p className="text-[#BE185D] font-semibold">
                        💌 {topSheep.ownerContact || 'ติดต่อผ่านศูนย์กลาง Ovispro'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/90 rounded-3xl border-2 border-[#F472B6] p-10 text-center max-w-xl mx-auto space-y-4 shadow-xl">
              <div className="text-5xl">🐑😘💘</div>
              <h3 className="text-2xl font-bold text-[#831843]">
                ปัดดูแกะครบทุกตัวในตัวกรองนี้แล้ว!
              </h3>
              <p className="text-sm text-[#9D174D]">
                คุณสามารถย้อนดูแกะที่ปัดผ่านไปแล้ว เช็กคู่แมตช์หัวใจ หรือส่งแกะของฟาร์มคุณลง Onlysheeps เพิ่มเติมได้
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetPasses}
                  className="min-h-[44px] bg-[#FCE7F3] hover:bg-[#FBCFE8] text-[#9D174D] border border-[#F472B6] px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  ↺ นำแกะที่ปัดผ่านกลับมาปัดใหม่ ({passedIds.length} ตัว)
                </button>
                <button
                  type="button"
                  onClick={() => setSubTab('matches')}
                  className="tactile-pink-btn min-h-[44px] bg-[#DB2777] text-white px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  💌 ดูคู่แมตช์หัวใจ ({matches.length})
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. MATCHES LIST TAB */}
      {subTab === 'matches' && (
        <section className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#831843] flex items-center gap-2">
                <span>คู่แมตช์ผสมพันธุ์หัวใจสีชมพู</span>
                <span>💘🌹</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#9D174D]">
                รวมรายชื่อแกะที่ถูกใจและส่ง Super Kiss แล้ว พร้อมช่องทางติดต่อเจ้าของฟาร์มเพื่อนัดผสมพันธุ์
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSubTab('swipe')}
              className="min-h-[44px] bg-white hover:bg-[#FFF0F6] text-[#BE185D] border-2 border-[#F472B6] px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
            >
              ← กลับไปปัดหาคู่ต่อ
            </button>
          </div>

          {matches.length === 0 ? (
            <div className="bg-white/90 rounded-3xl border-2 border-[#F9A8D4] p-10 text-center space-y-3">
              <div className="text-4xl">🐑😘</div>
              <h3 className="text-lg font-bold text-[#831843]">ยังไม่มีคู่แมตช์ในรายการ</h3>
              <p className="text-sm text-[#9D174D]">
                ลองกลับไปหน้าปัดการ์ด แล้วกดปุ่ม ♥ หรือ ★ Super Kiss เพื่อจับคู่ผสมพันธุ์แกะขนเลย!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map(m => (
                <div
                  key={m.id}
                  className="bg-white/95 rounded-3xl border-2 border-[#F472B6] overflow-hidden shadow-lg shadow-[#DB2777]/10 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-[16/10] bg-[#FCE7F3]">
                      <img
                        src={m.sheep.photoUrl || getBreedPhoto(m.sheep.breed)}
                        alt={m.sheep.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span
                        className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                          m.matchType === 'super_kiss'
                            ? 'bg-gradient-to-r from-[#F59E0B] to-[#DB2777] text-white'
                            : 'bg-[#DB2777] text-white'
                        }`}
                      >
                        {m.matchType === 'super_kiss' ? '★ SUPER KISS 🐑😘' : '💘 LOVE MATCH'}
                      </span>
                    </div>

                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="text-lg font-bold text-[#831843]">{m.sheep.name}</h3>
                        <p className="text-xs text-[#9D174D] font-medium">
                          {m.sheep.breed} · {m.sheep.gender === 'male' ? '♂ พ่อพันธุ์' : '♀ แม่พันธุ์'} ·{' '}
                          {m.sheep.earTag}
                        </p>
                      </div>

                      <div className="bg-[#FFF0F6] p-3 rounded-2xl border border-[#FBCFE8] text-xs space-y-1">
                        <p className="font-semibold text-[#831843]">🏡 {m.sheep.farmName}</p>
                        <p className="text-[#9D174D]">
                          📞 {m.sheep.ownerContact || 'ติดต่อผ่านศูนย์กลาง Ovispro'}
                        </p>
                        <p className="text-[#BE185D] font-mono">
                          ขน {m.sheep.woolMicron || 19.5} µm · {m.sheep.fleeceYieldKg || 6.0} กก./ปี
                        </p>
                      </div>

                      <p className="text-xs text-[#701A3C] leading-relaxed">{m.synergyNote}</p>

                      {m.scheduledNote && (
                        <div className="bg-[#FDF2F8] border border-[#F472B6] rounded-xl px-3 py-2 text-xs text-[#9D174D] font-semibold">
                          🌹 บันทึกนัด: {m.scheduledNote}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-5 py-3 bg-[#FFF5F9] border-t border-[#FCE7F3] flex items-center justify-between text-xs">
                    <span className="text-[#9D174D]">จับคู่เมื่อ {m.matchedAt}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMatch(m.id)}
                      className="text-[#E11D48] hover:text-[#9F1239] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบคู่แมตช์</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 3B. MY FARM PUBLISHED SHEEP TAB (WITH REMOVE / WITHDRAW BUTTON) */}
      {subTab === 'my_listings' && activeFarmProfile && (
        <section className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#831843] flex items-center gap-2">
                <span>แกะของ {activeFarmProfile.farmName} ที่ส่งลง Onlysheeps</span>
                <span>🐑🌹</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#9D174D]">
                จัดการรายชื่อแกะที่ฟาร์มของเราลงหาคู่บน Onlysheeps — สามารถเพิ่มหรือเอาออกได้ตลอดเวลาหากเปลี่ยนใจ
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleOpenPublishModal}
                className="tactile-pink-btn min-h-[44px] bg-gradient-to-r from-[#E11D48] via-[#DB2777] to-[#EC4899] text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>ส่งแกะลงเพิ่ม</span>
              </button>
              <button
                type="button"
                onClick={() => setSubTab('swipe')}
                className="min-h-[44px] bg-white hover:bg-[#FFF0F6] text-[#BE185D] border-2 border-[#F472B6] px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
              >
                ← กลับไปปัดหาคู่ฟาร์มอื่น
              </button>
            </div>
          </div>

          {myListings.length === 0 ? (
            <div className="bg-white/90 rounded-3xl border-2 border-[#F9A8D4] p-10 text-center space-y-3">
              <div className="text-4xl">🐑💐</div>
              <h3 className="text-lg font-bold text-[#831843]">
                ฟาร์มของเรายังไม่มีแกะที่ลงประกาศบน Onlysheeps
              </h3>
              <p className="text-sm text-[#9D174D]">
                กดปุ่ม &ldquo;ส่งแกะลงเพิ่ม&rdquo; เพื่อคัดเลือกพ่อ/แม่พันธุ์จากฟาร์มของ {activeFarmProfile.farmName} ให้ฟาร์มอื่นปัดหาคู่ได้เลย
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myListings.map(item => (
                <div
                  key={item.listingId}
                  className="bg-white/95 rounded-3xl border-2 border-[#F472B6] overflow-hidden shadow-lg shadow-[#DB2777]/10 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-[16/10] bg-[#FCE7F3]">
                      <img
                        src={item.photoUrl || getBreedPhoto(item.breed)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold shadow-sm bg-[#1E3F2B] text-[#FAF6EE]">
                        🏡 ฟาร์มเรา ({item.earTag})
                      </span>
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 text-[#9D174D]">
                        {item.gender === 'male' ? '♂ พ่อพันธุ์' : '♀ แม่พันธุ์'}
                      </span>
                    </div>

                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="text-lg font-bold text-[#831843]">{item.name}</h3>
                        <p className="text-xs text-[#9D174D] font-medium">
                          {item.breed} · อายุ {item.ageMonths} เดือน · {item.weightKg} กก.
                        </p>
                      </div>

                      <div className="bg-[#FFF0F6] p-3 rounded-2xl border border-[#FBCFE8] text-xs space-y-1">
                        <p className="text-[#BE185D] font-mono font-semibold">
                          ขน {item.woolMicron || 19.5} µm · {item.fleeceYieldKg || 6.0} กก./ปี
                        </p>
                        <p className="text-[#701A3C] line-clamp-2 italic">
                          “{getRomanticBioForSheep(item)}”
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-3.5 bg-[#FFF5F9] border-t border-[#FCE7F3] flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#9D174D]">ลงเมื่อ {item.publishedAt}</span>
                    <button
                      type="button"
                      disabled={deletingListingId === item.listingId}
                      onClick={() => handleWithdrawListing(item)}
                      className="px-3.5 py-2 rounded-xl bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#BE123C] border border-[#FDA4AF] font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>
                        {deletingListingId === item.listingId ? 'กำลังเอาออก...' : 'เอาแกะออกจาก Onlysheeps'}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 4. MATCH CELEBRATION OVERLAY (ZERO % MATCH) */}
      {celebratingMatch && (
        <div className="fixed inset-0 z-50 bg-[#500724]/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#FFF0F6] via-white to-[#FCE7F3] rounded-3xl max-w-lg w-full border-[3px] border-[#DB2777] shadow-2xl overflow-hidden text-center p-6 sm:p-8 space-y-5 relative">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#DB2777] tracking-tight">
              {celebratingMatch.matchType === 'super_kiss'
                ? 'SUPER KISS MATCH! 🐑😘💘'
                : "It's a Wool Match! 💘🌹"}
            </div>
            <p className="text-sm text-[#831843] font-medium">
              คู่สายพันธุ์ขนคุณภาพลงตัว พร้อมติดต่อฟาร์มเพื่อนัดผสมพันธุ์ข้ามคอกได้เลย!
            </p>

            <div className="flex items-center justify-center gap-4 py-2">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-[4px] border-[#EC4899] shadow-lg bg-white">
                <img
                  src={onlysheepsCupidLogo}
                  alt="Ovispro Cupid"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="text-4xl onlysheeps-float" aria-hidden="true">
                💘
              </div>

              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-[4px] border-[#DB2777] shadow-lg bg-white">
                <img
                  src={
                    celebratingMatch.sheep.photoUrl ||
                    getBreedPhoto(celebratingMatch.sheep.breed)
                  }
                  alt={celebratingMatch.sheep.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div className="bg-white/90 rounded-2xl border border-[#F9A8D4] p-4 text-left space-y-1.5 text-xs sm:text-sm">
              <p className="font-bold text-[#831843]">
                {celebratingMatch.sheep.name} · {celebratingMatch.sheep.farmName}
              </p>
              <p className="text-[#9D174D]">{celebratingMatch.synergyNote}</p>
              {celebratingMatch.sheep.ownerContact && (
                <p className="font-semibold text-[#DB2777] pt-1">
                  💌 ช่องทางติดต่อ: {celebratingMatch.sheep.ownerContact}
                </p>
              )}
            </div>

            <div className="space-y-3 text-left">
              <input
                type="text"
                placeholder="พิมพ์โน้ตนัดวันผสมพันธุ์หรือทักทายเจ้าของฟาร์ม..."
                value={matchNoteDraft}
                onChange={e => setMatchNoteDraft(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-[#F9A8D4] text-sm text-[#500724] focus:outline-none focus:border-[#DB2777]"
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleSaveScheduledNote}
                  className="tactile-pink-btn flex-1 min-h-[46px] bg-gradient-to-r from-[#DB2777] to-[#E11D48] text-white rounded-xl font-bold text-sm px-4 py-2.5 cursor-pointer"
                >
                  🌹 บันทึกนัดผสมพันธุ์ & ส่งจุ้บ 🐑😘
                </button>
                <button
                  type="button"
                  onClick={() => setCelebratingMatch(null)}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl bg-white border border-[#F472B6] text-[#9D174D] font-semibold text-sm hover:bg-[#FFF0F6] cursor-pointer"
                >
                  ปัดหาคู่ต่อ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. PUBLISH SHEEP TO ONLYSHEEPS MODAL (FOR AUTHENTICATED FARM) */}
      {isPublishModalOpen && activeFarmProfile && (
        <div className="fixed inset-0 z-50 bg-[#500724]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border-[3px] border-[#DB2777] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-[#DB2777] to-[#EC4899] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🐑😘</span>
                <h3 className="text-lg font-bold">
                  ส่งแกะของ {activeFarmProfile.farmName} ลง Onlysheeps
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPublish} className="p-6 space-y-4 overflow-y-auto text-sm text-[#500724]">
              {ownSheepList.length > 0 && (
                <div className="bg-[#FFF0F6] p-3.5 rounded-2xl border border-[#FBCFE8] space-y-2">
                  <label className="block text-xs font-bold text-[#831843]">
                    ดึงข้อมูลด่วนจากทะเบียนแกะของฟาร์มเรา (เฉพาะฟาร์มนี้เห็น):
                  </label>
                  <select
                    value={selectedOwnSheepId}
                    onChange={e => handleSelectOwnSheep(e.target.value)}
                    className="w-full border border-[#F472B6] rounded-xl px-3 py-2 bg-white text-xs sm:text-sm"
                  >
                    <option value="custom">-- กรอกข้อมูลแกะใหม่ด้วยตัวเอง --</option>
                    {ownSheepList.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.earTag} · {s.name} ({s.breed}, {s.gender === 'male' ? '♂' : '♀'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#831843] mb-1">
                    ชื่อเล่นแกะ (ชื่อไทยยุคเจน Z) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น อั่งเปา, มินนี่, ไบร์ท, น้ำปั่น"
                    value={pName}
                    onChange={e => setPName(e.target.value)}
                    className="w-full border border-[#F472B6] rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#DB2777]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#831843] mb-1">เพศ</label>
                  <select
                    value={pGender}
                    onChange={e => setPGender(e.target.value as 'male' | 'female')}
                    className="w-full border border-[#F472B6] rounded-xl px-3 py-2 bg-white"
                  >
                    <option value="male">♂ พ่อพันธุ์</option>
                    <option value="female">♀ แม่พันธุ์</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#831843] mb-1">รหัสเบอร์หูแกะ</label>
                  <input
                    type="text"
                    placeholder="เช่น OS-01"
                    value={pEarTag}
                    onChange={e => setPEarTag(e.target.value)}
                    className="w-full border border-[#F472B6] rounded-xl px-3.5 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#831843] mb-1">ช่องทางติดต่อกลับฟาร์มเรา</label>
                  <input
                    type="text"
                    placeholder="เช่น Line: @farmwool"
                    value={pOwnerContact}
                    onChange={e => setPOwnerContact(e.target.value)}
                    className="w-full border border-[#F472B6] rounded-xl px-3.5 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-[#831843] mb-1">สายพันธุ์แกะขน</label>
                  <select
                    value={pBreed}
                    onChange={e => setPBreed(e.target.value)}
                    className="w-full border border-[#F472B6] rounded-xl px-3 py-2 bg-white"
                  >
                    <option value="เมอริโน (Merino)">เมอริโน (Merino)</option>
                    <option value="แฮมป์เชียร์ (Hampshire)">แฮมป์เชียร์ (Hampshire)</option>
                    <option value="ดอร์เซท (Dorset)">ดอร์เซท (Dorset)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#831843] mb-1">อายุ (เดือน)</label>
                  <input
                    type="number"
                    min={6}
                    value={pAgeMonths}
                    onChange={e => setPAgeMonths(Number(e.target.value))}
                    className="w-full border border-[#F472B6] rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#831843] mb-1">น้ำหนัก (กก.)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={pWeightKg}
                    onChange={e => setPWeightKg(Number(e.target.value))}
                    className="w-full border border-[#F472B6] rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#831843] mb-1">เส้นใยขน (µm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={pMicron}
                    onChange={e => setPMicron(Number(e.target.value))}
                    className="w-full border border-[#F472B6] rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#831843] mb-1">ขนตัด/ปี (กก.)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={pFleeceKg}
                    onChange={e => setPFleeceKg(Number(e.target.value))}
                    className="w-full border border-[#F472B6] rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-[#831843] mb-1">สถิติผสม/ลูกแฝด</label>
                  <input
                    type="text"
                    value={pLambingPct}
                    onChange={e => setPLambingPct(e.target.value)}
                    className="w-full border border-[#F472B6] rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#831843] mb-1">
                  จุดเด่นด้านการผสมพันธุ์และคุณภาพขน
                </label>
                <input
                  type="text"
                  placeholder="เช่น จ่ายลูกขนละเอียด ดกหนา น้ำนมดี เลี้ยงง่าย"
                  value={pBreedingHighlight}
                  onChange={e => setPBreedingHighlight(e.target.value)}
                  className="w-full border border-[#F472B6] rounded-xl px-3.5 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#831843] mb-1">
                  คำแนะนำตัวสไตล์โรแมนติกบน Onlysheeps 💘
                </label>
                <textarea
                  rows={2}
                  placeholder="เช่น ขนนุ่มละมุนพร้อมมอบหัวใจให้แม่พันธุ์ทุกคอกนะครับ 🐑😘"
                  value={pRomanticBio}
                  onChange={e => setPRomanticBio(e.target.value)}
                  className="w-full border border-[#F472B6] rounded-xl px-3.5 py-2"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#F472B6] text-[#9D174D] font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPublishing}
                  className="tactile-pink-btn bg-gradient-to-r from-[#DB2777] to-[#E11D48] text-white px-6 py-2.5 rounded-xl font-bold cursor-pointer disabled:opacity-60"
                >
                  {isPublishing ? 'กำลังส่งลง Onlysheeps...' : '💘 ส่งแกะขึ้นการ์ด Onlysheeps เลย!'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
