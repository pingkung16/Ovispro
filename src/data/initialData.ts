/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FeedIngredient, FormulatedRation, FarmLog, Sheep, Pen } from '../types/sheep';
import {
  DEFAULT_PENS_TEMPLATE,
  DEFAULT_INGREDIENTS_TEMPLATE,
  DEFAULT_RATIONS_TEMPLATE,
  SEED_FARMS,
} from './multiFarmSeed';

export const INITIAL_PENS: Pen[] = DEFAULT_PENS_TEMPLATE.map(p => ({ ...p }));
export const INITIAL_INGREDIENTS: FeedIngredient[] = DEFAULT_INGREDIENTS_TEMPLATE.map(i => ({ ...i }));
export const INITIAL_RATIONS: FormulatedRation[] = DEFAULT_RATIONS_TEMPLATE.map(r => ({ ...r }));
export const INITIAL_SHEEP: Sheep[] = SEED_FARMS[0].sheepList;
export const INITIAL_LOGS: FarmLog[] = SEED_FARMS[0].logs;
