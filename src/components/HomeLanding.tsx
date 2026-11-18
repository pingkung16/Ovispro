/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Dna,
  Calculator,
  Wheat,
  CalendarCheck2,
  TrendingUp,
  ArrowRight,
  ChevronDown,
  Leaf,
  Heart,
  Lock,
  ShieldCheck,
  Building2,
  MapPin,
  LogOut,
  FileSpreadsheet,
  ExternalLink,
} from 'lucide-react';
import heroFlockImg from '../assets/images/hero_wool_flock_1794762559642.jpg';
import woodenBarnImg from '../assets/images/pasture_wooden_barn_1794762559623.jpg';
import onlysheepsCupidLogo from '../assets/images/onlysheeps_cupid_logo_1794824689407.jpg';
import type { FarmProfile, PublicPlatformOverview } from '../types/sheep';
import type { FarmWorkspaceData } from '../utils/api';
import { FarmAuthPanel } from './FarmAuthPanel';

interface HomeLandingProps {
  activeFarmProfile: FarmProfile | null;
  publicOverview: PublicPlatformOverview | null;
  ownSheepCount: number;
  ingredientsCount: number;
  logsCount: number;
  cloudSyncStatus?: 'synced' | 'saving' | 'pending';
  cloudSyncConfigured?: boolean;
  onRetryCloudSync?: () => void;
  onNavigateTab: (tab: string) => void;
  onAuthenticated: (profile: FarmProfile, workspace?: FarmWorkspaceData) => Promise<void> | void;
  onLogout: () => void;
  onOpenGoogleSheet: () => void;
  onOpenWebForm?: () => void;
}

const BotanicalVineAccent: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 180 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M6 48C42 42 74 20 116 20C140 20 158 13 174 6"
      stroke="#2E6B47"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path d="M32 38C28 24 40 12 54 16C50 29 42 36 32 38Z" fill="#1E3F2B" fillOpacity="0.88" />
    <path d="M72 28C70 14 84 6 96 12C92 24 82 28 72 28Z" fill="#2E6B47" fillOpacity="0.88" />
    <path d="M114 20C120 8 135 5 144 13C134 22 124 23 114 20Z" fill="#1E3F2B" fillOpacity="0.9" />
    <path d="M52 40C61 48 73 48 80 39C70 34 59 35 52 40Z" fill="#4A321F" fillOpacity="0.72" />
    <path d="M138 22C146 31 158 31 166 23C156 17 146 18 138 22Z" fill="#2E6B47" fillOpacity="0.82" />
  </svg>
);

export const HomeLanding: React.FC<HomeLandingProps> = ({
  activeFarmProfile,
  publicOverview,
  ownSheepCount,
  ingredientsCount,
  logsCount,
  cloudSyncStatus = 'synced',
  cloudSyncConfigured = false,
  onRetryCloudSync,
  onNavigateTab,
  onAuthenticated,
  onLogout,
  onOpenGoogleSheet,
  onOpenWebForm,
}) => {
  const [heroLoaded, setHeroLoaded] = useState(true);
  const [barnLoaded, setBarnLoaded] = useState(true);
  const [selectedLoginHint, setSelectedLoginHint] = useState<string>('');

  const totalFarms = publicOverview?.totalFarms ?? 6;
  const totalNetworkSheep = publicOverview?.totalNetworkSheep ?? 180;
  const onlysheepsCount = publicOverview?.onlysheepsCount ?? 14;
  const farmDirectory = publicOverview?.farmDirectory ?? [];

  const modules = [
    {
      id: 'sheep',
      number: '01',
      title: 'คอกและทะเบียนแกะขน (ส่วนตัว)',
      metric: activeFarmProfile ? `${ownSheepCount} ตัวของฟาร์มเรา` : 'ล็อกเฉพาะเจ้าของฟาร์ม',
      description:
        'จัดการรายชื่อแกะในคอก A–D, ประวัติวัคซีน FMD/แท้งติดต่อ, ถ่ายพยาธิ และบันทึกขนของฟาร์มคุณโดยเฉพาะ',
      actionLabel: activeFarmProfile ? 'เปิดทะเบียนแกะของฟาร์ม' : 'เข้าสู่ระบบเพื่อเปิดทะเบียน',
      icon: Users,
      tone: 'forest',
      requiresAuth: true,
    },
    {
      id: 'breeds',
      number: '02',
      title: 'แนะนำ 11 สายพันธุ์แกะขน',
      metric: 'สาธารณะ · อันดับ 1–11 (Top 3 ★)',
      description:
        'จัดอันดับสายพันธุ์แกะขนที่นิยมและให้ผลผลิตขนดีในไทย พร้อมข้อมูลไมครอน น้ำหนักขน และร้อยละการให้ลูก/คอก',
      actionLabel: 'ดูอันดับสายพันธุ์แนะนำ',
      icon: Dna,
      tone: 'walnut',
      requiresAuth: false,
    },
    {
      id: 'calculator',
      number: '03',
      title: 'คำนวณสูตรอาหารรายคอก (ส่วนตัว)',
      metric: 'คำนวณเอง + เกณฑ์ %CP NRC',
      description:
        'จัดสูตรอาหารหยาบ–ข้นเฉพาะฝูงของคุณเองอย่างอิสระ พร้อมการ์ดอ้างอิง % โปรตีน (CP) ตามช่วงวัยมาตรฐาน NRC',
      actionLabel: activeFarmProfile ? 'คำนวณสูตรอาหารฟาร์ม' : 'เข้าสู่ระบบเพื่อคำนวณสูตร',
      icon: Calculator,
      tone: 'forest',
      requiresAuth: true,
    },
    {
      id: 'ingredients',
      number: '04',
      title: 'คลังวัตถุดิบอาหารแกะ (ส่วนตัว)',
      metric: activeFarmProfile ? `${ingredientsCount} ชนิดของฟาร์ม` : 'แยกราคาวัตถุดิบรายฟาร์ม',
      description:
        'เพิ่มชื่อวัตถุดิบเพื่อให้ระบบคำนวณคุณค่าโภชนะ %DM/%CP/%TDN อัตโนมัติ พร้อมปรับราคาซื้อท้องถิ่นของฟาร์มคุณเอง',
      actionLabel: activeFarmProfile ? 'เปิดคลังวัตถุดิบฟาร์ม' : 'เข้าสู่ระบบเปิดคลังวัตถุดิบ',
      icon: Wheat,
      tone: 'walnut',
      requiresAuth: true,
    },
    {
      id: 'logs',
      number: '05',
      title: 'บันทึกกิจกรรมฟาร์ม (ส่วนตัว)',
      metric: activeFarmProfile ? `${logsCount} รายการของฟาร์ม` : 'สมุดบันทึกส่วนตัวของฟาร์ม',
      description:
        'จดบันทึกชั่งน้ำหนัก การให้อาหาร การฉีดวัคซีน การผสมพันธุ์ และสถิติการคลอด เก็บเป็นความลับเฉพาะฟาร์มของคุณ',
      actionLabel: activeFarmProfile ? 'ดูสมุดบันทึกฟาร์ม' : 'เข้าสู่ระบบเพื่อดูบันทึก',
      icon: CalendarCheck2,
      tone: 'forest',
      requiresAuth: true,
    },
    {
      id: 'dashboard',
      number: '06',
      title: 'สรุปต้นทุน-ผลผลิตขน (ส่วนตัว)',
      metric: 'วิเคราะห์เฉพาะฟาร์มของคุณ',
      description:
        'สรุปปริมาณอาหารที่ใช้ต่อวัน ต้นทุนค่าอาหาร ผลผลิตตัดขนรวม และจำนวนแกะแยกตามสายพันธุ์ในฟาร์มของคุณ',
      actionLabel: activeFarmProfile ? 'ดูรายงานสรุปฟาร์ม' : 'เข้าสู่ระบบเพื่อดูต้นทุน',
      icon: TrendingUp,
      tone: 'walnut',
      requiresAuth: true,
    },
  ];

  const handleJump = (tabId: string) => {
    onNavigateTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToPortal = () => {
    const el = document.getElementById('home-farm-portal');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-12 sm:space-y-14 pb-6">
      {/* ======================================================== */}
      {/* 1. HERO BANNER — Multi-Farm Hub + Organic Wave Edge      */}
      {/* ======================================================== */}
      <section className="relative rounded-3xl overflow-hidden border-[3px] border-[#4A321F] shadow-xl bg-[#183323]">
        <div className="h-2.5 w-full wood-grain-surface border-b border-[#26170C]/60" />

        <div className="relative min-h-[470px] sm:min-h-[540px] lg:min-h-[580px] flex items-center justify-center text-center px-5 sm:px-10 pt-10 pb-24 sm:pb-28">
          {heroLoaded ? (
            <img
              src={heroFlockImg}
              alt="ฝูงแกะขนในทุ่งหญ้าสีเขียวและคอกไม้ธรรมชาติ Ovispro"
              onError={() => setHeroLoaded(false)}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1E3F2B] via-[#285038] to-[#3B2616]" />
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-[#112419]/78 via-[#173021]/64 to-[#112419]/84 pointer-events-none" />

          <BotanicalVineAccent className="hidden sm:block absolute top-4 left-4 w-36 opacity-80 pointer-events-none" />
          <BotanicalVineAccent className="hidden sm:block absolute top-4 right-4 w-36 opacity-80 -scale-x-100 pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto space-y-5">
            <p className="text-xs sm:text-sm font-medium text-[#E5D3B3] tracking-wide flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#9FD1AE] shrink-0" />
              <span>ศูนย์รวมระบบจัดการฟาร์มแกะขนแบบแยกพื้นที่ส่วนตัวรายฟาร์ม (Multi-Farm Hub)</span>
            </p>

            <div className="space-y-2.5">
              <h1 className="font-brand italic font-semibold text-5xl sm:text-6xl lg:text-7xl text-[#FAF6EE] tracking-wide drop-shadow-md">
                Ovispro
              </h1>
              <h2 className="text-xl sm:text-3xl lg:text-4xl font-semibold text-[#FFFDF9] leading-snug max-w-3xl mx-auto drop-shadow-sm">
                พื้นที่เก็บข้อมูลส่วนตัวสำหรับทุกฟาร์มแกะขน
                <span className="block text-[#DFCBB3] text-lg sm:text-2xl font-medium mt-1">
                  ทุกฟาร์มจัดการข้อมูลตัวเองอย่างปลอดภัย ฟาร์มอื่นไม่สามารถเข้ามาดูข้อมูลภายในได้
                </span>
              </h2>
            </div>

            {/* Live Multi-Farm Network Summary Strip */}
            <div className="inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-5 py-2.5 rounded-2xl bg-[#182B1E]/80 backdrop-blur-xs border border-[#DFCBB3]/35 text-xs sm:text-sm text-[#FAF6EE]">
              <span>
                ฟาร์มเข้าร่วมปัจจุบัน{' '}
                <strong className="font-mono text-[#E8C589] text-sm sm:text-base ml-1">{totalFarms}</strong> ฟาร์ม
              </span>
              <span className="text-[#8DA696]" aria-hidden="true">·</span>
              <span>
                แกะขนรวมในเครือข่าย{' '}
                <strong className="font-mono text-[#FAF6EE] ml-1">{totalNetworkSheep}</strong> ตัว
              </span>
              <span className="text-[#8DA696]" aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-[#A7F3D0]">
                <Lock className="w-3.5 h-3.5" />
                <span>แยกข้อมูลส่วนตัว 100%</span>
              </span>
              <span className="text-[#8DA696]" aria-hidden="true">·</span>
              <span>
                Onlysheeps <strong className="font-mono text-[#FBCFE8] ml-1">{onlysheepsCount}</strong> คู่เด่น
              </span>
            </div>

            {/* Primary Embossed Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              {activeFarmProfile ? (
                <button
                  type="button"
                  onClick={() => handleJump('sheep')}
                  className="tactile-cta-btn bg-[#4A321F] hover:bg-[#5E4029] text-[#FAF6EE] border border-[#8B6240] px-6 py-3 rounded-xl font-semibold text-sm sm:text-base flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Users className="w-4 h-4 text-[#DFCBB3]" />
                  <span>
                    เข้าจัดการฟาร์ม {activeFarmProfile.farmName} ({ownSheepCount} ตัว)
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#DFCBB3]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={scrollToPortal}
                  className="tactile-cta-btn bg-[#4A321F] hover:bg-[#5E4029] text-[#FAF6EE] border border-[#8B6240] px-6 py-3 rounded-xl font-semibold text-sm sm:text-base flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Lock className="w-4 h-4 text-[#DFCBB3]" />
                  <span>เข้าสู่ระบบฟาร์ม / เปิดฟาร์มใหม่</span>
                  <ChevronDown className="w-4 h-4 text-[#DFCBB3]" />
                </button>
              )}

              <button
                type="button"
                onClick={() => handleJump('onlysheeps')}
                className="tactile-pink-btn px-5 py-3 rounded-xl bg-gradient-to-r from-[#DB2777] to-[#EC4899] text-white border border-[#FBCFE8] font-bold text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Heart className="w-4 h-4 fill-current text-[#FDE047]" />
                <span>Onlysheeps ปัดหาคู่แกะ 🐑😘</span>
              </button>

              {onOpenWebForm && (
                <button
                  type="button"
                  onClick={onOpenWebForm}
                  className="bg-[#FAF6EE] hover:bg-[#EFE6D5] text-[#1E3F2B] border border-[#DFCBB3] px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#2E6B47]" />
                  <span>ฟอร์มบันทึกข้อมูล</span>
                </button>
              )}
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 pointer-events-none leading-none">
            <svg
              viewBox="0 0 1440 110"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
              className="w-full h-14 sm:h-20"
            >
              <path
                d="M0,44 C160,96 310,12 490,52 C670,92 810,20 990,54 C1170,88 1310,30 1440,56 L1440,110 L0,110 Z"
                fill="#2E6B47"
                fillOpacity="0.45"
              />
              <path
                d="M0,62 C190,18 360,98 560,64 C760,30 920,96 1140,58 C1280,34 1370,66 1440,78 L1440,110 L0,110 Z"
                fill="#FAF6EE"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. MULTI-FARM WORKSPACE PORTAL (LOGIN OR ACTIVE STATUS)  */}
      {/* ======================================================== */}
      <section id="home-farm-portal" className="max-w-6xl mx-auto px-1 sm:px-3 space-y-6">
        {activeFarmProfile ? (
          <div className="bg-gradient-to-r from-[#1E3F2B] via-[#234832] to-[#3B2616] text-[#FAF6EE] rounded-3xl border-2 border-[#4A321F] p-6 sm:p-8 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#A7F3D0]">
                <ShieldCheck className="w-4 h-4" />
                <span>กำลังทำงานในพื้นที่ส่วนตัวที่เข้ารหัสเฉพาะฟาร์มนี้</span>
                <span className="text-[#8DA696]" aria-hidden="true">·</span>
                {cloudSyncStatus === 'saving' ? (
                  <span className="text-[#FDE68A]">กำลังซิงค์ขึ้นระบบกลาง...</span>
                ) : cloudSyncStatus === 'pending' ? (
                  <button
                    type="button"
                    onClick={onRetryCloudSync}
                    className="text-[#FCA5A5] underline hover:text-white cursor-pointer"
                  >
                    รอส่งข้อมูลขึ้นระบบกลาง — กดส่งทันที
                  </button>
                ) : (
                  <span className="text-[#BBF7D0]">
                    {cloudSyncConfigured ? 'ซิงค์ทุกเครื่อง + Google Sheet กลางแล้ว' : 'ซิงค์ระบบกลางแล้ว'}
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                {activeFarmProfile.farmName}
              </h2>
              <p className="text-xs sm:text-sm text-[#E5D3B3]">
                ผู้ดูแล: <strong>{activeFarmProfile.ownerName}</strong> · 📍 {activeFarmProfile.location} ·
                บัญชี <span className="font-mono">@{activeFarmProfile.username}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-[#112419]/65 border border-[#DFCBB3]/30 rounded-2xl px-4 py-2.5 text-center">
                <span className="text-[11px] text-[#D5E0D7] block">แกะขนในฟาร์มนี้</span>
                <strong className="font-mono text-xl font-bold text-[#E8C589]">
                  {ownSheepCount} <span className="text-xs font-sans font-normal">ตัว</span>
                </strong>
              </div>

              <button
                type="button"
                onClick={() => handleJump('sheep')}
                className="min-h-[44px] bg-[#FAF6EE] hover:bg-[#EFE6D5] text-[#1E3F2B] px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-colors"
              >
                จัดการคอกและทะเบียนแกะ →
              </button>

              <button
                type="button"
                onClick={onOpenGoogleSheet}
                className="min-h-[44px] bg-[#16A34A]/20 hover:bg-[#16A34A]/35 text-[#BBF7D0] border border-[#4ADE80]/45 px-3.5 py-2 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                title="ส่งออกข้อมูลฟาร์มเป็น Excel / CSV / Google Sheet"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#4ADE80]" />
                <span>ส่งออกข้อมูลฟาร์ม</span>
              </button>

              {activeFarmProfile.googleSheetConfig?.sheetUrl && (
                <a
                  href={activeFarmProfile.googleSheetConfig.sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] bg-white/10 hover:bg-white/20 text-[#FAF6EE] border border-[#DFCBB3]/40 px-3 py-2 rounded-xl font-semibold text-xs flex items-center gap-1 transition-colors"
                  title="เปิดไฟล์ Google Sheet ของฟาร์ม"
                >
                  <span>เปิด Sheet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <button
                type="button"
                onClick={onLogout}
                className="min-h-[44px] bg-transparent hover:bg-white/10 text-[#FAF6EE] border border-[#DFCBB3]/50 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>สลับฟาร์ม / ออกจากระบบ</span>
              </button>
            </div>
          </div>
        ) : (
          <FarmAuthPanel
            farmDirectory={farmDirectory}
            onAuthenticated={onAuthenticated}
            prefilledUsername={selectedLoginHint}
          />
        )}

        {/* Public Directory of Participating Farms (Summary Only — Private Inside Locked) */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#DFCBB3] p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-[#6E4826] flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#1E3F2B]" />
                <span>เครือข่ายฟาร์มที่ใช้งานระบบอยู่ในขณะนี้ ({totalFarms} ฟาร์ม)</span>
              </p>
              <h3 className="text-lg font-semibold text-[#1E3F2B] mt-0.5">
                รายชื่อฟาร์มสมาชิก (แสดงเฉพาะข้อมูลสาธารณะ — ข้อมูลภายในถูกล็อกส่วนตัวทุกฟาร์ม)
              </h3>
            </div>
            <span className="text-xs text-[#5C5346] flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-[#9C6B3F]" />
              <span>ฟาร์มอื่นดูข้อมูลภายในไม่ได้</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {farmDirectory.map(farm => {
              const isCurrent = activeFarmProfile?.farmId === farm.farmId;
              return (
                <div
                  key={farm.farmId}
                  className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-colors ${
                    isCurrent
                      ? 'bg-[#EDF4EF] border-[#1E3F2B]'
                      : 'bg-[#FAF6EE] border-[#E5DEC9]'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm text-[#1E3F2B] leading-snug">
                        {farm.farmName}
                      </h4>
                      <Lock
                        className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                          isCurrent ? 'text-[#2E6B47]' : 'text-[#8C7F6E]'
                        }`}
                      />
                    </div>
                    <p className="text-xs text-[#6E6254] flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0 text-[#9C6B3F]" />
                      <span>{farm.location}</span>
                    </p>
                    <p className="text-[11px] text-[#5C5346] font-medium">{farm.breedFocus}</p>
                  </div>

                  <div className="pt-2.5 border-t border-[#DFCBB3] flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-[#4A321F]">
                      {farm.sheepCount} ตัว
                    </span>
                    {!activeFarmProfile && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLoginHint(farm.username);
                          scrollToPortal();
                        }}
                        className="text-[#1E3F2B] hover:text-[#4A321F] font-semibold cursor-pointer"
                      >
                        กรอกชื่อเข้าฟาร์ม →
                      </button>
                    )}
                    {isCurrent && (
                      <span className="text-[#2E6B47] font-semibold">ฟาร์มที่ใช้งานอยู่</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. WOOD-FRAMED PRIVACY & BREEDING STORY COLLAGE          */}
      {/* ======================================================== */}
      <section className="max-w-6xl mx-auto px-2 sm:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 relative pb-6 sm:pb-8 pr-2 sm:pr-6">
            <div className="relative rounded-2xl overflow-hidden border-[4px] border-[#4A321F] shadow-lg bg-[#F3ECE0] aspect-[4/3]">
              {barnLoaded ? (
                <img
                  src={woodenBarnImg}
                  alt="คอกไม้ธรรมชาติของฟาร์มแกะขน Ovispro"
                  onError={() => setBarnLoaded(false)}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#F3ECE0] text-[#4A321F] font-semibold">
                  คอกแกะขนไม้ธรรมชาติ Ovispro
                </div>
              )}
            </div>

            <div className="w-40 sm:w-52 aspect-[4/3] rounded-2xl overflow-hidden border-[4px] border-[#3B2616] shadow-xl bg-[#FFFDF9] absolute -bottom-2 right-0 sm:right-2">
              <img
                src="/assets/breeds/merino_3912.jpg"
                alt="แกะขนพันธุ์เมอริโนคุณภาพสูง"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="hidden sm:flex items-center gap-2 wood-grain-surface text-[#FAF6EE] px-4 py-2 rounded-xl border border-[#8B6240] shadow-md absolute top-4 -left-3 text-xs font-medium">
              <Leaf className="w-3.5 h-3.5 text-[#9FD1AE]" />
              <span>เครือข่าย {totalFarms} ฟาร์ม · {totalNetworkSheep} แกะขน</span>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-5 text-left">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#6E4826] tracking-wide">
                ระบบศูนย์กลางหลายฟาร์ม · Privacy by Design
              </span>
              <BotanicalVineAccent className="w-24 h-7 shrink-0 opacity-85" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-semibold text-[#1E3F2B] leading-snug">
              แยกฐานข้อมูลทุกฟาร์มเป็นความลับส่วนตัว แต่เชื่อมโอกาสผสมพันธุ์บน Onlysheeps ได้ทันที
            </h2>

            <div className="wood-rail-divider w-28" />

            <p className="text-sm sm:text-base text-[#4A4137] leading-relaxed">
              ทุกฟาร์มที่เข้าใช้งานจะมีบัญชีและพื้นที่เก็บข้อมูลแยกเฉพาะของตัวเอง (ทะเบียนแกะ รายคอก ต้นทุนอาหาร วัตถุดิบ และสมุดบันทึก)
              ฟาร์มอื่นไม่สามารถเข้ามาดูข้อมูลภายในฟาร์มของคุณได้ แต่เมื่อฟาร์มใดต้องการหาคู่ผสมพันธุ์ สามารถเลือกส่งแกะเด่นขึ้นหน้า{' '}
              <strong className="text-[#BE185D]">Onlysheeps 🐑😘</strong> ได้อย่างปลอดภัย
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. 6 PRIVATE/PUBLIC MODULES + PINK ONLYSHEEPS SPOTLIGHT  */}
      {/* ======================================================== */}
      <section id="home-module-grid" className="space-y-6 pt-2">
        <div className="bg-[#FFFDF9] rounded-2xl border-2 border-[#4A321F]/35 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#6E4826]">
              <Leaf className="w-3.5 h-3.5 text-[#1E3F2B]" />
              <span>เครื่องมือบริหารจัดการภายในฟาร์ม (Private) และจับคู่ข้ามฟาร์ม (Public)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#1E3F2B]">
              เลือกหัวข้อการใช้งานของระบบ
            </h2>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <BotanicalVineAccent className="w-28 h-8 hidden sm:block" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map(mod => {
            const Icon = mod.icon;
            const isForest = mod.tone === 'forest';
            const locked = mod.requiresAuth && !activeFarmProfile;

            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => handleJump(mod.id)}
                className={`tactile-module-card group text-left rounded-2xl border-2 overflow-hidden flex flex-col justify-between cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3F2B] ${
                  isForest
                    ? 'bg-[#FFFDF9] border-[#29533A] hover:bg-[#F5F9F6]'
                    : 'bg-[#FFFDF9] border-[#4A321F] hover:bg-[#FAF4EA]'
                }`}
              >
                <div
                  className={`h-2 w-full ${
                    isForest
                      ? 'bg-gradient-to-r from-[#1E3F2B] via-[#2E6B47] to-[#1E3F2B]'
                      : 'wood-grain-surface'
                  }`}
                />

                <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-150 group-hover:scale-105 ${
                          isForest
                            ? 'bg-[#1E3F2B] text-[#FAF6EE] border-[#13291C]'
                            : 'bg-[#4A321F] text-[#FAF6EE] border-[#3B2616]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-xs text-[#8C7F6E] flex items-center justify-end gap-1">
                          {locked && <Lock className="w-3 h-3 text-[#9C6B3F]" />}
                          <span>หมวด {mod.number}</span>
                        </span>
                        <span
                          className={`font-mono text-xs font-semibold ${
                            isForest ? 'text-[#1E3F2B]' : 'text-[#6E4826]'
                          }`}
                        >
                          {mod.metric}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-[#1E3F2B] group-hover:text-[#13291C]">
                        {mod.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#5C5346] leading-relaxed mt-1.5">
                        {mod.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#EAE2D0] flex items-center justify-between">
                    <span
                      className={`text-xs sm:text-sm font-semibold ${
                        isForest ? 'text-[#1E3F2B]' : 'text-[#4A321F]'
                      }`}
                    >
                      {mod.actionLabel}
                    </span>
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-transform duration-150 group-hover:translate-x-1 ${
                        isForest
                          ? 'bg-[#EDF4EF] border-[#C5DEC9] text-[#1E3F2B]'
                          : 'bg-[#F3ECE0] border-[#DFCBB3] text-[#4A321F]'
                      }`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Highlighted Pink Romantic Onlysheeps Matchmaking Card */}
        <button
          type="button"
          onClick={() => handleJump('onlysheeps')}
          className="tactile-pink-btn w-full text-left rounded-3xl border-[3px] border-[#DB2777] bg-gradient-to-r from-[#FFF0F6] via-[#FFE4F0] to-[#FCE7F3] p-5 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer group"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="w-20 h-20 rounded-full overflow-hidden border-[3px] border-[#DB2777] shadow-md shrink-0 bg-white">
              <img
                src={onlysheepsCupidLogo}
                alt="Onlysheeps Cupid Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 bg-[#DB2777] text-white px-3 py-0.5 rounded-full text-xs font-bold">
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>พื้นที่สาธารณะข้ามฟาร์ม · Onlysheeps 🐑😘💘🌹</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#831843]">
                Onlysheeps — ปัดขวาจับคู่ผสมพันธุ์แกะขนข้ามฟาร์ม ({onlysheepsCount} โปรไฟล์)
              </h3>
              <p className="text-xs sm:text-sm text-[#9D174D] max-w-2xl leading-relaxed">
                พื้นที่แลกเปลี่ยนคู่ผสมพันธุ์ข้ามฟาร์มในธีมรักสีชมพู ดูเฉพาะคุณสมบัติแกะที่เจ้าของฟาร์มยินยอมส่งขึ้นการ์ด
                เทียบจุดเด่นคุณภาพขน (µm), น้ำหนักขน และการให้ลูกจริง
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-2 bg-gradient-to-r from-[#DB2777] to-[#E11D48] text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-md shrink-0 group-hover:scale-103 transition-transform">
            <span>เปิด Onlysheeps 💘</span>
            <ArrowRight className="w-4 h-4" />
          </span>
        </button>
      </section>
    </div>
  );
};
