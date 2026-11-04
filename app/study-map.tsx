"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { buildPartition, groupProvinces, linePath, MAP_HEIGHT, MAP_WIDTH, type DrawnLine, type Partition, type Point, type StudyProvince, type StudyBorder } from "./lib/dialect-regions";

import { ARCHIPELAGOS } from "./lib/archipelagos";

const pixel = "font-[family-name:var(--font-pixel)]";
const control = "inline-flex items-center justify-center gap-2 cursor-pointer border-2 border-[#52664b] bg-[#faf9f0] px-3 py-2 text-xs hover:bg-[#e2e8d5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a44d37] disabled:cursor-default disabled:opacity-40";
const DRAFT_KEY = "viet-atlas-dialect-study-v1";
type BoundaryInput = { lines: DrawnLine[]; borderIds: string[] };
type Response = BoundaryInput & { participant: string };
const initial: Response = { participant: "", lines: [], borderIds: [] };

function ToolbarIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    draw: "m4 16 12-12 4 4-12 12H4v-4Zm10-10 4 4M4 20h7",
    borders: "M3 3h18v18H3ZM3 10h7V3m0 7v5h11M10 15H7v6m8-6v6",
    pan: "M8 12V5a2 2 0 0 1 4 0v7-9a2 2 0 0 1 4 0v9-5a2 2 0 0 1 4 0v9l-4 5H9l-6-8a2 2 0 0 1 3-2l2 2",
    undo: "M9 4 3 10l6 6M3 10h11a6 6 0 0 1 0 12",
    redo: "m15 4 6 6-6 6m6-6H10a6 6 0 0 0 0 12",
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="miter" strokeLinecap="square"><path d={paths[name]} /></svg>;
}

function saveFile(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function StudyMap({ provinces, borders }: { provinces: StudyProvince[]; borders: StudyBorder[] }) {
  const [response, setResponse] = useState<Response>(initial);
  const [history, setHistory] = useState<BoundaryInput[]>([]);
  const [future, setFuture] = useState<BoundaryInput[]>([]);
  const [draft, setDraft] = useState<Point[]>([]);
  const [tool, setTool] = useState<"draw" | "borders" | "pan">("draw");
  const [labels, setLabels] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>([0, 0]);
  const [partition, setPartition] = useState<Partition | null>(null);
  const [status, setStatus] = useState("");
  const [ready, setReady] = useState(false);
  const svg = useRef<SVGSVGElement>(null);
  const group = useRef<SVGGElement>(null);
  const pointer = useRef<{ id: number; point: Point; pan: Point; mode: "draw" | "pan"; points: Point[] } | null>(null);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (typeof saved.participant === "string" && Array.isArray(saved.lines) && saved.lines.every((l: DrawnLine) => typeof l.id === "string" && Array.isArray(l.points) && l.points.length >= 2 && l.points.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite)))) setResponse({ participant: saved.participant, lines: saved.lines, borderIds: Array.isArray(saved.borderIds) ? saved.borderIds.filter((id: unknown) => typeof id === "string" && borders.some(b => b.id === id)) : [] });
      }
    } catch { setStorageError(true); }
    setReady(true);
  }, [borders]);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(response)); } catch { setStorageError(true); }
  }, [ready, response]);
  useEffect(() => {
    try { const drawn = buildPartition(provinces, response.lines, true, borders.filter(b => response.borderIds.includes(b.id)).map(b => b.path)); setPartition({ ...drawn, ...groupProvinces(provinces, borders, drawn.assignments, response.borderIds) }); }
    catch { setStatus("Chưa tô màu được các vùng. Bạn vẫn có thể vẽ và tải bản vẽ xuống."); }
  }, [provinces, borders, response.lines, response.borderIds]);

  function updateInput(input: BoundaryInput) {
    setHistory(h => [...h, { lines: response.lines, borderIds: response.borderIds }]); setFuture([]);
    setResponse(r => ({ ...r, ...input })); setStatus("");
  }
  function updateLines(lines: DrawnLine[]) { updateInput({ lines, borderIds: response.borderIds }); }
  function toggleBorder(id: string) {
    updateInput({ lines: response.lines, borderIds: response.borderIds.includes(id) ? response.borderIds.filter(value => value !== id) : [...response.borderIds, id] });
  }
  function finishLine(points = draft) {
    if (points.length < 2 || points.reduce((length, p, i) => i ? length + Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]) : 0, 0) < 5) { setDraft([]); return; }
    updateLines([...response.lines, { id: crypto.randomUUID(), points: points.map(p => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]) }]); setDraft([]);
  }
  function undo() {
    if (draft.length) { setDraft([]); return; }
    const previous = history.at(-1); if (!previous) return;
    setFuture(f => [...f, { lines: response.lines, borderIds: response.borderIds }]); setHistory(h => h.slice(0, -1)); setResponse(r => ({ ...r, ...previous })); setStatus("");
  }
  function redo() {
    const next = future.at(-1); if (!next) return;
    setHistory(h => [...h, { lines: response.lines, borderIds: response.borderIds }]); setFuture(f => f.slice(0, -1)); setResponse(r => ({ ...r, ...next })); setStatus("");
  }
  function mapPoint(e: PointerEvent<SVGSVGElement>): Point {
    const matrix = group.current?.getScreenCTM();
    if (!matrix) return [0, 0];
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
    return [Math.max(0, Math.min(MAP_WIDTH, p.x)), Math.max(0, Math.min(MAP_HEIGHT, p.y))];
  }
  function pointerDown(e: PointerEvent<SVGSVGElement>) {
    if (e.button !== 0 || pointer.current) return;
    if (tool === "borders") return;
    const p = mapPoint(e); e.currentTarget.setPointerCapture(e.pointerId);
    pointer.current = { id: e.pointerId, point: [e.clientX, e.clientY], pan, mode: tool, points: [p] };
    if (tool === "draw") setDraft([p]);
  }
  function pointerMove(e: PointerEvent<SVGSVGElement>) {
    const state = pointer.current; if (!state || state.id !== e.pointerId) return;
    if (state.mode === "pan") {
      const bounds = svg.current!.getBoundingClientRect(), scale = Math.max(740 / bounds.width, 800 / bounds.height);
      setPan([state.pan[0] + (e.clientX - state.point[0]) * scale, state.pan[1] + (e.clientY - state.point[1]) * scale]); return;
    }
    const p = mapPoint(e), last = state.points.at(-1)!;
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) >= 1.5) { state.points.push(p); setDraft([...state.points]); }
  }
  function pointerUp(e: PointerEvent<SVGSVGElement>) {
    const state = pointer.current; if (!state || state.id !== e.pointerId) return;
    pointer.current = null;
    if (state.mode === "draw") { const p = mapPoint(e); finishLine([...state.points, p]); }
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }
  const lineItems = useMemo(() => response.lines.map((line, i) => ({ ...line, number: i + 1 })), [response.lines]);
  function exportResponse() {
    saveFile(JSON.stringify({ appName: "Nghe vẻ nghe ve", schemaVersion: 2, participantCode: response.participant.trim() || null, exportedAt: new Date().toISOString(), administrativeLevel: "34 post-merger provinces/cities", boundarySource: "https://github.com/thanglequoc/vietnamese-provinces-database", boundarySnapshot: "11 March 2026", coordinateSystem: { type: "atlas-svg", width: MAP_WIDTH, height: MAP_HEIGHT, projection: { x: "round((longitude - 102) * 46 / 2) * 2 + 140", y: "round((23.6 - latitude) * 48 / 2) * 2 + 30" } }, provinceAssignment: "province-center", lines: response.lines, selectedProvinceBorders: response.borderIds.map(id => borders.find(b => b.id === id)), regions: partition?.regions.map(r => ({ ...r, provinces: r.provinceIds.map(id => provinces.find(p => p.id === id)?.name) })), provinceAssignments: partition?.assignments, islandReferencePoints: ARCHIPELAGOS }, null, 2), `nghe-ve-nghe-ve-cau-tra-loi${response.participant.trim() ? "-" + response.participant.trim().replace(/[^a-zA-Z0-9_-]/g, "_") : ""}.json`, "application/json");
    setStatus("Đã tải câu trả lời xuống. Dữ liệu chưa được gửi đi.");
  }
  function exportMap() {

    const shapes = provinces.map(p => `<path d="${p.path}" fill="${partition?.regions[partition.assignments[p.id]]?.color || '#b8cfa0'}" stroke="#52664b" stroke-width="0.8"/>`).join("");
    const lines = response.lines.map(l => `<path d="${linePath(l.points)}" fill="none" stroke="#243c32" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`).join("");
    const selected = borders.filter(b => response.borderIds.includes(b.id)).map(b => `<path d="${b.path}" fill="none" stroke="#243c32" stroke-width="2.5"/>`).join("");
    const islands = ARCHIPELAGOS.map(a => `<g fill="${partition?.regions[partition.assignments[a.provinceId]]?.color || '#b8cfa0'}" stroke="#52664b">${a.islands.map(({ name, point: [x, y] }) => `<rect x="${x - 2}" y="${y - 2}" width="4" height="4"><title>${name}</title></rect>`).join("")}<text x="${a.label[0]}" y="${a.label[1]}" fill="#243c32" stroke="none" text-anchor="middle" font-family="sans-serif" font-size="11">${a.name}</text></g>`).join("");
    const provinceLabels = labels ? provinces.map(p => `<text x="${p.center[0]}" y="${p.center[1]}" fill="#243c32" stroke="#faf9f0" stroke-width="2" paint-order="stroke" text-anchor="middle" font-family="sans-serif" font-size="10">${p.name}</text>`).join("") : "";
    saveFile(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="70 0 740 800"><title>Nghe vẻ nghe ve — Bản đồ giọng nói</title><desc>Hoàng Sa, Trường Sa chỉ thể hiện một số đảo, đá theo tọa độ tham khảo. Ký hiệu được phóng to, không phải đường bờ.</desc><rect x="70" width="740" height="800" fill="#edf0df"/>${shapes}${islands}${provinceLabels}${selected}${lines}</svg>`, "nghe-ve-nghe-ve-ban-do.svg", "image/svg+xml");
    setStatus("Đã tải bản đồ xuống.");
  }

  return <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_350px]">
    <section aria-label="Bản đồ phân vùng giọng nói" className="overflow-hidden border-2 border-[#3c5140] bg-[#edf0df]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#3c5140] bg-[#f9f8ee] p-3">
        <div className="flex flex-wrap gap-2" aria-label="Công cụ vẽ">{([['draw', 'Vẽ'], ['borders', 'Chọn ranh giới tỉnh'], ['pan', 'Di chuyển']] as const).map(([value, label]) => <button key={value} aria-pressed={tool === value} onClick={() => { setTool(value); setDraft([]); }} className={`${control} ${tool === value ? "bg-[#d5dfbf] underline underline-offset-4" : ""}`}><ToolbarIcon name={value} />{label}</button>)}</div>
        <div className="flex gap-2"><button onClick={undo} disabled={!history.length && !draft.length} className={control}><ToolbarIcon name="undo" />Hoàn tác</button><button onClick={redo} disabled={!future.length || !!draft.length} className={control}><ToolbarIcon name="redo" />Làm lại</button></div>
      </div>
      <p className="border-b border-[#b4c2a3] bg-[#f5f5e9] px-4 py-3 text-[11px] leading-5 text-[#56674e]">{tool === "draw" ? "Nhấn giữ và kéo để vẽ. Thả tay để kết thúc nét vẽ." : tool === "borders" ? "Chọn đường ranh giữa hai tỉnh để chia vùng. Chọn lần nữa để bỏ." : "Nhấn giữ và kéo để di chuyển bản đồ."}</p>
      <div className="relative h-[620px] bg-[radial-gradient(#aebd9b_0.65px,transparent_0.65px)] bg-size-[14px_14px] sm:h-[720px]">
        <svg ref={svg} viewBox="70 0 740 800" role="group" aria-label="Vẽ ranh giới các vùng giọng nói trên bản đồ Việt Nam" tabIndex={0} className={`h-full w-full touch-none select-none focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#a44d37] ${tool === "pan" ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"}`} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={() => { pointer.current = null; setDraft([]); }} onKeyDown={e => { if (e.key === "Escape") setDraft([]); if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); } }}>
          <g ref={group} transform={`translate(${360 + pan[0]} ${400 + pan[1]}) scale(${zoom}) translate(-335 -400)`}>
            {provinces.map(p => <path key={p.id} d={p.path} fill={partition?.regions[partition.assignments[p.id]]?.color || "#b8cfa0"} className="pointer-events-none stroke-[#52664b] stroke-[0.8]"><title>{p.name}</title></path>)}
            {ARCHIPELAGOS.map(a => <g key={a.name} aria-label={`${a.name}, ký hiệu đảo được phóng to`}><title>{a.name} — chỉ thể hiện một số đảo, đá theo tọa độ tham khảo; không phải đường bờ</title>{a.islands.map(({ name, point: [x, y] }) => <rect key={name} x={x - 2} y={y - 2} width="4" height="4" fill={partition?.regions[partition.assignments[a.provinceId]]?.color || "#b8cfa0"} className="stroke-[#52664b] stroke-[0.8]"><title>{name}</title></rect>)}<text x={a.label[0]} y={a.label[1]} textAnchor="middle" className={`${pixel} pointer-events-none fill-[#243c32] text-[12px]`}>{a.name}</text></g>)}
            {borders.map(b => <g key={b.id} role={tool === "borders" ? "button" : undefined} tabIndex={tool === "borders" ? 0 : undefined} aria-label={`Ranh giới giữa ${provinces.find(p => p.id === b.a)?.name} và ${provinces.find(p => p.id === b.b)?.name}`} aria-pressed={tool === "borders" ? response.borderIds.includes(b.id) : undefined} onClick={() => { if (tool === "borders") toggleBorder(b.id); }} onKeyDown={e => { if (tool === "borders" && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.stopPropagation(); toggleBorder(b.id); } }} className={tool === "borders" ? "group cursor-pointer outline-none" : "pointer-events-none"}>
              <path d={b.path} fill="none" className={tool === "borders" ? "stroke-transparent stroke-[12] [vector-effect:non-scaling-stroke]" : "stroke-none"} />
              <path d={b.path} fill="none" className={`pointer-events-none [vector-effect:non-scaling-stroke] ${response.borderIds.includes(b.id) ? "stroke-[#243c32] stroke-[3]" : "stroke-transparent stroke-[2.5] group-hover:stroke-[#a54b33] group-focus:stroke-[#a54b33]"}`} />
            </g>)}
            {labels && provinces.map(p => <text key={p.id} x={p.center[0]} y={p.center[1]} textAnchor="middle" className={`${pixel} pointer-events-none fill-[#243c32] stroke-[#faf9f0] stroke-[2px] text-[10px] [paint-order:stroke]`}>{p.name}</text>)}
            {lineItems.map(line => <g key={line.id} className="pointer-events-none"><path d={linePath(line.points)} fill="none" className="stroke-[#faf9f0] stroke-[5] [vector-effect:non-scaling-stroke]" /><path d={linePath(line.points)} fill="none" className="stroke-[#243c32] stroke-[2.5] [vector-effect:non-scaling-stroke]" /><rect x={line.points[0][0] - 7} y={line.points[0][1] - 8} width="14" height="15" fill="#faf9f0" stroke="#243c32" /><text x={line.points[0][0]} y={line.points[0][1] + 3} textAnchor="middle" className={`${pixel} fill-[#243c32] text-[11px]`}>{line.number}</text></g>)}
            {!!draft.length && <g className="pointer-events-none"><path d={linePath(draft)} fill="none" className="stroke-[#a54b33] stroke-[2.5] [vector-effect:non-scaling-stroke]" /></g>}
          </g>
        </svg>
        <div className="absolute bottom-4 left-4 flex border-2 border-[#52664b] bg-[#faf9f0]"><button aria-label="Thu nhỏ bản đồ" disabled={zoom <= .65} onClick={() => setZoom(z => Math.max(.65, z - .35))} className="h-10 w-10 cursor-pointer text-xl hover:bg-[#dfe6d0] disabled:opacity-30">−</button><button aria-label="Đưa bản đồ về vị trí ban đầu" onClick={() => { setZoom(1); setPan([0, 0]); }} className="cursor-pointer border-x border-[#bec9ad] px-3 text-[11px] hover:bg-[#dfe6d0]">{Math.round(zoom * 100)}%</button><button aria-label="Phóng to bản đồ" disabled={zoom >= 4} onClick={() => setZoom(z => Math.min(4, z + .35))} className="h-10 w-10 cursor-pointer text-xl hover:bg-[#dfe6d0] disabled:opacity-30">+</button></div>

      </div>
    </section>
    <aside className="flex flex-col gap-5">
      <section className="border-2 border-[#3c5140] bg-[#faf9f0]">
        <h2 className={`${pixel} border-b-2 border-[#3c5140] bg-[#e5ebd8] px-5 py-3 text-xl`}>Chia vùng giọng nói</h2>
        <div className="space-y-4 p-5"><p className="text-sm leading-6">Theo bạn, giọng nói thay đổi ở những đâu? Hãy vẽ ranh giới theo cảm nhận của mình. Bạn có thể vẽ bao nhiêu đường tùy ý.</p><p className="text-xs leading-5 text-[#657359]">Để chia vùng, hãy vẽ cắt ngang phần đất liền, nối vào đường đã vẽ hoặc vẽ một vòng khép kín.</p><p className="text-[11px] leading-5 text-[#657359]">Mỗi tỉnh được giữ nguyên trong một vùng. Nếu nét vẽ đi qua một tỉnh, vị trí tâm tỉnh trên bản đồ sẽ quyết định tỉnh đó thuộc bên nào.</p><label className="flex cursor-pointer items-center justify-between text-xs">Tên tỉnh, thành<input type="checkbox" checked={labels} onChange={e => setLabels(e.target.checked)} className="h-4 w-4 accent-[#405c3a]" /></label></div>
      </section>
      <section className="border-2 border-[#3c5140] bg-[#faf9f0] p-5"><div className="mb-4 flex items-center justify-between"><h2 className={`${pixel} text-xl`}>Nét vẽ ({response.lines.length})</h2><button className="cursor-pointer text-xs underline underline-offset-4 disabled:opacity-40" disabled={!response.lines.length && !response.borderIds.length} onClick={() => { setDraft([]); updateInput({ lines: [], borderIds: [] }); }}>Xóa hết</button></div>{!lineItems.length && <p className="text-xs text-[#657359]">Bạn chưa vẽ đường nào.</p>}<ol className="max-h-64 space-y-2 overflow-y-auto">{lineItems.map((line, i) => <li key={line.id} className="flex items-center justify-between gap-2 border-t border-[#d5dcc8] py-2 text-xs"><div>Đường {line.number}{partition?.lineEffects[i] === 0 && <span className="mt-1 block text-[10px] text-[#6e7058]">Chưa tạo thêm vùng</span>}</div><button aria-label={`Xóa đường ${line.number}`} onClick={() => updateLines(response.lines.filter(l => l.id !== line.id))} className="cursor-pointer px-2 py-1 underline underline-offset-4 hover:text-[#a54b33]">Xóa</button></li>)}</ol></section>
      {!!response.borderIds.length && <section className="border-2 border-[#3c5140] bg-[#faf9f0] p-5"><h2 className={`${pixel} mb-3 text-xl`}>Ranh giới đã chọn ({response.borderIds.length})</h2><ul className="max-h-64 space-y-2 overflow-y-auto">{response.borderIds.map(id => { const b = borders.find(value => value.id === id)!; const name = `${provinces.find(p => p.id === b.a)?.name} / ${provinces.find(p => p.id === b.b)?.name}`; return <li key={id} className="flex items-center justify-between gap-2 border-t border-[#d5dcc8] py-2 text-xs"><span>{name}</span><button aria-label={`Bỏ chọn ranh giới ${name}`} onClick={() => toggleBorder(id)} className="cursor-pointer underline underline-offset-4">Xóa</button></li>; })}</ul></section>}
      <section className="border-2 border-[#3c5140] bg-[#faf9f0] p-5"><h2 className={`${pixel} mb-4 text-xl`}>Các vùng ({partition?.regions.length ?? 1})</h2><ul className="max-h-80 space-y-3 overflow-y-auto">{partition?.regions.map(region => <li key={region.id} className="text-xs"><div className="flex items-center gap-2"><svg aria-hidden="true" width="16" height="16"><rect x="1" y="1" width="14" height="14" fill={region.color} stroke="#52664b" /></svg><span>Vùng {region.id + 1}</span>{<span className="ml-auto text-[10px] text-[#6c795f]">{region.provinceIds.length} tỉnh, thành</span>}</div>{<details className="mt-2 pl-6 text-[11px] leading-5 text-[#657359]"><summary className="cursor-pointer">Xem các tỉnh, thành</summary>{region.provinceIds.map(id => provinces.find(p => p.id === id)?.name).join(", ")}</details>}</li>)}</ul></section>
      <section className="space-y-3 border-t border-[#cad3bb] pt-4"><label htmlFor="participant" className="block text-xs">Mã người tham gia (nếu có)</label><input id="participant" value={response.participant} maxLength={100} onChange={e => setResponse(r => ({ ...r, participant: e.target.value }))} className="w-full border-2 border-[#7a8a6b] bg-[#faf9f0] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2" /><button onClick={exportResponse} disabled={!ready} className={`${control} w-full`}>Tải câu trả lời (JSON)</button><button onClick={exportMap} className={`${control} w-full`}>Tải bản đồ (SVG)</button><p className="text-[10px] leading-4 text-[#68765c]">{storageError ? "Chưa lưu được bản vẽ trên trình duyệt. Bạn hãy tải câu trả lời xuống trước khi đóng trang." : "Bản vẽ được lưu trên trình duyệt này. Dữ liệu chưa được gửi đi."}</p>{status && <p role="status" className="text-xs leading-5 text-[#526b41]">{status}</p>}</section>
    </aside>
  </div>;
}
