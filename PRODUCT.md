# Nghe vẻ nghe ve
<!-- impeccable:product-schema 1 -->
## Platform
Web; existing Next.js and React application.
## Product Purpose
Support a dialect perception study. Participants draw any number of boundaries to express where they consider dialects different. The study map groups the resulting areas into colored regions while retaining visible province borders. The study map is the only view, with Draw and Province boundaries input modes. The user confirmed the 34 merged provinces/cities as the administrative level.
## Capabilities and Constraints
Interactive map, freehand drawing and multiple selectable province borders, plus Pan. Province labels are enabled by default. Hoàng Sa and Trường Sa appear as simplified enlarged island markers. Use real geometry, label simplified boundaries clearly. All interface styling uses inline Tailwind utilities; CSS only imports Tailwind.
## Brand Commitments
8-bit style requested by the user. The app is named “Nghe vẻ nghe ve”. All participant-facing copy is natural Vietnamese, including accessibility labels and status messages. The logo combines the atlas-derived Vietnam silhouette with sound bars; favicon matches.
## Evidence on Hand
Community-maintained province geometry from thanglequoc/vietnamese-provinces-database, snapshot 11 March 2026, MIT license retained in public/data/LICENSE. Geometry is illustrative, not a legal survey.

## Study Responses
Participants begin with no predefined dialect labels or lines. Multiple freehand lines and province-boundary selections are supported; point-to-point input is removed. Drafts stay in local browser storage, and responses export as JSON; there is no server submission or collection backend. The user confirmed keeping provinces whole and assigning them by their mapped centers when a drawn line passes through them. Keep participant instructions functional and omit decorative slogans.

Island markers use named, sourced geographic reference points, with enlarged symbols rather than fabricated island outlines. They show a selected subset, not complete archipelago geometry. Sources and coordinates are recorded in app/lib/archipelagos.ts.
