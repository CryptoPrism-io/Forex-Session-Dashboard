# Animation System Documentation

## Overview

This project uses **Framer Motion 11.18.2** and **React Aria Components 1.13.0** to provide professional, accessible animations throughout the application. All animations respect user accessibility preferences and maintain 60fps performance.

## Table of Contents

1. [Architecture](#architecture)
2. [Animation Inventory](#animation-inventory)
3. [Accessibility](#accessibility)
4. [Performance](#performance)
5. [Usage Patterns](#usage-patterns)
6. [Best Practices](#best-practices)

---

## Architecture

### Core Dependencies

```json
{
  "framer-motion": "^11.18.2",
  "react-aria-components": "^1.13.0"
}
```

### Key Files

- **`hooks/useReducedMotion.ts`** - Custom hook for accessibility
- **`components/Tooltip.tsx`** - Unified accessible tooltip system
- **`components/Menu.tsx`** - Accessible popover menu components
- **`App.tsx`** - Left pane mobile animations
- **`components/ForexChart.tsx`** - Chart animations (bars, events, now line)

---

## Animation Inventory

### 1. Left Pane (Mobile)

**Location:** `App.tsx` lines 73-98, 287-306

**Type:** Slide + Fade

**Behavior:**
- **Mobile (< 768px)**: Slides in from left with spring physics
- **Desktop (>= 768px)**: Always visible, no animation
- **Gesture Support**: Swipe left to close (100px or 500px/s velocity threshold)

**Variants:**
```typescript
{
  openMobile: { x: 0, opacity: 1 },
  closedMobile: { x: '-100%', opacity: 0 },
  desktop: { x: 0, opacity: 1 }
}
```

**Spring Config:**
- Stiffness: 300
- Damping: 30

**Drag Config:**
- Direction: Horizontal (`drag="x"`)
- Constraints: `{ left: -300, right: 0 }`
- Elastic: 0.2

---

### 2. Tooltips

**Location:** `components/Tooltip.tsx` lines 100-116

**Type:** Fade + Scale

**Behavior:**
- Appears on hover/focus after 300ms delay
- Smooth entrance with gentle scale effect
- Auto-positioning with viewport collision detection

**Variants:**
```typescript
{
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 }
}
```

**Timing:**
- Entrance: 200ms
- Exit: 150ms
- Type: Tween (GPU-accelerated)

**Features:**
- Keyboard navigation (Tab + Hover, Escape to close)
- Screen reader support
- Automatic ARIA attributes
- Supports both session and event tooltip content

---

### 3. Session Bars

**Location:** `components/ForexChart.tsx` lines 134-162

**Type:** Staggered Scale + Fade

**Behavior:**
- Entrance: Scale up from 80% to 100% with fade
- Hover: Scale up to 125%
- Stagger: 50ms delay between each bar

**Variants:**
```typescript
{
  hidden: { scaleY: 0.8, opacity: 0 },
  visible: (i) => ({ scaleY: 1, opacity: 1, delay: i * 0.05 }),
  hover: { scaleY: 1.25 }
}
```

**Timing:**
- Entrance: 300ms per bar
- Hover: 200ms
- Type: Tween

**Usage:**
- Main sessions (y-level 0)
- Overlaps (y-level 1)
- Killzones (y-level 2)

---

### 4. Economic Event Indicators

**Location:** `components/ForexChart.tsx` lines 164-193

**Type:** Spring Bounce + Fade

**Behavior:**
- Entrance: Scale from 0 with spring overshoot
- Hover: Scale to 110%
- Stagger: 30ms delay between each event
- Exit: Smooth scale down and fade when toggled off

**Variants:**
```typescript
{
  hidden: { scale: 0, opacity: 0 },
  visible: (i) => ({
    scale: 1,
    opacity: 0.67,
    delay: i * 0.03,
    ease: [0.34, 1.56, 0.64, 1] // Spring-like cubic bezier
  }),
  hover: { scale: 1.1, opacity: 1 }
}
```

**Timing:**
- Entrance: 400ms per event
- Hover: 200ms
- Exit: Uses `hidden` variant with AnimatePresence

**Exit Animations:**
Wrapped in `<AnimatePresence>` for smooth removal when "Economic Events" layer is toggled off.

---

### 5. "Now" Line

**Location:** `components/ForexChart.tsx` lines 232-237, 752-768, 935-951

**Type:** Blink + Glow

**Behavior:**
- Position updates every 1 second (from App state)
- Blinks between full brightness and subtle (opacity 1 → 0.15)
- Glow effect synced with blink

**Animation:**
```typescript
animate={{
  opacity: nowBlinkVisible ? 1 : 0.15,
  boxShadow: nowBlinkVisible
    ? '0 0 14px rgba(250, 204, 21, 0.8)'
    : '0 0 0px rgba(250, 204, 21, 0)'
}}
```

**Timing:**
- Blink interval: 1000ms (controlled by App.tsx state)
- Transition: 200ms for opacity and boxShadow
- Type: Tween

**Optimization Note:**
Position changes are NOT animated (0.00116% per second). Adding transitions would make the line appear choppy. The position is wrapped in `useMemo` to prevent unnecessary recalculations.

---

## Accessibility

### Reduced Motion Support

All animations respect the OS/browser `prefers-reduced-motion` setting.

**Implementation:**

```typescript
import { useReducedMotion } from '../hooks/useReducedMotion';

const prefersReducedMotion = useReducedMotion();

const variants = {
  visible: {
    opacity: 1,
    transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }
  }
};
```

**When reduced motion is enabled:**
- All animation durations become 0ms (instant)
- Transforms still apply (maintain layout)
- No performance impact
- Full functionality preserved

### Keyboard Navigation

Implemented via React Aria Components:

- **Tooltips**: Tab to focus, Escape to close
- **Menus**: Arrow keys for navigation, Enter to select, Escape to close
- **Buttons**: Standard focus indicators and keyboard activation

### Screen Reader Support

- Automatic ARIA attributes (via React Aria)
- Semantic HTML structure
- Descriptive labels for interactive elements
- Status announcements for state changes

---

## Performance

### GPU Acceleration

All animations use GPU-accelerated properties:

- **Transform properties**: `scale`, `scaleY`, `x`, `y`
- **Opacity**: GPU-friendly on modern browsers
- **Type: 'tween'**: Forces predictable GPU rendering

### Optimization Techniques

1. **`useMemo` for static values**
   ```typescript
   const nowLinePosition = useMemo(() => ({
     left: `${(nowLine / 24) * 100}%`
   }), [nowLine]);
   ```

2. **AnimatePresence for exit animations**
   ```typescript
   <AnimatePresence>
     {visible && <motion.div exit="hidden">...</motion.div>}
   </AnimatePresence>
   ```

3. **Stagger optimization**
   - Session bars: 50ms delay (60 total bars = 3s total cascade)
   - Event indicators: 30ms delay (variable count)

4. **Layout thrashing prevention**
   - Avoid reading/writing layout properties during animations
   - Use transform instead of top/left where possible
   - Batch DOM reads before writes

### Performance Targets

- **60fps** for all animations
- **< 200ms** HMR rebuild time
- **Zero** layout recalculations during animations
- **< 5ms** JavaScript execution per frame

---

## Usage Patterns

### Adding a New Tooltip

```tsx
import { AccessibleTooltip } from './components/Tooltip';

<AccessibleTooltip
  content={{
    type: 'session',
    name: 'London Session',
    timeRange: '07:00 - 16:00',
    timezoneLabel: 'UTC+0',
    tooltipInfo: {
      volatility: 'High',
      bestPairs: 'EUR/USD, GBP/USD',
      strategy: 'Breakout trading'
    }
  }}
  delay={300}
>
  <div>Hover over me</div>
</AccessibleTooltip>
```

### Adding a New Animated Element

```tsx
import { motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

function MyComponent() {
  const prefersReducedMotion = useReducedMotion();

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.3, type: 'tween' }
    }
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
    >
      Content
    </motion.div>
  );
}
```

### Adding Exit Animations

```tsx
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence>
  {isVisible && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}  // ← Exit animation
    >
      Content
    </motion.div>
  )}
</AnimatePresence>
```

### Adding Gesture Support

```tsx
<motion.div
  drag="x"
  dragConstraints={{ left: -200, right: 0 }}
  dragElastic={0.2}
  onDragEnd={(e, { offset, velocity }) => {
    if (offset.x < -100 || velocity.x < -500) {
      onClose();
    }
  }}
>
  Swipe me left to close
</motion.div>
```

---

## Best Practices

### 1. Always Respect Reduced Motion

```typescript
// ✅ Good
const transition = prefersReducedMotion
  ? { duration: 0 }
  : { duration: 0.3, type: 'tween' };

// ❌ Bad
const transition = { duration: 0.3 };
```

### 2. Use GPU-Accelerated Properties

```typescript
// ✅ Good - GPU accelerated
<motion.div animate={{ x: 100, opacity: 1, scale: 1.2 }} />

// ❌ Bad - Triggers layout recalculation
<motion.div animate={{ left: 100, top: 50, width: 200 }} />
```

### 3. Optimize for Mobile

```typescript
// Conditional drag only on mobile
drag={isMobile ? 'x' : false}

// Reduce animation complexity on mobile
duration: isMobile ? 0.2 : 0.3
```

### 4. Use AnimatePresence for Removals

```typescript
// ✅ Good - Smooth exit
<AnimatePresence>
  {items.map(item => (
    <motion.div key={item.id} exit={{ opacity: 0 }}>
      {item.content}
    </motion.div>
  ))}
</AnimatePresence>

// ❌ Bad - Instant removal
{items.map(item => (
  <motion.div>{item.content}</motion.div>
))}
```

### 5. Memoize Animation Variants

```typescript
// ✅ Good - Prevents recreation on every render
const variants = useMemo(() => ({
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}), []);

// ❌ Bad - Creates new object every render
const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};
```

### 6. Use Stagger Wisely

```typescript
// ✅ Good - Stagger for visual hierarchy
variants={{
  visible: (i) => ({
    opacity: 1,
    transition: { delay: i * 0.05 }  // 50ms between items
  })
}}

// ❌ Bad - Too long delay makes UI feel slow
variants={{
  visible: (i) => ({
    opacity: 1,
    transition: { delay: i * 0.5 }  // 500ms - way too slow!
  })
}}
```

### 7. Specify Animation Type

```typescript
// ✅ Good - Explicit type for GPU optimization
transition={{ type: 'tween', duration: 0.3 }}

// ⚠️ OK - Spring for natural feel (but more CPU intensive)
transition={{ type: 'spring', stiffness: 300, damping: 30 }}
```

### 8. Handle Window Size Checks Safely

```typescript
// ✅ Good - Check for window existence
drag={typeof window !== 'undefined' && window.innerWidth < 768 ? 'x' : false}

// ❌ Bad - SSR will crash
drag={window.innerWidth < 768 ? 'x' : false}
```

---

## Animation Timeline

Visual representation of animation timings:

```
App Load (t=0ms)
│
├─ t=0ms:    Session bars start entering (stagger 50ms each)
├─ t=50ms:   Second session bar enters
├─ t=100ms:  Third session bar enters
├─ ...
├─ t=3000ms: Last session bar enters
│
├─ t=0ms:    Event indicators start (stagger 30ms each)
├─ t=30ms:   Second event enters
├─ t=60ms:   Third event enters
├─ ...
│
└─ t=1000ms: First "Now" line blink cycle completes

Hover Events:
├─ Session bar hover: 200ms scale to 125%
└─ Event hover: 200ms scale to 110%

User Interactions:
├─ Tooltip appears: 300ms delay → 200ms fade+scale
├─ Swipe left pane: Drag with 20% elastic → snap on release
└─ Toggle layers: AnimatePresence exit (matches entrance timing)
```

---

## Debugging Animations

### Check Reduced Motion Status

```typescript
console.log('Reduced motion:', window.matchMedia('(prefers-reduced-motion: reduce)').matches);
```

### Force Reduced Motion in Browser

**Chrome DevTools:**
1. Open DevTools → Rendering tab
2. Enable "Emulate CSS media feature prefers-reduced-motion"
3. Select "reduce"

**Firefox:**
1. `about:config`
2. Set `ui.prefersReducedMotion` to `1`

### Performance Profiling

1. Open Chrome DevTools → Performance tab
2. Record during animation
3. Look for:
   - **Layout thrashing** (purple bars should be minimal)
   - **60fps target** (green line)
   - **Long tasks** (< 50ms ideal)

### Common Issues

**Animation not firing:**
- Check if `initial` prop is set (prevents entrance animation on mount if missing)
- Verify variant names match between `variants` and `animate`

**Janky animations:**
- Ensure using transform properties (not left/top)
- Check for layout reads during animation
- Verify GPU acceleration is active (check DevTools → Layers)

**Exit animation skipped:**
- Wrap in `<AnimatePresence>`
- Ensure unique `key` prop on each element
- Add `exit` prop to motion component

---

## Future Enhancements

Potential improvements for future iterations:

1. **View Transitions API**
   - Integrate with Chrome's View Transitions API for shared element transitions
   - Automatic cross-fade between route changes

2. **Gesture Recognition**
   - Pinch-to-zoom for chart
   - Two-finger pan for time scrubbing

3. **Advanced Micro-interactions**
   - Ripple effect on button clicks
   - Magnetic snap for drag targets
   - Particle effects for important events

4. **Performance Monitoring**
   - Runtime FPS tracking
   - Automatic animation degradation on slow devices
   - Analytics for animation performance metrics

---

## References

- **Framer Motion Docs**: https://www.framer.com/motion/
- **React Aria Docs**: https://react-spectrum.adobe.com/react-aria/
- **Web Animations Best Practices**: https://web.dev/animations/
- **Accessibility Guidelines**: https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html

---

**Last Updated:** 2025-11-22
**Animation System Version:** 1.0
**Maintained By:** Development Team
