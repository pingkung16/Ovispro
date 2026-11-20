/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  UserPlus,
  LogIn,
  Sparkles,
  KeyRound,
  AlertCircle,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import type { FarmProfile, PublicFarmSummary } from '../types/sheep';
import { loginFarmAccount, registerFarmAccount, type FarmWorkspaceData } from '../utils/api';
import { writeFarmLocalVault } from '../utils/farmStorage';

interface FarmAuthPanelProps {
  farmDirectory: PublicFarmSummary[];
  onAuthenticated: (profile: FarmProfile, workspace?: FarmWorkspaceData) => Promise<void> | void;
  prefilledUsername?: string;
  compact?: boolean;
  title?: string;
  subtitle?: string;
}

export const FarmAuthPanel: React.FC<FarmAuthPanelProps> = ({
  farmDirectory,
  onAuthenticated,
  prefilledUsername = '',
  compact = false,
  title = 'เข้าสู่พื้นที่จัดการฟาร์มของคุณ',
  subtitle = 'เข้าสู่ระบบฟาร์มที่มีอยู่ หรือสมัครเปิดฟาร์มใหม่ได้ทันที เพื่อบันทึกฝูงแกะและคำนวณสูตรอาหาร',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login state
  const [username, setUsername] = useState(prefilledUsername);
  const [password, setPassword] = useState('');

  // Register state
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFarmName, setRegFarmName] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regLocation, setRegLocation] = useState('');
  const [regContact, setRegContact] = useState('');
  const [regBreedFocus, setRegBreedFocus] = useState('Merino · Hampshire · Dorset');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync prefilled username when user clicks a farm card
  React.useEffect(() => {
    if (prefilledUsername) {
      setMode('login');
      setUsername(prefilledUsername);
      setErrorMsg(null);
    }
  }, [prefilledUsername]);

  const normalizedRegUsername = regUsername.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await loginFarmAccount(username.trim(), password);
      setPassword('');
      if (res.workspace) {
        writeFarmLocalVault(res.workspace.profile.farmId, res.workspace);
      }
      await onAuthenticated(res.profile, res.workspace);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);

    if (normalizedRegUsername.length < 3) {
      setErrorMsg('กรุณาตั้งชื่อบัญชีฟาร์มด้วยภาษาอังกฤษหรือตัวเลข (a-z, 0-9) อย่างน้อย 3 ตัวอักษร');
      return;
    }
    if (regPassword.length < 4) {
      setErrorMsg('กรุณาตั้งรหัสผ่านอย่างน้อย 4 ตัวอักษร');
      return;
    }
    if (regFarmName.trim().length < 2) {
      setErrorMsg('กรุณากรอกชื่อฟาร์มของคุณอย่างน้อย 2 ตัวอักษร');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerFarmAccount({
        username: normalizedRegUsername,
        password: regPassword,
        farmName: regFarmName.trim(),
        ownerName: regOwnerName.trim(),
        location: regLocation.trim(),
        contact: regContact.trim(),
        breedFocus: regBreedFocus.trim(),
      });
      if (res.workspace) {
        writeFarmLocalVault(res.workspace.profile.farmId, res.workspace);
      }
      await onAuthenticated(res.profile, res.workspace);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'สมัครเปิดฟาร์มไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`bg-[#FFFDF9] rounded-3xl border-2 border-[#4A321F]/40 shadow-lg overflow-hidden ${
        compact ? 'p-5 sm:p-6' : 'p-6 sm:p-8'
      }`}
    >
      {/* Header + Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EAE2D0]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1E3F2B]">
            <Sparkles className="w-4 h-4 text-[#2E6B47]" />
            <span>ระบบจัดการฟาร์มแกะขนครบวงจร (Ovispro Workspace)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-[#1E3F2B] mt-1">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-[#5C5346] mt-0.5">{subtitle}</p>
        </div>

        <div className="bg-[#F3ECE0] p-1 rounded-xl border border-[#DFCBB3] flex items-center shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`min-h-[40px] px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
              mode === 'login'
                ? 'bg-[#1E3F2B] text-[#FAF6EE] shadow-xs'
                : 'text-[#5C5346] hover:text-[#1E3F2B]'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>เข้าสู่ระบบฟาร์ม</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`min-h-[40px] px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
              mode === 'register'
                ? 'bg-[#4A321F] text-[#FAF6EE] shadow-xs'
                : 'text-[#5C5346] hover:text-[#1E3F2B]'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>สมัครเปิดฟาร์มใหม่</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-4 bg-[#FCEFED] border border-[#E8C5C0] text-[#A63D2E] rounded-xl px-4 py-3 text-xs sm:text-sm flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* MODE 1: LOGIN */}
      {mode === 'login' && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form onSubmit={handleLogin} className="lg:col-span-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#5C5346] mb-1.5">
                ชื่อบัญชีฟาร์ม (Username)
              </label>
              <input
                type="text"
                required
                placeholder="เช่น Ovisfarm, inthanon หรือชื่อบัญชีของคุณ"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-sm text-[#24201B] focus:outline-none focus:border-[#1E3F2B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C5346] mb-1.5">
                รหัสผ่านฟาร์ม (Password)
              </label>
              <input
                type="password"
                required
                placeholder="กรอกรหัสผ่านส่วนตัวของฟาร์มนี้"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-sm text-[#24201B] focus:outline-none focus:border-[#1E3F2B]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="tactile-cta-btn w-full min-h-[46px] bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่พื้นที่ฟาร์มนี้'}</span>
            </button>

            <div className="bg-[#FAF6EE] border border-[#EAE2D0] rounded-xl p-3.5 text-xs text-[#5C5346] space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-[#4A321F]">
                <KeyRound className="w-3.5 h-3.5 text-[#9C6B3F]" />
                <span>เข้าใช้งานได้สะดวกจากทุกอุปกรณ์:</span>
              </div>
              <p className="leading-relaxed">
                กรอกชื่อบัญชีและรหัสผ่านฟาร์มของคุณ เพื่อซิงค์ข้อมูลฝูงแกะ สูตรอาหาร และผลผลิตขนแบบเรียลไทม์
              </p>
            </div>
          </form>

          {/* Participating Farms Selector Hints (No Passwords or Private Data Shown) */}
          <div className="lg:col-span-6 space-y-2.5">
            <p className="text-xs font-semibold text-[#6E4826]">
              ฟาร์มสมาชิกที่เข้าร่วมใช้งานตอนนี้ ({farmDirectory.length} ฟาร์ม) · แตะเพื่อกรอกชื่อบัญชี:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 max-h-[290px] overflow-y-auto pr-1">
              {farmDirectory.map(farm => {
                const isSelected = username.trim().toLowerCase() === farm.username.toLowerCase();
                return (
                  <button
                    key={farm.farmId}
                    type="button"
                    onClick={() => setUsername(farm.username)}
                    className={`text-left px-3.5 py-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#EDF4EF] border-[#1E3F2B] shadow-xs'
                        : 'bg-[#FAF6EE] border-[#DFCBB3] hover:border-[#9C6B3F]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#1E3F2B] truncate">
                          {farm.farmName}
                        </span>
                        <span className="font-mono text-[11px] bg-[#EFE6D5] text-[#4A321F] px-1.5 py-0.5 rounded shrink-0">
                          @{farm.username}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6E6254] flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 shrink-0 text-[#9C6B3F]" />
                        <span>{farm.location}</span>
                        <span aria-hidden="true">·</span>
                        <span>{farm.sheepCount} ตัว</span>
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8C7F6E] shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: REGISTER NEW FARM */}
      {mode === 'register' && (
        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          <div className="bg-[#EDF4EF] border border-[#C5DEC9] rounded-xl px-4 py-3 text-xs text-[#1E3F2B]">
            ฟาร์มใหม่จะได้พื้นที่ฐานข้อมูลส่วนตัวแยกขาดจากฟาร์มอื่น พร้อมคอกมาตรฐาน A–D และคลังวัตถุดิบอาหารเริ่มต้นทันที
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5C5346] mb-1">
                ชื่อบัญชีฟาร์ม (Username ภาษาอังกฤษ/ตัวเลข) *
              </label>
              <input
                type="text"
                required
                minLength={3}
                placeholder="เช่น mywoolfarm"
                value={regUsername}
                onChange={e => setRegUsername(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-sm font-mono focus:outline-none focus:border-[#1E3F2B]"
              />
              {regUsername.trim().length > 0 && normalizedRegUsername !== regUsername.trim().toLowerCase() && (
                <p className="mt-1 text-[11px] text-[#9C6B3F]">
                  ชื่อบัญชีที่จะใช้จริง: <span className="font-mono font-semibold">@{normalizedRegUsername || '(ต้องเป็น a-z / 0-9)'}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C5346] mb-1">
                ตั้งรหัสผ่าน (อย่างน้อย 4 ตัวอักษร) *
              </label>
              <input
                type="password"
                required
                minLength={4}
                placeholder="ตั้งรหัสผ่านฟาร์ม"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-sm focus:outline-none focus:border-[#1E3F2B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5C5346] mb-1">
                ชื่อฟาร์มของคุณ *
              </label>
              <input
                type="text"
                required
                placeholder="เช่น ฟาร์มแกะขนสายหมอก"
                value={regFarmName}
                onChange={e => setRegFarmName(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-sm focus:outline-none focus:border-[#1E3F2B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C5346] mb-1">
                ชื่อเจ้าของ / ผู้ดูแลฟาร์ม
              </label>
              <input
                type="text"
                placeholder="เช่น คุณปันปัน"
                value={regOwnerName}
                onChange={e => setRegOwnerName(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-sm focus:outline-none focus:border-[#1E3F2B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5C5346] mb-1">จังหวัด / อำเภอ</label>
              <input
                type="text"
                placeholder="เช่น จ.เชียงราย"
                value={regLocation}
                onChange={e => setRegLocation(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-sm focus:outline-none focus:border-[#1E3F2B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C5346] mb-1">เบอร์โทร / Line ID</label>
              <input
                type="text"
                placeholder="เช่น Line: @myfarm"
                value={regContact}
                onChange={e => setRegContact(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-sm focus:outline-none focus:border-[#1E3F2B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C5346] mb-1">สายพันธุ์ที่เลี้ยง</label>
              <input
                type="text"
                value={regBreedFocus}
                onChange={e => setRegBreedFocus(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-sm focus:outline-none focus:border-[#1E3F2B]"
              />
            </div>
          </div>

          <div className="pt-1 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="tactile-cta-btn min-h-[46px] bg-[#4A321F] hover:bg-[#5E4029] text-[#FAF6EE] px-7 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังสร้างพื้นที่ฟาร์ม...' : 'สร้างบัญชีฟาร์มส่วนตัวทันที'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
