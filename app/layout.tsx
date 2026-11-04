import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
const pixel = localFont({ src: "../public/fonts/vt323-regular.ttf", variable: "--font-pixel", weight: "400", display: "swap" });
export const metadata: Metadata = {
  title: "Nghe vẻ nghe ve — Bản đồ giọng nói",
  description: "Bạn phân chia các vùng giọng nói ở Việt Nam như thế nào? Vẽ ranh giới theo cảm nhận của bạn trên bản đồ.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi" className={pixel.variable}><body className="min-h-screen bg-[#f7f6ee] text-[#263f35] antialiased selection:bg-[#f3a78c] selection:text-[#263f35]">{children}</body></html>;
}
