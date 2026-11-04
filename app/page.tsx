"use client";

import { useEffect, useState } from "react";
import StudyMap from "./study-map";
import type { StudyBorder, StudyProvince } from "./lib/dialect-regions";

type Atlas = { provinces: StudyProvince[]; borders: StudyBorder[] };

export default function Home() {
  const [data, setData] = useState<Atlas | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/data/vietnam.json", { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error("Map request failed"); return r.json(); })
      .then(d => { setData(d); setError(false); })
      .catch(e => { if (e.name !== "AbortError") setError(true); });
    return () => controller.abort();
  }, [retry]);
  return <div className="mx-auto max-w-[1600px] px-5 sm:px-9 lg:px-14">
    <header className="flex min-h-24 items-center border-b border-[#d9ddce]">
      <a href="/" aria-label="Nghe vẻ nghe ve — Trang chủ" className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4">
        {/* The logo is an SVG asset; all interface styling remains in Tailwind. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Bản đồ Việt Nam kết hợp sóng âm" width="48" height="48" className="h-12 w-12 shrink-0" />
        <span className="font-[family-name:var(--font-pixel)] text-[30px] leading-none tracking-tight sm:text-4xl">Nghe vẻ nghe ve</span>
      </a>
    </header>
    <main className="pb-8">
      <h1 className="py-8 font-[family-name:var(--font-pixel)] text-[40px] leading-[1.12] sm:text-5xl lg:py-10">Bản đồ giọng nói</h1>
      {data ? <StudyMap provinces={data.provinces} borders={data.borders} /> : <div role="status" className="flex min-h-80 flex-col items-center justify-center gap-4 border-2 border-[#3c5140] bg-[#edf0df] p-6"><p>{error ? "Chưa tải được bản đồ." : "Đang tải bản đồ…"}</p>{error && <button onClick={() => { setError(false); setRetry(n => n + 1); }} className="cursor-pointer border-2 border-[#52664b] bg-[#faf9f0] px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-4">Tải lại</button>}</div>}
    </main>
    <footer className="border-t border-[#d9ddce] py-6 text-[10px] text-[#76806d]">Dữ liệu địa giới: cộng đồng đóng góp · Tháng 3/2026 · <a href="https://github.com/thanglequoc/vietnamese-provinces-database" target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-[#304e3c]">Nguồn dữ liệu</a></footer>
  </div>;
}
