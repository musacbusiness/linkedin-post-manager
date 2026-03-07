# Visuo Design System - Animation Catalog

All animations defined in Tailwind config and globals.css. Used with Framer Motion or Tailwind classes.

## Animation Library

### 1. Fade-In
- **Duration**: 300ms
- **Easing**: ease-in-out
- **Opacity**: 0 → 1
- **Use**: Page transitions, component reveals, toast notifications
- **Tailwind class**: `animate-fade-in`

### 2. Slide-Up
- **Duration**: 400ms
- **Easing**: ease-out
- **Transform**: translateY(20px) → translateY(0)
- **Opacity**: 0 → 1
- **Use**: Modal entrance, dropdown menus, content blocks
- **Tailwind class**: `animate-slide-up`

### 3. Glow-Pulse
- **Duration**: 2s
- **Easing**: infinite
- **Effect**: Opacity 0.5 → 1 → 0.5
- **Use**: Loading states, attention-grabbing elements, focus indicators
- **Tailwind class**: `animate-glow-pulse`

### 4. Float
- **Duration**: 3s
- **Easing**: ease-in-out infinite
- **Transform**: translateY(-8px) ↔ translateY(0)
- **Use**: Floating elements, subtle motion, decorative backgrounds
- **Tailwind class**: `animate-float`

### 5. Scale-In
- **Duration**: 300ms
- **Easing**: ease-out
- **Transform**: scale(0.95) → scale(1)
- **Opacity**: 0 → 1
- **Use**: Button clicks, icon reveals, component mounts
- **Tailwind class**: `animate-scale-in`

## Framer Motion Usage

Variants for use with Framer Motion:

```typescript
const pageVariants = {
  fadeIn: { opacity: [0, 1], duration: 0.3 },
  slideUp: { y: [20, 0], opacity: [0, 1], duration: 0.4 },
  glowPulse: { opacity: [0.5, 1, 0.5], repeat: Infinity, duration: 2 },
  float: { y: [0, -8, 0], repeat: Infinity, duration: 3 },
  scaleIn: { scale: [0.95, 1], opacity: [0, 1], duration: 0.3 },
};
```

## Timing Guidelines

- **Fast feedback**: 200-300ms (button clicks, hover effects)
- **Page transitions**: 300-400ms (slides, fades)
- **Subtle motion**: 2-3s infinite (pulse, float, ambient animations)
- **Loading loops**: 2s (glow-pulse standard for spinners)

## Performance Notes

- Use `transform` and `opacity` only (GPU-accelerated)
- Avoid animating `width`, `height`, `left`, `top` (causes repaints)
- Debounce rapid animations with `will-change` CSS property
- On mobile, consider reducing duration by 25-50% for snappier feel
