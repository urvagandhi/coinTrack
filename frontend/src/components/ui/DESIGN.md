# coinTrack Design System Specification (Cirrus UI)

> **Version**: 3.0.0  
> **Status**: Approved / Moving to Production  
> **Aesthetic Philosophy**: High-Fidelity Fintech · Apple Glassmorphism · Quiet Institutional
> Clarity  
> **Scope**: Component Primitives (`frontend/src/components/ui`), Public Surface
> (`frontend/src/app/(public)`), Design Lab Sandbox, and Motion Tokens (`system.css`).  
> _Note: Legacy production "Terminal Editorial" (newspaper paper background, hairline grids, and
> serif italic fonts) has been completely retired._

---

## 1. Executive Summary & Design Vision

coinTrack unites institutional-grade wealth tracking (Zerodha, Upstox, Angel One, EPFO, mutual
funds, gold, and fixed deposits) inside an effortless, luminous operating system.

The **Cirrus UI** replaces dense, newspaper-inspired editorial aesthetics with:

- **Luminous Atmospheric Canvas**: Soft sky tint (`#e8f1fb`), pristine white surfaces, and deep
  obsidian typography (`#0a0a0a`).
- **Apple-Grade Frosted Glassmorphism**: High-index backdrop blur (`backdrop-blur-xl`), hairline
  translucent borders (`border-black/[0.08]` / `border-border/50`), and subtle multi-layered ambient
  drop shadows.
- **Physical Motion & Micro-Interactions**: Tactile button presses (`active:scale-[0.97]`),
  Apple-curve bezier transitions (`cubic-bezier(0.22, 1, 0.36, 1)`), shared layout spring pills, and
  animated SVG stroke path drawings.
- **Strict Tabular Numeric Precision**: `Geist Mono` and tabular-num features (`tnum`) for monetary
  figures, capital gains percentages, and sub-millisecond execution engines.

---

## 2. Color Palette & Semantic Tokens

All color tokens are engineered with high mathematical contrast ratios and semantic clarity.

### 2.1 Core Surfaces & Canvas

| Token                 | Light Mode Value                           | Dark Mode Value                | Tailwind / CSS Class                       | Description                      |
| :-------------------- | :----------------------------------------- | :----------------------------- | :----------------------------------------- | :------------------------------- |
| **Canvas Background** | `hsl(214 60% 98%)` (`#f5f8fc`) / `#e8f1fb` | `hsl(224 71% 4%)` (`#030712`)  | `bg-background` / `bg-[#e8f1fb]`           | Atmospheric sky backdrop         |
| **Surface Card**      | `hsl(0 0% 100%)` (`#ffffff`)               | `hsl(224 71% 6%)` (`#090d16`)  | `bg-card` / `bg-white/95`                  | Elevated bento card surfaces     |
| **Frosted Popover**   | `rgba(255, 255, 255, 0.85)`                | `rgba(15, 23, 42, 0.75)`       | `bg-popover/80 backdrop-blur-xl`           | Floating menus, pills, modals    |
| **Foreground (Text)** | `hsl(224 71% 4%)` (`#0a0a0a`)              | `hsl(210 20% 98%)` (`#fafafa`) | `text-foreground` / `text-neutral-950`     | Deep obsidian high-contrast type |
| **Muted Text**        | `hsl(215 16% 47%)` (`#64748b`)             | `hsl(215 20% 65%)` (`#94a3b8`) | `text-muted-foreground`                    | Secondary labels, descriptions   |
| **Border / Hairline** | `rgba(0, 0, 0, 0.08)` / `hsl(214 20% 88%)` | `rgba(255, 255, 255, 0.1)`     | `border-border/50` / `border-black/[0.08]` | Translucent structural dividers  |

### 2.2 Brand & Accents

| Token                | Hex Value                 | Semantic Role                                    | Tailwind Utility               |
| :------------------- | :------------------------ | :----------------------------------------------- | :----------------------------- |
| **Primary Obsidian** | `#0a0a0a` / `neutral-950` | Primary action buttons, brand logo, badges       | `bg-neutral-950 text-white`    |
| **Electric Blue**    | `#2563eb` (`blue-600`)    | Interactive focal points, links, verified states | `text-blue-600 bg-blue-500/10` |
| **Sky Tint**         | `#38bdf8` (`sky-400`)     | Gradient stops, ambient glow backlights          | `from-blue-600 via-sky-500`    |
| **Brand Accent**     | `#0284c7` (`sky-600`)     | Focus rings, active controls                     | `ring-ring`                    |

### 2.3 FinTech P&L & Semantic Status Tokens

Fintech signals are clear, accessible, and paired with translucent tinted badge surfaces
(`bg-*/10 border-*/20`):

| Signal                        | Color Code              | Background Tint            | Border Tint                | Usage                                   |
| :---------------------------- | :---------------------- | :------------------------- | :------------------------- | :-------------------------------------- |
| **Gain / Profit / Success**   | `#10b981` (Emerald 500) | `rgba(16, 185, 129, 0.1)`  | `rgba(16, 185, 129, 0.2)`  | Positive XIRR, verified 2FA, live sync  |
| **Loss / Destructive**        | `#f43f5e` (Rose 500)    | `rgba(244, 63, 94, 0.1)`   | `rgba(244, 63, 94, 0.2)`   | Portfolio drawdown, delete confirmation |
| **Warning / Action Required** | `#f59e0b` (Amber 500)   | `rgba(245, 158, 11, 0.1)`  | `rgba(245, 158, 11, 0.2)`  | Rebalance trigger, pending email verify |
| **Info / Neutral**            | `#64748b` (Slate 500)   | `rgba(100, 116, 139, 0.1)` | `rgba(100, 116, 139, 0.2)` | Informational tooltips, secondary tags  |

### 2.4 Multi-Asset Allocation Palette

Used across portfolio allocation segmented bars and charts:

- **Equities & ETFs**: `#2563eb` (Cirrus Blue 600)
- **Mutual Funds & SIPs**: `#f59e0b` (Vibrant Amber 500)
- **EPF, PPF & Statutory**: `#10b981` (Emerald 500)
- **Gold, Silver & Liquid**: `#94a3b8` (Muted Slate 400) or repeating hatch pattern
- **Alternative Assets**: `#8b5cf6` (Purple 500)

---

## 3. Typography Architecture

The new UI strictly enforces a clean geometric sans-serif hierarchy paired with monospace tabular
numerals. **No serif fonts are permitted.**

```
┌────────────────────────────────────────────────────────┐
│  DISPLAY: Inter Tight (ExtraBold 800 / Bold 700)       │
│  Headlines, hero metric values, brand logo, sections   │
├────────────────────────────────────────────────────────┤
│  INTERFACE: Inter (Regular 400 / Medium 500 / Semi 600)│
│  UI text, buttons, body copy, descriptions, inputs     │
├────────────────────────────────────────────────────────┤
│  NUMERICS: Geist Mono (Tabular figures, tnum, zero)    │
│  Currency amounts, XIRR, timestamps, dates, codes      │
└────────────────────────────────────────────────────────┘
```

### 3.1 Type Scale

| Level                  | Font Family   | Size                                                 | Weight    | Tracking                     | Line Height                 | Example Target                            |
| :--------------------- | :------------ | :--------------------------------------------------- | :-------- | :--------------------------- | :-------------------------- | :---------------------------------------- |
| **Hero Display**       | `Inter Tight` | 56px–82px (`text-5xl`–`text-7xl` / `lg:text-[82px]`) | 800       | `-0.04em` (`tracking-tight`) | `1.04` (`leading-[1.04]`)   | Hero Title: _"See your entire wealth..."_ |
| **Section Header**     | `Inter Tight` | 32px–48px (`text-3xl`–`text-5xl`)                    | 700 / 800 | `-0.03em` (`tracking-tight`) | `1.1` (`leading-tight`)     | Bento Titles, Feature Section Headers     |
| **Card / Modal Title** | `Inter Tight` | 20px–24px (`text-xl`–`text-2xl`)                     | 700       | `-0.02em` (`tracking-tight`) | `1.2` (`leading-snug`)      | Dialog Titles, Bento Card Headers         |
| **Primary Metric**     | `Inter Tight` | 36px–48px (`text-4xl`–`text-5xl`)                    | 800       | `-0.04em` (`tracking-tight`) | `1.0` (`leading-none`)      | `₹48,92,400`, Consolidated Net Worth      |
| **Body Large / Lead**  | `Inter`       | 18px–20px (`text-lg`–`text-xl`)                      | 400 / 500 | `normal`                     | `1.625` (`leading-relaxed`) | Hero Subtitles, Lead paragraphs           |
| **Body Standard**      | `Inter`       | 14px–16px (`text-sm`–`text-base`)                    | 400 / 500 | `normal`                     | `1.5` (`leading-normal`)    | Form labels, card descriptions            |
| **UI Control**         | `Inter`       | 13px–14px (`text-[13px]`–`text-sm`)                  | 600       | `0.01em`                     | `1.0`                       | Buttons, Tabs, Navigation links           |
| **Micro Badge**        | `Inter`       | 10px–11px (`text-[10px]`–`text-[11px]`)              | 600 / 700 | `0.08em` (`tracking-wider`)  | `1.0`                       | Uppercase badges, category chips          |
| **Ledger Figure**      | `Geist Mono`  | 12px–18px (`text-xs`–`text-lg`)                      | 500 / 600 | `-0.02em`                    | `1.0`                       | Table amounts, XIRR, sub-millisecond      |

### 3.2 Canonical Landing Page Typography Implementation

The production landing page (`frontend/src/app/(public)/landing/page.jsx`) exemplifies this
architecture in its pure form:

#### 1. The Main Headline

> _"See your entire wealth in one clear, quiet view."_

```jsx
className =
  'font-display font-extrabold text-4xl sm:text-6xl md:text-7xl lg:text-[82px] text-neutral-950 tracking-tight leading-[1.04]';
```

- **Font Family**: `font-display` (`Inter Tight`)
- **Weight**: `font-extrabold` (`800`)
- **Size (Responsive)**: `text-4xl` on mobile, scaling fluidly to `sm:text-6xl`, `md:text-7xl`, and
  `lg:text-[82px]` on large displays.
- **Letter Spacing**: `tracking-tight` (`-0.04em` optical compensation for oversized display scales)
- **Line Height**: `leading-[1.04]` (ultra-compact display line height)
- **Color**: `text-neutral-950` (deep obsidian)

#### 2. The Subtitle / Body Paragraph

> _"Connect Zerodha, Upstox, and Angel One with your statutory EPF, PPF, mutual funds, and gold
> bullion..."_

```jsx
className =
  'text-neutral-700/90 text-sm sm:text-base md:text-lg lg:text-xl font-normal max-w-2xl mx-auto mt-6 leading-relaxed';
```

- **Font Family**: `font-sans` (`Inter` default)
- **Weight**: `font-normal` (`400`)
- **Size (Responsive)**: `text-sm` on mobile, scaling up to `lg:text-xl` on desktops.
- **Line Height**: `leading-relaxed` (`1.625` for effortless reading)
- **Color**: `text-neutral-700/90` (softened charcoal to preserve visual hierarchy)

#### 3. Data Figures, Small Labels & Numbers

- **Dynamic Ledger & Metrics**: `font-mono tabular-nums font-semibold` to prevent horizontal layout
  jitter when real-time numbers recalculate.
- **Micro Eyebrows & Status Pills**: `font-mono text-[10px]` or
  `font-sans text-[11px] font-semibold uppercase tracking-wider`.

---

## 4. Geometry, Elevation & Glassmorphism

### 4.1 Continuous Radii Scale

Squircle-inspired continuous curves provide tactile softness:

- **Outer Shell / Viewport Bento**: `rounded-[40px]` / `rounded-[36px]` / `rounded-[32px]`
- **Feature Cards**: `rounded-[28px]` / `rounded-3xl` (24px)
- **Dialogs & Popover Modals**: `rounded-[20px]` / `rounded-2xl` (16px)
- **Buttons, Inputs & Form Cards**: `rounded-xl` (12px) / `rounded-[10px]`
- **Pills, Badges, Segmented Tracks**: `rounded-full` (9999px)

### 4.2 Elevation & Shadow Layers

Shadows are diffused, multi-stop, and tinted to avoid muddy black outlines:

- `shadow-xs`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- `shadow-sm`: `0 1px 3px 0 rgba(0, 0, 0, 0.08)`
- `shadow-[0_8px_30px_rgb(0,0,0,0.04)]`: Floating segmented pills & navbar
- `shadow-[0_12px_36px_rgba(0,0,0,0.06)]`: Standard bento cards & token showcases
- `shadow-[0_20px_60px_-15px_rgba(15,23,42,0.14)]`: Floating dossier cards
- `shadow-[0_30px_90px_-20px_rgba(15,23,42,0.16)]`: Hero interactive 3D dashboard container

### 4.3 Glassmorphism Specifications

```css
/* Core Popover & Navbar Glass Surface */
background: rgba(255, 255, 255, 0.85);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border: 1px solid rgba(0, 0, 0, 0.08);
box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
```

---

## 5. Animation, Motion & Physics Architecture

### 5.1 Physics & Easing Curves

- **Apple Standard Motion**: `cubic-bezier(0.22, 1, 0.36, 1)` — used for entrances, page
  transitions, and smooth reveals.
- **Luminous Deceleration**: `cubic-bezier(0.16, 1, 0.3, 1)` — used for Lottie hover expansions and
  radial glows.
- **Spring Physics**: `stiffness: 350, damping: 30` (active tab pill layout) and
  `stiffness: 100, damping: 30` (scroll progress bar).
- **Tactile Click Response**: `active:scale-[0.97]` on all buttons, chips, and interactive cards.

### 5.2 Animated SVG Micro-Interactions

Used in `AnimatedSuccessIcon`, `AnimatedWarningIcon`, and interactive status dialogs:

- `@keyframes draw-circle`: `strokeDashoffset: 100 -> 0` (0.8s ease-in-out forwards)
- `@keyframes draw-check`: `strokeDashoffset: 50 -> 0` (0.5s ease-out 0.6s forwards)
- `@keyframes draw-triangle`: `strokeDashoffset: 120 -> 0` (0.8s ease-in-out forwards)
- `@keyframes check-scale-in`: `scale(0) rotate(-45deg)` -> `scale(1.18)` -> `scale(1)`

### 5.3 Lottie Ambient Backlight Halos

Luminous radial glow breathing animations preventing banding or muddy halos:

- `lottie-amber-breathe`: Luminous gold breathing (`4.5s ease-in-out infinite`)
- `lottie-cyan-breathe`: Luminous cyan breathing (`4.5s ease-in-out infinite`)
- `lottie-emerald-breathe`: Luminous emerald wealth breathing (`4.5s ease-in-out infinite`)
- `lottie-halo-pulse`: Multi-stop mathematical radial gradient breathing (`5s ease-in-out infinite`)

### 5.4 Dispatch & Trajectory Animations

- `airplane-fly`: 3D looping aerodynamic flight trajectory for verification and password reset
  screens.
- `airplane-shadow`: Dynamic ground shadow dilation in sync with flight elevation.
- `airplane-trail-1/2/3`: Triple staggered aerodynamic wind streak particles.
- `glow-ring-pulse`: Expanding emerald halo ring for authentication success states.
- `live-dot-pulse`: Pulsing 6px radar dot (`animate-pulse`) for real-time broker sync status.

---

## 6. Component Primitives Hierarchy

Located in `frontend/src/components/ui/primitives/`:

### 6.1 Buttons (`button.jsx`)

- Built with Radix Slot & `class-variance-authority` (CVA).
- **Variants**:
  - `default`: High-contrast solid obsidian (`bg-neutral-950 text-white hover:bg-neutral-900`)
  - `secondary`: Frosted glass
    (`bg-muted/50 text-foreground border border-border/40 backdrop-blur-md`)
  - `outline`: Translucent subtle border
    (`border border-border/60 bg-background/50 backdrop-blur-md`)
  - `ghost`: Transparent with hover fill
  - `destructive`: Rose tint (`bg-rose-500/10 text-rose-600 border-rose-500/20`)
  - `success`: Emerald tint (`bg-emerald-500/10 text-emerald-600 border-emerald-500/20`)
  - `warning`: Amber tint (`bg-amber-500/10 text-amber-600 border-amber-500/20`)
  - `link`: Underlined clean blue
- **Sizes**: `xs` (26px), `sm` (32px), `default` (36px), `lg` (40px), `xl` (44px), plus
  corresponding icon sizes.

### 6.2 Badges (`badge.jsx`)

- Continuous pill shape (`rounded-full`, `h-[22px]`).
- Uppercase tracking (`tracking-wider text-[11px] font-semibold`).
- Available in semantic variants: `default`, `secondary`, `success`, `destructive`, `warning`,
  `info`, `outline`.

### 6.3 Spotlight Search Input (`spotlight-input.jsx`)

- Raycast/Linear inspired frosted search bar
  (`bg-background/50 backdrop-blur-2xl border border-border/50`).
- Keyboard accelerator shortcut badge (`Cmd+K`).
- Quick-jump category suggestion dropdown with keyboard arrow-key navigation.

### 6.4 Currency Stepper (`currency-stepper.jsx`)

- Stripe / Apple Pay styled amount hero for investments.
- Live automated Indian rupee word denomination (`formatIndianAmount`: Lakhs / Crores).
- Integrated currency switcher (`INR`, `USD`, `EUR`) and quick-add chips (`+₹1,00,000`, `+₹25,000`,
  `+₹5,000`, `+₹1,000`).

### 6.5 Segmented Pill Navigation (`tabs.jsx` & `cointrack-navbar.jsx`)

- Floating frosted container:
  `rounded-[20px] bg-popover/80 backdrop-blur-xl border border-border/50`.
- Spring layout indicator transitioning smoothly between active destinations.

---

## 7. Accessibility & Implementation Standards

1. **Tabular Numbers Mandatory**: Always apply `tabular-nums` or `font-mono` on numbers,
   percentages, dates, and currency to prevent layout shifting during live recalculations.
2. **Reduced Motion**: All CSS animations in `system.css` automatically collapse to 0.01ms under
   `@media (prefers-reduced-motion: reduce)`.
3. **Contrast Compliance**: Text in both light and dark modes adheres to WCAG AA contrast (4.5:1 for
   body copy, 3:1 for large display titles).
4. **Zero Legacy Artifacts**: Do not introduce classes starting with `.ed-*` (Terminal Editorial).
   Use modern primitives and utility classes defined in `system.css`.

---

_Authored for the coinTrack Core UI Team — Cirrus Design System Specification._
