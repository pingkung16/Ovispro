/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  RefreshCw,
  ArrowLeft,
  Users,
  Wheat,
  Calculator,
  CalendarCheck2,
  Clock,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import type { LiveShareReport, PublicPlatformOverview } from '../types/sheep';
import { fetchLiveShareReport } from '../utils/api';
import { decodeCompactSharePayload, extractSharePayloadFromUrlHash } from '../utils/shareReport';

interface LiveShareReportViewProps {
  shareId: string;
  livePublicOverview?: PublicPlatformOverview | null;
  onExitShareView: () => void;
}

export const LiveShareReportView: React.FC<LiveShareReportViewProps> = ({
  shareId,
  livePublicOverview,
  onExitShareView,
}) => {
  const [report, setReport] = useState<LiveShareReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveReport =
    report && report.scope === 'hub' && livePublicOverview
      ? {
          ...report,
          totalSheep: livePublicOverview.totalNetworkSheep,
          publicOverview: livePublicOverview,
        }
      : report;

  const loadReport = async () => {
    setLoading(true);
    setError(null);

    let embeddedReport: LiveShareReport | null = null;
    if (typeof window !== 'undefined') {
      const encoded = extractSharePayloadFromUrlHash(window.location.hash, window.location.search);
      if (encoded) {
        embeddedReport = await decodeCompactSharePayload(encoded);
        if (embeddedReport) {
          setReport(embeddedReport);
        }
      }
    }

    if (!shareId || shareId === 'embedded-live') {
      if (!embeddedReport) {
        setError('ไม่พบข้อมูลลิงก์รายงานที่แชร์นี้');
      }
      setLoading(false);
      return;
    }

    try {
      const serverReport = await fetchLiveShareReport(shareId);
      if (
        !embeddedReport ||
        new Date(serverReport.updatedAt).getTime() >= new Date(embeddedReport.updatedAt).getTime()
      ) {
        setReport(serverReport);
      }
    } catch (err) {
      if (!embeddedReport) {
        setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดรายงานล่าสุดได้');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [shareId]);

  if (loading && !report) {
    return (
      <div className="max-w-4xl mx-auto bg-[#FFFDF9] rounded-3xl border border-[#DFCBB3] p-12 text-center space-y-2">
        <p className="text-base font-semibold text-[#1E3F2B]">กำลังดึงข้อมูลฟาร์มล่าสุดจากระบบ...</p>
        <p className="text-xs text-[#6E6254]">ซิงค์ข้อมูล ณ ปัจจุบัน</p>
      </div>
    );
  }

  if (error || !effectiveReport) {
    return (
      <div className="max-w-xl mx-auto bg-[#FFFDF9] rounded-3xl border border-[#E8C5C0] p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-[#A63D2E]">ไม่พบข้อมูลลิงก์ที่แชร์นี้</h2>
        <p className="text-xs sm:text-sm text-[#5C5346]">{error || 'ลิงก์อาจหมดอายุหรือไม่ถูกต้อง'}</p>
        <button
          type="button"
          onClick={onExitShareView}
          className="bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับสู่หน้าหลัก Ovispro</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-[#FFFDF9] rounded-3xl border-2 border-[#4A321F]/35 p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2E6B47] bg-[#EDF4EF] border border-[#C5DEC9] px-3 py-1 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>รายงานข้อมูลฟาร์มล่าสุดแบบเรียลไทม์ (อ่านอย่างเดียว)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1E3F2B] mt-2">
              {effectiveReport.farmName}
            </h1>
            <p className="text-xs sm:text-sm text-[#5C5346] flex flex-wrap items-center gap-3">
              <span>เจ้าของฟาร์ม: {effectiveReport.ownerName}</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#9C6B3F]" />
                {effectiveReport.location}
              </span>
              <span className="inline-flex items-center gap-1 text-[#2E6B47] font-medium">
                <Clock className="w-3.5 h-3.5" />
                อัปเดตล่าสุด: {new Date(effectiveReport.updatedAt).toLocaleString('th-TH')}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={loadReport}
              className="bg-[#EDF4EF] hover:bg-[#DCECE1] text-[#1E3F2B] border border-[#C5DEC9] px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>รีเฟรชข้อมูลล่าสุด</span>
            </button>
            <button
              type="button"
              onClick={onExitShareView}
              className="bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>เข้าสู่แอป Ovispro</span>
            </button>
          </div>
        </div>

        {/* Summary KPI Strip */}
        {effectiveReport.scope === 'farm' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#EAE2D0]">
            <div className="bg-[#FAF6EE] p-3.5 rounded-xl border border-[#DFCBB3]">
              <span className="text-xs text-[#6E6254] flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#1E3F2B]" />
                จำนวนแกะในฟาร์ม
              </span>
              <strong className="text-xl font-mono text-[#1E3F2B] block mt-1">
                {effectiveReport.totalSheep} ตัว
              </strong>
            </div>
            <div className="bg-[#FAF6EE] p-3.5 rounded-xl border border-[#DFCBB3]">
              <span className="text-xs text-[#6E6254] flex items-center gap-1">
                <Wheat className="w-3.5 h-3.5 text-[#9C6B3F]" />
                วัตถุดิบในคลัง
              </span>
              <strong className="text-xl font-mono text-[#1E3F2B] block mt-1">
                {effectiveReport.totalIngredients} ชนิด
              </strong>
            </div>
            <div className="bg-[#FAF6EE] p-3.5 rounded-xl border border-[#DFCBB3]">
              <span className="text-xs text-[#6E6254] flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-[#2E6B47]" />
                สูตรอาหารที่บันทึก
              </span>
              <strong className="text-xl font-mono text-[#1E3F2B] block mt-1">
                {effectiveReport.totalRations} สูตร
              </strong>
            </div>
            <div className="bg-[#FAF6EE] p-3.5 rounded-xl border border-[#DFCBB3]">
              <span className="text-xs text-[#6E6254] flex items-center gap-1">
                <CalendarCheck2 className="w-3.5 h-3.5 text-[#6E4826]" />
                บันทึกกิจกรรมฟาร์ม
              </span>
              <strong className="text-xl font-mono text-[#1E3F2B] block mt-1">
                {effectiveReport.totalLogs} รายการ
              </strong>
            </div>
          </div>
        ) : (
          effectiveReport.publicOverview && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#EAE2D0]">
              <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#DFCBB3]">
                <span className="text-xs text-[#6E6254]">จำนวนฟาร์มสมาชิก</span>
                <strong className="text-2xl font-mono text-[#1E3F2B] block mt-1">
                  {effectiveReport.publicOverview.totalFarms} ฟาร์ม
                </strong>
              </div>
              <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#DFCBB3]">
                <span className="text-xs text-[#6E6254]">แกะในเครือข่ายรวม</span>
                <strong className="text-2xl font-mono text-[#1E3F2B] block mt-1">
                  {effectiveReport.publicOverview.totalNetworkSheep} ตัว
                </strong>
              </div>
              <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#DFCBB3]">
                <span className="text-xs text-[#6E6254]">โปรไฟล์บน Onlysheeps</span>
                <strong className="text-2xl font-mono text-[#DB2777] block mt-1">
                  {effectiveReport.publicOverview.onlysheepsCount} โปรไฟล์
                </strong>
              </div>
            </div>
          )
        )}
      </div>

      {/* Live Pen Breakdown */}
      {effectiveReport.pens.length > 0 && (
        <section className="bg-[#FFFDF9] rounded-2xl border border-[#DFCBB3] p-6 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-[#1E3F2B]">
            สรุปจำนวนแกะรายคอก ณ ปัจจุบัน
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {effectiveReport.pens.map(pen => (
              <div
                key={pen.id}
                className="bg-[#FAF6EE] rounded-xl border border-[#EAE2D0] p-4 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#1E3F2B]">{pen.code}</span>
                  <span className="font-mono text-sm font-bold text-[#9C6B3F]">
                    {pen.sheepCount} ตัว
                  </span>
                </div>
                <p className="text-xs text-[#5C5346] line-clamp-1">{pen.name}</p>
                <p className="text-[11px] font-mono text-[#6E6254]">
                  นน.เฉลี่ย {pen.averageWeightKg} กก. · ADG +{pen.averageAdgGrams} ก./วัน
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Live Formulated Rations */}
      {effectiveReport.rations.length > 0 && (
        <section className="bg-[#FFFDF9] rounded-2xl border border-[#DFCBB3] p-6 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-[#1E3F2B]">
            สูตรอาหารที่ใช้งานล่าสุด ({effectiveReport.rations.length} สูตร)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {effectiveReport.rations.map(r => (
              <div
                key={r.id}
                className="bg-[#FAF6EE] rounded-xl border border-[#EAE2D0] p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <strong className="text-sm text-[#1E3F2B]">{r.name}</strong>
                  <span className="text-xs font-mono font-semibold text-[#9C6B3F] shrink-0">
                    {r.costPerHeadPerDay.toFixed(1)} ฿/ตัว/วัน
                  </span>
                </div>
                <p className="text-xs text-[#6E6254]">{r.description}</p>
                <div className="flex flex-wrap gap-3 text-xs font-mono text-[#1E3F2B] pt-1">
                  <span>CP {r.calculatedCpPercent}%</span>
                  <span>TDN {r.calculatedTdnPercent}%</span>
                  <span>ให้กิน {r.totalAsFedKg.toFixed(2)} กก./วัน</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Logs */}
      {effectiveReport.recentLogs.length > 0 && (
        <section className="bg-[#FFFDF9] rounded-2xl border border-[#DFCBB3] p-6 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-[#1E3F2B]">
            สมุดบันทึกกิจกรรมล่าสุด ({effectiveReport.recentLogs.length} รายการล่าสุด)
          </h2>
          <div className="divide-y divide-[#EAE2D0]">
            {effectiveReport.recentLogs.map(log => (
              <div key={log.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-mono text-[#9C6B3F] mr-2">{log.date}</span>
                  <strong className="text-[#1E3F2B]">{log.title}</strong>
                  {log.notes && <p className="text-[#6E6254] mt-0.5">{log.notes}</p>}
                </div>
                <span className="text-[#5C5346] font-medium">{log.recordedBy}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
