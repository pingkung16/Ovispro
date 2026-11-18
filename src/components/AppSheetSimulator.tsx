/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  RotateCw, 
  ChevronRight, 
  Calculator, 
  Wheat, 
  Activity, 
  ArrowLeft,
  X,
  Share2,
  Users
} from 'lucide-react';
import { FeedIngredient, FormulatedRation, FarmLog, Sheep } from '../types/sheep';

interface AppSheetSimulatorProps {
  sheepList: Sheep[];
  ingredients: FeedIngredient[];
  rations: FormulatedRation[];
  logs: FarmLog[];
  onAddSheep: () => void;
  onSelectSheep: (sheep: Sheep) => void;
  onSelectRation: (ration: FormulatedRation) => void;
}

export const AppSheetSimulator: React.FC<AppSheetSimulatorProps> = ({
  sheepList,
  ingredients,
  rations,
  logs,
  onAddSheep,
  onSelectSheep,
  onSelectRation,
}) => {
  const [activeBottomTab, setActiveBottomTab] = useState<'sheep' | 'ingredients' | 'rations' | 'logs'>('sheep');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSheepDetail, setSelectedSheepDetail] = useState<Sheep | null>(null);

  return (
    <div className="flex flex-col items-center justify-center py-6 px-3">
      <div className="text-center mb-6 max-w-md space-y-1.5">
        <p className="text-xs font-medium text-[#9C6B3F]">
          Ovispro โหมดเข้าคอก · มุมมองสมาร์ตโฟนสำหรับเกษตรกร
        </p>
        <p className="text-xs sm:text-sm text-[#6E6254]">
          มุมมองจำลองสมาร์ตโฟนสำหรับเปิดใช้งานจริงในโรงเรือนและคอกแกะ จับถนัดมือ บันทึกและดูสูตรอาหารได้รวดเร็ว
        </p>
      </div>

      {/* Mobile Device Frame */}
      <div className="w-full max-w-[400px] h-[780px] bg-[#24201B] rounded-[44px] p-3 shadow-2xl border-4 border-[#3A332B] relative flex flex-col overflow-hidden">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-[#171411] rounded-full z-30 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#3A332B] mr-2"></div>
          <div className="w-10 h-1 bg-[#3A332B] rounded-full"></div>
        </div>

        {/* Screen container */}
        <div className="w-full h-full bg-[#FAF6EE] rounded-[34px] overflow-hidden flex flex-col justify-between pt-6 relative">
          
          {/* Top Bar */}
          <div className="bg-[#1E3F2B] text-[#FAF6EE] px-4 py-3 flex items-center justify-between z-20">
            <div className="flex items-center gap-2">
              {selectedSheepDetail ? (
                <button
                  onClick={() => setSelectedSheepDetail(null)}
                  className="p-1 hover:bg-white/15 rounded-lg cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : null}
              <h3 className="font-semibold text-base tracking-tight truncate max-w-[190px]">
                {selectedSheepDetail ? selectedSheepDetail.name : (
                  activeBottomTab === 'sheep' ? 'บันทึกข้อมูลแกะขน' :
                  activeBottomTab === 'ingredients' ? 'คลังวัตถุดิบ' :
                  activeBottomTab === 'rations' ? 'สูตรอาหารรายคอก' : 'บันทึกกิจกรรมฟาร์ม'
                )}
              </h3>
            </div>

            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-[#DFCBB3]" />
              <RotateCw className="w-4 h-4 text-[#DFCBB3]" />
              <Share2 className="w-4 h-4 text-[#DFCBB3]" />
            </div>
          </div>

          {/* Sub-header Search input */}
          {!selectedSheepDetail && (
            <div className="bg-[#FFFDF9] px-3.5 py-2.5 border-b border-[#E5DEC9] flex items-center gap-2 text-xs">
              <Search className="w-3.5 h-3.5 text-[#8C7F6E]" />
              <input
                type="text"
                placeholder="ค้นหาข้อมูล..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-transparent w-full focus:outline-none text-[#24201B] placeholder:text-[#8C7F6E]"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="text-[#8C7F6E] cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Screen Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#EAE2D0] relative bg-[#FFFDF9]">
            {selectedSheepDetail ? (
              <div className="p-4 space-y-4 text-xs">
                <div className="bg-[#FAF6EE] p-3.5 rounded-xl border border-[#EAE2D0]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#1E3F2B] text-[#FAF6EE] font-semibold flex items-center justify-center text-xl">
                      {selectedSheepDetail.gender === 'male' ? '♂' : '♀'}
                    </div>
                    <div>
                      <span className="font-mono text-xs font-semibold text-[#9C6B3F]">
                        {selectedSheepDetail.earTag}
                      </span>
                      <h4 className="text-base font-semibold text-[#1E3F2B]">{selectedSheepDetail.name}</h4>
                      <p className="text-[#6E6254]">{selectedSheepDetail.breed}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#FFFDF9] border border-[#E5DEC9] rounded-xl divide-y divide-[#EAE2D0] text-[#5C5346]">
                  <div className="p-3 flex justify-between">
                    <span className="text-[#8C7F6E]">น้ำหนักตัว</span>
                    <span className="font-semibold font-mono text-[#24201B]">{selectedSheepDetail.weightKg} กก.</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-[#8C7F6E]">ระยะการผลิต</span>
                    <span className="font-medium text-[#1E3F2B]">
                      {selectedSheepDetail.stage === 'wool_lamb' ? 'ลูกแกะเล็ก (0–3 เดือน)' :
                       selectedSheepDetail.stage === 'wool_weaning' ? 'ลูกแกะหย่านม (3–6 เดือน)' :
                       selectedSheepDetail.stage === 'wool_maintenance' ? 'แกะขนระยะดำรงชีพ' :
                       selectedSheepDetail.stage === 'wool_growing' ? 'แกะรุ่นสร้างเส้นใยขน' :
                       selectedSheepDetail.stage === 'wool_gestation' ? 'แม่แกะขนอุ้มท้อง (รวมทุกระยะ)' :
                       selectedSheepDetail.stage === 'wool_lactation' ? 'แม่แกะขนระยะให้นม' :
                       selectedSheepDetail.stage === 'wool_ram' ? 'พ่อพันธุ์แกะขนพรีเมียม' :
                       selectedSheepDetail.stage}
                    </span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-[#8C7F6E]">อัตราโตต่อวัน (ADG)</span>
                    <span className="font-semibold font-mono text-[#2E6B47]">+{selectedSheepDetail.currentAdgGrams || selectedSheepDetail.adgTargetGrams || 175} กรัม/วัน</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-[#8C7F6E]">คะแนน BCS</span>
                    <span className="font-semibold font-mono text-[#9C6B3F]">{selectedSheepDetail.bcs} / 5</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-[#8C7F6E]">คอก</span>
                    <span className="font-medium text-[#24201B]">{selectedSheepDetail.pen}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const s = selectedSheepDetail;
                    setSelectedSheepDetail(null);
                    onSelectSheep(s);
                  }}
                  className="w-full py-2.5 bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] rounded-xl font-semibold text-center cursor-pointer transition-colors"
                >
                  เปิดคำนวณสูตรอาหารสำหรับแกะตัวนี้
                </button>
              </div>
            ) : activeBottomTab === 'sheep' ? (
              sheepList
                .filter(s => s.earTag.toLowerCase().includes(searchTerm.toLowerCase()) || s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(sheep => (
                  <div
                    key={sheep.id}
                    onClick={() => setSelectedSheepDetail(sheep)}
                    className="p-3.5 hover:bg-[#FAF6EE] flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#F3ECE0] text-[#1E3F2B] font-semibold text-xs flex items-center justify-center border border-[#DFCBB3]">
                        {sheep.gender === 'male' ? '♂' : '♀'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-semibold text-[#9C6B3F]">{sheep.earTag}</span>
                          <span className="text-[#8C7F6E]" aria-hidden="true">·</span>
                          <span className="text-xs font-semibold text-[#24201B]">{sheep.name}</span>
                        </div>
                        <p className="text-[11px] text-[#6E6254]">{sheep.breed} · {sheep.pen}</p>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-2">
                      <div>
                        <span className="font-mono font-semibold text-[#1E3F2B] text-xs block">{sheep.weightKg} กก.</span>
                        <span className="text-[10px] font-mono text-[#2E6B47]">+{sheep.currentAdgGrams || 175}g</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8C7F6E]" />
                    </div>
                  </div>
                ))
            ) : activeBottomTab === 'ingredients' ? (
              ingredients
                .filter(i => i.nameTh.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(ing => (
                  <div key={ing.id} className="p-3.5 hover:bg-[#FAF6EE] flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-[#24201B]">{ing.nameTh}</h4>
                      <p className="text-[11px] text-[#6E6254]">CP {ing.crudeProtein}% · TDN {ing.tdn}%</p>
                    </div>
                    <span className="font-mono font-semibold text-[#9C6B3F] text-xs">
                      {ing.pricePerKg.toFixed(1)} ฿/กก.
                    </span>
                  </div>
                ))
            ) : activeBottomTab === 'rations' ? (
              rations.map(ration => (
                <div 
                  key={ration.id} 
                  onClick={() => onSelectRation(ration)}
                  className="p-3.5 hover:bg-[#FAF6EE] flex items-center justify-between cursor-pointer"
                >
                  <div className="max-w-[240px]">
                    <h4 className="text-xs font-semibold text-[#1E3F2B] leading-tight">{ration.name}</h4>
                    <p className="text-[11px] text-[#6E6254] mt-0.5">CP {ration.calculatedCpPercent}% · TDN {ration.calculatedTdnPercent}%</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-semibold text-xs text-[#9C6B3F] block">{ration.costPerHeadPerDay.toFixed(1)} ฿</span>
                    <span className="text-[10px] text-[#8C7F6E]">ต่อตัว/วัน</span>
                  </div>
                </div>
              ))
            ) : (
              logs.map(log => (
                <div key={log.id} className="p-3.5 text-xs space-y-1">
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold text-[#1E3F2B]">{log.sheepEarTag ? `${log.sheepEarTag} - ` : ''}{log.title}</span>
                    <span className="text-[10px] font-mono text-[#8C7F6E] shrink-0">{log.date}</span>
                  </div>
                  <div className="flex justify-between text-[#6E6254] text-[11px]">
                    <span>{log.notes || log.treatmentDose || log.type}</span>
                    {log.weightKg ? <strong className="font-mono text-[#24201B]">{log.weightKg} กก.</strong> :
                     log.feedAmountKg ? <strong className="font-mono text-[#9C6B3F]">{log.feedAmountKg} กก.</strong> : null}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Floating Action Button */}
          {!selectedSheepDetail && (
            <button
              onClick={onAddSheep}
              className="absolute bottom-16 right-4 w-12 h-12 rounded-full bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] shadow-lg flex items-center justify-center cursor-pointer transition-transform active:scale-95 z-20"
              title="เพิ่มข้อมูลใหม่"
            >
              <Plus className="w-6 h-6" />
            </button>
          )}

          {/* Bottom Navigation Bar */}
          <div className="bg-[#F3ECE0] border-t border-[#E5DEC9] px-2 py-2 flex items-center justify-around z-20 text-[10px] font-medium text-[#6E6254]">
            <button
              onClick={() => { setSelectedSheepDetail(null); setActiveBottomTab('sheep'); }}
              className={`flex flex-col items-center py-1 px-2 rounded-lg cursor-pointer transition-colors ${
                activeBottomTab === 'sheep' ? 'text-[#1E3F2B] font-semibold' : 'hover:text-[#1E3F2B]'
              }`}
            >
              <Users className="w-4 h-4 mb-0.5" />
              <span>แกะ ({sheepList.length})</span>
            </button>

            <button
              onClick={() => { setSelectedSheepDetail(null); setActiveBottomTab('ingredients'); }}
              className={`flex flex-col items-center py-1 px-2 rounded-lg cursor-pointer transition-colors ${
                activeBottomTab === 'ingredients' ? 'text-[#1E3F2B] font-semibold' : 'hover:text-[#1E3F2B]'
              }`}
            >
              <Wheat className="w-4 h-4 mb-0.5" />
              <span>วัตถุดิบ</span>
            </button>

            <button
              onClick={() => { setSelectedSheepDetail(null); setActiveBottomTab('rations'); }}
              className={`flex flex-col items-center py-1 px-2 rounded-lg cursor-pointer transition-colors ${
                activeBottomTab === 'rations' ? 'text-[#1E3F2B] font-semibold' : 'hover:text-[#1E3F2B]'
              }`}
            >
              <Calculator className="w-4 h-4 mb-0.5" />
              <span>สูตรอาหาร</span>
            </button>

            <button
              onClick={() => { setSelectedSheepDetail(null); setActiveBottomTab('logs'); }}
              className={`flex flex-col items-center py-1 px-2 rounded-lg cursor-pointer transition-colors ${
                activeBottomTab === 'logs' ? 'text-[#1E3F2B] font-semibold' : 'hover:text-[#1E3F2B]'
              }`}
            >
              <Activity className="w-4 h-4 mb-0.5" />
              <span>บันทึก</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
