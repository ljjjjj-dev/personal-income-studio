import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeedData, DEFAULT_CATEGORIES } from '../public/app/seed.js';
import { computeAnalytics } from '../public/app/analytics.js';
import { migrateStore } from '../public/app/io.js';

test('createSeedData returns valid v6 demo dataset', () => {
  const seed = createSeedData();
  assert.equal(seed.version, 6);
  assert.equal(seed.categories.length, DEFAULT_CATEGORIES.length);
  assert.ok(seed.records.length >= 73);

  const hist = seed.records.find((r) => r.isHistorical);
  assert.ok(hist, 'should include one historical baseline record');
});

test('computeAnalytics maintains exact cash + fund == total and same-period diff consistency', () => {
  const seed = createSeedData();
  const a = computeAnalytics(seed);

  assert.equal(a.recordedMonths.length, 22);
  assert.equal(
    Number((a.cumulativeCash + a.cumulativeFund).toFixed(2)),
    a.cumulativeTotal,
    'cash + fund must equal cumulative total'
  );

  if (a.samePeriodComparison) {
    const sumItemDiffs = Number(
      a.samePeriodComparison.itemDiffs.reduce((s, d) => s + d.diff, 0).toFixed(2)
    );
    assert.equal(
      sumItemDiffs,
      a.samePeriodComparison.diff,
      'sum of per-category same-period diffs must match overall diff'
    );
  }
});

test('migrateStore upgrades older versions to v6 and refreshes built-in colors', () => {
  const legacy = {
    version: 3,
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c, color: '#000000' })),
    records: [],
  };
  const { data, migrated } = migrateStore(legacy);
  assert.equal(migrated, true);
  assert.equal(data.version, 6);
  assert.equal(data.categories[0].color, DEFAULT_CATEGORIES[0].color);
});
