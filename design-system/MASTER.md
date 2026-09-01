# AI Tools Directory — Master Design System

## Product Identity

**Product:** AI Tools Directory + Smart Links + Analytics Platform
**Personality:** Premium, Modern, Clean, Trustworthy, Technical, Editorial, Fast, Professional
**Feel:** A serious technology product — not a generic AI SaaS template.

---

## Anti-Patterns (AVOID)

- Purple gradients as primary branding
- Neon/glowing effects
- Glassmorphism / frosted glass
- Huge glowing background blobs
- Rounded-everything (pill shapes everywhere)
- Decorative animations / parallax
- Emoji as UI icons
- Fake 3D illustrations
- Excessive shadow depth
- Overly saturated colors

---

## Color System

### Primitive Tokens
```css
--color-slate-50: #f8fafc;
--color-slate-100: #f1f5f9;
--color-slate-200: #e2e8f0;
--color-slate-300: #cbd5e1;
--color-slate-400: #94a3b8;
--color-slate-500: #64748b;
--color-slate-600: #475569;
--color-slate-700: #334155;
--color-slate-800: #1e293b;
--color-slate-900: #0f172a;
--color-slate-950: #020617;

--color-blue-50: #eff6ff;
--color-blue-100: #dbeafe;
--color-blue-200: #bfdbfe;
--color-blue-500: #3b82f6;
--color-blue-600: #2563eb;
--color-blue-700: #1d4ed8;

--color-emerald-50: #ecfdf5;
--color-emerald-100: #d1fae5;
--color-emerald-500: #10b981;
--color-emerald-600: #059669;

--color-amber-50: #fffbeb;
--color-amber-100: #fef3c7;
--color-amber-500: #f59e0b;
--color-amber-600: #d97706;

--color-red-50: #fef2f2;
--color-red-500: #ef4444;
--color-red-600: #dc2626;
```

### Semantic Tokens
```css
--color-background: #ffffff;
--color-foreground: #0f172a;
--color-muted: #f8fafc;
--color-muted-foreground: #64748b;
--color-border: #e2e8f0;
--color-ring: #3b82f6;

--color-primary: #0f172a;
--color-primary-foreground: #ffffff;
--color-primary-hover: #1e293b;

--color-accent: #f1f5f9;
--color-accent-foreground: #0f172a;

--color-success: #059669;
--color-warning: #d97706;
--color-error: #dc2626;
```

### Usage Rules
- Primary actions use slate-900 (dark, not blue)
- Links and interactive highlights use blue-600
- Never use gradients for primary UI elements
- Background is always white or slate-50
- Text is always slate-900 or slate-600

---

## Typography

### Font Stack
- **Headings:** Inter (700, 600)
- **Body:** Inter (400, 500)
- **Monospace:** JetBrains Mono (for code/technical)

### Type Scale
| Token | Size | Line Height | Weight | Use |
|-------|------|-------------|--------|-----|
| --text-xs | 12px | 16px | 400 | Labels, metadata |
| --text-sm | 14px | 20px | 400/500 | Secondary text |
| --text-base | 16px | 24px | 400 | Body text |
| --text-lg | 18px | 28px | 500 | Subheadings |
| --text-xl | 20px | 28px | 600 | Section titles |
| --text-2xl | 24px | 32px | 700 | Page titles |
| --text-3xl | 30px | 36px | 700 | Hero titles |
| --text-4xl | 36px | 40px | 700 | Display |

### Rules
- Headings: font-weight 700, letter-spacing -0.02em
- Body: font-weight 400, line-height 1.6
- Never use more than 2 font sizes in a single component
- Max line length for body: 65-75 characters

---

## Spacing Scale

| Token | Value | Use |
|-------|-------|-----|
| --space-0 | 0px | Reset |
| --space-1 | 4px | Tight gaps |
| --space-2 | 8px | Small gaps |
| --space-3 | 12px | Component internals |
| --space-4 | 16px | Standard gaps |
| --space-5 | 20px | Medium spacing |
| --space-6 | 24px | Card padding |
| --space-8 | 32px | Section gaps |
| --space-10 | 40px | Large section gaps |
| --space-12 | 48px | Page section spacing |
| --space-16 | 64px | Major section breaks |
| --space-20 | 80px | Hero padding |
| --space-24 | 96px | Page margins |

---

## Grid & Layout

### Container Widths
| Breakpoint | Max Width | Padding |
|------------|-----------|---------|
| Default | 1200px | 24px |
| sm (640px) | 640px | 24px |
| md (768px) | 768px | 32px |
| lg (1024px) | 1024px | 32px |
| xl (1280px) | 1200px | 32px |

### Grid
- 12-column grid
- Column gap: 24px
- Row gap: 24px (cards), 16px (compact)

---

## Border Radius

| Token | Value | Use |
|-------|-------|-----|
| --radius-sm | 4px | Tags, badges |
| --radius-md | 6px | Buttons, inputs |
| --radius-lg | 8px | Cards, modals |
| --radius-xl | 12px | Featured cards |
| --radius-full | 9999px | Pills, avatars |

---

## Shadows

| Token | Value | Use |
|-------|-------|-----|
| --shadow-xs | 0 1px 2px rgba(0,0,0,0.05) | Subtle elevation |
| --shadow-sm | 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06) | Cards |
| --shadow-md | 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06) | Hover states |
| --shadow-lg | 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05) | Dropdowns, modals |

---

## Buttons

### Variants
| Variant | Background | Text | Border | Use |
|---------|------------|------|--------|-----|
| primary | slate-900 | white | none | Main CTA |
| secondary | white | slate-900 | slate-200 | Secondary actions |
| ghost | transparent | slate-600 | none | Subtle actions |
| link | transparent | blue-600 | none | Inline navigation |

### Sizes
| Size | Height | Padding X | Font Size |
|------|--------|-----------|-----------|
| sm | 32px | 12px | 13px |
| md | 36px | 16px | 14px |
| lg | 44px | 24px | 15px |

### States
- Hover: darken background by 1 shade
- Focus: 2px ring offset (ring color: blue-500)
- Disabled: opacity 0.5, cursor not-allowed
- Active: darken further

---

## Cards

### Variants
| Variant | Shadow | Border | Radius | Use |
|---------|--------|--------|--------|-----|
| default | xs | 1px slate-200 | lg | Standard card |
| elevated | md | none | lg | Featured content |
| interactive | xs → md | 1px slate-200 | lg | Clickable (hover lift) |

### Anatomy
```
┌─────────────────────────────────┐
│ [Icon/Logo]                     │
│ Title                           │
│ Description (2 lines max)       │
│                                 │
│ [Badges]           [Rating]     │
├─────────────────────────────────┤
│ Tags row                        │
└─────────────────────────────────┘
```

### Spacing
- Padding: 24px
- Gap between sections: 12-16px
- Hover transition: 200ms ease

---

## Forms

### Input
- Height: 40px
- Padding: 0 12px
- Border: 1px slate-300
- Border radius: 6px
- Focus: border blue-500, ring blue-500/20%
- Error: border red-500

### Select
- Same as input
- Custom arrow indicator

---

## Navigation

### Header
- Height: 64px
- Background: white
- Border-bottom: 1px slate-200
- Position: sticky, top 0
- Logo left, nav center, actions right
- Mobile: hamburger menu

### Sidebar (Admin)
- Width: 256px
- Background: white
- Border-right: 1px slate-200
- Nav items: 40px height, rounded-md
- Active: slate-50 bg, slate-900 text

---

## Tables

### Structure
- Header: slate-50 bg, slate-500 text, 12px uppercase
- Rows: white bg, hover slate-50
- Cells: 12px 16px padding
- Border-bottom: 1px slate-100
- Compact row height: 48px

---

## Badges

### Variants
| Variant | Background | Text |
|---------|------------|------|
| default | slate-900 | white |
| secondary | slate-100 | slate-700 |
| success | emerald-50 | emerald-600 |
| warning | amber-50 | amber-600 |
| error | red-50 | red-600 |

### Size
- Padding: 2px 8px
- Font: 12px, medium
- Radius: 4px

---

## Icons

- **Library:** Lucide React
- **Size:** 18px (default), 16px (sm), 20px (lg)
- **Stroke:** 1.5
- **Color:** inherit from parent
- **Never use emoji as icons**

---

## Charts

- Use Recharts with the color palette above
- Chart colors: slate-900, blue-500, emerald-500, amber-500
- Grid lines: slate-100
- Axis text: slate-500, 12px
- Tooltip: white bg, shadow-md, rounded-lg

---

## States

### Loading
- Skeleton animation: slate-200 → slate-100 pulse
- Duration: 2s infinite

### Empty
- Centered icon + message + action
- Icon: 48px, slate-300
- Message: slate-500, text-base
- Action: primary button

### Error
- Red accent
- Clear error message
- Retry action

---

## Responsive Rules

| Breakpoint | Layout Changes |
|------------|---------------|
| < 640px | Single column, stacked nav, full-width cards |
| 640-768px | 2-column grid, collapsible sidebar |
| 768-1024px | 2-3 column grid, visible sidebar |
| > 1024px | 3-4 column grid, full sidebar |

### Mobile-Specific
- Touch targets: minimum 44px
- Bottom spacing for fixed elements: 16px
- Font sizes stay the same (no reduction)

---

## Accessibility

- Focus visible: 2px solid blue-500 with 2px offset
- Contrast: minimum 4.5:1 for text, 3:1 for large text
- Semantic HTML: header, nav, main, footer, article
- ARIA labels on icon-only buttons
- Keyboard navigation: tab order follows visual order
- Reduced motion: disable transitions/animations
- Screen reader: alt text on images, labels on inputs

---

## Animation

- Duration: 150ms (fast), 200ms (normal), 300ms (slow)
- Easing: ease-in-out
- Hover transitions: background, color, shadow, transform
- Transform on hover: translateY(-2px) for cards
- No entrance animations on page load
- Respect prefers-reduced-motion

---

## Page-Specific Notes

See individual page files in `design-system/pages/` for deviations from this master system.
