/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Wheat,
  Calculator,
  Plus,
  CheckCircle2,
  Sparkles,
  BarChart3,
  ShieldCheck,
  Scissors,
  Search,
  Star,
  Award,
  Leaf,
} from 'lucide-react';
import { SheepBreedInfo } from '../types/sheep';
import { SHEEP_BREEDS } from '../data/breedsData';

interface BreedsCatalogProps {
  onSelectBreedForRegistration: (breedName: string) => void;
  onSelectBreedForFormulation: (breedName: string) => void;
}

export const BreedsCatalog: React.FC<BreedsCatalogProps> = ({
  onSelectBreedForRegistration,
  onSelectBreedForFormulation,
}) => {
  const [selectedBreedId, setSelectedBreedId] = useState<string>(SHEEP_BREEDS[0].id);
  const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards');
  const [breedGroupFilter, setBreedGroupFilter] = useState<
    'all' | 'fine_wool' | 'medium_wool' | 'long_wool'
  >('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBreeds = useMemo(() => {
    return SHEEP_BREEDS.filter(breed => {
      const matchFilter = breedGroupFilter === 'all' || breed.type === breedGroupFilter;

      const matchSearch =
        breed.nameTh.toLowerCase().includes(searchTerm.toLowerCase()) ||
        breed.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        breed.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        breed.typeLabel.toLowerCase().includes(searchTerm.toLowerCase());

      return matchFilter && matchSearch;
    });
  }, [breedGroupFilter, searchTerm]);

  const selectedBreed = useMemo(() => {
    const found = filteredBreeds.find(b => b.id === selectedBreedId);
    return found || filteredBreeds[0] || SHEEP_BREEDS[0];
  }, [filteredBreeds, selectedBreedId]);

  const getBreedBadge = (breed: SheepBreedInfo) => {
    switch (breed.type) {
      case 'fine_wool':
        return { label: 'แกะขนละเอียด', color: 'text-[#1E3F2B]' };
      case 'medium_wool':
        return { label: 'แกะขนปานกลาง', color: 'text-[#9C6B3F]' };
      case 'long_wool':
      default:
        return { label: 'แกะขนยาว', color: 'text-[#2E6B47]' };
    }
  };

  return (
    <div className="space-y-8">
      {/* Editorial Top Banner */}
      <div className="bg-[#FFFDF9] p-6 sm:p-8 rounded-2xl border border-[#DFCBB3] space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div>
            <p className="text-xs text-[#6E4826] font-semibold flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-[#2E6B47]" />
              <span>
                2. คำแนะนำจากแอปพลิเคชันสำหรับเจ้าของฟาร์ม · เฉพาะแกะขนแท้ 11 สายพันธุ์
              </span>
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#1E3F2B] mt-1.5 tracking-tight">
              อันดับสายพันธุ์แกะขนยอดนิยมและให้ผลผลิตดีในประเทศไทย
            </h2>
            <p className="text-xs sm:text-sm text-[#6E6254] mt-2 max-w-3xl leading-relaxed">
              จัดอันดับพันธุ์แกะขน (Wool Sheep Only) ที่แนะนำสำหรับเกษตรกรไทยตั้งแต่{' '}
              <strong className="text-[#9C6B3F]">อันดับ 1 – 11</strong> พร้อมติดดาว{' '}
              <strong className="text-[#B8860B]">★ 3 อันดับแรก</strong> อ้างอิงข้อมูลจาก OSU, SheepUSA, Livestock Conservancy และกรมปศุสัตว์/โครงการหลวง
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#F3ECE0] p-1 rounded-xl border border-[#E5DEC9] self-start md:self-auto shrink-0">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'cards'
                  ? 'bg-[#1E3F2B] text-[#FAF6EE]'
                  : 'text-[#5C5346] hover:text-[#1E3F2B]'
              }`}
            >
              ดูรายละเอียดรายอันดับ
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                viewMode === 'matrix'
                  ? 'bg-[#1E3F2B] text-[#FAF6EE]'
                  : 'text-[#5C5346] hover:text-[#1E3F2B]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>ตารางจัดอันดับ 1–11</span>
            </button>
          </div>
        </div>

        {/* Top 3 Quick Star Showcase Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
          {SHEEP_BREEDS.slice(0, 3).map(topBreed => {
            const isActive = selectedBreed.id === topBreed.id && viewMode === 'cards';
            return (
              <button
                key={topBreed.id}
                type="button"
                onClick={() => {
                  setBreedGroupFilter('all');
                  setSelectedBreedId(topBreed.id);
                  setViewMode('cards');
                }}
                className={`text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                  isActive
                    ? 'bg-[#1E3F2B] border-[#B8860B] text-[#FAF6EE] shadow-md'
                    : 'bg-[#FAF6EE] border-[#DFCBB3] hover:border-[#B8860B] text-[#24201B]'
                }`}
              >
                <img
                  src={topBreed.photoUrl}
                  alt={topBreed.nameTh}
                  className="w-12 h-12 rounded-xl object-cover border border-[#DFCBB3] shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                    <Star className="w-3.5 h-3.5 fill-[#E5A93B] text-[#E5A93B] shrink-0" />
                    <span className={isActive ? 'text-[#F5CF7B]' : 'text-[#9C6B3F]'}>
                      อันดับ {topBreed.rank} แนะนำในไทย
                    </span>
                  </div>
                  <p className={`text-sm font-semibold truncate mt-0.5 ${isActive ? 'text-[#FAF6EE]' : 'text-[#1E3F2B]'}`}>
                    {topBreed.nameTh}
                  </p>
                  <p className={`text-[11px] truncate ${isActive ? 'text-[#D5E0D7]' : 'text-[#6E6254]'}`}>
                    ขนตัด {topBreed.fleeceWeightKg.split('(')[0].trim()}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Filter Bar (Wool Only — No Hair Sheep) */}
        <div className="pt-5 border-t border-[#EAE2D0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            <button
              onClick={() => setBreedGroupFilter('all')}
              className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                breedGroupFilter === 'all'
                  ? 'bg-[#1E3F2B] text-[#FAF6EE]'
                  : 'bg-[#FAF6EE] text-[#5C5346] hover:text-[#1E3F2B] border border-[#E5DEC9]'
              }`}
            >
              แกะขนทั้งหมด ({SHEEP_BREEDS.length} พันธุ์)
            </button>
            <button
              onClick={() => setBreedGroupFilter('fine_wool')}
              className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors flex items-center gap-1.5 ${
                breedGroupFilter === 'fine_wool'
                  ? 'bg-[#1E3F2B] text-[#FAF6EE]'
                  : 'bg-[#FAF6EE] text-[#5C5346] hover:text-[#1E3F2B] border border-[#E5DEC9]'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>แกะขนละเอียด (Fine Wool)</span>
            </button>
            <button
              onClick={() => setBreedGroupFilter('medium_wool')}
              className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                breedGroupFilter === 'medium_wool'
                  ? 'bg-[#1E3F2B] text-[#FAF6EE]'
                  : 'bg-[#FAF6EE] text-[#5C5346] hover:text-[#1E3F2B] border border-[#E5DEC9]'
              }`}
            >
              แกะขนปานกลาง (Medium Wool)
            </button>
            <button
              onClick={() => setBreedGroupFilter('long_wool')}
              className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                breedGroupFilter === 'long_wool'
                  ? 'bg-[#1E3F2B] text-[#FAF6EE]'
                  : 'bg-[#FAF6EE] text-[#5C5346] hover:text-[#1E3F2B] border border-[#E5DEC9]'
              }`}
            >
              แกะขนยาว (Long Wool)
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#8C7F6E] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาพันธุ์ เช่น คอร์ริเดล, ดอร์เซท..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-[#24201B] placeholder:text-[#9A8E7D] focus:outline-none focus:border-[#1E3F2B]"
            />
          </div>
        </div>
      </div>

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Ranked Breed List */}
          <div className="lg:col-span-4 space-y-3 max-h-[800px] overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs text-[#6E6254] px-1 font-medium">
              <span>จัดอันดับพันธุ์แกะขน ({filteredBreeds.length})</span>
              <span className="text-[#9C6B3F]">★ = ติดดาว 3 อันดับแรก</span>
            </div>

            {filteredBreeds.map(breed => {
              const isSelected = breed.id === selectedBreed.id;
              const badge = getBreedBadge(breed);
              const isTop3 = Boolean(breed.isTopRecommended || breed.rank <= 3);

              return (
                <div
                  key={breed.id}
                  onClick={() => setSelectedBreedId(breed.id)}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#1E3F2B] border-[#4A321F] text-[#FAF6EE] shadow-md shadow-[#1E3F2B]/10'
                      : isTop3
                      ? 'bg-[#FFFDF9] border-[#E5C88B] hover:border-[#B8860B] text-[#24201B]'
                      : 'bg-[#FFFDF9] border-[#E5DEC9] hover:border-[#B68656] text-[#24201B]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Badge */}
                    <div
                      className={`w-8 h-8 rounded-xl flex flex-col items-center justify-center shrink-0 font-mono text-xs font-semibold border ${
                        isTop3
                          ? 'bg-[#FDF4DC] border-[#E5A93B] text-[#8B5A00]'
                          : isSelected
                          ? 'bg-[#29533A] border-[#FAF6EE]/20 text-[#FAF6EE]'
                          : 'bg-[#F3ECE0] border-[#DFCBB3] text-[#4A321F]'
                      }`}
                    >
                      {isTop3 ? (
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-[#E5A93B] text-[#B8860B]" />
                          <span>{breed.rank}</span>
                        </div>
                      ) : (
                        <span>#{breed.rank}</span>
                      )}
                    </div>

                    <img
                      src={breed.photoUrl}
                      alt={breed.nameTh}
                      className="w-12 h-12 rounded-xl object-cover border border-[#DFCBB3]/60 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="truncate">
                      <h4
                        className={`font-semibold text-sm truncate ${
                          isSelected ? 'text-[#FAF6EE]' : 'text-[#1E3F2B]'
                        }`}
                      >
                        {breed.nameTh}
                      </h4>
                      <p
                        className={`text-xs truncate ${
                          isSelected ? 'text-[#D5E0D7]' : 'text-[#6E6254]'
                        }`}
                      >
                        {breed.nameEn}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-[11px] font-medium block ${
                        isSelected ? 'text-[#DFCBB3]' : badge.color
                      }`}
                    >
                      {badge.label}
                    </span>
                    <span
                      className={`block text-[11px] font-mono mt-0.5 ${
                        isSelected ? 'text-[#FAF6EE]/80' : 'text-[#8C7F6E]'
                      }`}
                    >
                      ลูก/คอก {breed.twinningRatePct}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Active Breed Dossier */}
          <div className="lg:col-span-8 bg-[#FFFDF9] rounded-2xl border border-[#DFCBB3] p-6 sm:p-8 space-y-7">
            {/* Real Breed Photo Banner */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-[#4A321F]/30 aspect-16/9 sm:aspect-21/9 max-h-80 bg-[#F3ECE0]">
              <img
                src={selectedBreed.photoUrl}
                alt={selectedBreed.nameTh}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#18291E]/90 via-[#18291E]/40 to-transparent flex flex-col justify-between p-5 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm ${
                      selectedBreed.isTopRecommended
                        ? 'bg-[#FDF4DC] text-[#7D4E00] border border-[#E5A93B]'
                        : 'bg-[#1E3F2B]/90 text-[#FAF6EE] border border-[#FAF6EE]/20'
                    }`}
                  >
                    {selectedBreed.isTopRecommended ? (
                      <>
                        <Star className="w-3.5 h-3.5 fill-[#E5A93B] text-[#B8860B]" />
                        <span>แนะนำติดดาว อันดับที่ {selectedBreed.rank} สำหรับไทย</span>
                      </>
                    ) : (
                      <>
                        <Award className="w-3.5 h-3.5 text-[#DFCBB3]" />
                        <span>อันดับที่ {selectedBreed.rank} · แกะขนแนะนำ</span>
                      </>
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-medium text-[#DFCBB3] mb-1 block">
                    {selectedBreed.typeLabel}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-semibold text-[#FAF6EE]">
                    {selectedBreed.nameTh}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#EFE6D5] mt-0.5">
                    {selectedBreed.nameEn} · แหล่งกำเนิด: {selectedBreed.origin}
                  </p>
                </div>
              </div>
            </div>

            {/* Recommendation Reason Highlight */}
            {selectedBreed.recommendationReason && (
              <div
                className={`p-4 sm:p-5 rounded-xl border text-xs sm:text-sm flex items-start gap-3 ${
                  selectedBreed.isTopRecommended
                    ? 'bg-[#FDF9ED] border-[#E5C88B] text-[#5C4418]'
                    : 'bg-[#FAF6EE] border-[#DFCBB3] text-[#5C5346]'
                }`}
              >
                {selectedBreed.isTopRecommended ? (
                  <Star className="w-5 h-5 fill-[#E5A93B] text-[#B8860B] shrink-0 mt-0.5" />
                ) : (
                  <Award className="w-5 h-5 text-[#9C6B3F] shrink-0 mt-0.5" />
                )}
                <div>
                  <strong className="text-[#1E3F2B] font-semibold block">
                    เหตุผลการจัดอันดับ #{selectedBreed.rank} สำหรับฟาร์มแกะขนในประเทศไทย:
                  </strong>
                  <p className="mt-1 leading-relaxed">{selectedBreed.recommendationReason}</p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#EAE2D0]">
              <div className="text-xs sm:text-sm text-[#6E6254]">
                คำแนะนำจากแอปพลิเคชันเพื่อประกอบการตัดสินใจคัดเลือกพันธุ์เข้าฟาร์ม
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onSelectBreedForRegistration(selectedBreed.nameTh)}
                  className="bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>ไปหน้าลงทะเบียนแกะของฟาร์ม</span>
                </button>

                <button
                  onClick={() => onSelectBreedForFormulation(selectedBreed.nameTh)}
                  className="bg-[#FAF6EE] hover:bg-[#F3ECE0] text-[#1E3F2B] border border-[#DFCBB3] px-4 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Calculator className="w-4 h-4" />
                  <span>คำนวณสูตรอาหาร</span>
                </button>
              </div>
            </div>

            {/* Key KPI Metrics (3 Clean Columns — NO % Carcass, Twinning renamed to ร้อยละการให้ลูก/คอก) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#EAE2D0] bg-[#FAF6EE] rounded-xl border border-[#EAE2D0] text-center">
              <div className="p-4">
                <span className="text-[11px] text-[#7D7061] font-medium block">น้ำหนักตัวเต็มวัย</span>
                <span className="text-base font-semibold font-mono text-[#1E3F2B] mt-1 block">
                  พ่อ {selectedBreed.adultRamWeightKg}
                </span>
                <span className="text-[11px] text-[#6E6254]">
                  แม่พันธุ์ {selectedBreed.adultEweWeightKg}
                </span>
              </div>

              <div className="p-4">
                <span className="text-[11px] text-[#7D7061] font-medium block">อัตราการเติบโต (ADG)</span>
                <span className="text-base font-semibold font-mono text-[#9C6B3F] mt-1 block">
                  +{selectedBreed.averageAdgGrams}
                </span>
                <span className="text-[11px] text-[#6E6254]">
                  หย่านม 90 วัน {selectedBreed.weaningWeightKg}
                </span>
              </div>

              <div className="p-4">
                <span className="text-[11px] text-[#7D7061] font-medium block">ร้อยละการให้ลูก/คอก</span>
                <span className="text-base font-semibold font-mono text-[#2E6B47] mt-1 block">
                  {selectedBreed.twinningRatePct}
                </span>
                <span className="text-[11px] text-[#6E6254]">อ้างอิงอัตราการตกลูกเฉลี่ย</span>
              </div>
            </div>

            {/* Wool / Fleece Specs */}
            <div className="bg-[#EDF3EE] p-5 rounded-xl border border-[#C5D6C9] text-xs sm:text-sm space-y-2">
              <div className="flex items-center gap-2 text-[#1E3F2B] font-semibold">
                <Scissors className="w-4 h-4 text-[#1E3F2B]" />
                <span>ข้อมูลคุณภาพเส้นใยและผลผลิตขน (Wool & Fleece Yield)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[#3C5343] pt-1">
                <div>
                  <span className="text-[#5C7263]">เกรดความละเอียดขน: </span>
                  <strong className="text-[#1E3F2B]">{selectedBreed.woolGrade}</strong>
                </div>
                <div>
                  <span className="text-[#5C7263]">น้ำหนักขนตัดต่อปี: </span>
                  <strong className="text-[#1E3F2B]">{selectedBreed.fleeceWeightKg}</strong>
                </div>
              </div>
            </div>

            {/* Highlight Characteristics */}
            <div className="space-y-3">
              <h4 className="text-sm sm:text-base font-semibold text-[#1E3F2B] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#9C6B3F]" />
                <span>ลักษณะเด่นทางพันธุศาสตร์และการให้ผลผลิตขน</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedBreed.highlightFeatures.map((feat, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-[#5C5346] bg-[#FAF6EE] p-3.5 rounded-xl border border-[#EAE2D0]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#2E6B47] shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Climate & Feeding Strategy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs sm:text-sm">
              <div className="bg-[#FAF6EE] p-5 rounded-xl border border-[#EAE2D0] space-y-2">
                <span className="font-semibold text-[#1E3F2B] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#2E6B47]" />
                  <span>การปรับตัวต่อสภาพภูมิอากาศไทย</span>
                </span>
                <p className="text-[#5C5346] leading-relaxed">{selectedBreed.climateAdaptation}</p>
              </div>

              <div className="bg-[#FAF6EE] p-5 rounded-xl border border-[#EAE2D0] space-y-2">
                <span className="font-semibold text-[#1E3F2B] flex items-center gap-2">
                  <Wheat className="w-4 h-4 text-[#9C6B3F]" />
                  <span>กลยุทธ์การให้อาหารที่แนะนำ</span>
                </span>
                <p className="text-[#5C5346] leading-relaxed">{selectedBreed.feedingStrategy}</p>
              </div>
            </div>

            {/* Suitability for Thai Farms */}
            <div className="bg-[#F5EDE2] p-5 rounded-xl border border-[#DFCBB3] text-xs sm:text-sm">
              <span className="font-semibold text-[#6E4826] block mb-1">
                คำแนะนำเชิงธุรกิจสำหรับฟาร์มแกะขนในประเทศไทย
              </span>
              <p className="text-[#5C5346] leading-relaxed">{selectedBreed.suitabilityForThaiFarms}</p>
            </div>
          </div>
        </div>
      ) : (
        /* Matrix Comparison Table (NO % Carcass, Ranked #1..#11 with ★ Top 3, and ร้อยละการให้ลูก/คอก) */
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#DFCBB3] overflow-x-auto p-5">
          <table className="w-full text-left text-xs sm:text-sm text-[#5C5346]">
            <thead className="bg-[#FAF6EE] text-[#6E6254] font-semibold border-b border-[#E5DEC9]">
              <tr>
                <th className="p-3.5 pl-4 text-center whitespace-nowrap">อันดับ</th>
                <th className="p-3.5">สายพันธุ์แกะขน</th>
                <th className="p-3.5 whitespace-nowrap">กลุ่มเส้นใย</th>
                <th className="p-3.5 text-right whitespace-nowrap">พ่อพันธุ์ (กก.)</th>
                <th className="p-3.5 text-right whitespace-nowrap">แม่พันธุ์ (กก.)</th>
                <th className="p-3.5 text-center whitespace-nowrap">ADG (ก./วัน)</th>
                <th className="p-3.5 text-center whitespace-nowrap">ผลผลิตขน/ปี</th>
                <th className="p-3.5 text-center whitespace-nowrap">ร้อยละการให้ลูก/คอก</th>
                <th className="p-3.5 pr-4 text-right whitespace-nowrap">ดูรายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE2D0]">
              {filteredBreeds.map(breed => {
                const badge = getBreedBadge(breed);
                const isTop3 = Boolean(breed.isTopRecommended || breed.rank <= 3);
                return (
                  <tr key={breed.id} className="hover:bg-[#FAF6EE]/70 transition-colors">
                    <td className="p-3.5 pl-4 text-center font-mono font-semibold">
                      {isTop3 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FDF4DC] border border-[#E5A93B] text-[#7D4E00] text-xs">
                          <Star className="w-3.5 h-3.5 fill-[#E5A93B] text-[#B8860B]" />
                          <span>{breed.rank}</span>
                        </span>
                      ) : (
                        <span className="text-[#6E6254]">#{breed.rank}</span>
                      )}
                    </td>
                    <td className="p-3.5 font-semibold text-[#1E3F2B] flex items-center gap-3">
                      <img
                        src={breed.photoUrl}
                        alt={breed.nameTh}
                        className="w-10 h-10 rounded-xl object-cover border border-[#DFCBB3] shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div>{breed.nameTh}</div>
                        <div className="text-[11px] text-[#7D7061] font-normal">{breed.nameEn}</div>
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`text-xs font-medium ${badge.color}`}>{badge.label}</span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-semibold text-[#24201B] whitespace-nowrap">
                      {breed.adultRamWeightKg}
                    </td>
                    <td className="p-3.5 text-right font-mono text-[#5C5346] whitespace-nowrap">
                      {breed.adultEweWeightKg}
                    </td>
                    <td className="p-3.5 text-center font-mono font-semibold text-[#9C6B3F] whitespace-nowrap">
                      +{breed.averageAdgGrams}
                    </td>
                    <td className="p-3.5 text-center font-mono text-[#1E3F2B] text-xs whitespace-nowrap">
                      {breed.fleeceWeightKg.split('(')[0].trim()}
                    </td>
                    <td className="p-3.5 text-center font-mono font-semibold text-[#2E6B47] whitespace-nowrap">
                      {breed.twinningRatePct}
                    </td>
                    <td className="p-3.5 pr-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedBreedId(breed.id);
                          setViewMode('cards');
                        }}
                        className="px-3 py-1.5 bg-[#1E3F2B] text-[#FAF6EE] rounded-lg text-xs font-medium hover:bg-[#29533A] cursor-pointer"
                      >
                        เจาะลึกพันธุ์
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
