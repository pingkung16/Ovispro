/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  BookOpen,
  Smartphone,
  Monitor,
  Share2,
  Home,
  Dna,
  Users,
  Calculator,
  Wheat,
  TrendingUp,
  CalendarCheck2,
  Heart,
  LogOut,
  LogIn,
  FileSpreadsheet,
} from 'lucide-react';
import onlysheepsCupidLogo from '../assets/images/onlysheeps_cupid_logo_1794824689407.jpg';
import type { FarmProfile } from '../types/sheep';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isAppSheetMode: boolean;
  setIsAppSheetMode: (val: boolean) => void;
  onOpenLabGuide: () => void;
  onOpenShareModal: () => void;
  activeFarmProfile: FarmProfile | null;
  totalFarmsCount: number;
  sheepCount: number;
  ingredientCount: number;
  rationCount: number;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onOpenGoogleSheet: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  isAppSheetMode,
  setIsAppSheetMode,
  onOpenLabGuide,
  onOpenShareModal,
  activeFarmProfile,
  totalFarmsCount,
  sheepCount,
  ingredientCount,
  rationCount,
  onOpenAuthModal,
  onLogout,
  onOpenGoogleSheet,
}) => {
  return (
    <header className="bg-[#FFFDF9]/95 backdrop-blur-md sticky top-0 z-40 border-b-2 border-[#4A321F]/25">
      {/* Forest Green & Dark Walnut Timber Utility Strip */}
      <div className="bg-gradient-to-r from-[#1E3F2B] via-[#234832] to-[#3B2616] text-[#FAF6EE] text-xs py-2 px-5 sm:px-8 border-b border-[#3B2616]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="font-medium text-[#EFE6D5]">
              แพลตฟอร์มจัดการฟาร์มแกะขนครบวงจร (Smart Wool Sheep Hub)
            </span>
            <span className="hidden sm:inline text-[#A6B89D]" aria-hidden="true">·</span>
            <span className="hidden sm:inline text-[#D5E0D7]">
              เครือข่าย {totalFarmsCount} ฟาร์ม · บริหารฝูงแกะ คำนวณอาหาร และจับคู่พันธุ์
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {activeFarmProfile ? (
              <>
                <button
                  type="button"
                  onClick={onOpenGoogleSheet}
                  className="text-[#BBF7D0] hover:text-white font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                  title="ส่งออกข้อมูลฟาร์มเป็น Excel / CSV / Google Sheet"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#4ADE80]" />
                  <span>ส่งออกข้อมูล</span>
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-[#FDE68A] hover:text-white font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                  title="ออกจากระบบฟาร์มนี้เพื่อสลับเข้าฟาร์มอื่น"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>สลับฟาร์ม / ออกจากระบบ</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="text-[#A7F3D0] hover:text-white font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>เข้าสู่ระบบฟาร์ม</span>
              </button>
            )}

            <button
              onClick={onOpenShareModal}
              className="text-[#FAF6EE]/90 hover:text-white font-medium flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
              title="แชร์ลิงก์หรือเปิด QR Code"
            >
              <Share2 className="w-3.5 h-3.5 text-[#DFCBB3]" />
              <span className="hidden md:inline">แชร์เว็บให้ฟาร์มอื่น</span>
            </button>

            <button
              onClick={onOpenLabGuide}
              className="bg-[#FAF6EE] hover:bg-[#F3ECE0] text-[#1E3F2B] px-3.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 border-b-2 border-[#C5B197]"
              title="คู่มือแนวทางคำนวณและโภชนาการแกะ"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>คู่มือการใช้งาน</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Boutique Branding Bar */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div
          className="flex items-center gap-3.5 cursor-pointer group"
          onClick={() => {
            setIsAppSheetMode(false);
            setCurrentTab('home');
          }}
        >
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-[#4A321F]/65 bg-[#FAF6EE] shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-xs">
            <img
              src="/assets/logo/ovispro_playful_logo.jpg"
              alt="Ovispro Playful Farm Stamp Logo"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-baseline gap-2.5">
              <span className="font-brand italic font-semibold text-2xl sm:text-3xl tracking-wide text-[#1E3F2B]">
                Ovispro
              </span>
              <span className="text-xs text-[#6E4826] font-semibold tracking-wide">
                {activeFarmProfile ? activeFarmProfile.farmName : 'Smart Sheep Hub'}
              </span>
            </div>
            <p className="text-xs text-[#6E6254] hidden sm:block mt-0.5">
              {activeFarmProfile
                ? `${activeFarmProfile.farmName} · 📍 ${activeFarmProfile.location}`
                : 'ผู้ช่วยดิจิทัลสำหรับคนเลี้ยงแกะขน · ทะเบียนแกะ คำนวณอาหาร และจับคู่พันธุ์'}
            </p>
          </div>
        </div>

        {/* Active Farm Metrics or Login Prompt + Mode Switcher */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          {activeFarmProfile ? (
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#5C5346] bg-[#FAF6EE] px-3.5 py-1.5 rounded-xl border border-[#DFCBB3]">
              <span>
                แกะของฟาร์มนี้ <strong className="text-[#1E3F2B] font-mono text-sm ml-0.5">{sheepCount}</strong> ตัว
              </span>
              <span className="text-[#C8B89E]" aria-hidden="true">·</span>
              <span>
                วัตถุดิบ <strong className="text-[#1E3F2B] font-mono text-sm ml-0.5">{ingredientCount}</strong>
              </span>
              <span className="hidden sm:inline text-[#C8B89E]" aria-hidden="true">·</span>
              <span className="hidden sm:inline">
                สูตร <strong className="text-[#6E4826] font-mono text-sm ml-0.5">{rationCount}</strong>
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 text-xs font-semibold text-[#1E3F2B] bg-[#EDF4EF] hover:bg-[#DCECE1] px-4 py-2 rounded-xl border border-[#C5DEC9] cursor-pointer transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 text-[#2E6B47]" />
              <span>เข้าสู่ระบบฟาร์ม / สมัครฟาร์มใหม่</span>
            </button>
          )}

          {/* Mode Switcher */}
          <div className="bg-[#F3ECE0] p-1 rounded-xl border border-[#DFCBB3] flex items-center text-xs">
            <button
              onClick={() => setIsAppSheetMode(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                !isAppSheetMode
                  ? 'bg-[#1E3F2B] text-[#FAF6EE] shadow-xs'
                  : 'text-[#5C5346] hover:text-[#1E3F2B]'
              }`}
              title="มุมมองหน้าจอคอมพิวเตอร์และแท็บเล็ต"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">หน้าเว็บหลัก</span>
              <span className="sm:hidden">เว็บ</span>
            </button>
            <button
              onClick={() => setIsAppSheetMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isAppSheetMode
                  ? 'bg-[#4A321F] text-[#FAF6EE] shadow-xs'
                  : 'text-[#5C5346] hover:text-[#1E3F2B]'
              }`}
              title="จำลองมุมมองมือถือสำหรับเกษตรกรถือเข้าคอก"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">โหมดเข้าคอก</span>
              <span className="sm:hidden">เข้าคอก</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      {!isAppSheetMode && (
        <div className="border-t border-[#EAE2D0] bg-[#FAF6EE]/80 px-5 sm:px-8">
          <nav className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-2.5 overflow-x-auto py-2.5 scrollbar-none text-xs sm:text-sm">
            <button
              onClick={() => setCurrentTab('home')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'home'
                  ? 'bg-[#4A321F] text-[#FAF6EE] font-semibold border-b-2 border-[#26170C]'
                  : 'text-[#5C5346] hover:text-[#1E3F2B] hover:bg-[#EFE6D5] font-medium'
              }`}
            >
              <Home className="w-4 h-4 shrink-0" />
              <span>หน้าแรก</span>
            </button>

            <button
              onClick={() => setCurrentTab('sheep')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'sheep'
                  ? 'bg-[#1E3F2B] text-[#FAF6EE] font-semibold border-b-2 border-[#13291C]'
                  : 'text-[#5C5346] hover:text-[#1E3F2B] hover:bg-[#EFE6D5] font-medium'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>1. คอกและทะเบียนแกะ{activeFarmProfile ? ` (${sheepCount})` : ''}</span>
            </button>

            <button
              onClick={() => setCurrentTab('breeds')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'breeds'
                  ? 'bg-[#1E3F2B] text-[#FAF6EE] font-semibold border-b-2 border-[#13291C]'
                  : 'text-[#5C5346] hover:text-[#1E3F2B] hover:bg-[#EFE6D5] font-medium'
              }`}
            >
              <Dna className="w-4 h-4 shrink-0" />
              <span>2. แนะนำสายพันธุ์ (11 พันธุ์)</span>
            </button>

            <button
              onClick={() => setCurrentTab('calculator')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'calculator'
                  ? 'bg-[#1E3F2B] text-[#FAF6EE] font-semibold border-b-2 border-[#13291C]'
                  : 'text-[#5C5346] hover:text-[#1E3F2B] hover:bg-[#EFE6D5] font-medium'
              }`}
            >
              <Calculator className="w-4 h-4 shrink-0" />
              <span>3. คำนวณสูตรอาหาร</span>
            </button>

            <button
              onClick={() => setCurrentTab('ingredients')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'ingredients'
                  ? 'bg-[#1E3F2B] text-[#FAF6EE] font-semibold border-b-2 border-[#13291C]'
                  : 'text-[#5C5346] hover:text-[#1E3F2B] hover:bg-[#EFE6D5] font-medium'
              }`}
            >
              <Wheat className="w-4 h-4 shrink-0" />
              <span>4. วัตถุดิบอาหาร</span>
            </button>

            <button
              onClick={() => setCurrentTab('logs')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'logs'
                  ? 'bg-[#1E3F2B] text-[#FAF6EE] font-semibold border-b-2 border-[#13291C]'
                  : 'text-[#5C5346] hover:text-[#1E3F2B] hover:bg-[#EFE6D5] font-medium'
              }`}
            >
              <CalendarCheck2 className="w-4 h-4 shrink-0" />
              <span>5. บันทึกกิจกรรม</span>
            </button>

            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'bg-[#1E3F2B] text-[#FAF6EE] font-semibold border-b-2 border-[#13291C]'
                  : 'text-[#5C5346] hover:text-[#1E3F2B] hover:bg-[#EFE6D5] font-medium'
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span>สรุปต้นทุน-ผลผลิตขน</span>
            </button>

            <button
              onClick={() => setCurrentTab('onlysheeps')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer border ${
                currentTab === 'onlysheeps'
                  ? 'bg-gradient-to-r from-[#DB2777] via-[#EC4899] to-[#E11D48] text-white font-bold border-[#9D174D] border-b-2 shadow-sm shadow-[#DB2777]/30'
                  : 'bg-[#FFF0F6] text-[#BE185D] border-[#F9A8D4] hover:bg-[#FCE7F3] font-semibold'
              }`}
            >
              <img
                src={onlysheepsCupidLogo}
                alt=""
                className="w-5 h-5 rounded-full object-cover border border-white/80 shrink-0"
                referrerPolicy="no-referrer"
              />
              <Heart className="w-3.5 h-3.5 fill-current shrink-0" />
              <span>Onlysheeps 🐑😘</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
