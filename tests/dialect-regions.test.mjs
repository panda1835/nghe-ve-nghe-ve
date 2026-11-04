import { test } from 'node:test';
import assert from 'node:assert/strict';
import { components, linePath, groupProvinces } from '../app/lib/dialect-regions.ts';

function mask(rows) {
  return { pixels: Uint8Array.from(rows.join(''), value => value === '#' ? 1 : 0), width: rows[0].length, height: rows.length };
}
function count(rows) {
  const { pixels, width, height } = mask(rows);
  return components(pixels, width, height).sizes.length;
}

test('five complete boundaries produce six regions', () => {
  const rows = Array.from({ length: 17 }, (_, y) => [2, 5, 8, 11, 14].includes(y) ? '.........' : '#########');
  assert.equal(count(rows), 6);
});
test('a line ending inside the land does not create another region', () => {
  assert.equal(count(['#######', '...####', '#######']), 1);
});
test('crossing boundaries produce four regions', () => {
  assert.equal(count(['###.###', '###.###', '.......', '###.###', '###.###']), 4);
});
test('a closed loop creates an enclosed region', () => {
  assert.equal(count(['#######', '#.....#', '#.###.#', '#.###.#', '#.....#', '#######']), 2);
});
test('adjacent rows never connect by wrapping the edge of the raster', () => {
  assert.equal(count(['..#', '#..']), 2);
});
test('diagonally touching regions remain distinct', () => {
  assert.equal(count(['#.', '.#']), 2);
});
test('clearing boundaries restores one region', () => {
  assert.equal(count(['#####', '#####', '#####']), 1);
});
test('line coordinates retain sub-pixel precision in SVG exports', () => {
  assert.equal(linePath([[2.25, 4], [10, 20.12]]), 'M2.3,4.0L10.0,20.1');
});

const provinces = [1, 2, 3].map(id => ({ id, name: String(id), path: '', center: [id, id] }));
const triangle = [{ id: '1-2', a: 1, b: 2, path: '' }, { id: '2-3', a: 2, b: 3, path: '' }, { id: '1-3', a: 1, b: 3, path: '' }];
const together = { 1: 0, 2: 0, 3: 0 };
test('one selected province boundary preserves alternative connections', () => {
  assert.equal(groupProvinces(provinces, triangle, together, ['1-2']).regions.length, 1);
});
test('selecting every boundary around a province separates it', () => {
  const result = groupProvinces(provinces, triangle, together, ['1-2', '1-3']);
  assert.equal(result.regions.length, 2);
  assert.notEqual(result.assignments[1], result.assignments[2]);
  assert.equal(result.assignments[2], result.assignments[3]);
});
test('province selections and freehand assignments combine', () => {
  const result = groupProvinces(provinces, triangle, { 1: 0, 2: 1, 3: 1 }, ['2-3']);
  assert.equal(result.regions.length, 3);
});
test('clearing selected province boundaries rejoins the regions', () => {
  assert.equal(groupProvinces(provinces, triangle, together, []).regions.length, 1);
});
test('the actual Vietnam adjacency graph starts as one region and can isolate any province', async () => {
  const { readFile } = await import('node:fs/promises');
  const atlas = JSON.parse(await readFile(new URL('../public/data/vietnam.json', import.meta.url), 'utf8'));
  const assignments = Object.fromEntries(atlas.provinces.map(p => [p.id, 0]));
  assert.equal(groupProvinces(atlas.provinces, atlas.borders, assignments, []).regions.length, 1);
  for (const p of atlas.provinces) {
    const selected = atlas.borders.filter(b => b.a === p.id || b.b === p.id).map(b => b.id);
    const result = groupProvinces(atlas.provinces, atlas.borders, assignments, selected);
    assert.deepEqual(result.regions.find(r => r.provinceIds.includes(p.id)).provinceIds, [p.id]);
    assert.equal(result.regions.flatMap(r => r.provinceIds).length, 34);
  }
  assert.equal(groupProvinces(atlas.provinces, atlas.borders, assignments, atlas.borders.map(b => b.id)).regions.length, 34);
});

test('archipelago markers use named source coordinates and fit the map', async () => {
  const { ARCHIPELAGOS } = await import('../app/lib/archipelagos.ts');
  assert.equal(ARCHIPELAGOS.flatMap(a => a.islands).length, 8);
  for (const a of ARCHIPELAGOS) {
    assert.match(a.source, /^https:\/\//);
    for (const island of a.islands) {
      assert.ok(island.name && island.latitude && island.longitude);
      assert.ok(island.point[0] > 560 && island.point[0] < 810);
      assert.ok(island.point[1] > 300 && island.point[1] < 800);
    }
  }
  assert.deepEqual(ARCHIPELAGOS[0].islands.find(i => i.name === 'Đảo Phú Lâm').point, [616, 354]);
  assert.deepEqual(ARCHIPELAGOS[1].islands.find(i => i.name === 'Đảo Song Tử Tây').point, [708, 614]);
});
