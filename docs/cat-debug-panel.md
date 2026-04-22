# CAT debug panel

CAT includes a dev-only debug panel for quickly testing asset providers and states.

## Enable it

Open either page with `catDebug=1` in the URL:

- `index.html?catDebug=1`
- `report.html?catDebug=1`

## What it can do

- switch provider type (`inline-svg`, `svg-url`, `video`, `spline`)
- set a primary source URL
- set optional per-state URLs (`idle`, `attentive`, `active`, `celebratory`)
- set optional video poster URL
- set an optional accessibility label
- trigger state transitions directly

## Behavior

- changes are applied immediately to mounted cat instances
- invalid or unreachable external assets automatically fall back to inline SVG
- panel is hidden by default and only shown when `catDebug=1`
