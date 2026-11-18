/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Wheat, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  Layers,
  ShieldAlert,
  LayoutGrid,
  Table as TableIcon,
  Sprout,
  Zap,
  FlaskConical,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import { FeedIngredient, IngredientCategory } from '../types/sheep';
import {
  resolveIngredientFromName,
  QUICK_INGREDIENT_SUGGESTIONS,
} from '../data/feedCompositionLookup';

interface IngredientsManagerProps {
  ingredients: FeedIngredient[];
  onAddIngredient: (ing: Omit<FeedIngredient, 'id'>) => void;
  onUpdateIngredient: (ing: FeedIngredient) => void;
  onDeleteIngredient: (id: string) => void;
}

type NutritionGroupKey = 'all' | 'protein' | 'energy' | 'mineral_vitamin';

interface CategoryCardMeta {
  key: Exclude<NutritionGroupKey, 'all'>;
  nameTh: string;
  subtitle: string;
  tagline: string;
  icon: 'protein' | 'energy' | 'mineral_vitamin';
}

const CATEGORY_DEFINITIONS: CategoryCardMeta[] = [
  {
    key: 'protein',
    nameTh: 'อาหารให้โปรตีน',
    subtitle: 'Protein & Keratin Sources',
    tagline: 'กากถั่วเหลือง กากเบียร์เปียกสด และใบกระถิน เสริมกรดอะมิโนสร้างเส้นใยขนและน้ำนม',
    icon: 'protein',
  },
  {
    key: 'energy',
    nameTh: 'อาหารให้พลังงาน',
    subtitle: 'Energy & Forage Sources',
    tagline: 'หญ้าสด หญ้าแห้ง หญ้าหมัก ข้าวโพดบด รำข้าว มันสำปะหลังเส้น และกากน้ำตาล',
    icon: 'energy',
  },
  {
    key: 'mineral_vitamin',
    nameTh: 'วิตามินและแร่ธาตุ',
    subtitle: 'Vitamins, Minerals & Premixes',
    tagline: 'พรีมิกซ์แร่ธาตุและกำมะถัน ไดแคลเซียมฟอสเฟต และเกลือแกงเสริมไอโอดีน',
    icon: 'mineral_vitamin',
  },
];

export const getNutritionGroup = (ing: FeedIngredient): Exclude<NutritionGroupKey, 'all'> => {
  if (ing.category === 'mineral_supplement') {
    return 'mineral_vitamin';
  }
  if (ing.category === 'concentrate_protein') {
    return 'protein';
  }
  if (ing.category === 'byproduct') {
    if (
      ing.id === 'ing-9' ||
      ing.id === 'ing-10' ||
      ing.nameTh.includes('กระถิน') ||
      ing.nameTh.includes('กากเบียร์') ||
      ing.crudeProtein >= 18
    ) {
      return 'protein';
    }
    return 'energy';
  }
  return 'energy';
};

export const IngredientsManager: React.FC<IngredientsManagerProps> = ({
  ingredients,
  onAddIngredient,
  onUpdateIngredient,
  onDeleteIngredient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<NutritionGroupKey>('all');
  const [viewStyle, setViewStyle] = useState<'table' | 'cards'>('table');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingIng, setEditingIng] = useState<FeedIngredient | null>(null);

  const [formNameTh, setFormNameTh] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formCategory, setFormCategory] = useState<IngredientCategory>('roughage_fresh');
  const [formDryMatter, setFormDryMatter] = useState(20);
  const [formCrudeProtein, setFormCrudeProtein] = useState(9.0);
  const [formTdn, setFormTdn] = useState(55);
  const [formCalcium, setFormCalcium] = useState(0.35);
  const [formPhosphorus, setFormPhosphorus] = useState(0.25);
  const [formPrice, setFormPrice] = useState(2.0);
  const [formIsRoughage, setFormIsRoughage] = useState(true);
  const [formDescription, setFormDescription] = useState('');
  const [showManualOverrideInAdd, setShowManualOverrideInAdd] = useState(false);

  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);

  const autoResolvedPreview = useMemo(() => {
    if (!formNameTh.trim()) return null;
    return resolveIngredientFromName(formNameTh);
  }, [formNameTh]);

  const filteredIngredients = useMemo(() => {
    return ingredients.filter(ing => {
      const matchSearch =
        ing.nameTh.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ing.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ing.description && ing.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCat = categoryFilter === 'all' || getNutritionGroup(ing) === categoryFilter;

      return matchSearch && matchCat;
    });
  }, [ingredients, searchTerm, categoryFilter]);

  const categoryCounts = useMemo(() => {
    const counts: Record<NutritionGroupKey, number> = {
      all: ingredients.length,
      protein: 0,
      energy: 0,
      mineral_vitamin: 0,
    };
    ingredients.forEach(i => {
      const group = getNutritionGroup(i);
      counts[group] += 1;
    });
    return counts;
  }, [ingredients]);

  const resetForm = () => {
    setFormNameTh('');
    setFormNameEn('');
    setFormCategory('roughage_fresh');
    setFormDryMatter(20);
    setFormCrudeProtein(9.0);
    setFormTdn(55);
    setFormCalcium(0.35);
    setFormPhosphorus(0.25);
    setFormPrice(2.0);
    setFormIsRoughage(true);
    setFormDescription('');
    setShowManualOverrideInAdd(false);
  };

  const applyResolvedNameToForm = (name: string) => {
    setFormNameTh(name);
    if (name.trim()) {
      const resolved = resolveIngredientFromName(name);
      setFormNameEn(resolved.nameEn);
      setFormCategory(resolved.category);
      setFormDryMatter(resolved.dryMatter);
      setFormCrudeProtein(resolved.crudeProtein);
      setFormTdn(resolved.tdn);
      setFormCalcium(resolved.calcium);
      setFormPhosphorus(resolved.phosphorus);
      setFormPrice(resolved.pricePerKg);
      setFormIsRoughage(resolved.isRoughage);
      setFormDescription(resolved.description || '');
    }
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (ing: FeedIngredient) => {
    setEditingIng(ing);
    setFormNameTh(ing.nameTh);
    setFormNameEn(ing.nameEn);
    setFormCategory(ing.category);
    setFormDryMatter(ing.dryMatter);
    setFormCrudeProtein(ing.crudeProtein);
    setFormTdn(ing.tdn);
    setFormCalcium(ing.calcium);
    setFormPhosphorus(ing.phosphorus);
    setFormPrice(ing.pricePerKg);
    setFormIsRoughage(ing.isRoughage);
    setFormDescription(ing.description || '');
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNameTh.trim()) return;

    const resolved = resolveIngredientFromName(formNameTh);
    const useOverride = showManualOverrideInAdd;

    onAddIngredient({
      nameTh: formNameTh.trim(),
      nameEn: useOverride ? (formNameEn.trim() || resolved.nameEn) : resolved.nameEn,
      category: useOverride ? formCategory : resolved.category,
      dryMatter: useOverride ? Number(formDryMatter) : resolved.dryMatter,
      crudeProtein: useOverride ? Number(formCrudeProtein) : resolved.crudeProtein,
      tdn: useOverride ? Number(formTdn) : resolved.tdn,
      calcium: useOverride ? Number(formCalcium) : resolved.calcium,
      phosphorus: useOverride ? Number(formPhosphorus) : resolved.phosphorus,
      pricePerKg: useOverride ? Number(formPrice) : resolved.pricePerKg,
      isRoughage: useOverride ? formIsRoughage : resolved.isRoughage,
      description: useOverride ? formDescription : resolved.description,
    });

    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIng || !formNameTh.trim()) return;

    onUpdateIngredient({
      ...editingIng,
      nameTh: formNameTh.trim(),
      nameEn: formNameEn.trim() || formNameTh.trim(),
      category: formCategory,
      dryMatter: Number(formDryMatter),
      crudeProtein: Number(formCrudeProtein),
      tdn: Number(formTdn),
      calcium: Number(formCalcium),
      phosphorus: Number(formPhosphorus),
      pricePerKg: Number(formPrice),
      isRoughage: formIsRoughage,
      description: formDescription,
    });

    setEditingIng(null);
  };

  const handleStartPriceEdit = (id: string, currentPrice: number) => {
    setEditingPriceId(id);
    setTempPrice(currentPrice);
  };

  const handleSavePriceEdit = (ing: FeedIngredient) => {
    onUpdateIngredient({
      ...ing,
      pricePerKg: tempPrice,
    });
    setEditingPriceId(null);
  };

  const getCategoryBadge = (ing: FeedIngredient) => {
    const group = getNutritionGroup(ing);
    switch (group) {
      case 'protein': {
        const subLabel =
          ing.category === 'byproduct' ? 'โปรตีน · ผลพลอยได้' : 'อาหารให้โปรตีน';
        return {
          label: subLabel,
          color: 'bg-[#FCEFED] text-[#8A3B2D] border border-[#E8C5C0]',
        };
      }
      case 'energy': {
        let subLabel = 'อาหารให้พลังงาน';
        if (ing.category === 'roughage_fresh') subLabel = 'พลังงาน · หญ้าสด';
        else if (ing.category === 'roughage_dry') subLabel = 'พลังงาน · หญ้าแห้ง';
        else if (ing.category === 'roughage_silage') subLabel = 'พลังงาน · หญ้าหมัก';
        else if (ing.category === 'concentrate_energy') subLabel = 'พลังงาน · อาหารข้น';
        else if (ing.category === 'byproduct') subLabel = 'พลังงาน · ผลพลอยได้';
        return {
          label: subLabel,
          color: 'bg-[#EDF4EF] text-[#1E3F2B] border border-[#C5DEC9]',
        };
      }
      case 'mineral_vitamin':
      default:
        return {
          label: 'วิตามินและแร่ธาตุ',
          color: 'bg-[#F9F2E4] text-[#855828] border border-[#E5D3B3]',
        };
    }
  };

  const renderCategoryIcon = (icon: CategoryCardMeta['icon'], isSelected: boolean) => {
    const cls = `w-4 h-4 ${isSelected ? 'text-[#FAF6EE]' : 'text-[#1E3F2B]'}`;
    if (icon === 'protein') return <Sprout className={cls} />;
    if (icon === 'energy') return <Zap className={cls} />;
    return <FlaskConical className={cls} />;
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-[#FFFDF9] p-6 sm:p-8 rounded-2xl border border-[#E5DEC9] space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs text-[#9C6B3F] font-medium flex items-center gap-2">
              <Wheat className="w-3.5 h-3.5" />
              <span>4. คลังโภชนาการและราคาวัตถุดิบอาหารแกะ</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-[#1E3F2B] font-semibold">
                {filteredIngredients.length} / {ingredients.length} รายการ
              </span>
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#1E3F2B] mt-1.5 tracking-tight">
              ฐานข้อมูลโภชนาการและราคาวัตถุดิบท้องถิ่น (Ovis Nutrition Bank)
            </h2>
            <p className="text-xs sm:text-sm text-[#6E6254] mt-1.5 max-w-3xl leading-relaxed">
              ตารางคุณค่าสารอาหาร (วัตถุแห้ง DM, โปรตีน CP, พลังงาน TDN, แคลเซียม Ca, ฟอสฟอรัส P) สามารถคลิกแก้ไขราคาซื้อจริงตามท้องถิ่นได้ทันที
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <div className="flex items-center bg-[#F3ECE0] p-1 rounded-xl border border-[#E5DEC9] text-xs">
              <button
                onClick={() => setViewStyle('table')}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  viewStyle === 'table' ? 'bg-[#1E3F2B] text-[#FAF6EE]' : 'text-[#5C5346] hover:text-[#1E3F2B]'
                }`}
                title="มุมมองตารางเปรียบเทียบ"
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewStyle('cards')}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  viewStyle === 'cards' ? 'bg-[#1E3F2B] text-[#FAF6EE]' : 'text-[#5C5346] hover:text-[#1E3F2B]'
                }`}
                title="มุมมองการ์ดวัตถุดิบ"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleOpenAdd}
              className="bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มวัตถุดิบใหม่</span>
            </button>
          </div>
        </div>

        {/* Search Bar + View All Filter Button */}
        <div className="pt-4 border-t border-[#EAE2D0] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8C7F6E] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="ค้นหาชื่อวัตถุดิบ เช่น หญ้าเนเปียร์, ข้าวโพดบด, กากถั่วเหลือง, มันเส้น, กากเบียร์..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl focus:outline-none focus:border-[#1E3F2B] text-[#24201B] placeholder:text-[#8C7F6E]"
            />
          </div>

          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center justify-center gap-2 ${
              categoryFilter === 'all'
                ? 'bg-[#1E3F2B] text-[#FAF6EE] border-[#1E3F2B]'
                : 'bg-[#FAF6EE] text-[#1E3F2B] border-[#DFCBB3] hover:border-[#9C6B3F] hover:bg-[#F3ECE0]'
            }`}
          >
            <span>ดูทั้งหมด</span>
            <span className={`font-mono text-xs ${categoryFilter === 'all' ? 'text-[#DFCBB3]' : 'text-[#9C6B3F]'}`}>
              ({ingredients.length} ชนิด)
            </span>
          </button>
        </div>
      </div>

      {/* Category Explorer: 3 Nutrition Groups */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="flex items-center gap-1.5 text-[#1E3F2B] font-semibold">
            <Layers className="w-4 h-4 text-[#9C6B3F]" />
            <span>เลือกหมวดหมู่วัตถุดิบตามคุณค่าอาหาร (Category Explorer)</span>
          </span>
          <span className="text-xs text-[#6E6254]">
            {categoryFilter === 'all'
              ? `แสดงทั้งหมด ${filteredIngredients.length} ชนิด`
              : `แสดง ${filteredIngredients.length} ชนิด ในหมวด${CATEGORY_DEFINITIONS.find(c => c.key === categoryFilter)?.nameTh || ''}`}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CATEGORY_DEFINITIONS.map(cat => {
            const isSelected = categoryFilter === cat.key;
            const count = categoryCounts[cat.key] || 0;

            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setCategoryFilter(isSelected ? 'all' : cat.key)}
                className={`text-left p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#1E3F2B] border-[#1E3F2B] text-[#FAF6EE] shadow-md shadow-[#1E3F2B]/10'
                    : 'bg-[#FFFDF9] border-[#E5DEC9] hover:border-[#B68656] text-[#24201B]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-[#29533A] border-[#FAF6EE]/15'
                          : 'bg-[#FAF6EE] border-[#EAE2D0]'
                      }`}>
                        {renderCategoryIcon(cat.icon, isSelected)}
                      </span>
                      <span className={`font-semibold text-sm sm:text-base leading-snug ${
                        isSelected ? 'text-[#FAF6EE]' : 'text-[#1E3F2B]'
                      }`}>
                        {cat.nameTh}
                      </span>
                    </div>
                    <span className={`text-xs font-mono font-semibold shrink-0 pt-1 ${
                      isSelected ? 'text-[#DFCBB3]' : 'text-[#9C6B3F]'
                    }`}>
                      {count} ชนิด
                    </span>
                  </div>

                  <p className={`text-xs leading-relaxed mt-3 ${isSelected ? 'text-[#EFE6D5]' : 'text-[#6E6254]'}`}>
                    {cat.tagline}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-current/10 flex items-center justify-between">
                  <span className={`text-[11px] font-mono ${isSelected ? 'text-[#D5E0D7]' : 'text-[#8C7F6E]'}`}>
                    {cat.subtitle}
                  </span>
                  <span className={`text-[11px] font-medium ${isSelected ? 'text-[#DFCBB3]' : 'text-[#9C6B3F]'}`}>
                    {isSelected ? 'กำลังกรองอยู่ · กดเพื่อยกเลิก' : 'คลิกเพื่อดูรายการ →'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed Safety Notice */}
      <div className="bg-[#FAF6EE] rounded-2xl p-4 sm:p-5 border border-[#DFCBB3] text-xs sm:text-sm flex items-start gap-3 text-[#5C5346]">
        <ShieldAlert className="w-5 h-5 text-[#9C6B3F] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#1E3F2B] block font-semibold">
            กฎความปลอดภัยโภชนาการแกะ (Mahidol Vet Science):
          </strong>
          <span className="leading-relaxed block mt-0.5">
            แกะไวต่อพิษทองแดงมาก (Copper Toxic level: 10 ppm) · <strong className="text-[#A63D2E]">ห้ามใช้อาหารวัวหรืออาหารสุกรเด็ดขาด</strong> · กระถินจำกัดไม่เกิน 50% (Mimosine) · มันสำปะหลังต้องตากแห้งสนิท
          </span>
        </div>
      </div>

      {/* View 1: Ingredients Table */}
      {viewStyle === 'table' ? (
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E5DEC9] overflow-x-auto">
          <table className="w-full text-left text-xs text-[#5C5346]">
            <thead className="bg-[#F3ECE0] text-[#5C5346] font-semibold border-b border-[#EAE2D0]">
              <tr>
                <th className="p-3.5 pl-5">ชื่อวัตถุดิบ (ไทย / อังกฤษ)</th>
                <th className="p-3.5 whitespace-nowrap">หมวดหมู่</th>
                <th className="p-3.5 text-right whitespace-nowrap">วัตถุแห้ง (% DM)</th>
                <th className="p-3.5 text-right whitespace-nowrap">โปรตีนหยาบ (% CP)</th>
                <th className="p-3.5 text-right whitespace-nowrap">พลังงาน (% TDN)</th>
                <th className="p-3.5 text-right whitespace-nowrap">แคลเซียม (% Ca)</th>
                <th className="p-3.5 text-right whitespace-nowrap">ฟอสฟอรัส (% P)</th>
                <th className="p-3.5 text-right whitespace-nowrap">ราคาซื้อจริง (บาท/กก.)</th>
                <th className="p-3.5 text-right pr-5">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE2D0]">
              {filteredIngredients.map(ing => {
                const catInfo = getCategoryBadge(ing);
                const isEditingThisPrice = editingPriceId === ing.id;

                return (
                  <tr key={ing.id} className="hover:bg-[#FAF6EE]/80 transition-colors">
                    <td className="p-3.5 pl-5">
                      <div className="font-semibold text-[#1E3F2B] text-xs sm:text-sm">{ing.nameTh}</div>
                      <div className="text-[11px] text-[#8C7F6E] font-normal">{ing.nameEn}</div>
                      {ing.description && (
                        <div className="text-[11px] text-[#6E6254] mt-0.5 line-clamp-1">{ing.description}</div>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className={`inline-block text-[11px] px-2.5 py-1 rounded-lg font-medium whitespace-nowrap ${catInfo.color}`}>
                        {catInfo.label}
                      </span>
                    </td>

                    <td className="p-3.5 text-right font-mono text-[#24201B]">{ing.dryMatter}%</td>
                    <td className="p-3.5 text-right font-mono text-[#1E3F2B] font-semibold">{ing.crudeProtein}%</td>
                    <td className="p-3.5 text-right font-mono text-[#9C6B3F] font-semibold">{ing.tdn}%</td>
                    <td className="p-3.5 text-right font-mono text-[#5C5346]">{ing.calcium}%</td>
                    <td className="p-3.5 text-right font-mono text-[#5C5346]">{ing.phosphorus}%</td>

                    <td className="p-3.5 text-right">
                      {isEditingThisPrice ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={tempPrice}
                            onChange={e => setTempPrice(parseFloat(e.target.value) || 0)}
                            className="w-16 px-2 py-1 text-xs bg-[#FAF6EE] border border-[#1E3F2B] rounded-lg text-right font-mono font-semibold text-[#24201B] focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSavePriceEdit(ing)}
                            className="p-1.5 bg-[#1E3F2B] text-[#FAF6EE] rounded-lg hover:bg-[#29533A] cursor-pointer"
                            title="บันทึกราคา"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingPriceId(null)}
                            className="p-1.5 bg-[#F3ECE0] text-[#6E6254] rounded-lg hover:bg-[#E5DEC9] cursor-pointer"
                            title="ยกเลิก"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartPriceEdit(ing.id, ing.pricePerKg)}
                          className="group inline-flex items-center gap-1 font-mono font-semibold text-[#9C6B3F] hover:text-[#1E3F2B] hover:bg-[#F3ECE0] px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                          title="คลิกเพื่อแก้ไขราคาซื้อจริงของฟาร์มท่าน"
                        >
                          <span>{ing.pricePerKg.toFixed(1)} ฿</span>
                          <Edit2 className="w-3 h-3 text-[#8C7F6E] group-hover:text-[#1E3F2B] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </td>

                    <td className="p-3.5 text-right pr-5 space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(ing)}
                        className="p-1.5 text-[#6E6254] hover:text-[#1E3F2B] hover:bg-[#F3ECE0] rounded-lg transition-colors cursor-pointer"
                        title="แก้ไขโภชนาการวัตถุดิบ"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteIngredient(ing.id)}
                        className="p-1.5 text-[#8C7F6E] hover:text-[#A63D2E] hover:bg-[#FCEFED] rounded-lg transition-colors cursor-pointer"
                        title="ลบวัตถุดิบนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* View 2: Cards Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredIngredients.map(ing => {
            const catInfo = getCategoryBadge(ing);
            const isEditingThisPrice = editingPriceId === ing.id;

            return (
              <div 
                key={ing.id}
                className="bg-[#FFFDF9] rounded-2xl p-5 border border-[#E5DEC9] hover:border-[#B68656] transition-colors space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-[#1E3F2B] text-base">{ing.nameTh}</h3>
                      <p className="text-xs text-[#8C7F6E]">{ing.nameEn}</p>
                    </div>
                    <span className={`text-[11px] px-2.5 py-1 rounded-lg font-medium shrink-0 ${catInfo.color}`}>
                      {catInfo.label}
                    </span>
                  </div>

                  {ing.description && (
                    <p className="text-xs text-[#5C5346] leading-relaxed bg-[#FAF6EE] p-3 rounded-xl border border-[#EAE2D0]">
                      {ing.description}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 divide-x divide-[#EAE2D0] text-center bg-[#FAF6EE] rounded-xl border border-[#EAE2D0] py-2.5">
                    <div>
                      <span className="text-[11px] text-[#6E6254] block">วัตถุแห้ง DM</span>
                      <span className="text-xs font-semibold font-mono text-[#24201B] mt-0.5 block">{ing.dryMatter}%</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#6E6254] block">โปรตีน CP</span>
                      <span className="text-xs font-semibold font-mono text-[#1E3F2B] mt-0.5 block">{ing.crudeProtein}%</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#6E6254] block">พลังงาน TDN</span>
                      <span className="text-xs font-semibold font-mono text-[#9C6B3F] mt-0.5 block">{ing.tdn}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#EAE2D0]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#6E6254]">ราคาซื้อจริง:</span>
                      {isEditingThisPrice ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={tempPrice}
                            onChange={e => setTempPrice(parseFloat(e.target.value) || 0)}
                            className="w-16 px-2 py-1 text-xs bg-[#FAF6EE] border border-[#1E3F2B] rounded-lg text-right font-mono font-semibold text-[#24201B] focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSavePriceEdit(ing)}
                            className="p-1 bg-[#1E3F2B] text-[#FAF6EE] rounded-lg hover:bg-[#29533A] cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartPriceEdit(ing.id, ing.pricePerKg)}
                          className="font-mono font-semibold text-sm text-[#9C6B3F] hover:text-[#1E3F2B] hover:underline cursor-pointer"
                        >
                          {ing.pricePerKg.toFixed(1)} ฿/กก.
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(ing)}
                        className="p-1.5 text-[#6E6254] hover:text-[#1E3F2B] hover:bg-[#F3ECE0] rounded-lg transition-colors cursor-pointer"
                        title="แก้ไข"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteIngredient(ing.id)}
                        className="p-1.5 text-[#8C7F6E] hover:text-[#A63D2E] hover:bg-[#FCEFED] rounded-lg transition-colors cursor-pointer"
                        title="ลบ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Ingredient Modal */}
      {(isAddModalOpen || editingIng) && (
        <div className="fixed inset-0 bg-[#1B1712]/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#FFFDF9] rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-xl border border-[#DFCBB3] text-[#24201B] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE2D0]">
              <h3 className="text-base sm:text-lg font-semibold text-[#1E3F2B] flex items-center gap-2">
                <Wheat className="w-4 h-4 text-[#9C6B3F]" />
                <span>{editingIng ? 'แก้ไขข้อมูลวัตถุดิบอาหาร' : 'เพิ่มวัตถุดิบอาหารสัตว์ใหม่'}</span>
              </h3>
              <button
                onClick={() => { setIsAddModalOpen(false); setEditingIng(null); }}
                className="text-[#8C7F6E] hover:text-[#24201B] p-1.5 rounded-lg hover:bg-[#F3ECE0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingIng ? handleSaveEdit : handleSaveAdd} className="space-y-4 text-xs">
              {!editingIng ? (
                /* Simplified Smart Add Mode: Type ONLY ingredient name -> auto-compute all % proportions */
                <div className="space-y-4">
                  <div className="bg-[#EDF4EF] border border-[#C5DEC9] rounded-xl p-3.5 text-xs text-[#1E3F2B] flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#2E6B47] shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong className="font-semibold block">พิมพ์แค่ชื่อวัตถุดิบ ระบบคำนวณสัดส่วน % ให้อัตโนมัติ</strong>
                      <span>
                        ระบบจะค้นหาฐานข้อมูลกรมปศุสัตว์/NRC และคำนวณ % DM, % CP, % TDN, % Ca, % P พร้อมจัดหมวดหมู่ให้อัตโนมัติทันที
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1E3F2B] mb-1.5">
                      ชื่อวัตถุดิบที่ต้องการเพิ่ม *
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={formNameTh}
                      onChange={e => applyResolvedNameToForm(e.target.value)}
                      placeholder="พิมพ์ชื่อวัตถุดิบ เช่น หญ้ารูซี่สด, ใบหม่อนสด, กากมะพร้าว, เกลือแกง..."
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FAF6EE] border-2 border-[#DFCBB3] rounded-xl focus:border-[#1E3F2B] focus:outline-none text-[#24201B] font-medium"
                    />
                  </div>

                  {/* Quick Suggest Pills */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-[#6E6254] font-medium block">
                      ตัวอย่างวัตถุดิบยอดนิยม (คลิกเลือกได้ทันที):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_INGREDIENT_SUGGESTIONS.map(sample => (
                        <button
                          key={sample}
                          type="button"
                          onClick={() => applyResolvedNameToForm(sample)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] border transition-colors cursor-pointer ${
                            formNameTh.trim() === sample
                              ? 'bg-[#1E3F2B] text-[#FAF6EE] border-[#1E3F2B]'
                              : 'bg-[#FAF6EE] text-[#5C5346] border-[#DFCBB3] hover:border-[#1E3F2B] hover:text-[#1E3F2B]'
                          }`}
                        >
                          + {sample}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auto-Calculated % Proportions Live Preview */}
                  {autoResolvedPreview && (
                    <div className="bg-[#FAF6EE] rounded-2xl border border-[#DFCBB3] p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-semibold text-[#2E6B47] block">
                            {autoResolvedPreview.sourceLabel}
                          </span>
                          <p className="text-sm font-semibold text-[#1E3F2B]">
                            {autoResolvedPreview.nameTh}{' '}
                            <span className="text-xs font-normal text-[#8C7F6E]">
                              ({autoResolvedPreview.nameEn})
                            </span>
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#EDF4EF] text-[#1E3F2B] border border-[#C5DEC9]">
                          {autoResolvedPreview.isRoughage ? 'อาหารหยาบ' : 'อาหารข้น / เสริม'}
                        </span>
                      </div>

                      <div className="grid grid-cols-5 gap-2 text-center bg-[#FFFDF9] p-3 rounded-xl border border-[#EAE2D0]">
                        <div>
                          <span className="text-[10px] text-[#6E6254] block">% DM</span>
                          <strong className="font-mono text-xs sm:text-sm text-[#24201B]">
                            {showManualOverrideInAdd ? formDryMatter : autoResolvedPreview.dryMatter}%
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#6E6254] block">% CP</span>
                          <strong className="font-mono text-xs sm:text-sm text-[#1E3F2B]">
                            {showManualOverrideInAdd ? formCrudeProtein : autoResolvedPreview.crudeProtein}%
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#6E6254] block">% TDN</span>
                          <strong className="font-mono text-xs sm:text-sm text-[#9C6B3F]">
                            {showManualOverrideInAdd ? formTdn : autoResolvedPreview.tdn}%
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#6E6254] block">% Ca</span>
                          <strong className="font-mono text-xs sm:text-sm text-[#5C5346]">
                            {showManualOverrideInAdd ? formCalcium : autoResolvedPreview.calcium}%
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#6E6254] block">% P</span>
                          <strong className="font-mono text-xs sm:text-sm text-[#5C5346]">
                            {showManualOverrideInAdd ? formPhosphorus : autoResolvedPreview.phosphorus}%
                          </strong>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#5C5346]">
                        <span>
                          ราคาประเมิน:{' '}
                          <strong className="font-mono text-[#9C6B3F]">
                            {(showManualOverrideInAdd ? formPrice : autoResolvedPreview.pricePerKg).toFixed(1)} ฿/กก.
                          </strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowManualOverrideInAdd(prev => !prev)}
                          className="text-[#1E3F2B] hover:text-[#4A321F] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                          <span>{showManualOverrideInAdd ? 'ซ่อนการปรับแก้เอง' : 'ปรับแก้ค่า % หรือราคาเอง'}</span>
                        </button>
                      </div>

                      {!showManualOverrideInAdd && autoResolvedPreview.description && (
                        <p className="text-[11px] text-[#6E6254] leading-relaxed border-t border-[#EAE2D0] pt-2">
                          {autoResolvedPreview.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : null}

              {(editingIng || showManualOverrideInAdd) && (
              <>
              <div className="grid grid-cols-2 gap-3.5">
                {editingIng && (
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-[#5C5346] mb-1">
                    ชื่อวัตถุดิบ (ภาษาไทย) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNameTh}
                    onChange={e => setFormNameTh(e.target.value)}
                    placeholder="เช่น หญ้าเนเปียร์สด"
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl focus:border-[#1E3F2B] focus:outline-none text-[#24201B]"
                  />
                </div>
                )}

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-[#5C5346] mb-1">
                    ชื่อภาษาอังกฤษ
                  </label>
                  <input
                    type="text"
                    value={formNameEn}
                    onChange={e => setFormNameEn(e.target.value)}
                    placeholder="เช่น Napier Grass"
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl focus:border-[#1E3F2B] focus:outline-none text-[#24201B]"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-[#5C5346] mb-1">
                    หมวดหมู่วัตถุดิบ *
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as IngredientCategory)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl focus:border-[#1E3F2B] focus:outline-none text-[#24201B]"
                  >
                    <option value="roughage_fresh">หญ้าสดและพืชอาหารสัตว์ (Fresh Forage)</option>
                    <option value="roughage_dry">หญ้าแห้งและฟางข้าว (Dry Hay/Straw)</option>
                    <option value="roughage_silage">พืชหมักไซเลจถนอมอาหาร (Silage)</option>
                    <option value="concentrate_energy">อาหารข้นเสริมพลังงานสูง (Energy)</option>
                    <option value="concentrate_protein">อาหารข้นเสริมโปรตีนสูง (Protein)</option>
                    <option value="byproduct">ผลพลอยได้เกษตรและอุตสาหกรรม (Byproduct)</option>
                    <option value="mineral_supplement">แร่ธาตุ ไวตามิน และพรีมิกซ์ (Minerals)</option>
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-[#5C5346] mb-1">
                    ราคาตลาดฟาร์มท่าน (บาท/กก. สด) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={formPrice}
                    onChange={e => setFormPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl focus:border-[#1E3F2B] focus:outline-none font-semibold text-[#9C6B3F] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5C5346] mb-1">
                    วัตถุแห้ง (% DM) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="5"
                    max="100"
                    required
                    value={formDryMatter}
                    onChange={e => setFormDryMatter(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl focus:border-[#1E3F2B] focus:outline-none text-[#24201B] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5C5346] mb-1">
                    โปรตีนหยาบ (% CP) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={formCrudeProtein}
                    onChange={e => setFormCrudeProtein(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl focus:border-[#1E3F2B] focus:outline-none font-semibold text-[#1E3F2B] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5C5346] mb-1">
                    พลังงานย่อยได้ (% TDN) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={formTdn}
                    onChange={e => setFormTdn(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl focus:border-[#1E3F2B] focus:outline-none text-[#9C6B3F] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5C5346] mb-1">
                    จัดเป็นอาหารหยาบ?
                  </label>
                  <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-1.5 text-xs text-[#24201B] cursor-pointer">
                      <input
                        type="radio"
                        checked={formIsRoughage}
                        onChange={() => setFormIsRoughage(true)}
                        className="accent-[#1E3F2B]"
                      />
                      <span>ใช่อาหารหยาบ</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-[#24201B] cursor-pointer">
                      <input
                        type="radio"
                        checked={!formIsRoughage}
                        onChange={() => setFormIsRoughage(false)}
                        className="accent-[#1E3F2B]"
                      />
                      <span>อาหารข้น / เสริม</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5C5346] mb-1">
                    แคลเซียม (% Ca)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="50"
                    value={formCalcium}
                    onChange={e => setFormCalcium(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl focus:border-[#1E3F2B] focus:outline-none text-[#24201B] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5C5346] mb-1">
                    ฟอสฟอรัส (% P)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="50"
                    value={formPhosphorus}
                    onChange={e => setFormPhosphorus(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl focus:border-[#1E3F2B] focus:outline-none text-[#24201B] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5C5346] mb-1">
                  คำอธิบายคุณประโยชน์ / ข้อจำกัดการใช้
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="เช่น ความน่ากินสูง เสริมโปรตีนและไขมันดี เพดานการใช้ไม่เกิน 15%..."
                  className="w-full px-3 py-2 text-xs bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl focus:border-[#1E3F2B] focus:outline-none text-[#24201B] placeholder:text-[#8C7F6E]"
                />
              </div>
              </>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-[#EAE2D0]">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingIng(null); }}
                  className="px-4 py-2 text-xs text-[#6E6254] hover:text-[#24201B] hover:bg-[#F3ECE0] rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  {editingIng ? 'บันทึกการแก้ไข' : 'คำนวณ % และบันทึกวัตถุดิบ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
