import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mergeOnlysheepsListingCreated,
  mergeOnlysheepsListingDeleted,
  shouldApplyRevision,
  shouldNotifyForEvent,
} from './realtime.ts';
import type { OnlysheepsListing } from '../types/sheep.ts';

function makeListing(id: string, name: string, farmId = 'farm-a'): OnlysheepsListing {
  return {
    id: `sheep-${id}`,
    listingId: id,
    ownerFarmId: farmId,
    publishedAt: '2026-11-18',
    earTag: `OS-${id}`,
    name,
    breed: 'เมอริโน (Merino)',
    gender: 'male',
    birthDate: '2024-01-01',
    ageMonths: 24,
    weightKg: 70,
    currentAdgGrams: 220,
    stage: 'wool_ram',
    bcs: 3.5,
    penId: 'partner',
    pen: 'ฟาร์มสมาชิก Onlysheeps',
    healthStatus: 'healthy',
    farmName: 'ฟาร์มทดสอบ',
  };
}

test('mergeOnlysheepsListingCreated is idempotent against duplicate broadcasts or reconnect races', () => {
  const existing = [makeListing('os-1', 'สายฟ้า'), makeListing('os-2', 'พายุ')];
  const incoming = makeListing('os-3', 'ขุนศึก');

  const once = mergeOnlysheepsListingCreated(existing, incoming);
  assert.equal(once.length, 3);
  assert.equal(once[0].listingId, 'os-3');

  // Re-applying the exact same create event must not duplicate the listing
  const twice = mergeOnlysheepsListingCreated(once, incoming);
  assert.equal(twice.length, 3);
  assert.deepEqual(
    twice.map(l => l.listingId),
    ['os-3', 'os-1', 'os-2']
  );

  // Updating an existing listing replaces in place without growing array
  const updatedIncoming = makeListing('os-1', 'สายฟ้า อัปเดต');
  const afterUpdate = mergeOnlysheepsListingCreated(twice, updatedIncoming);
  assert.equal(afterUpdate.length, 3);
  assert.equal(afterUpdate.find(l => l.listingId === 'os-1')?.name, 'สายฟ้า อัปเดต');
});

test('mergeOnlysheepsListingDeleted safely removes item and no-ops when already absent', () => {
  const list = [makeListing('os-1', 'สายฟ้า'), makeListing('os-2', 'พายุ')];
  const removed = mergeOnlysheepsListingDeleted(list, 'os-1');
  assert.equal(removed.length, 1);
  assert.equal(removed[0].listingId, 'os-2');

  // Removing already-deleted item returns same array reference (idempotent no-op)
  const removedAgain = mergeOnlysheepsListingDeleted(removed, 'os-1');
  assert.equal(removedAgain, removed);
});

test('shouldApplyRevision enforces strictly monotonic revision ordering', () => {
  assert.equal(shouldApplyRevision(0, 1), true);
  assert.equal(shouldApplyRevision(5, 6), true);
  assert.equal(shouldApplyRevision(6, 6), false);
  assert.equal(shouldApplyRevision(6, 4), false);
});

test('shouldNotifyForEvent suppresses toasts for events originating from the current tab', () => {
  assert.equal(shouldNotifyForEvent('tab-abc', 'tab-abc'), false);
  assert.equal(shouldNotifyForEvent('tab-xyz', 'tab-abc'), true);
  assert.equal(shouldNotifyForEvent(undefined, 'tab-abc'), true);
});
