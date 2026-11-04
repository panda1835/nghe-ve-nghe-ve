/** Region partitioning is independent of province names and existing dialect labels. */
export type Point = [number, number];
export type DrawnLine = { id: string; points: Point[] };
export type StudyProvince = { id: number; name: string; path: string; center: Point };
export const MAP_WIDTH = 810;
export const MAP_HEIGHT = 800;
export const REGION_COLORS = ["#b8cfa0", "#e5ad93", "#a8c9da", "#d0b5d9", "#e7d18b", "#91c9bb", "#dca9bc", "#bbc0e2", "#c8cc8a", "#e4b985", "#9db9a5", "#c7b1a0"];
function regionColor(id: number) {
  if (id < REGION_COLORS.length) return REGION_COLORS[id];
  // Extend the palette without repeating colors when many regions are drawn.
  const hue = ((id - REGION_COLORS.length) * 137.508 + 18) % 360;
  const saturation = .43, lightness = .67;
  const a = saturation * Math.min(lightness, 1 - lightness);
  const channel = (n: number) => {
    const k = (n + hue / 30) % 12;
    return Math.round(255 * (lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}
const STEP = 2;
const W = MAP_WIDTH / STEP;
const H = MAP_HEIGHT / STEP;
export type Region = { id: number; color: string; provinceIds: number[] };
export type Partition = { regions: Region[]; assignments: Record<number, number>; image: string; lineEffects: number[] };

/** Label a four-connected binary raster. Exported for topology regression tests. */
export function components(mask: Uint8Array, width: number, height: number) {
  const labels = new Int32Array(mask.length).fill(-1);
  const sizes: number[] = [];
  const queue = new Int32Array(mask.length);
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || labels[start] !== -1) continue;
    const id = sizes.length;
    let head = 0, tail = 1;
    queue[0] = start; labels[start] = id;
    while (head < tail) {
      const p = queue[head++], x = p % width;
      const adjacent = [x > 0 ? p - 1 : -1, x + 1 < width ? p + 1 : -1, p >= width ? p - width : -1, p + width < width * height ? p + width : -1];
      for (const n of adjacent) if (n >= 0 && mask[n] && labels[n] === -1) { labels[n] = id; queue[tail++] = n; }
    }
    sizes.push(tail);
  }
  return { labels, sizes };
}

export function linePath(points: Point[]) {
  return points.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");
}

export function buildPartition(provinces: StudyProvince[], lines: DrawnLine[], keepWhole: boolean, boundaryPaths: string[] = []): Partition {
  const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");
  ctx.scale(1 / STEP, 1 / STEP);
  for (const p of provinces) { ctx.fillStyle = "#ffffff"; ctx.fill(new Path2D(p.path)); }
  const landPixels = ctx.getImageData(0, 0, W, H).data;
  const land = Uint8Array.from({ length: W * H }, (_, i) => landPixels[i * 4 + 3] > 100 ? 1 : 0);
  // Close single-pixel geometry gaps before finding the connected mainland.
  const connectedLand = land.slice();
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    if (!land[i] && ((land[i - 1] && land[i + 1]) || (land[i - W] && land[i + W]))) connectedLand[i] = 1;
  }
  const initial = components(connectedLand, W, H);
  const mainlandId = initial.sizes.indexOf(Math.max(...initial.sizes));
  const mainland = Uint8Array.from(initial.labels, label => label === mainlandId ? 1 : 0);
  ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
  ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3; ctx.lineJoin = "round"; ctx.lineCap = "round";
  const cut = mainland.slice();
  // Administrative-border selections also act as barriers so a freehand line
  // may join a selected border and together complete a cross-mainland cut.
  for (const path of boundaryPaths) ctx.stroke(new Path2D(path));
  if (boundaryPaths.length) {
    const barriers = ctx.getImageData(0, 0, W, H).data;
    for (let i = 0; i < cut.length; i++) if (barriers[i * 4 + 3] > 30) cut[i] = 0;
  }
  let partition = components(cut, W, H);
  const lineEffects: number[] = [];
  for (const line of lines) {
    ctx.stroke(new Path2D(linePath(line.points)));
    const barrier = ctx.getImageData(0, 0, W, H).data;
    for (let i = 0; i < cut.length; i++) if (barrier[i * 4 + 3] > 30) cut[i] = 0;
    const next = components(cut, W, H);
    lineEffects.push(next.sizes.filter(s => s >= 12).length - partition.sizes.filter(s => s >= 12).length);
    partition = next;
  }
  // Ignore tiny raster slivers; order regions north-to-south, then west-to-east.
  const significant = new Set(partition.sizes.map((size, i) => size >= 12 ? i : -1).filter(i => i >= 0));
  const order: number[] = [];
  for (const id of partition.labels) if (significant.has(id) && !order.includes(id)) order.push(id);
  if (!order.length) order.push(mainlandId);
  const normalized = new Int32Array(cut.length).fill(-1);
  const queue = new Int32Array(cut.length); let head = 0, tail = 0;
  for (let i = 0; i < normalized.length; i++) {
    const id = order.indexOf(partition.labels[i]);
    if (id >= 0) { normalized[i] = id; queue[tail++] = i; }
  }
  // Nearest-mainland propagation assigns offshore islands and boundary pixels
  // to the same spatial region, rather than counting each island as a dialect.
  while (head < tail) {
    const p = queue[head++], x = p % W;
    for (const n of [x > 0 ? p - 1 : -1, x + 1 < W ? p + 1 : -1, p >= W ? p - W : -1, p + W < normalized.length ? p + W : -1]) {
      if (n >= 0 && normalized[n] === -1) { normalized[n] = normalized[p]; queue[tail++] = n; }
    }
  }
  const assignments: Record<number, number> = {};
  const regions = order.map((_, id) => ({ id, color: regionColor(id), provinceIds: [] as number[] }));
  for (const p of provinces) {
    const x = Math.max(0, Math.min(W - 1, Math.round(p.center[0] / STEP)));
    const y = Math.max(0, Math.min(H - 1, Math.round(p.center[1] / STEP)));
    const id = Math.max(0, normalized[y * W + x]);
    assignments[p.id] = id; regions[id].provinceIds.push(p.id);
  }
  // For whole-province mode, empty geographic slivers do not count as regions.
  if (keepWhole) {
    const used = regions.filter(r => r.provinceIds.length);
    for (const p of provinces) assignments[p.id] = used.findIndex(r => r.id === assignments[p.id]);
    return { regions: used.map((r, id) => ({ ...r, id, color: regionColor(id) })), assignments, image: "", lineEffects };
  }
  const pixels = ctx.createImageData(W, H);
  const colors = regions.map(r => [1, 3, 5].map(offset => parseInt(r.color.slice(offset, offset + 2), 16)));
  for (let i = 0; i < land.length; i++) if (land[i]) {
    const color = colors[Math.max(0, normalized[i])] || colors[0];
    pixels.data.set([...color, 255], i * 4);
  }
  ctx.putImageData(pixels, 0, 0);
  return { regions, assignments, image: canvas.toDataURL(), lineEffects };
}

export type StudyBorder = { id: string; a: number; b: number; path: string };

/** Combine freehand center assignments with cuts in the province adjacency graph.
 * A selected border blocks an adjacency; regions split only when all remaining
 * routes between the groups are cut. Existing drawn divisions stay respected.
 */
export function groupProvinces(provinces: StudyProvince[], borders: StudyBorder[], assignments: Record<number, number>, selectedBorders: string[]): Pick<Partition, "regions" | "assignments"> {
  const excluded = new Set(selectedBorders);
  const parent = new Map(provinces.map(p => [p.id, p.id]));
  function root(id: number): number { const p = parent.get(id)!; if (p !== id) parent.set(id, root(p)); return parent.get(id)!; }
  for (const border of borders) {
    if (!excluded.has(border.id) && assignments[border.a] === assignments[border.b] && parent.has(border.a) && parent.has(border.b)) parent.set(root(border.a), root(border.b));
  }
  const groups = new Map<number, number[]>();
  for (const p of provinces) { const id = root(p.id); groups.set(id, [...(groups.get(id) || []), p.id]); }
  const ordered = [...groups.values()].sort((a, b) => {
    const center = (ids: number[]) => provinces.filter(p => ids.includes(p.id)).reduce((min, p) => Math.min(min, p.center[1]), Infinity);
    return center(a) - center(b) || Math.min(...a) - Math.min(...b);
  });
  const result: Record<number, number> = {};
  const regions = ordered.map((provinceIds, id) => { for (const provinceId of provinceIds) result[provinceId] = id; return { id, color: regionColor(id), provinceIds }; });
  return { regions, assignments: result };
}
