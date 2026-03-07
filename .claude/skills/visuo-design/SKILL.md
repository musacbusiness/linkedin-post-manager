---
name: visuo-design
description: >
  Provides Visuo design system reference for AIO Platform and LinkedIn Post Manager.
  Auto-load when: implementing glassmorphism, applying backdrop-blur, using brand
  purple (#6b4ceb), creating glass card containers, applying glow shadow effects
  (rgba 107,76,235), using Geist font, writing Framer Motion animations (fade-in,
  slide-up, glow-pulse, float, scale-in), applying gradient overlays, implementing
  hover scale transforms, or using purple glow focus rings.
user-invocable: false
---

# Visuo Design System

Shared design language for AIO Platform and LinkedIn Post Manager.

## Color Tokens (Quick Reference)

- **Primary**: #6b4ceb (deep purple)
- **Black**: #121116
- **Accent Purple**: #9378ff (light purple)
- **Dark Blue**: #02071a
- **Grays**: Full 9-level scale from #ddd to #0a0a0a
- **Glow Shadow**: rgba(107, 76, 235, 0.3–0.5 opacity)

## Component Patterns

- **Glass containers**: Semi-transparent background + backdrop-blur
- **Borders**: rgba white/purple at 10–20% opacity
- **Hover states**: Scale transforms + shadow enhancement
- **Focus states**: Purple glow rings

## Animations

All 5 animation types: fade-in, slide-up, glow-pulse, float, scale-in

Details in `reference/animations.md`. Tokens and blend modes in `reference/tokens.md`.

## Reference Files

- **`reference/tokens.md`** — Full hex values, opacity levels, backdrop-blur levels (xl/2xl/3xl), gradient overlay types
- **`reference/animations.md`** — Full animation catalog with names, durations, easing, CSS class names from globals.css

Load when implementing UI components, styling new pages, or writing Framer Motion animations.
