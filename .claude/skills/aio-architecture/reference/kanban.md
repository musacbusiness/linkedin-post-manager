# CRM Kanban Deep Dive

## Responsive Carousel Navigation

The Kanban board displays pipeline stages in a carousel that adapts to viewport width.

**Visible Stage Calculation:**
```
Math.floor((availableWidth + 16) / (250 + 16))
```
Where:
- `availableWidth = containerWidth - 48` (padding)
- STAGE_MIN_WIDTH = 250px
- STAGE_GAP = 16px
- Min visible stages = 1, Max = however many fit

**ResizeObserver:** Monitors container width with 50ms debounce for performance

## Navigation Controls

- **Left/Right Arrows**: Click to scroll viewport. Disabled states:
  - Left arrow disabled when `currentStageOffset === 0`
  - Right arrow disabled when `currentStageOffset >= stages.length - visibleStageCount`

- **Scrollbar Thumb**: Visual indicator of viewport position within all stages
  - **Thumb width** = `(visibleStageCount / totalStages) * scrollbarTrackWidth`
  - **Thumb position** = proportional to `currentStageOffset`
  - Minimum thumb width = 30px

## Safari 4-Finger Swipe Bug & Fix

**Problem**: When user switches away (Safari 4-finger swipe) and returns, the measured stage count drops to 0 or a lower value, causing stages to disappear.

**Root Cause**: Window focus change event fires before layout has stabilized; container reports width=0.

**Solution**: Track `maxMeasuredCountRef` with recovery logic:

```typescript
const maxMeasuredCountRef = useRef(0);  // Persistent across renders

// After measuring visible stage count:
if (measuredCount > maxMeasuredCountRef.current) {
  maxMeasuredCountRef.current = measuredCount;  // Store new maximum
}

// Use the maximum as fallback:
const visibleStageCount = measuredCount > 0 ? measuredCount : maxMeasuredCountRef.current;
```

**Cross-Browser Timing**: Different browsers report container width at different times:
- 100ms: Initial check
- 250ms, 400ms, 600ms, 900ms: Retry at staggered intervals

## Smooth Scrolling

Navigation uses `behavior: 'smooth'` for natural transitions:
```javascript
element.scrollLeft += scrollAmount;  // CSS scroll-behavior: smooth
```

## Files

- Source: `src/app/dashboard/crm/page.tsx` (ResizeObserver at lines ~56-80, Kanban at ~80-120, scrollbar at ~340-380)
- Related: `src/app/dashboard/crm/layout.tsx` for PipelineSelector
