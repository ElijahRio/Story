## 2025-03-28 - Unified Timeline Empty States
**Learning:** Empty states without consistent visual styling across different tabs/views create a disjointed experience and miss an opportunity for gentle guidance. In this system, empty states generally use a 24px icon with 20% opacity and specifically styled uppercase monospace text (`text-[10px] uppercase tracking-widest`).
**Action:** When implementing new views or components that handle arrays/lists, always check for the 0-length condition and apply the standard 20% opacity icon + monospace typography pattern to maintain the industrial/clinical aesthetic.

## 2026-03-30 - Accessible Empty States
**Learning:** The text size in empty states must be large enough to be legible and accessible while preserving the visual aesthetic of the interface. Using `text-[10px]` violates basic a11y rules.
**Action:** Use a minimum of `text-xs` combined with styling properties like `uppercase`, `font-mono`, and `tracking-widest` to achieve a similar dense look without sacrificing legibility.
