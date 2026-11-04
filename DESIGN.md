---
name: Nghe vẻ nghe ve
description: A pixel atlas with paper surfaces, sage geography, and terracotta connections.
colors:
  paper: "#f7f6ee"
  ink: "#263f35"
  frame: "#3c5140"
  map: "#edf0df"
  panel: "#faf9f0"
  selected: "#b94f36"
  selected-land: "#e4b091"
  connection: "#eddfc7"
typography:
  display:
    fontFamily: VT323
    fontSize: 48px
    fontWeight: 400
    lineHeight: 1.12
  body:
    fontFamily: ui-sans-serif, system-ui, sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.7
rounded:
  none: 0px
spacing:
  small: 8px
  medium: 20px
  large: 40px
---
## Overview
An Operate surface with the visual language of an 8-bit atlas. The map is the main artifact, with an adjacent response inspector.
## Colors
Paper and sage create a daylight reading surface. Terracotta identifies a shared border; peach marks its two provinces. Never rely on color alone: name both provinces in the connection details.
## Typography
Participant-facing copy is written in natural Vietnamese. The name is “Nghe vẻ nghe ve”; retain its spelling and capitalization. The logo and favicon combine the real atlas silhouette with four sound bars.
Self-hosted VT323 provides the pixel display voice. System sans makes instructions and province names in form controls readable. Main heading is 40px on mobile and 48px from the small breakpoint.
## Layout
Desktop uses a fluid map plus a 320–350px inspector. Below 1024px the inspector follows the map. Outer margins grow from 20px to 56px. Tight groups use 8px; sections use 20–40px.
## Elevation & Depth
Two-pixel dark frames and small offset block shadows evoke pixel windows. Avoid soft surfaces or rounded cards.
## Shapes
Orthogonal geometry, square controls, and stepped source-derived coastlines. SVG is used for geographic geometry and consistent line icons.
## Components
The dialect study map inherits the pixel frames and paper surfaces. Participants start with a single muted green region and no example boundaries. Drawn boundaries separate pastel regions; thin province outlines remain visible. The palette extends for additional regions. Keep instructions factual and concise; do not add slogans or suggested dialect groupings.
Draw, Province boundaries, and Pan share an icon-and-label toolbar with Undo and Redo. Point-to-point and Explore map are removed. Labels start enabled. Selectable SVG borders are keyboard-operable. Hoàng Sa and Trường Sa use enlarged square markers at sourced island/reef coordinates; clarify that only selected points are shown. Zoom and drag assist detailed inspection; export generates a standalone SVG.
## Do's and Don'ts
Use inline Tailwind classes for every style. The global stylesheet only imports Tailwind. Preserve real source geometry and attribution. Describe lengths as approximate and the map as simplified; do not imply legal survey accuracy.
