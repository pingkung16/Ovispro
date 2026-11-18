/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Sparkles, 
  X,
  Wheat,
  Smartphone
} from 'lucide-react';

interface LabGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LabGuideModal: React.FC<LabGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#1B1712]/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#FFFDF9] rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-xl border border-[#DFCBB3] max-h-[90vh] overflow-y-auto space-y-6 text-[#24201B]">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#EAE2D0]">
          <div>
            <p className="text-xs text-[#9C6B3F] font-medium">
              คู่มือสำหรับเกษตรกร · Ovispro Guide
            </p>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#1E3F2B] mt-1">
              วิธีใช้งาน Ovispro จัดการฟาร์มแกะขน & คำนวณสูตรอาหาร
            </h2>
            <p className="text-xs sm:text-sm text-[#6E6254] mt-1">
              คู่มือแนะนำขั้นตอนง่ายๆ สำหรับเจ้าของฟาร์ม ผู้ดูแลคอก และผู้เริ่มต้นเลี้ยงแกะขน
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#8C7F6E] hover:text-[#24201B] p-1.5 rounded-lg hover:bg-[#F3ECE0] cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Quick 4 Steps for Farmers */}
        <div className="space-y-3">
          <h3 className="font-semibold text-[#1E3F2B] text-sm sm:text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#9C6B3F]" />
            <span>4 ขั้นตอนง่ายๆ ในการบริหารฟาร์มแกะขนให้มีคุณภาพสูงสุด</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm">
            <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#EAE2D0] space-y-1.5">
              <span className="font-semibold text-[#1E3F2B] block">
                1. ดูภาพรวมคอกและลงทะเบียนแกะขน
              </span>
              <p className="text-[#5C5346] leading-relaxed text-xs">
                เข้าที่หน้า <strong>"1. คอกและทะเบียนแกะขน"</strong> เลือกคอก A–D เพื่อดูอายุ น้ำหนักเฉลี่ย ปริมาณอาหาร และ ADG พร้อมกด <strong>"ลงทะเบียนแกะขนใหม่"</strong> เพื่อบันทึกประวัติสายพันธุ์พ่อแม่และข้อมูลสุขภาพ
              </p>
            </div>

            <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#EAE2D0] space-y-1.5">
              <span className="font-semibold text-[#9C6B3F] block">
                2. ดูอันดับสายพันธุ์แกะขนแนะนำสำหรับไทย
              </span>
              <p className="text-[#5C5346] leading-relaxed text-xs">
                ดูที่แท็บ <strong>"2. แนะนำสายพันธุ์แกะขน (11 พันธุ์)"</strong> เพื่อเปรียบเทียบอันดับความนิยม 3 อันดับแรก (ติดดาว), ความละเอียดเส้นใย (ไมครอน µm), น้ำหนักขนตัดต่อปี และร้อยละการให้ลูก/คอก
              </p>
            </div>

            <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#EAE2D0] space-y-1.5">
              <span className="font-semibold text-[#1E3F2B] block">
                3. คำนวณสูตรอาหารเองตามเกณฑ์ % โปรตีน NRC
              </span>
              <p className="text-[#5C5346] leading-relaxed text-xs">
                เลือกช่วงวัยและวัตถุดิบในคอก พร้อมเทียบตาราง <strong>% โปรตีน (% CP)</strong> ที่แนะนำแต่ละช่วงวัย ระบบจะคำนวณโปรตีน พลังงาน TDN และต้นทุนต่อตัวต่อวันให้อัตโนมัติ
              </p>
            </div>

            <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#EAE2D0] space-y-1.5">
              <span className="font-semibold text-[#9C6B3F] block">
                4. พิมพ์ใบชั่งผสมอาหารและติดตามฟาร์ม
              </span>
              <p className="text-[#5C5346] leading-relaxed text-xs">
                เปิด <strong>"ใบชั่งผสมประจำวัน"</strong> สำหรับคนงานชั่งตามน้ำหนักจริงในคอก พร้อมบันทึก 5 กิจกรรมหลักและดูผลผลิตขนรายปีในหน้าสรุป
              </p>
            </div>
          </div>
        </div>

        {/* Feeding Nutrition Principles */}
        <div className="bg-[#FAF6EE] p-5 rounded-xl border border-[#EAE2D0] space-y-2.5 text-xs">
          <h4 className="font-semibold text-[#1E3F2B] text-sm flex items-center gap-2">
            <Wheat className="w-4 h-4 text-[#9C6B3F]" />
            <span>หลักการให้อาหารแกะขนที่เกษตรกรควรรู้ (มาตรฐาน NRC):</span>
          </h4>
          <ul className="list-disc pl-5 space-y-1.5 text-[#5C5346] leading-relaxed">
            <li><strong>ปริมาณการกินได้ (DMI):</strong> แกะโตเต็มวัยกินวัตถุแห้งประมาณ 3.0 – 3.5% ของน้ำหนักตัว ส่วนแม่ให้นมลูกแฝดกินได้ถึง 4.0 – 4.5%</li>
            <li><strong>สัดส่วนอาหารหยาบต่อข้น (Roughage : Concentrate):</strong> แกะขนระยะบำรุงเส้นใยแนะนำหยาบ 70% ข้น 30% และระยะเติบโต/ให้นม 55–65% เพื่อรักษาสมดุลกระเพาะรูเมนและการสังเคราะห์เคราติน</li>
            <li><strong>สัดส่วนแคลเซียมต่อฟอสฟอรัส (Ca : P):</strong> ควรควบคุมให้ได้ <strong>2 : 1</strong> เสมอ โดยเฉพาะในแกะเพศผู้ เพื่อป้องกันโรคนิ่วในระบบทางเดินปัสสาวะ และระมัดระวังพิษจากทองแดง</li>
          </ul>
        </div>

        {/* Mobile & Public Sharing Tip */}
        <div className="bg-[#EDF4EF] p-4 rounded-xl border border-[#C5DEC9] flex items-start gap-3 text-xs text-[#1E3F2B]">
          <Smartphone className="w-5 h-5 text-[#2E6B47] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">ใช้งานในคอกแกะผ่านมือถือ:</span>
            <p className="text-[#2E6B47] leading-relaxed">
              คุณสามารถกดปุ่ม <strong>"โหมดเข้าคอก"</strong> ที่มุมบนขวา เพื่อเปิดหน้าจอสไตล์แอปพลิเคชันมือถือที่จับถนัดมือ และกดปุ่ม <strong>"แชร์ให้ฟาร์มอื่น"</strong> เพื่อส่งต่อลิงก์หรือแสดง QR Code ให้คนงานหรือเพื่อนเกษตรกรเปิดใช้งานได้ทันที
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-[#EAE2D0]">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] rounded-xl font-semibold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            เข้าใจแล้ว / เริ่มใช้งาน
          </button>
        </div>
      </div>
    </div>
  );
};
