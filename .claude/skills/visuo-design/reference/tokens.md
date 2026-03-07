# Visuo Design System - Color & Visual Tokens

## Color Palette

### Primary Colors
- **Deep Purple**: `#6b4ceb` (brand primary, buttons, highlights, focus rings)
- **Black**: `#121116` (dark backgrounds, text on light)

### Accent Colors
- **Light Purple**: `#9378ff` (hover states, secondary accents)
- **Dark Blue**: `#02071a` (dark overlays, deep shadows)

### Grays (9-level scale)
- `#ddd` → `#0a0a0a` (light to dark, used for: backgrounds, borders, disabled states, text hierarchy)

## Visual Effects

### Glassmorphism
- **Backdrop-blur levels**: `xl`, `2xl`, `3xl` (tailwind `backdrop-blur-xl` = 12px, etc.)
- **Semi-transparent backgrounds**: 90-95% opacity on dark base colors
- **Borders**: rgba(255, 255, 255, 0.1) or rgba(107, 76, 235, 0.15) at 10-20% opacity

### Glow Shadows
- **Standard glow**: `rgba(107, 76, 235, 0.3)` (30% opacity)
- **Enhanced glow**: `rgba(107, 76, 235, 0.5)` (50% opacity)
- **Shadow blur radius**: 8-16px
- **Used on**: cards, buttons on hover, focus rings

### Gradient Overlays
- **Radial gradients**: Center to edges for card backgrounds
- **Linear gradients**: Top-to-bottom for hero sections
- **Base direction**: Always from lighter to darker purple shades

## Component Tokens

### Card Styling
- Background: rgba(18, 17, 22, 0.7) with backdrop-blur-xl
- Border: 1px solid rgba(255, 255, 255, 0.1)
- Padding: 20px (1.25rem)
- Border radius: 12px (rounded-lg)
- Shadow: 0 8px 32px rgba(107, 76, 235, 0.3)

### Button States
- **Default**: bg-[#6b4ceb], text-white, border-none
- **Hover**: bg-[#9378ff], scale(1.05), shadow-enhancement
- **Focus**: ring-2 ring-offset-0 ring-[#6b4ceb]
- **Disabled**: opacity-50, cursor-not-allowed
- **Loading**: spin animation on icon

### Focus Rings
- **Width**: 2px
- **Color**: #6b4ceb with glow
- **Offset**: 0 (no offset, ring inside border)
- **Blur**: 4-6px glow extending outward

## Opacity Values
- Full opacity: 1 (100%)
- Hover/active: 0.9 (90%)
- Disabled: 0.5 (50%)
- Border: 0.1-0.2 (10-20%)
- Glow shadow: 0.3-0.5 (30-50%)
- Background glass: 0.7-0.95 (70-95%)
