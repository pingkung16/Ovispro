/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSupabaseClient } from '../lib/supabase';
import { getBreedPhoto } from '../data/breedPhotos';
import {
  DEFAULT_INGREDIENTS_TEMPLATE,
  DEFAULT_PENS_TEMPLATE,
  DEFAULT_RATIONS_TEMPLATE,
  ONLYSHEEPS_INITIAL_LISTINGS,
  SEED_FARMS,
} from '../data/multiFarmSeed';
import { computeLivePens } from './nutrition';
import { buildOwnerMasterSheetTabs } from './sheetExport';
import type {
  FarmGoogleSheetConfig,
  FarmLog,
  FarmProfile,
  FeedIngredient,
  FormulatedRation,
  LiveShareReport,
  OnlysheepsListing,
  OnlysheepsMatchRecord,
  OwnerMasterSheetData,
  Pen,
  PublicPlatformOverview,
  RationIngredientItem,
  Sheep,
  SheepStage,
  WebFormSubmission,
  WoolCrimpStyle,
  WoolHandle,
  WoolSoundness,
} from '../types/sheep';
import type { FarmWorkspaceData } from './api';

const SB_TOKEN_PREFIX = 'sb-farm:';

let lastLocalWriteAt = 0;

export function markSupabaseLocalWrite(): void {
  lastLocalWriteAt = Date.now();
}

export function getLastSupabaseLocalWriteAt(): number {
  return lastLocalWriteAt;
}

export function makeSupabaseSessionToken(farmId: string): string {
  return `${SB_TOKEN_PREFIX}${farmId}`;
}

export function parseSupabaseFarmIdFromToken(token: string | null): string | null {
  if (!token || !token.startsWith(SB_TOKEN_PREFIX)) return null;
  const farmId = token.slice(SB_TOKEN_PREFIX.length).trim();
  return farmId || null;
}

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('ยังไม่ได้ตั้งค่า VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY');
  }
  return client;
}

// ============================================================================
// ROW MAPPERS (PostgreSQL snake_case <-> TypeScript camelCase)
// ============================================================================

interface DbFarmRow {
  id: string;
  username: string;
  farm_name: string;
  owner_name: string;
  location: string;
  contact: string;
  breed_focus: string;
  is_seed_farm: boolean;
  sheep_count: number;
  google_sheet_config: FarmGoogleSheetConfig | null;
  updated_at: string;
}

function mapFarmRowToProfile(row: DbFarmRow): FarmProfile {
  return {
    farmId: row.id,
    username: row.username,
    farmName: row.farm_name,
    ownerName: row.owner_name,
    location: row.location,
    contact: row.contact,
    breedFocus: row.breed_focus,
    isSeedFarm: Boolean(row.is_seed_farm),
    googleSheetConfig: row.google_sheet_config || undefined,
    updatedAt: row.updated_at,
  };
}

function mapPenRow(row: Record<string, unknown>): Pen {
  return {
    id: String(row.id),
    code: String(row.code || ''),
    name: String(row.name || ''),
    ageRange: String(row.age_range || 'ทุกช่วงอายุ'),
    sheepCount: Number(row.sheep_count ?? 0),
    averageWeightKg: Number(row.average_weight_kg ?? 50),
    dailyFeedKg: Number(row.daily_feed_kg ?? 2),
    averageAdgGrams: Number(row.average_adg_grams ?? 175),
    purpose: String(row.purpose || ''),
    colorTheme: row.color_theme ? String(row.color_theme) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
  };
}

function penToRow(farmId: string, pen: Pen) {
  return {
    id: pen.id,
    farm_id: farmId,
    code: pen.code,
    name: pen.name,
    age_range: pen.ageRange || 'ทุกช่วงอายุ',
    sheep_count: Number(pen.sheepCount ?? 0),
    average_weight_kg: Number(pen.averageWeightKg ?? 50),
    daily_feed_kg: Number(pen.dailyFeedKg ?? 2),
    average_adg_grams: Math.round(Number(pen.averageAdgGrams ?? 175)),
    purpose: pen.purpose || '',
    color_theme: pen.colorTheme ?? null,
    notes: pen.notes ?? null,
  };
}

function mapSheepRow(row: Record<string, unknown>): Sheep {
  return {
    id: String(row.id),
    earTag: String(row.ear_tag || ''),
    name: String(row.name || ''),
    breed: String(row.breed || ''),
    bloodPercentage: row.blood_percentage ? String(row.blood_percentage) : undefined,
    gender: row.gender === 'male' ? 'male' : 'female',
    birthDate: String(row.birth_date || ''),
    ageMonths: Number(row.age_months ?? 12),
    weightKg: Number(row.weight_kg ?? 40),
    currentAdgGrams: Number(row.current_adg_grams ?? 180),
    adgTargetGrams: row.adg_target_grams != null ? Number(row.adg_target_grams) : undefined,
    adgExplanation: row.adg_explanation ? String(row.adg_explanation) : undefined,
    stage: (row.stage ? String(row.stage) : 'wool_maintenance') as SheepStage,
    bcs: Number(row.bcs ?? 3.5),
    penId: String(row.pen_id || 'pen-a'),
    pen: String(row.pen || 'คอก A'),
    healthStatus: (row.health_status ? String(row.health_status) : 'healthy') as Sheep['healthStatus'],
    assignedRationId: row.assigned_ration_id ? String(row.assigned_ration_id) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    avatarColor: row.avatar_color ? String(row.avatar_color) : undefined,
    photoUrl: row.photo_url ? String(row.photo_url) : undefined,
    sireId: row.sire_id ? String(row.sire_id) : undefined,
    sireName: row.sire_name ? String(row.sire_name) : undefined,
    sireBreed: row.sire_breed ? String(row.sire_breed) : undefined,
    damId: row.dam_id ? String(row.dam_id) : undefined,
    damName: row.dam_name ? String(row.dam_name) : undefined,
    damBreed: row.dam_breed ? String(row.dam_breed) : undefined,
    vaccineName: row.vaccine_name ? String(row.vaccine_name) : undefined,
    vaccineLastDate: row.vaccine_last_date ? String(row.vaccine_last_date) : undefined,
    dewormName: row.deworm_name ? String(row.deworm_name) : undefined,
    dewormLastDate: row.deworm_last_date ? String(row.deworm_last_date) : undefined,
    hoofTrimLastDate: row.hoof_trim_last_date ? String(row.hoof_trim_last_date) : undefined,
    healthNotes: row.health_notes ? String(row.health_notes) : undefined,
    woolGrade: row.wool_grade ? String(row.wool_grade) : undefined,
    woolMicron: row.wool_micron != null ? Number(row.wool_micron) : undefined,
    woolStapleLengthCm:
      row.wool_staple_length_cm != null ? Number(row.wool_staple_length_cm) : undefined,
    fleeceYieldKg: row.fleece_yield_kg != null ? Number(row.fleece_yield_kg) : undefined,
    gfwBodyKg: row.gfw_body_kg != null ? Number(row.gfw_body_kg) : undefined,
    gfwSkirtingsKg: row.gfw_skirtings_kg != null ? Number(row.gfw_skirtings_kg) : undefined,
    woolSoundness: row.wool_soundness ? (String(row.wool_soundness) as WoolSoundness) : undefined,
    woolCrimpStyle: row.wool_crimp_style
      ? (String(row.wool_crimp_style) as WoolCrimpStyle)
      : undefined,
    woolHandle: row.wool_handle ? (String(row.wool_handle) as WoolHandle) : undefined,
    lastShearingDate: row.last_shearing_date ? String(row.last_shearing_date) : undefined,
    woolColor: row.wool_color ? String(row.wool_color) : undefined,
    crimpPerInch: row.crimp_per_inch != null ? Number(row.crimp_per_inch) : undefined,
    fleeceQualityRating:
      row.fleece_quality_rating != null ? Number(row.fleece_quality_rating) : undefined,
    isPartnerFarm: row.is_partner_farm != null ? Boolean(row.is_partner_farm) : undefined,
    farmName: row.farm_name ? String(row.farm_name) : undefined,
    farmLocation: row.farm_location ? String(row.farm_location) : undefined,
    ownerContact: row.owner_contact ? String(row.owner_contact) : undefined,
    romanticBio: row.romantic_bio ? String(row.romantic_bio) : undefined,
    breedingHighlight: row.breeding_highlight ? String(row.breeding_highlight) : undefined,
    lambingRatePct: row.lambing_rate_pct ? String(row.lambing_rate_pct) : undefined,
  };
}

function sheepToRow(farmId: string, sheep: Sheep) {
  return {
    id: sheep.id,
    farm_id: farmId,
    ear_tag: sheep.earTag,
    name: sheep.name,
    breed: sheep.breed,
    blood_percentage: sheep.bloodPercentage ?? null,
    gender: sheep.gender === 'male' ? 'male' : 'female',
    birth_date: sheep.birthDate ?? null,
    age_months: Number(sheep.ageMonths ?? 12),
    weight_kg: Math.max(0.5, Number(sheep.weightKg ?? 40)),
    current_adg_grams: Math.round(Number(sheep.currentAdgGrams ?? 180)),
    adg_target_grams: sheep.adgTargetGrams != null ? Math.round(Number(sheep.adgTargetGrams)) : null,
    adg_explanation: sheep.adgExplanation ?? null,
    stage: sheep.stage || 'wool_maintenance',
    bcs: Number(sheep.bcs ?? 3.5),
    pen_id: sheep.penId || 'pen-a',
    pen: sheep.pen || 'คอก A',
    health_status: sheep.healthStatus || 'healthy',
    assigned_ration_id: sheep.assignedRationId ?? null,
    notes: sheep.notes ?? null,
    avatar_color: sheep.avatarColor ?? null,
    photo_url: sheep.photoUrl ?? null,
    sire_id: sheep.sireId ?? null,
    sire_name: sheep.sireName ?? null,
    sire_breed: sheep.sireBreed ?? null,
    dam_id: sheep.damId ?? null,
    dam_name: sheep.damName ?? null,
    dam_breed: sheep.damBreed ?? null,
    vaccine_name: sheep.vaccineName ?? null,
    vaccine_last_date: sheep.vaccineLastDate ?? null,
    deworm_name: sheep.dewormName ?? null,
    deworm_last_date: sheep.dewormLastDate ?? null,
    hoof_trim_last_date: sheep.hoofTrimLastDate ?? null,
    health_notes: sheep.healthNotes ?? null,
    wool_grade: sheep.woolGrade ?? null,
    wool_micron: sheep.woolMicron != null ? Number(sheep.woolMicron) : null,
    wool_staple_length_cm:
      sheep.woolStapleLengthCm != null ? Number(sheep.woolStapleLengthCm) : null,
    fleece_yield_kg: sheep.fleeceYieldKg != null ? Number(sheep.fleeceYieldKg) : null,
    gfw_body_kg: sheep.gfwBodyKg != null ? Number(sheep.gfwBodyKg) : null,
    gfw_skirtings_kg: sheep.gfwSkirtingsKg != null ? Number(sheep.gfwSkirtingsKg) : null,
    wool_soundness: sheep.woolSoundness ?? null,
    wool_crimp_style: sheep.woolCrimpStyle ?? null,
    wool_handle: sheep.woolHandle ?? null,
    last_shearing_date: sheep.lastShearingDate ?? null,
    wool_color: sheep.woolColor ?? null,
    crimp_per_inch: sheep.crimpPerInch != null ? Math.round(Number(sheep.crimpPerInch)) : null,
    fleece_quality_rating:
      sheep.fleeceQualityRating != null ? Math.round(Number(sheep.fleeceQualityRating)) : null,
    is_partner_farm: Boolean(sheep.isPartnerFarm),
    farm_name: sheep.farmName ?? null,
    farm_location: sheep.farmLocation ?? null,
    owner_contact: sheep.ownerContact ?? null,
    romantic_bio: sheep.romanticBio ?? null,
    breeding_highlight: sheep.breedingHighlight ?? null,
    lambing_rate_pct: sheep.lambingRatePct ?? null,
  };
}

const OPTIONAL_NEW_SHEEP_COLUMNS = [
  'gfw_body_kg',
  'gfw_skirtings_kg',
  'wool_soundness',
  'wool_crimp_style',
  'wool_handle',
] as const;

function stripOptionalNewSheepColumns(row: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...row };
  for (const key of OPTIONAL_NEW_SHEEP_COLUMNS) {
    delete copy[key];
  }
  return copy;
}

function isMissingColumnError(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  return (
    err.code === 'PGRST204' ||
    err.code === '42703' ||
    msg.includes('schema cache') ||
    msg.includes('does not exist')
  );
}

function mapIngredientRow(row: Record<string, unknown>): FeedIngredient {
  return {
    id: String(row.id),
    nameTh: String(row.name_th || ''),
    nameEn: String(row.name_en || ''),
    category: String(row.category || 'roughage_fresh') as FeedIngredient['category'],
    dryMatter: Number(row.dry_matter ?? 88),
    crudeProtein: Number(row.crude_protein ?? 10),
    tdn: Number(row.tdn ?? 60),
    calcium: Number(row.calcium ?? 0.3),
    phosphorus: Number(row.phosphorus ?? 0.2),
    pricePerKg: Number(row.price_per_kg ?? 0),
    maxInclusionPct:
      row.max_inclusion_pct != null ? Number(row.max_inclusion_pct) : undefined,
    isRoughage: Boolean(row.is_roughage),
    description: row.description ? String(row.description) : undefined,
  };
}

function ingredientToRow(farmId: string, ing: FeedIngredient) {
  return {
    id: ing.id,
    farm_id: farmId,
    name_th: ing.nameTh,
    name_en: ing.nameEn || '',
    category: ing.category,
    dry_matter: Number(ing.dryMatter ?? 88),
    crude_protein: Number(ing.crudeProtein ?? 10),
    tdn: Number(ing.tdn ?? 60),
    calcium: Number(ing.calcium ?? 0.3),
    phosphorus: Number(ing.phosphorus ?? 0.2),
    price_per_kg: Number(ing.pricePerKg ?? 0),
    max_inclusion_pct: ing.maxInclusionPct != null ? Number(ing.maxInclusionPct) : null,
    is_roughage: Boolean(ing.isRoughage),
    description: ing.description ?? null,
  };
}

function mapRationRow(row: Record<string, unknown>): FormulatedRation {
  return {
    id: String(row.id),
    name: String(row.name || ''),
    description: String(row.description || ''),
    targetStage: String(row.target_stage || 'wool_maintenance') as SheepStage,
    recommendedForWeight: Number(row.recommended_for_weight ?? 50),
    items: Array.isArray(row.items) ? (row.items as RationIngredientItem[]) : [],
    totalAsFedKg: Number(row.total_as_fed_kg ?? 0),
    totalDmKg: Number(row.total_dm_kg ?? 0),
    calculatedCpPercent: Number(row.calculated_cp_percent ?? 0),
    calculatedTdnPercent: Number(row.calculated_tdn_percent ?? 0),
    calculatedCaPercent: Number(row.calculated_ca_percent ?? 0),
    calculatedPPercent: Number(row.calculated_p_percent ?? 0),
    roughagePercent: Number(row.roughage_percent ?? 0),
    concentratePercent: Number(row.concentrate_percent ?? 0),
    costPerKgMix: Number(row.cost_per_kg_mix ?? 0),
    costPerHeadPerDay: Number(row.cost_per_head_per_day ?? 0),
    createdAt: String(row.created_at || ''),
  };
}

function rationToRow(farmId: string, ration: FormulatedRation) {
  return {
    id: ration.id,
    farm_id: farmId,
    name: ration.name,
    description: ration.description || '',
    target_stage: ration.targetStage,
    recommended_for_weight: Number(ration.recommendedForWeight ?? 50),
    items: ration.items || [],
    total_as_fed_kg: Number(ration.totalAsFedKg ?? 0),
    total_dm_kg: Number(ration.totalDmKg ?? 0),
    calculated_cp_percent: Number(ration.calculatedCpPercent ?? 0),
    calculated_tdn_percent: Number(ration.calculatedTdnPercent ?? 0),
    calculated_ca_percent: Number(ration.calculatedCaPercent ?? 0),
    calculated_p_percent: Number(ration.calculatedPPercent ?? 0),
    roughage_percent: Number(ration.roughagePercent ?? 0),
    concentrate_percent: Number(ration.concentratePercent ?? 0),
    cost_per_kg_mix: Number(ration.costPerKgMix ?? 0),
    cost_per_head_per_day: Number(ration.costPerHeadPerDay ?? 0),
    created_at: ration.createdAt || new Date().toISOString().split('T')[0],
  };
}

const OPTIONAL_NEW_LOG_COLUMNS = [
  'wool_weight_kg',
  'wool_body_kg',
  'wool_skirtings_kg',
  'wool_staple_length_cm',
  'wool_micron',
  'wool_grade',
  'wool_soundness',
  'wool_crimp_style',
  'wool_handle',
] as const;

function sanitizeLogRowForLegacyDb(row: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...row };
  for (const key of OPTIONAL_NEW_LOG_COLUMNS) {
    delete copy[key];
  }
  if (copy.type === 'shearing') {
    copy.type = 'weight';
  }
  return copy;
}

function mapLogRow(row: Record<string, unknown>): FarmLog {
  const rawType = String(row.type || 'feeding');
  const titleStr = String(row.title || '');
  const resolvedType = (
    rawType === 'weight' && (row.wool_weight_kg != null || titleStr.includes('ตัดขน'))
      ? 'shearing'
      : rawType
  ) as FarmLog['type'];

  return {
    id: String(row.id),
    date: String(row.date || ''),
    time: row.time ? String(row.time) : undefined,
    type: resolvedType,
    sheepId: row.sheep_id ? String(row.sheep_id) : undefined,
    sheepEarTag: row.sheep_ear_tag ? String(row.sheep_ear_tag) : undefined,
    penId: row.pen_id ? String(row.pen_id) : undefined,
    penName: row.pen_name ? String(row.pen_name) : undefined,
    title: titleStr,
    recordedBy: String(row.recorded_by || ''),
    weightKg: row.weight_kg != null ? Number(row.weight_kg) : undefined,
    feedRationName: row.feed_ration_name ? String(row.feed_ration_name) : undefined,
    feedAmountKg: row.feed_amount_kg != null ? Number(row.feed_amount_kg) : undefined,
    vaccineOrMedicineName: row.vaccine_or_medicine_name
      ? String(row.vaccine_or_medicine_name)
      : undefined,
    treatmentDose: row.treatment_dose ? String(row.treatment_dose) : undefined,
    administratorName: row.administrator_name ? String(row.administrator_name) : undefined,
    estrusStartDate: row.estrus_start_date ? String(row.estrus_start_date) : undefined,
    matingDate: row.mating_date ? String(row.mating_date) : undefined,
    sireBreedAndTag: row.sire_breed_and_tag ? String(row.sire_breed_and_tag) : undefined,
    damEarTag: row.dam_ear_tag ? String(row.dam_ear_tag) : undefined,
    lambCount: row.lamb_count != null ? Number(row.lamb_count) : undefined,
    lambGenders: row.lamb_genders ? String(row.lamb_genders) : undefined,
    lambSurvivalRate: row.lamb_survival_rate ? String(row.lamb_survival_rate) : undefined,
    woolWeightKg: row.wool_weight_kg != null ? Number(row.wool_weight_kg) : undefined,
    woolBodyKg: row.wool_body_kg != null ? Number(row.wool_body_kg) : undefined,
    woolSkirtingsKg: row.wool_skirtings_kg != null ? Number(row.wool_skirtings_kg) : undefined,
    woolStapleLengthCm:
      row.wool_staple_length_cm != null ? Number(row.wool_staple_length_cm) : undefined,
    woolMicron: row.wool_micron != null ? Number(row.wool_micron) : undefined,
    woolGrade: row.wool_grade ? String(row.wool_grade) : undefined,
    woolSoundness: row.wool_soundness ? (String(row.wool_soundness) as FarmLog['woolSoundness']) : undefined,
    woolCrimpStyle: row.wool_crimp_style
      ? (String(row.wool_crimp_style) as FarmLog['woolCrimpStyle'])
      : undefined,
    woolHandle: row.wool_handle ? (String(row.wool_handle) as FarmLog['woolHandle']) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
  };
}

function logToRow(farmId: string, log: FarmLog) {
  return {
    id: log.id,
    farm_id: farmId,
    date: log.date,
    time: log.time ?? null,
    type: log.type,
    sheep_id: log.sheepId ?? null,
    sheep_ear_tag: log.sheepEarTag ?? null,
    pen_id: log.penId ?? null,
    pen_name: log.penName ?? null,
    title: log.title,
    recorded_by: log.recordedBy || 'ผู้จัดการฟาร์ม',
    weight_kg: log.weightKg != null ? Number(log.weightKg) : null,
    feed_ration_name: log.feedRationName ?? null,
    feed_amount_kg: log.feedAmountKg != null ? Number(log.feedAmountKg) : null,
    vaccine_or_medicine_name: log.vaccineOrMedicineName ?? null,
    treatment_dose: log.treatmentDose ?? null,
    administrator_name: log.administratorName ?? null,
    estrus_start_date: log.estrusStartDate ?? null,
    mating_date: log.matingDate ?? null,
    sire_breed_and_tag: log.sireBreedAndTag ?? null,
    dam_ear_tag: log.damEarTag ?? null,
    lamb_count: log.lambCount != null ? Math.round(Number(log.lambCount)) : null,
    lamb_genders: log.lambGenders ?? null,
    lamb_survival_rate: log.lambSurvivalRate ?? null,
    wool_weight_kg: log.woolWeightKg != null ? Number(log.woolWeightKg) : null,
    wool_body_kg: log.woolBodyKg != null ? Number(log.woolBodyKg) : null,
    wool_skirtings_kg: log.woolSkirtingsKg != null ? Number(log.woolSkirtingsKg) : null,
    wool_staple_length_cm:
      log.woolStapleLengthCm != null ? Number(log.woolStapleLengthCm) : null,
    wool_micron: log.woolMicron != null ? Number(log.woolMicron) : null,
    wool_grade: log.woolGrade ?? null,
    wool_soundness: log.woolSoundness ?? null,
    wool_crimp_style: log.woolCrimpStyle ?? null,
    wool_handle: log.woolHandle ?? null,
    notes: log.notes ?? null,
  };
}

function mapMatchRow(row: Record<string, unknown>): OnlysheepsMatchRecord {
  return {
    id: String(row.id),
    listingId: undefined as never,
    sheep: row.sheep_snapshot as OnlysheepsListing,
    matchedAt: String(row.matched_at || ''),
    matchType: row.match_type === 'super_kiss' ? 'super_kiss' : 'like',
    synergyNote: String(row.synergy_note || ''),
    scheduledNote: row.scheduled_note ? String(row.scheduled_note) : undefined,
  } as OnlysheepsMatchRecord;
}

function matchToRow(farmId: string, match: OnlysheepsMatchRecord) {
  return {
    id: match.id,
    farm_id: farmId,
    listing_id: match.sheep?.listingId || match.id,
    match_type: match.matchType === 'super_kiss' ? 'super_kiss' : 'like',
    matched_at: match.matchedAt,
    synergy_note: match.synergyNote || '',
    scheduled_note: match.scheduledNote ?? null,
    sheep_snapshot: match.sheep,
  };
}

function mapWebFormRow(row: Record<string, unknown>): WebFormSubmission {
  return {
    id: String(row.id),
    submittedAt: String(row.submitted_at || new Date().toISOString()),
    farmName: String(row.farm_name || ''),
    recorderName: String(row.recorder_name || ''),
    province: String(row.province || ''),
    sheepEarTag: String(row.sheep_ear_tag || ''),
    sheepName: String(row.sheep_name || ''),
    breed: String(row.breed || ''),
    gender: row.gender === 'male' ? 'male' : 'female',
    ageMonths: Number(row.age_months ?? 12),
    weightKg: Number(row.weight_kg ?? 40),
    woolMicron: Number(row.wool_micron ?? 20),
    dailyFeedKg: Number(row.daily_feed_kg ?? 2),
    notes: row.notes ? String(row.notes) : undefined,
    syncedToSheet: Boolean(row.synced_to_sheet),
  };
}

// ============================================================================
// ONE-TIME BOOTSTRAP SEED IF SUPABASE DATABASE IS EMPTY
// ============================================================================

let seedPromise: Promise<void> | null = null;
let seededChecked = false;

export async function ensureSupabaseSeeded(): Promise<void> {
  if (seededChecked) return;
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    const supabase = requireClient();
    const { count, error } = await supabase
      .from('farms')
      .select('id', { count: 'exact', head: true });
    if (error) {
      throw new Error(`Supabase query failed: ${error.message}`);
    }
    if ((count ?? 0) > 0) {
      seededChecked = true;
      return;
    }

    for (const seed of SEED_FARMS) {
      const { error: rpcErr } = await supabase.rpc('seed_ovispro_farm_if_missing', {
        p_farm_id: seed.profile.farmId,
        p_username: seed.profile.username,
        p_password: seed.passwordPlain,
        p_farm_name: seed.profile.farmName,
        p_owner_name: seed.profile.ownerName,
        p_location: seed.profile.location,
        p_contact: seed.profile.contact,
        p_breed_focus: seed.profile.breedFocus,
        p_is_seed_farm: true,
      });
      if (rpcErr) {
        throw new Error(`Seed farm RPC failed (${seed.profile.farmId}): ${rpcErr.message}`);
      }

      const farmId = seed.profile.farmId;
      await supabase
        .from('farm_pens')
        .upsert(seed.pens.map(p => penToRow(farmId, p)), { onConflict: 'farm_id,id' });
      await supabase
        .from('feed_ingredients')
        .upsert(seed.ingredients.map(i => ingredientToRow(farmId, i)), { onConflict: 'farm_id,id' });
      await supabase
        .from('formulated_rations')
        .upsert(seed.rations.map(r => rationToRow(farmId, r)), { onConflict: 'farm_id,id' });
      const sheepRows = seed.sheepList.map(s => sheepToRow(farmId, s));
      const seedSheepRes = await supabase
        .from('sheep')
        .upsert(sheepRows, { onConflict: 'id' });
      if (seedSheepRes.error && isMissingColumnError(seedSheepRes.error)) {
        await supabase
          .from('sheep')
          .upsert(sheepRows.map(stripOptionalNewSheepColumns), { onConflict: 'id' });
      }
      await supabase
        .from('farm_logs')
        .upsert(seed.logs.map(l => logToRow(farmId, l)), { onConflict: 'id' });
    }

    await supabase.from('onlysheeps_listings').upsert(
      ONLYSHEEPS_INITIAL_LISTINGS.map(item => ({
        listing_id: item.listingId,
        owner_farm_id: item.ownerFarmId,
        sheep_id: item.id,
        published_at: item.publishedAt,
        payload: item,
      })),
      { onConflict: 'listing_id' }
    );

    seededChecked = true;
  })().finally(() => {
    seedPromise = null;
  });

  return seedPromise;
}

// ============================================================================
// PUBLIC HUB OVERVIEW
// ============================================================================

export async function sbFetchPublicOverview(): Promise<PublicPlatformOverview> {
  await ensureSupabaseSeeded();
  const supabase = requireClient();

  const [farmsRes, listingsRes] = await Promise.all([
    supabase
      .from('farms')
      .select('id, username, farm_name, location, breed_focus, sheep_count')
      .order('created_at', { ascending: true }),
    supabase
      .from('onlysheeps_listings')
      .select('listing_id', { count: 'exact', head: true }),
  ]);

  if (farmsRes.error) {
    throw new Error(farmsRes.error.message);
  }

  const rows = farmsRes.data || [];
  const farmDirectory = rows.map(r => ({
    farmId: String(r.id),
    username: String(r.username),
    farmName: String(r.farm_name),
    location: String(r.location),
    breedFocus: String(r.breed_focus),
    sheepCount: Number(r.sheep_count ?? 0),
  }));

  return {
    totalFarms: farmDirectory.length,
    totalNetworkSheep: farmDirectory.reduce((sum, f) => sum + f.sheepCount, 0),
    onlysheepsCount: listingsRes.count ?? 0,
    farmDirectory,
  };
}

// ============================================================================
// PRIVATE FARM WORKSPACE LOAD & DIFF-SYNC SAVE
// ============================================================================

export async function sbFetchFarmWorkspace(farmId: string): Promise<FarmWorkspaceData> {
  await ensureSupabaseSeeded();
  const supabase = requireClient();

  const [farmRes, pensRes, sheepRes, ingRes, rationsRes, logsRes, matchesRes] =
    await Promise.all([
      supabase.from('farms').select('*').eq('id', farmId).single(),
      supabase.from('farm_pens').select('*').eq('farm_id', farmId).order('code', { ascending: true }),
      supabase.from('sheep').select('*').eq('farm_id', farmId).order('created_at', { ascending: false }),
      supabase.from('feed_ingredients').select('*').eq('farm_id', farmId),
      supabase.from('formulated_rations').select('*').eq('farm_id', farmId),
      supabase.from('farm_logs').select('*').eq('farm_id', farmId).order('date', { ascending: false }),
      supabase.from('onlysheeps_matches').select('*').eq('farm_id', farmId),
    ]);

  if (farmRes.error || !farmRes.data) {
    throw new Error('ไม่พบบัญชีฟาร์มในฐานข้อมูล Supabase');
  }

  const profile = mapFarmRowToProfile(farmRes.data as DbFarmRow);
  const sheepList = (sheepRes.data || []).map(r => mapSheepRow(r as Record<string, unknown>));
  const rawPens = (pensRes.data || []).map(r => mapPenRow(r as Record<string, unknown>));
  const pens = computeLivePens(
    rawPens.length > 0 ? rawPens : DEFAULT_PENS_TEMPLATE.map(p => ({ ...p })),
    sheepList
  );
  const rawIngredients = (ingRes.data || []).map(r =>
    mapIngredientRow(r as Record<string, unknown>)
  );
  const rawRations = (rationsRes.data || []).map(r => mapRationRow(r as Record<string, unknown>));
  const logs = (logsRes.data || []).map(r => mapLogRow(r as Record<string, unknown>));
  const matches = (matchesRes.data || []).map(r => mapMatchRow(r as Record<string, unknown>));

  return {
    profile,
    pens,
    sheepList,
    ingredients:
      rawIngredients.length > 0
        ? rawIngredients
        : DEFAULT_INGREDIENTS_TEMPLATE.map(i => ({ ...i })),
    rations:
      rawRations.length > 0 ? rawRations : DEFAULT_RATIONS_TEMPLATE.map(r => ({ ...r })),
    logs,
    matches,
  };
}

async function syncScopedTableRows<T extends { id: string }>(
  table: 'farm_pens' | 'sheep' | 'feed_ingredients' | 'formulated_rations' | 'farm_logs' | 'onlysheeps_matches',
  farmId: string,
  items: T[],
  toRow: (farmId: string, item: T) => Record<string, unknown>,
  onConflict: string
): Promise<void> {
  const supabase = requireClient();

  const existingRes = await supabase.from(table).select('id').eq('farm_id', farmId);
  if (existingRes.error) {
    throw new Error(`Sync ${table} read failed: ${existingRes.error.message}`);
  }

  const currentIds = new Set(items.map(item => item.id));
  const idsToDelete = (existingRes.data || [])
    .map(r => String((r as { id: string }).id))
    .filter(id => !currentIds.has(id));

  if (idsToDelete.length > 0) {
    const delRes = await supabase
      .from(table)
      .delete()
      .eq('farm_id', farmId)
      .in('id', idsToDelete);
    if (delRes.error) {
      throw new Error(`Sync ${table} delete failed: ${delRes.error.message}`);
    }
  }

  if (items.length > 0) {
    const rows = items.map(item => toRow(farmId, item));
    const CHUNK = 100;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const slice = rows.slice(i, i + CHUNK);
      let upsertRes = await supabase.from(table).upsert(slice, { onConflict });
      if (upsertRes.error && table === 'sheep' && isMissingColumnError(upsertRes.error)) {
        upsertRes = await supabase
          .from(table)
          .upsert(slice.map(stripOptionalNewSheepColumns), { onConflict });
      }
      if (
        upsertRes.error &&
        table === 'farm_logs' &&
        (isMissingColumnError(upsertRes.error) || upsertRes.error.code === '23514')
      ) {
        upsertRes = await supabase
          .from(table)
          .upsert(slice.map(sanitizeLogRowForLegacyDb), { onConflict });
      }
      if (upsertRes.error) {
        throw new Error(`Sync ${table} upsert failed: ${upsertRes.error.message}`);
      }
    }
  }
}

export async function sbSaveFarmWorkspace(
  farmId: string,
  payload: {
    profile?: Partial<FarmProfile>;
    pens?: Pen[];
    sheepList?: Sheep[];
    ingredients?: FeedIngredient[];
    rations?: FormulatedRation[];
    logs?: FarmLog[];
    matches?: OnlysheepsMatchRecord[];
  }
): Promise<{ ok: boolean; profile: FarmProfile; pens: Pen[] }> {
  markSupabaseLocalWrite();
  const supabase = requireClient();

  const farmUpdate: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (payload.profile) {
    if (payload.profile.farmName) farmUpdate.farm_name = payload.profile.farmName.trim();
    if (payload.profile.ownerName) farmUpdate.owner_name = payload.profile.ownerName.trim();
    if (payload.profile.location) farmUpdate.location = payload.profile.location.trim();
    if (payload.profile.contact) farmUpdate.contact = payload.profile.contact.trim();
    if (payload.profile.breedFocus) farmUpdate.breed_focus = payload.profile.breedFocus.trim();
    if (payload.profile.googleSheetConfig !== undefined) {
      farmUpdate.google_sheet_config = payload.profile.googleSheetConfig || {};
    }
  }
  if (Array.isArray(payload.sheepList)) {
    farmUpdate.sheep_count = payload.sheepList.length;
  }

  const { data: updatedFarm, error: farmErr } = await supabase
    .from('farms')
    .update(farmUpdate)
    .eq('id', farmId)
    .select('*')
    .single();

  if (farmErr || !updatedFarm) {
    throw new Error(farmErr?.message || 'ไม่สามารถบันทึกข้อมูลฟาร์มลง Supabase ได้');
  }

  const ops: Promise<void>[] = [];
  if (Array.isArray(payload.pens)) {
    ops.push(
      syncScopedTableRows('farm_pens', farmId, payload.pens, penToRow, 'farm_id,id')
    );
  }
  if (Array.isArray(payload.sheepList)) {
    ops.push(syncScopedTableRows('sheep', farmId, payload.sheepList, sheepToRow, 'id'));
  }
  if (Array.isArray(payload.ingredients)) {
    ops.push(
      syncScopedTableRows(
        'feed_ingredients',
        farmId,
        payload.ingredients,
        ingredientToRow,
        'farm_id,id'
      )
    );
  }
  if (Array.isArray(payload.rations)) {
    ops.push(
      syncScopedTableRows('formulated_rations', farmId, payload.rations, rationToRow, 'farm_id,id')
    );
  }
  if (Array.isArray(payload.logs)) {
    ops.push(syncScopedTableRows('farm_logs', farmId, payload.logs, logToRow, 'id'));
  }
  if (Array.isArray(payload.matches)) {
    ops.push(
      syncScopedTableRows('onlysheeps_matches', farmId, payload.matches, matchToRow, 'farm_id,id')
    );
  }

  await Promise.all(ops);

  const profile = mapFarmRowToProfile(updatedFarm as DbFarmRow);
  const pens = payload.pens && payload.sheepList
    ? computeLivePens(payload.pens, payload.sheepList)
    : payload.pens || [];

  return { ok: true, profile, pens };
}

// ============================================================================
// AUTHENTICATION VIA PGCRYPTO RPC
// ============================================================================

export async function sbLoginFarmAccount(
  username: string,
  password: string
): Promise<{ token: string; profile: FarmProfile; workspace: FarmWorkspaceData }> {
  await ensureSupabaseSeeded();
  const supabase = requireClient();

  const { data, error } = await supabase.rpc('verify_farm_login', {
    p_username: username.trim(),
    p_password: password,
  });

  if (error || !data) {
    throw new Error(error?.message || 'ชื่อบัญชีฟาร์มหรือรหัสผ่านไม่ถูกต้อง');
  }

  const farmRow = data as DbFarmRow;
  const workspace = await sbFetchFarmWorkspace(farmRow.id);
  return {
    token: makeSupabaseSessionToken(farmRow.id),
    profile: workspace.profile,
    workspace,
  };
}

export async function sbRegisterFarmAccount(payload: {
  username: string;
  password: string;
  farmName: string;
  ownerName: string;
  location: string;
  contact: string;
  breedFocus: string;
}): Promise<{ token: string; profile: FarmProfile; workspace: FarmWorkspaceData }> {
  await ensureSupabaseSeeded();
  const supabase = requireClient();

  const cleanUsername = payload.username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '');
  const farmId = `farm-${cleanUsername}-${Date.now()}`;

  const { data, error } = await supabase.rpc('register_farm_account', {
    p_farm_id: farmId,
    p_username: cleanUsername,
    p_password: payload.password,
    p_farm_name: payload.farmName.trim(),
    p_owner_name: payload.ownerName.trim() || 'เจ้าของฟาร์ม',
    p_location: payload.location.trim() || 'ประเทศไทย',
    p_contact: payload.contact.trim() || 'ติดต่อผ่านระบบ Ovispro',
    p_breed_focus: payload.breedFocus.trim() || 'Merino · Hampshire · Dorset',
  });

  if (error || !data) {
    throw new Error(error?.message || 'สมัครเปิดฟาร์มไม่สำเร็จ');
  }

  const defaultPens = DEFAULT_PENS_TEMPLATE.map(p => ({ ...p, sheepCount: 0 }));
  const defaultIngredients = DEFAULT_INGREDIENTS_TEMPLATE.map(i => ({ ...i }));
  const defaultRations = DEFAULT_RATIONS_TEMPLATE.map(r => ({ ...r }));

  await Promise.all([
    supabase
      .from('farm_pens')
      .upsert(defaultPens.map(p => penToRow(farmId, p)), { onConflict: 'farm_id,id' }),
    supabase
      .from('feed_ingredients')
      .upsert(defaultIngredients.map(i => ingredientToRow(farmId, i)), {
        onConflict: 'farm_id,id',
      }),
    supabase
      .from('formulated_rations')
      .upsert(defaultRations.map(r => rationToRow(farmId, r)), { onConflict: 'farm_id,id' }),
  ]);

  const workspace = await sbFetchFarmWorkspace(farmId);
  return {
    token: makeSupabaseSessionToken(farmId),
    profile: workspace.profile,
    workspace,
  };
}

export async function sbResetFarmData(farmId: string): Promise<FarmWorkspaceData> {
  const seedMatch = SEED_FARMS.find(s => s.profile.farmId === farmId);
  const nextPens = seedMatch
    ? seedMatch.pens.map(p => ({ ...p }))
    : DEFAULT_PENS_TEMPLATE.map(p => ({ ...p, sheepCount: 0 }));
  const nextSheep = seedMatch ? seedMatch.sheepList.map(s => ({ ...s })) : [];
  const nextIngredients = seedMatch
    ? seedMatch.ingredients.map(i => ({ ...i }))
    : DEFAULT_INGREDIENTS_TEMPLATE.map(i => ({ ...i }));
  const nextRations = seedMatch
    ? seedMatch.rations.map(r => ({ ...r }))
    : DEFAULT_RATIONS_TEMPLATE.map(r => ({ ...r }));
  const nextLogs = seedMatch ? seedMatch.logs.map(l => ({ ...l })) : [];

  await sbSaveFarmWorkspace(farmId, {
    pens: nextPens,
    sheepList: nextSheep,
    ingredients: nextIngredients,
    rations: nextRations,
    logs: nextLogs,
  });

  return sbFetchFarmWorkspace(farmId);
}

// ============================================================================
// ONLYSHEEPS PUBLIC FEED
// ============================================================================

export async function sbFetchOnlysheepsFeed(): Promise<OnlysheepsListing[]> {
  await ensureSupabaseSeeded();
  const supabase = requireClient();

  const { data, error } = await supabase
    .from('onlysheeps_listings')
    .select('payload')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return (data || []).map(row => row.payload as OnlysheepsListing);
}

export async function sbPublishToOnlysheeps(
  farmId: string,
  listingPayload: Partial<Sheep> & { name: string }
): Promise<OnlysheepsListing> {
  const supabase = requireClient();
  const { data: farmData, error: farmErr } = await supabase
    .from('farms')
    .select('*')
    .eq('id', farmId)
    .single();
  if (farmErr || !farmData) {
    throw new Error('กรุณาเข้าสู่ระบบฟาร์มก่อนเผยแพร่บน Onlysheeps');
  }
  const profile = mapFarmRowToProfile(farmData as DbFarmRow);
  const breed = typeof listingPayload.breed === 'string' ? listingPayload.breed : 'เมอริโน (Merino)';
  const micronNum = Number(listingPayload.woolMicron) || 19.2;
  const nowDate = new Date().toISOString().split('T')[0];

  const newListing: OnlysheepsListing = {
    id: listingPayload.id || `sheep-os-${Date.now()}`,
    listingId: `os-${profile.farmId}-${Date.now()}`,
    ownerFarmId: profile.farmId,
    publishedAt: nowDate,
    earTag:
      (typeof listingPayload.earTag === 'string' && listingPayload.earTag.trim()) ||
      `OS-${Date.now().toString().slice(-3)}`,
    name: listingPayload.name.trim(),
    breed,
    bloodPercentage: listingPayload.bloodPercentage || `${breed} สายเลือดแท้คัดเกรด 100%`,
    gender: listingPayload.gender === 'female' ? 'female' : 'male',
    birthDate: listingPayload.birthDate || '2024-09-14',
    ageMonths: Number(listingPayload.ageMonths) || 24,
    weightKg: Number(listingPayload.weightKg) || 72,
    currentAdgGrams:
      Number(listingPayload.currentAdgGrams) || (listingPayload.gender === 'female' ? 190 : 230),
    stage: listingPayload.gender === 'female' ? 'wool_maintenance' : 'wool_ram',
    bcs: Number(listingPayload.bcs) || 3.5,
    penId: 'partner',
    pen: 'ฟาร์มสมาชิก Onlysheeps',
    healthStatus: 'healthy',
    photoUrl: listingPayload.photoUrl || getBreedPhoto(breed),
    vaccineName:
      listingPayload.vaccineName || 'วัคซีนป้องกันโรคปากและเท้าเปื่อย (FMD) + โรคแท้งติดต่อ',
    vaccineLastDate: listingPayload.vaccineLastDate || nowDate,
    dewormName: listingPayload.dewormName || 'Ivermectin (ไอเวอร์เมกติน 1%)',
    dewormLastDate: listingPayload.dewormLastDate || nowDate,
    woolGrade:
      listingPayload.woolGrade ||
      (micronNum <= 19 ? `ซูเปอร์ไฟน์ (${micronNum} µm)` : `ไฟน์-มีเดียม (${micronNum} µm)`),
    woolMicron: micronNum,
    woolStapleLengthCm: Number(listingPayload.woolStapleLengthCm) || 10.6,
    fleeceYieldKg: Number(listingPayload.fleeceYieldKg) || 6.2,
    lastShearingDate: listingPayload.lastShearingDate || '2026-03-15',
    woolColor: listingPayload.woolColor || 'ขาวนวลธรรมชาติ',
    crimpPerInch: Number(listingPayload.crimpPerInch) || 12,
    fleeceQualityRating: 5,
    isPartnerFarm: true,
    farmName: profile.farmName,
    farmLocation: profile.location,
    ownerContact:
      (typeof listingPayload.ownerContact === 'string' && listingPayload.ownerContact.trim()) ||
      profile.contact,
    lambingRatePct:
      (typeof listingPayload.lambingRatePct === 'string' && listingPayload.lambingRatePct.trim()) ||
      'ความสมบูรณ์พันธุ์สูง พร้อมผสม',
    breedingHighlight:
      (typeof listingPayload.breedingHighlight === 'string' &&
        listingPayload.breedingHighlight.trim()) ||
      'คัดเกรดพ่อแม่พันธุ์คุณภาพ ถ่ายทอดเส้นใยขนและโครงสร้างแข็งแรง',
    romanticBio:
      (typeof listingPayload.romanticBio === 'string' && listingPayload.romanticBio.trim()) ||
      `น้อง${listingPayload.name.trim()} จาก${profile.farmName} พร้อมส่งหัวใจสีชมพูและจุ้บหวานๆ ให้คู่แท้ทุกฟาร์ม 🐑😘💘`,
  };

  const { error } = await supabase.from('onlysheeps_listings').insert({
    listing_id: newListing.listingId,
    owner_farm_id: profile.farmId,
    sheep_id: newListing.id,
    published_at: newListing.publishedAt,
    payload: newListing,
  });

  if (error) {
    throw new Error(error.message);
  }
  return newListing;
}

export async function sbDeleteOnlysheepsListing(
  farmId: string,
  listingId: string
): Promise<void> {
  markSupabaseLocalWrite();
  const supabase = requireClient();
  const { error } = await supabase
    .from('onlysheeps_listings')
    .delete()
    .eq('listing_id', listingId)
    .eq('owner_farm_id', farmId);

  if (error) {
    throw new Error(error.message);
  }
}

// ============================================================================
// WEB FORM SUBMISSIONS
// ============================================================================

export async function sbFetchWebFormRecords(): Promise<{
  records: WebFormSubmission[];
  sheetSyncConfigured: boolean;
  apiKeyConfigured: boolean;
}> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('web_form_submissions')
    .select('*')
    .order('submitted_at', { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(error.message);
  }

  return {
    records: (data || []).map(r => mapWebFormRow(r as Record<string, unknown>)),
    sheetSyncConfigured: false,
    apiKeyConfigured: false,
  };
}

export async function sbSubmitWebFormRecord(payload: {
  farmName: string;
  recorderName: string;
  province: string;
  sheepEarTag?: string;
  sheepName: string;
  breed: string;
  gender: 'male' | 'female';
  ageMonths: number;
  weightKg: number;
  woolMicron: number;
  dailyFeedKg: number;
  notes?: string;
}): Promise<{
  record: WebFormSubmission;
  sheetSyncConfigured: boolean;
}> {
  markSupabaseLocalWrite();
  const supabase = requireClient();
  const id = `wf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const nowIso = new Date().toISOString();
  const earTag =
    payload.sheepEarTag && payload.sheepEarTag.trim()
      ? payload.sheepEarTag.trim().slice(0, 40)
      : `WF-${Date.now().toString().slice(-4)}`;

  const row = {
    id,
    submitted_at: nowIso,
    farm_name: payload.farmName.trim(),
    recorder_name: payload.recorderName.trim(),
    province: payload.province.trim(),
    sheep_ear_tag: earTag,
    sheep_name: payload.sheepName.trim(),
    breed: payload.breed.trim(),
    gender: payload.gender === 'male' ? 'male' : 'female',
    age_months: Number(Number(payload.ageMonths).toFixed(1)),
    weight_kg: Number(Number(payload.weightKg).toFixed(1)),
    wool_micron: Number(Number(payload.woolMicron).toFixed(1)),
    daily_feed_kg: Number(Number(payload.dailyFeedKg).toFixed(2)),
    notes: payload.notes?.trim() || null,
    synced_to_sheet: false,
  };

  const { data, error } = await supabase
    .from('web_form_submissions')
    .insert(row)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'ไม่สามารถบันทึกข้อมูลฟอร์มลง Supabase ได้');
  }

  return {
    record: mapWebFormRow(data as Record<string, unknown>),
    sheetSyncConfigured: false,
  };
}

// ============================================================================
// LIVE SHARE SNAPSHOTS
// ============================================================================

export async function sbCreateOrRefreshShareSnapshot(
  farmId: string | null,
  payload?: {
    sheepList?: Sheep[];
    ingredients?: FeedIngredient[];
    rations?: FormulatedRation[];
    logs?: FarmLog[];
  }
): Promise<{ shareId: string; updatedAt: string; report: LiveShareReport }> {
  const supabase = requireClient();
  const nowIso = new Date().toISOString();

  if (farmId) {
    if (payload) {
      await sbSaveFarmWorkspace(farmId, payload);
    }
    const workspace = await sbFetchFarmWorkspace(farmId);
    const shareId = `live-${farmId}`;
    const report: LiveShareReport = {
      shareId,
      scope: 'farm',
      updatedAt: nowIso,
      farmName: workspace.profile.farmName,
      ownerName: workspace.profile.ownerName,
      location: workspace.profile.location,
      totalSheep: workspace.sheepList.length,
      totalIngredients: workspace.ingredients.length,
      totalRations: workspace.rations.length,
      totalLogs: workspace.logs.length,
      pens: workspace.pens,
      rations: workspace.rations,
      ingredients: workspace.ingredients,
      recentLogs: workspace.logs.slice(0, 15),
    };

    await supabase.from('share_snapshots').upsert(
      {
        share_id: shareId,
        scope: 'farm',
        farm_id: farmId,
        report_payload: report,
        updated_at: nowIso,
      },
      { onConflict: 'share_id' }
    );

    return { shareId, updatedAt: nowIso, report };
  }

  const overview = await sbFetchPublicOverview();
  const shareId = 'live-public-hub';
  const report: LiveShareReport = {
    shareId,
    scope: 'hub',
    updatedAt: nowIso,
    farmName: 'Ovispro Multi-Farm Hub',
    ownerName: 'เครือข่ายฟาร์มแกะขนประเทศไทย',
    location: 'ประเทศไทย',
    totalSheep: overview.totalNetworkSheep,
    totalIngredients: 0,
    totalRations: 0,
    totalLogs: 0,
    pens: [],
    rations: [],
    ingredients: [],
    recentLogs: [],
    publicOverview: overview,
  };

  await supabase.from('share_snapshots').upsert(
    {
      share_id: shareId,
      scope: 'hub',
      farm_id: null,
      report_payload: report,
      updated_at: nowIso,
    },
    { onConflict: 'share_id' }
  );

  return { shareId, updatedAt: nowIso, report };
}

export async function sbFetchLiveShareReport(shareId: string): Promise<LiveShareReport> {
  const supabase = requireClient();

  if (shareId.startsWith('live-farm-')) {
    const farmId = shareId.slice('live-'.length);
    try {
      const workspace = await sbFetchFarmWorkspace(farmId);
      return {
        shareId,
        scope: 'farm',
        updatedAt: workspace.profile.updatedAt || new Date().toISOString(),
        farmName: workspace.profile.farmName,
        ownerName: workspace.profile.ownerName,
        location: workspace.profile.location,
        totalSheep: workspace.sheepList.length,
        totalIngredients: workspace.ingredients.length,
        totalRations: workspace.rations.length,
        totalLogs: workspace.logs.length,
        pens: workspace.pens,
        rations: workspace.rations,
        ingredients: workspace.ingredients,
        recentLogs: workspace.logs.slice(0, 15),
      };
    } catch {
      // fall through to snapshot table lookup
    }
  }

  if (shareId === 'live-public-hub') {
    const overview = await sbFetchPublicOverview();
    return {
      shareId,
      scope: 'hub',
      updatedAt: new Date().toISOString(),
      farmName: 'Ovispro Multi-Farm Hub',
      ownerName: 'เครือข่ายฟาร์มแกะขนประเทศไทย',
      location: 'ประเทศไทย',
      totalSheep: overview.totalNetworkSheep,
      totalIngredients: 0,
      totalRations: 0,
      totalLogs: 0,
      pens: [],
      rations: [],
      ingredients: [],
      recentLogs: [],
      publicOverview: overview,
    };
  }

  const { data, error } = await supabase
    .from('share_snapshots')
    .select('report_payload')
    .eq('share_id', shareId)
    .single();

  if (error || !data) {
    throw new Error('ไม่พบลิงก์รายงานที่แชร์นี้');
  }
  return data.report_payload as LiveShareReport;
}

// ============================================================================
// OWNER MASTER AGGREGATION
// ============================================================================

export async function sbFetchOwnerMasterSheet(ownerEmail: string): Promise<OwnerMasterSheetData> {
  await ensureSupabaseSeeded();
  const supabase = requireClient();

  const [farmsRes, sheepRes, ingRes, rationsRes, logsRes, listingsRes, formsRes] =
    await Promise.all([
      supabase.from('farms').select('*').order('created_at', { ascending: true }),
      supabase.from('sheep').select('*'),
      supabase.from('feed_ingredients').select('*'),
      supabase.from('formulated_rations').select('*'),
      supabase.from('farm_logs').select('*').order('date', { ascending: false }),
      supabase.from('onlysheeps_listings').select('payload'),
      supabase
        .from('web_form_submissions')
        .select('*')
        .order('submitted_at', { ascending: false }),
    ]);

  const farmRows = (farmsRes.data || []) as DbFarmRow[];
  const sheepByFarm = new Map<string, Sheep[]>();
  const ingByFarm = new Map<string, FeedIngredient[]>();
  const rationsByFarm = new Map<string, FormulatedRation[]>();
  const logsByFarm = new Map<string, FarmLog[]>();

  for (const row of sheepRes.data || []) {
    const fId = String((row as { farm_id: string }).farm_id);
    const list = sheepByFarm.get(fId) || [];
    list.push(mapSheepRow(row as Record<string, unknown>));
    sheepByFarm.set(fId, list);
  }
  for (const row of ingRes.data || []) {
    const fId = String((row as { farm_id: string }).farm_id);
    const list = ingByFarm.get(fId) || [];
    list.push(mapIngredientRow(row as Record<string, unknown>));
    ingByFarm.set(fId, list);
  }
  for (const row of rationsRes.data || []) {
    const fId = String((row as { farm_id: string }).farm_id);
    const list = rationsByFarm.get(fId) || [];
    list.push(mapRationRow(row as Record<string, unknown>));
    rationsByFarm.set(fId, list);
  }
  for (const row of logsRes.data || []) {
    const fId = String((row as { farm_id: string }).farm_id);
    const list = logsByFarm.get(fId) || [];
    list.push(mapLogRow(row as Record<string, unknown>));
    logsByFarm.set(fId, list);
  }

  const farms = farmRows.map(row => ({
    profile: mapFarmRowToProfile(row),
    sheepList: sheepByFarm.get(row.id) || [],
    ingredients: ingByFarm.get(row.id) || [],
    rations: rationsByFarm.get(row.id) || [],
    logs: logsByFarm.get(row.id) || [],
  }));

  const onlysheepsListings = (listingsRes.data || []).map(
    r => (r as { payload: OnlysheepsListing }).payload
  );
  const webFormRecords = (formsRes.data || []).map(r =>
    mapWebFormRow(r as Record<string, unknown>)
  );

  const tabs = buildOwnerMasterSheetTabs(farms, onlysheepsListings, webFormRecords);

  return {
    ownerEmail,
    generatedAt: new Date().toISOString(),
    ownerSheetConfig: {},
    summary: {
      totalFarms: farms.length,
      totalSheep: farms.reduce((s, f) => s + f.sheepList.length, 0),
      totalIngredients: farms.reduce((s, f) => s + f.ingredients.length, 0),
      totalRations: farms.reduce((s, f) => s + f.rations.length, 0),
      totalLogs: farms.reduce((s, f) => s + f.logs.length, 0),
      totalOnlysheeps: onlysheepsListings.length,
    },
    tabs,
  };
}
