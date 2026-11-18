/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  DollarSign,
  Wheat,
  TrendingUp,
  Calculator,
  Scissors,
  Leaf,
  Dna,
  ArrowRight,
} from 'lucide-react';
import { FormulatedRation, Sheep } from '../types/sheep';
import { getBreedPhoto } from '../data/breedPhotos';

interface DashboardViewProps {
  sheepList: Sheep[];
  rations: FormulatedRation[];
  onSelectRationToEdit?: (ration: FormulatedRation) => void;
  onNavigateToTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  sheepList,
  rations,
  onNavigateToTab,
}) => {
  const stats = useMemo(() => {
    let totalAsFedDailyKg = 0;
    let totalDailyCost = 0;

    const rationsMap = new Map<string, FormulatedRation>();
    rations.forEach(r => rationsMap.set(r.id, r));

    sheepList.forEach(s => {
      const assigned = s.assignedRationId ? rationsMap.get(s.assignedRationId) : null;
      if (assigned) {
        totalAsFedDailyKg += assigned.totalAsFedKg;
        totalDailyCost += assigned.costPerHeadPerDay;
      } else {
        totalAsFedDailyKg += 3.0;
        totalDailyCost += 15.0;
      }
    });

    const totalWoolYieldKg = Number(
      sheepList.reduce((sum, s) => sum + (s.fleeceYieldKg || 0), 0).toFixed(1)
    );
    const sheepWithMicron = sheepList.filter(s => s.woolMicron);
    const avgMicron =
      sheepWithMicron.length > 0
        ? (
            sheepWithMicron.reduce((sum, s) => sum + (s.woolMicron || 0), 0) /
            sheepWithMicron.length
          ).toFixed(1)
        : '22.0';

    const breedMap = new Map<string, { breed: string; count: number; pens: Set<string> }>();
    sheepList.forEach(s => {
      const existing = breedMap.get(s.breed);
      if (existing) {
        existing.count += 1;
        if (s.pen) existing.pens.add(s.pen);
      } else {
        breedMap.set(s.breed, {
          breed: s.breed,
          count: 1,
          pens: new Set(s.pen ? [s.pen] : []),
        });
      }
    });

    const breedBreakdown = Array.from(breedMap.values())
      .map(item => ({
        breed: item.breed,
        count: item.count,
        percent: sheepList.length > 0 ? Math.round((item.count / sheepList.length) * 100) : 0,
        pensLabel: Array.from(item.pens).sort().join(', '),
        photoUrl: getBreedPhoto(item.breed),
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalSheep: sheepList.length,
      totalAsFedDailyKg: totalAsFedDailyKg.toFixed(1),
      totalDailyCost: Math.round(totalDailyCost),
      totalMonthlyCost: Math.round(totalDailyCost * 30),
      totalWoolYieldKg,
      avgMicron,
      breedBreakdown,
    };
  }, [sheepList, rations]);

  return (
    <div className="space-y-8">
      {/* Top Executive Summary Banner */}
      <div className="relative overflow-hidden bg-[#FFFDF9] p-6 sm:p-8 rounded-2xl border border-[#DFCBB3] flex flex-col md:flex-row md:items-end justify-between gap-4 shadow-xs">
        <div className="space-y-1.5">
          <p className="text-xs text-[#6E4826] font-semibold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#1E3F2B]" />
            <span>6. สรุปต้นทุน-ผลผลิตขนประจำฟาร์ม ({stats.totalSheep} ตัว)</span>
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#1E3F2B] tracking-tight">
            ภาพรวมปริมาณอาหาร ต้นทุนรายวัน และผลผลิตตัดขนต่อปี
          </h2>
          <p className="text-xs sm:text-sm text-[#6E6254] max-w-2xl leading-relaxed">
            สรุป 3 ตัวชี้วัดหลักสำหรับเจ้าของฟาร์ม เพื่อวางแผนจัดซื้อวัตถุดิบ คุมงบค่าอาหารรายวัน และประเมินผลผลิตเส้นใยขนแกะประจำปี
          </p>
        </div>

        <button
          onClick={() => onNavigateToTab('calculator')}
          className="tactile-cta-btn bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start md:self-auto"
        >
          <Calculator className="w-4 h-4 text-[#DFCBB3]" />
          <span>คำนวณสูตรอาหารรายคอก</span>
        </button>
      </div>

      {/* 3 Requested Executive KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. อาหารสดที่ใช้ต่อวัน */}
        <div className="relative overflow-hidden bg-[#FFFDF9] rounded-2xl border-2 border-[#4A321F]/25 p-6 sm:p-7 flex flex-col justify-between space-y-5 shadow-xs">
          <div className="h-1.5 w-full wood-grain-surface rounded-full" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-[#6E4826] flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-[#2E6B47]" />
                <span>ปริมาณการใช้อาหารทั้งฟาร์ม</span>
              </span>
              <h3 className="text-lg font-semibold text-[#1E3F2B] mt-1">
                อาหารสดที่ใช้ต่อวัน
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#FAF6EE] border border-[#DFCBB3] flex items-center justify-center shrink-0">
              <Wheat className="w-5 h-5 text-[#9C6B3F]" />
            </div>
          </div>

          <div className="pt-2 border-t border-[#EAE2D0]">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold font-mono text-[#9C6B3F]">
                {stats.totalAsFedDailyKg}
              </span>
              <span className="text-sm font-medium text-[#5C5346]">กก./วัน</span>
            </div>
            <p className="text-xs text-[#6E6254] mt-2 leading-relaxed">
              รวมอาหารหยาบและอาหารข้นสำหรับแกะขนทั้งหมด {stats.totalSheep} ตัวในคอก A–D
            </p>
          </div>
        </div>

        {/* 2. ต้นทุนค่าอาหารต่อวัน */}
        <div className="relative overflow-hidden bg-[#FFFDF9] rounded-2xl border-2 border-[#1E3F2B]/25 p-6 sm:p-7 flex flex-col justify-between space-y-5 shadow-xs">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#1E3F2B] via-[#2E6B47] to-[#1E3F2B] rounded-full" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-[#2E6B47] flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-[#1E3F2B]" />
                <span>ค่าใช้จ่ายโภชนาการรายวัน</span>
              </span>
              <h3 className="text-lg font-semibold text-[#1E3F2B] mt-1">
                ต้นทุนค่าอาหารต่อวัน
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#EDF4EF] border border-[#C5DEC9] flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-[#1E3F2B]" />
            </div>
          </div>

          <div className="pt-2 border-t border-[#EAE2D0]">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold font-mono text-[#1E3F2B]">
                {stats.totalDailyCost.toLocaleString()}
              </span>
              <span className="text-sm font-medium text-[#5C5346]">บาท/วัน</span>
            </div>
            <p className="text-xs text-[#6E6254] mt-2 leading-relaxed">
              ประมาณการค่าอาหารรายเดือน{' '}
              <strong className="text-[#1E3F2B] font-mono">
                {stats.totalMonthlyCost.toLocaleString()}
              </strong>{' '}
              บาท/เดือน
            </p>
          </div>
        </div>

        {/* 3. ผลผลิตตัดขนต่อปี */}
        <div className="relative overflow-hidden bg-[#FFFDF9] rounded-2xl border-2 border-[#4A321F]/25 p-6 sm:p-7 flex flex-col justify-between space-y-5 shadow-xs">
          <div className="h-1.5 w-full wood-grain-surface rounded-full" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-[#6E4826] flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-[#2E6B47]" />
                <span>ผลผลิตเส้นใยขนทั้งฟาร์ม</span>
              </span>
              <h3 className="text-lg font-semibold text-[#1E3F2B] mt-1">
                ผลผลิตตัดขนต่อปี
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#FAF6EE] border border-[#DFCBB3] flex items-center justify-center shrink-0">
              <Scissors className="w-5 h-5 text-[#9C6B3F]" />
            </div>
          </div>

          <div className="pt-2 border-t border-[#EAE2D0]">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold font-mono text-[#4A321F]">
                {stats.totalWoolYieldKg}
              </span>
              <span className="text-sm font-medium text-[#5C5346]">กก./ปี</span>
            </div>
            <p className="text-xs text-[#6E6254] mt-2 leading-relaxed">
              ความละเอียดเส้นใยเฉลี่ยทั้งฝูง{' '}
              <strong className="text-[#9C6B3F] font-mono">{stats.avgMicron} µm</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Farm Breed Breakdown & Headcount Section */}
      <section className="bg-[#FFFDF9] rounded-2xl border-2 border-[#4A321F]/25 p-6 sm:p-7 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE2D0]">
          <div>
            <p className="text-xs font-semibold text-[#6E4826] flex items-center gap-1.5">
              <Dna className="w-3.5 h-3.5 text-[#1E3F2B]" />
              <span>โครงสร้างสายพันธุ์ในฟาร์มจริง ({stats.breedBreakdown.length} สายพันธุ์)</span>
            </p>
            <h3 className="text-lg sm:text-xl font-semibold text-[#1E3F2B] mt-1">
              รายชื่อสายพันธุ์และจำนวนตัวที่มีอยู่ในฟาร์ม
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToTab('sheep')}
            className="text-xs font-semibold text-[#1E3F2B] hover:text-[#4A321F] flex items-center gap-1.5 cursor-pointer transition-colors self-start sm:self-auto"
          >
            <span>ดูรายตัวในหน้าคอกและทะเบียน</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {stats.breedBreakdown.length === 0 ? (
          <p className="text-sm text-[#6E6254] py-4 text-center">
            ยังไม่มีข้อมูลแกะในฟาร์ม
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {stats.breedBreakdown.map(item => (
              <div
                key={item.breed}
                className="rounded-2xl border border-[#DFCBB3] bg-[#FAF6EE] overflow-hidden flex flex-col justify-between"
              >
                <div className="p-4 sm:p-5 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-[#4A321F]/35 bg-[#EFE6D5] shrink-0">
                    <img
                      src={item.photoUrl}
                      alt={item.breed}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-[#1E3F2B] text-base leading-snug">
                      {item.breed}
                    </h4>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-semibold font-mono text-[#4A321F]">
                        {item.count}
                      </span>
                      <span className="text-xs font-medium text-[#5C5346]">
                        ตัว ({item.percent}% ของฝูง)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-4 sm:px-5 py-2.5 bg-[#F3ECE0] border-t border-[#EAE2D0] flex items-center justify-between text-xs text-[#5C5346]">
                  <span>คอกที่เลี้ยง</span>
                  <span className="font-medium text-[#1E3F2B]">
                    {item.pensLabel || '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
