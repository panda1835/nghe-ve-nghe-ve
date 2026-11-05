import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startPinch, movePinch, MIN_MAP_ZOOM, MAX_MAP_ZOOM } from '../app/lib/map-gestures.ts';

const origin = [360, 400];
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
const midpoint = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
function worldAt(point, view) { return point.map((p, i) => (p - origin[i] - view.pan[i]) / view.zoom); }

test('moving two fingers together pans without zooming', () => {
  const start = startPinch([100, 200], [200, 200], { zoom: 1, pan: [0, 0] });
  assert.deepEqual(movePinch(start, [130, 180], [230, 180]), { zoom: 1, pan: [30, -20] });
});
test('pinch zoom keeps the map point beneath the finger midpoint fixed', () => {
  const view = { zoom: 1, pan: [0, 0] };
  const a = [200, 300], b = [300, 300], nextA = [150, 300], nextB = [350, 300];
  const next = movePinch(startPinch(a, b, view), nextA, nextB);
  assert.equal(next.zoom, 2);
  worldAt(midpoint(a, b), view).forEach((value, i) => near(value, worldAt(midpoint(nextA, nextB), next)[i]));
});
test('zoom and pan combine correctly from an already transformed view', () => {
  const view = { zoom: 1.5, pan: [80, -35] };
  const a = [90, 240], b = [190, 240], nextA = [70, 280], nextB = [270, 280];
  const next = movePinch(startPinch(a, b, view), nextA, nextB);
  assert.equal(next.zoom, 3);
  worldAt(midpoint(a, b), view).forEach((value, i) => near(value, worldAt(midpoint(nextA, nextB), next)[i]));
});
test('maximum zoom is clamped without losing the midpoint anchor', () => {
  const view = { zoom: 3, pan: [40, 15] };
  const a = [100, 200], b = [200, 200], nextA = [0, 230], nextB = [400, 230];
  const next = movePinch(startPinch(a, b, view), nextA, nextB);
  assert.equal(next.zoom, MAX_MAP_ZOOM);
  worldAt(midpoint(a, b), view).forEach((value, i) => near(value, worldAt(midpoint(nextA, nextB), next)[i]));
});
test('minimum zoom is clamped and coincident pointers produce finite values', () => {
  const next = movePinch(startPinch([100, 100], [200, 100], { zoom: 1, pan: [0, 0] }), [150, 100], [150, 100]);
  assert.equal(next.zoom, MIN_MAP_ZOOM);
  assert.ok(next.pan.every(Number.isFinite));
  assert.ok(movePinch(startPinch([10, 10], [10, 10], { zoom: 1, pan: [0, 0] }), [10, 10], [10, 10]).pan.every(Number.isFinite));
});
test('rebasing after a finger changes does not jump the view', () => {
  const view = { zoom: 2.25, pan: [-82, 37] };
  const a = [180, 200], b = [330, 450];
  const next = movePinch(startPinch(a, b, view), a, b);
  near(next.zoom, view.zoom); next.pan.forEach((p, i) => near(p, view.pan[i]));
});
test('a gesture snapshots its starting view instead of mutating it', () => {
  const view = { zoom: 1, pan: [5, 10] };
  const gesture = startPinch([10, 20], [40, 20], view);
  view.pan[0] = 900;
  assert.deepEqual(gesture.view.pan, [5, 10]);
});
