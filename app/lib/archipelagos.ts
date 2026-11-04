/** Named geographic reference points. Symbols are enlarged and are NOT outlines
 * or a complete inventory of either archipelago. Coordinates are transcribed
 * from the linked sources as published, then projected to the atlas grid.
 */
export const HOANG_SA_SOURCE = "https://mae.gov.vn/noidung/Lists/VBQPPL/Attachments/514/1_DanhMuc_TT_DiaDanh_BanHanh.pdf";
export const TRUONG_SA_SOURCE = "https://catphatinh.gov.vn/bai-viet/danh-sach-cac-dao-do-viet-nam-kiem-soat-o-quan-dao-truong-sa.catp";
const dms = (degrees: number, minutes: number, seconds: number) => degrees + minutes / 60 + seconds / 3600;
export function projectIsland(longitude: number, latitude: number): [number, number] {
  return [Math.round((longitude - 102) * 46 / 2) * 2 + 140, Math.round((23.6 - latitude) * 48 / 2) * 2 + 30];
}
function island(name: string, latitude: number, longitude: number) {
  return { name, latitude, longitude, point: projectIsland(longitude, latitude) };
}
export const ARCHIPELAGOS = [
  { name: "Hoàng Sa", provinceId: 21, label: [601, 400], source: HOANG_SA_SOURCE, islands: [
    island("Đảo Quang Ảnh", dms(16, 26, 57), dms(111, 30, 20)),
    island("Đảo Quang Hòa", dms(16, 27, 10), dms(111, 42, 36)),
    island("Đảo Bắc", dms(16, 58, 0), dms(112, 18, 18)),
    island("Đảo Phú Lâm", dms(16, 50, 12), dms(112, 20, 0)),
  ] },
  { name: "Trường Sa", provinceId: 23, label: [707, 781], source: TRUONG_SA_SOURCE, islands: [
    island("Đảo Trường Sa", dms(8, 38, 30), dms(111, 55, 55)),
    island("Đảo Song Tử Tây", dms(11, 25, 46), dms(114, 19, 54)),
    island("Đá Cô Lin", dms(9, 46, 13), dms(114, 15, 25)),
    island("Đá Đông", dms(8, 49, 42), dms(112, 35, 48)),
  ] },
];
