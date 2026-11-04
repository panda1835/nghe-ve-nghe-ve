# Nghe vẻ nghe ve

An 8-bit dialect-perception study map of Vietnam's 34 provinces/cities. Use **Draw** for freehand boundaries or **Province boundaries** to toggle multiple shared administrative borders. Both modes contribute to the same colored regions. Province labels are on by default. Supports Pan, zoom, undo/redo, local drafts, and JSON/SVG exports. All interface styling uses inline Tailwind utilities.

## Development

```sh
npm install
npm run dev
```

Open http://localhost:3000. Use `npm run build` for production and `npx tsc --noEmit` for type checking. Turbopack’s CSS compiler needs permission to spawn local processes and bind a local port; restricted environments may prevent production builds.

## Boundary data

`public/data/vietnam.json` contains 34 province geometries and 58 shared boundaries, derived from the [Vietnamese Provinces Database](https://github.com/thanglequoc/vietnamese-provinces-database), `dataset-generation-scripts/resources/gis/geojson_11Mar2026/*/province.geojson`. The original MIT license is in `public/data/LICENSE`. VT323 is distributed under the OFL license in `public/fonts/OFL-vt323.txt`.

`scripts/prepare-map.py` extracts shared source segments and snaps them to a consistent orthogonal pixel grid. To regenerate, download the 34 upstream files into `/tmp/vn-provinces/{1..34}.json`, where the number is the upstream directory prefix, then run `python3 scripts/prepare-map.py`.

The administrative structure became effective July 1, 2025. Districts were abolished; this map operates at province/city level. Geometry is illustrative, lengths are approximate, and offshore coverage follows the source rather than constituting a complete territorial map. It is not an official legal boundary survey.

## Dialect study

The study map supports multiple freehand boundaries and province-border selections, automatic region coloring, undo/redo for both input modes, individual deletion, local drafts, participant codes, JSON response exports, and SVG map exports. Old drafts containing freehand lines remain compatible. No responses are submitted to a server.

Region segmentation uses a 2-unit raster of the actual mainland geometry. Complete cross-mainland cuts, intersecting lines, and closed loops can create regions; dangling lines are retained without forcing a split. Offshore islands inherit the nearest mainland region. Whole provinces are assigned by their existing mapped centers, with provincial outlines retained. A line cutting across a province can therefore differ from the colored province edge.

Run topology regression checks with `node --test tests/dialect-regions.test.mjs`. Province-boundary selections remove links from the province adjacency graph. Regions split when their remaining connections are cut, and these selections also combine with freehand raster barriers.

## Island reference points

Hoàng Sa and Trường Sa now use eight named island/reef coordinates, projected through the same coordinate formula as the mainland. The previous hand-positioned dots have been removed. Markers are enlarged squares; they are neither coastline geometry nor a complete inventory. Sources and original latitude/longitude values are preserved in `app/lib/archipelagos.ts` and included in response exports.

- Hoàng Sa reference points: [Ministry of Agriculture and Environment geographic-name catalogue](https://mae.gov.vn/noidung/Lists/VBQPPL/Attachments/514/1_DanhMuc_TT_DiaDanh_BanHanh.pdf), coordinates as published in VN-2000; approximate atlas placement only.
- Trường Sa reference points: [Hà Tĩnh Police geographic overview](https://catphatinh.gov.vn/bai-viet/danh-sach-cac-dao-do-viet-nam-kiem-soat-o-quan-dao-truong-sa.catp), coordinates as published.

## Language and identity

The interface, accessibility labels, status messages, and page metadata are Vietnamese. The name is **Nghe vẻ nghe ve**. `public/logo.svg`, `app/icon.svg`, and `app/favicon.ico` share a mark combining the actual atlas geometry with sound bars. VT323 supplies Vietnamese pixel lettering. Local storage keeps its original key so existing drafts are preserved. Export field identifiers remain compatible for analysis.
