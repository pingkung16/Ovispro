import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSheepNutrientRequirement,
  calculateRationNutrition,
  solvePearsonSquare,
  solvePearsonSquareAsFed,
} from './nutrition';
import { FeedIngredient, RationIngredientItem } from '../types/sheep';

test('calculateSheepNutrientRequirement gives valid NRC standards for wool sheep maintenance & fiber synthesis', () => {
  const req = calculateSheepNutrientRequirement(60, 'wool_maintenance', 180);
  assert.ok(req.dmiKgMin > 1.0 && req.dmiKgMax < 2.5, `DMI range should be reasonable: ${req.dmiKgMin}-${req.dmiKgMax}`);
  assert.equal(req.cpPercent, 10.5, 'Wool maintenance should require ~10.5% CP for keratin');
  assert.equal(req.tdnPercent, 58.0, 'TDN should be 58%');
  assert.ok(req.cpGrams > 100, 'Crude protein grams per day should be > 100g');
});

test('calculateSheepNutrientRequirement gives valid standards for wool ewe lactation', () => {
  const req = calculateSheepNutrientRequirement(65, 'wool_lactation', 0);
  assert.ok(req.dmiPercentBw >= 4.0, 'Wool lactating ewes have high DMI requirement');
  assert.equal(req.cpPercent, 15.0, 'Protein requirement for wool lactating ewe should be 15.0%');
  assert.ok(req.calciumPercent >= 0.55, 'Calcium requirement for milk yield should be >= 0.55%');
});

test('solvePearsonSquare calculates correct proportions', () => {
  // Pangola hay (CP 8%) and Concentrate (CP 18%) to reach target 14% CP
  const result = solvePearsonSquare(8, 18, 14);
  assert.equal(result.isValid, true);
  // part1 = |18 - 14| = 4 parts of hay
  // part2 = |8 - 14| = 6 parts of concentrate
  // total = 10 parts -> 40% hay, 60% concentrate
  assert.equal(result.percent1, 40.0);
  assert.equal(result.percent2, 60.0);
  // Verify weighted CP: (40 * 8 + 60 * 18) / 100 = (320 + 1080) / 100 = 14%
  const weightedCp = (result.percent1 * 8 + result.percent2 * 18) / 100;
  assert.equal(Math.round(weightedCp), 14);
});

test('solvePearsonSquare flags invalid impossible targets', () => {
  // Cannot reach 20% CP if components are 8% and 16%
  const result = solvePearsonSquare(8, 16, 20);
  assert.equal(result.isValid, false);
});

test('solvePearsonSquareAsFed converts DM ratio to As-Fed % so resulting CP matches target ~16%', () => {
  // Fresh Napier (18% DM, 9.5% CP) + Soybean Meal (89% DM, 44.5% CP) targeting 16.0% CP
  const res = solvePearsonSquareAsFed(9.5, 18, 44.5, 89, 16.0);
  assert.equal(res.isValid, true);
  assert.ok(Math.abs(res.resultingCpPercent - 16.0) <= 0.3, `Expected ~16% CP, got ${res.resultingCpPercent}`);

  const map = new Map<string, FeedIngredient>([
    [
      'napier',
      {
        id: 'napier',
        nameTh: 'หญ้าเนเปียร์สดสับ',
        nameEn: 'Napier Grass',
        category: 'roughage_fresh',
        dryMatter: 18,
        crudeProtein: 9.5,
        tdn: 54,
        calcium: 0.38,
        phosphorus: 0.24,
        pricePerKg: 1.2,
        isRoughage: true,
      },
    ],
    [
      'sbm',
      {
        id: 'sbm',
        nameTh: 'กากถั่วเหลือง',
        nameEn: 'Soybean Meal',
        category: 'concentrate_protein',
        dryMatter: 89,
        crudeProtein: 44.5,
        tdn: 80,
        calcium: 0.32,
        phosphorus: 0.65,
        pricePerKg: 20,
        isRoughage: false,
      },
    ],
  ]);

  const stats = calculateRationNutrition(
    [
      { ingredientId: 'napier', percentInMix: res.asFedPercent1 },
      { ingredientId: 'sbm', percentInMix: res.asFedPercent2 },
    ],
    map
  );
  assert.ok(
    Math.abs(stats.calculatedCpPercent - 16.0) <= 0.3,
    `calculateRationNutrition should return ~16.0% CP (got ${stats.calculatedCpPercent}%)`
  );
});

test('calculateRationNutrition aggregates DM, CP, TDN, and cost accurately', () => {
  const mockIngredients = new Map<string, FeedIngredient>([
    [
      'ing-1',
      {
        id: 'ing-1',
        nameTh: 'หญ้าแพงโกล่าแห้ง',
        nameEn: 'Pangola Hay',
        category: 'roughage_dry',
        dryMatter: 88,
        crudeProtein: 8.0,
        tdn: 52.0,
        calcium: 0.35,
        phosphorus: 0.22,
        pricePerKg: 4.5,
        isRoughage: true,
      },
    ],
    [
      'ing-2',
      {
        id: 'ing-2',
        nameTh: 'กากถั่วเหลือง',
        nameEn: 'Soybean Meal',
        category: 'concentrate_protein',
        dryMatter: 89,
        crudeProtein: 44.0,
        tdn: 80.0,
        calcium: 0.32,
        phosphorus: 0.65,
        pricePerKg: 20.0,
        isRoughage: false,
      },
    ],
  ]);

  const items: RationIngredientItem[] = [
    { ingredientId: 'ing-1', percentInMix: 50 },
    { ingredientId: 'ing-2', percentInMix: 50 },
  ];

  const stats = calculateRationNutrition(items, mockIngredients);
  assert.ok(stats.calculatedCpPercent > 8 && stats.calculatedCpPercent < 44);
  assert.ok(stats.costPerKgMix > 0);
  assert.ok(stats.totalAsFedKg > 0);
});

import { computeLivePens, autoFormulateRationFromIngredients } from './nutrition';
import { DEFAULT_PENS_TEMPLATE, DEFAULT_INGREDIENTS_TEMPLATE } from '../data/multiFarmSeed';
import type { Sheep } from '../types/sheep';

test('computeLivePens aggregates real sheep count and average weight per pen', () => {
  const sampleSheep: Sheep[] = [
    {
      id: 's1',
      earTag: 'OV-001',
      name: 'แบมแบม',
      breed: 'เมอริโน (Merino)',
      bloodPercentage: '100%',
      gender: 'female',
      birthDate: '2024-01-01',
      ageMonths: 24,
      weightKg: 60,
      currentAdgGrams: 180,
      stage: 'wool_maintenance',
      bcs: 3.5,
      penId: 'pen-a',
      pen: 'คอก A',
      healthStatus: 'healthy',
    },
    {
      id: 's2',
      earTag: 'OV-002',
      name: 'ออมสิน',
      breed: 'ดอร์เซท (Dorset)',
      bloodPercentage: '100%',
      gender: 'female',
      birthDate: '2024-02-01',
      ageMonths: 22,
      weightKg: 70,
      currentAdgGrams: 200,
      stage: 'wool_maintenance',
      bcs: 3.5,
      penId: 'pen-a',
      pen: 'คอก A',
      healthStatus: 'healthy',
    },
  ];

  const customTemplate = [
    ...DEFAULT_PENS_TEMPLATE,
    {
      id: 'pen-e',
      code: 'คอก E',
      name: 'คอก E - ลูกแกะหย่านม',
      ageRange: '3 - 6 เดือน',
      sheepCount: 0,
      averageWeightKg: 22,
      dailyFeedKg: 1.0,
      averageAdgGrams: 190,
      purpose: 'อนุบาลลูกแกะหย่านม',
    },
  ];
  const sheepWithCustomPen: Sheep[] = [
    ...sampleSheep,
    {
      ...sampleSheep[0],
      id: 's3',
      earTag: 'OV-003',
      penId: 'pen-e',
      pen: 'คอก E',
      weightKg: 24,
      currentAdgGrams: 210,
    },
  ];
  const live = computeLivePens(customTemplate, sheepWithCustomPen);
  const penA = live.find(p => p.id === 'pen-a')!;
  const penB = live.find(p => p.id === 'pen-b')!;
  const penE = live.find(p => p.id === 'pen-e')!;
  assert.equal(penA.sheepCount, 2);
  assert.equal(penA.averageWeightKg, 65.0);
  assert.equal(penA.averageAdgGrams, 190);
  assert.equal(penB.sheepCount, 0);
  assert.equal(penE.sheepCount, 1);
  assert.equal(penE.averageWeightKg, 24.0);
});

test('autoFormulateRationFromIngredients computes valid 100% proportions hitting target protein', () => {
  const chosen = [
    DEFAULT_INGREDIENTS_TEMPLATE[0], // Napier fresh (9.5% CP)
    DEFAULT_INGREDIENTS_TEMPLATE[1], // Pangola hay (8.5% CP)
    DEFAULT_INGREDIENTS_TEMPLATE[4], // Corn (8.5% CP)
    DEFAULT_INGREDIENTS_TEMPLATE[6], // Soybean meal (44.5% CP)
    DEFAULT_INGREDIENTS_TEMPLATE[10], // Mineral premix (0% CP, max 2%)
  ];
  const req = calculateSheepNutrientRequirement(45, 'wool_growing', 220); // target 13.5% CP
  const items = autoFormulateRationFromIngredients(chosen, req);

  assert.equal(items.length, chosen.length);
  const sum = Number(items.reduce((s, i) => s + i.percentInMix, 0).toFixed(1));
  assert.equal(sum, 100.0);

  const map = new Map(chosen.map(c => [c.id, c]));
  const stats = calculateRationNutrition(items, map, req);
  assert.ok(
    Math.abs(stats.calculatedCpPercent - req.cpPercent) <= 1.2,
    `Expected CP near ${req.cpPercent}%, got ${stats.calculatedCpPercent}%`
  );
  assert.ok(items.every(i => i.percentInMix > 0), 'Every chosen ingredient should be included');
});

import { buildOwnerMasterSheetTabs } from './sheetExport';
import type { FarmProfile, OnlysheepsListing } from '../types/sheep';

test('calculateSheepNutrientRequirement supports lamb, weaning, growing, and unified gestation stages', () => {
  const lambReq = calculateSheepNutrientRequirement(8, 'wool_lamb', 180);
  assert.equal(lambReq.cpPercent, 17.0);
  assert.equal(lambReq.tdnPercent, 72.0);
  assert.equal(lambReq.dmiPercentBw, 4.2);
  assert.ok(lambReq.dmiKgMin < 0.5, `8kg lamb DMI should scale accurately from 8kg (got ${lambReq.dmiKgMin})`);

  const weaningReq = calculateSheepNutrientRequirement(20, 'wool_weaning', 200);
  assert.equal(weaningReq.cpPercent, 15.0);
  assert.equal(weaningReq.tdnPercent, 68.0);
  assert.equal(weaningReq.dmiPercentBw, 4.0);

  const growingReq = calculateSheepNutrientRequirement(38, 'wool_growing', 220);
  assert.equal(growingReq.cpPercent, 13.5);
  assert.equal(growingReq.tdnPercent, 64.0);

  const gestationReq = calculateSheepNutrientRequirement(62, 'wool_gestation', 100);
  assert.equal(gestationReq.cpPercent, 12.5);
  assert.equal(gestationReq.tdnPercent, 64.0);
  assert.equal(gestationReq.dmiPercentBw, 3.2);
});

test('buildOwnerMasterSheetTabs aggregates 6 master tabs across multiple farms and Onlysheeps', () => {
  const mockProfile1: FarmProfile = {
    farmId: 'farm-1',
    username: 'farmone',
    farmName: 'ฟาร์มหนึ่ง',
    ownerName: 'สมชาย',
    location: 'เชียงใหม่',
    contact: '081-111-1111',
    breedFocus: 'Merino',
  };
  const mockProfile2: FarmProfile = {
    farmId: 'farm-2',
    username: 'farmtwo',
    farmName: 'ฟาร์มสอง',
    ownerName: 'สมหญิง',
    location: 'นครราชสีมา',
    contact: '082-222-2222',
    breedFocus: 'Dorset',
  };

  const mockSheep: Sheep = {
    id: 's-1',
    earTag: 'F1-01',
    name: 'น้ำปั่น',
    breed: 'Merino',
    bloodPercentage: '100%',
    gender: 'female',
    birthDate: '2025-01-01',
    ageMonths: 4,
    weightKg: 18,
    currentAdgGrams: 200,
    stage: 'wool_weaning',
    bcs: 3.0,
    penId: 'pen-b',
    pen: 'คอก B',
    healthStatus: 'healthy',
  };

  const mockListing: OnlysheepsListing = {
    listingId: 'os-1',
    ownerFarmId: 'farm-1',
    farmName: 'ฟาร์มหนึ่ง',
    farmLocation: 'เชียงใหม่',
    ownerContact: '081-111-1111',
    id: 's-1',
    earTag: 'F1-01',
    name: 'น้ำปั่น',
    breed: 'Merino',
    gender: 'female',
    birthDate: '2025-01-01',
    ageMonths: 4,
    weightKg: 18,
    currentAdgGrams: 200,
    stage: 'wool_weaning',
    bcs: 3.0,
    penId: 'pen-b',
    pen: 'คอก B',
    healthStatus: 'healthy',
    woolMicron: 17.5,
    fleeceYieldKg: 3.8,
    romanticBio: 'ขนละเอียดเกรดพรีเมียม',
    breedingHighlight: 'Ultra Fine',
    publishedAt: '2026-01-01T00:00:00.000Z',
  };

  const tabs = buildOwnerMasterSheetTabs(
    [
      {
        profile: mockProfile1,
        sheepList: [mockSheep],
        ingredients: [DEFAULT_INGREDIENTS_TEMPLATE[0]],
        rations: [],
        logs: [],
      },
      {
        profile: mockProfile2,
        sheepList: [],
        ingredients: [],
        rations: [],
        logs: [],
      },
    ],
    [mockListing]
  );

  assert.equal(tabs.length, 6);
  assert.deepEqual(
    tabs.map(t => t.sheetName),
    [
      'สรุปทุกฟาร์ม',
      'ทะเบียนแกะทุกฟาร์ม',
      'วัตถุดิบทุกฟาร์ม',
      'สูตรอาหารทุกฟาร์ม',
      'สมุดบันทึกทุกฟาร์ม',
      'Onlysheeps ทั้งหมด',
    ]
  );
  assert.equal(tabs[0].rows.length, 2);
  assert.equal(tabs[1].rows.length, 1);
  assert.equal(tabs[2].rows.length, 1);
  assert.equal(tabs[5].rows.length, 1);
});

import {
  resolvePublicShareOrigin,
  encodeCompactSharePayload,
  decodeCompactSharePayload,
} from './shareReport';
import type { LiveShareReport } from '../types/sheep';

test('resolvePublicShareOrigin maps ais-dev origin to ais-pre public Shared URL', () => {
  assert.equal(
    resolvePublicShareOrigin('https://ais-dev-qrjdvrntkqves6dcxlicos-821895887617.asia-northeast1.run.app'),
    'https://ais-pre-qrjdvrntkqves6dcxlicos-821895887617.asia-northeast1.run.app'
  );
  assert.equal(
    resolvePublicShareOrigin('https://ais-pre-qrjdvrntkqves6dcxlicos-821895887617.asia-northeast1.run.app'),
    'https://ais-pre-qrjdvrntkqves6dcxlicos-821895887617.asia-northeast1.run.app'
  );
  assert.equal(resolvePublicShareOrigin('http://localhost:3000'), 'http://localhost:3000');
});

test('encodeCompactSharePayload & decodeCompactSharePayload preserve Thai farm report data cleanly', async () => {
  const sample: LiveShareReport = {
    shareId: 'live-farm-ovisfarm',
    scope: 'farm',
    updatedAt: '2026-11-17T08:55:00.000Z',
    farmName: 'Ovisfarm',
    ownerName: 'เจ้าของฟาร์ม Ovisfarm',
    location: 'จ.นครปฐม (ศาลายา)',
    totalSheep: 62,
    totalIngredients: 14,
    totalRations: 3,
    totalLogs: 5,
    pens: [
      {
        id: 'pen-a',
        code: 'คอก A',
        name: 'แม่พันธุ์ขนละเอียด',
        ageRange: '18-36 เดือน',
        sheepCount: 20,
        averageWeightKg: 68.3,
        dailyFeedKg: 2.3,
        averageAdgGrams: 199,
        purpose: 'แม่พันธุ์',
      },
    ],
    rations: [],
    ingredients: [],
    recentLogs: [],
  };

  const encoded = await encodeCompactSharePayload(sample);
  assert.ok(encoded.startsWith('z.') || encoded.startsWith('u.'), 'Should use compact encoded format');
  assert.ok(encoded.length < 1000, `Compact payload should stay QR-friendly (got ${encoded.length})`);

  const decoded = await decodeCompactSharePayload(encoded);
  assert.ok(decoded !== null);
  assert.equal(decoded!.farmName, 'Ovisfarm');
  assert.equal(decoded!.totalSheep, 62);
  assert.equal(decoded!.pens[0].code, 'คอก A');
  assert.equal(decoded!.pens[0].sheepCount, 20);
});

import { analyzeWoolNutritionAdjustments } from './nutrition';
import {
  ALL_THAI_PROVINCES,
  formatThaiFarmLocation,
  getDistrictsForProvince,
} from '../data/thailandLocations';

test('analyzeWoolNutritionAdjustments returns zero adjustments for strong, well-grown wool', () => {
  const healthyWoolSheep: Sheep = {
    id: 'w-good',
    earTag: 'W-01',
    name: 'ปุยเมฆ',
    breed: 'เมอริโน (Merino)',
    gender: 'female',
    birthDate: '2024-01-01',
    ageMonths: 24,
    weightKg: 60,
    currentAdgGrams: 180,
    stage: 'wool_maintenance',
    bcs: 3.5,
    penId: 'pen-a',
    pen: 'คอก A',
    healthStatus: 'healthy',
    gfwBodyKg: 3.8,
    gfwSkirtingsKg: 0.9,
    woolStapleLengthCm: 10.5,
    woolSoundness: 'strong',
    woolCrimpStyle: 'dense',
    woolHandle: 'soft_greasy',
  };

  const adj = analyzeWoolNutritionAdjustments(healthyWoolSheep);
  assert.equal(adj.hasPenSideData, true);
  assert.equal(adj.hasAdjustments, false);
  assert.equal(adj.cpDeltaPct, 0);
  assert.equal(adj.tdnDeltaPct, 0);
  assert.equal(adj.roughageMinPctDelta, 0);

  const req = calculateSheepNutrientRequirement(60, 'wool_maintenance', 180, adj);
  assert.equal(req.cpPercent, 10.5);
  assert.equal(req.tdnPercent, 58.0);
  assert.equal(req.targetRcRatio, '75:25');
});

test('analyzeWoolNutritionAdjustments boosts CP and TDN with safe physiological caps', () => {
  const stressedSheep: Sheep = {
    id: 'w-stress',
    earTag: 'W-02',
    name: 'มอมแมม',
    breed: 'เมอริโน (Merino)',
    gender: 'female',
    birthDate: '2024-01-01',
    ageMonths: 24,
    weightKg: 60,
    currentAdgGrams: 140,
    stage: 'wool_growing',
    bcs: 3.0,
    penId: 'pen-b',
    pen: 'คอก B',
    healthStatus: 'monitoring',
    gfwBodyKg: 4.5,
    gfwSkirtingsKg: 1.5, // total 6.0 kg >= 5.5 -> +0.5 CP
    woolStapleLengthCm: 5.8, // < 7.0 -> +1.5 TDN
    woolSoundness: 'weak_base', // +1.0 CP, +2.0 TDN
    woolCrimpStyle: 'loose',
    woolHandle: 'dry_harsh', // +1.5 TDN (raw TDN = 5.0 -> capped at 4.0)
  };

  const adj = analyzeWoolNutritionAdjustments(stressedSheep);
  assert.equal(adj.hasAdjustments, true);
  assert.equal(adj.cpDeltaPct, 1.5); // 1.0 (soundness) + 0.5 (high GFW)
  assert.equal(adj.tdnDeltaPct, 4.0); // 2.0 + 1.5 + 1.5 = 5.0 -> capped at 4.0
  assert.equal(adj.roughageMinPctDelta, 0);
  assert.ok(adj.reasons.some(r => r.key === 'soundness' && r.severity === 'action'));
  assert.ok(adj.reasons.some(r => r.key === 'staple' && r.severity === 'action'));
  assert.ok(adj.reasons.some(r => r.key === 'handle' && r.severity === 'action'));

  const baseReq = calculateSheepNutrientRequirement(60, 'wool_growing', 140);
  const adjustedReq = calculateSheepNutrientRequirement(60, 'wool_growing', 140, adj);
  assert.equal(baseReq.cpPercent, 13.5);
  assert.equal(adjustedReq.cpPercent, 15.0);
  assert.equal(adjustedReq.tdnPercent, 68.0);
  assert.equal(adjustedReq.targetRcRatio, '55:45');
});

test('Thailand provinces and districts lookup covers all 77 provinces and formats locations cleanly', () => {
  assert.equal(ALL_THAI_PROVINCES.length, 77);
  for (const prov of ALL_THAI_PROVINCES) {
    assert.ok(getDistrictsForProvince(prov).length >= 3, `${prov} should have districts`);
  }
  assert.ok(getDistrictsForProvince('เชียงใหม่').includes('จอมทอง'));
  assert.equal(formatThaiFarmLocation('เชียงใหม่', 'จอมทอง'), 'จ.เชียงใหม่ (อ.จอมทอง)');
  assert.equal(formatThaiFarmLocation('กรุงเทพมหานคร', 'จตุจักร'), 'กรุงเทพมหานคร (เขตจตุจักร)');
  assert.equal(formatThaiFarmLocation(''), '');
});




