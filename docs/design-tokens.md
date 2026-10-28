---
order: 3
---

# Design tokens

`design/tokens.json` is the single source of truth for colors, radius, fonts, layout and motion. `npm run build:tokens` turns it into CSS variables.

## Colors

The site is dark only. Surfaces climb from the page background through four raised steps, and text has five levels from bright to faint.

## Change the accent

Edit `color.accent` and `color.accent-strong` in `design/tokens.json`, then regenerate. Everything that uses the brand color follows.

## Type

Geist for text and Geist Mono for names, numbers and commands, both self-hosted. No request leaves the page for fonts.
