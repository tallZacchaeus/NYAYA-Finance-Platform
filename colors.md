# RCCG YAYA Finance Portal — Brand Color System (Solid Colors Only)

## Design Principle

**No gradients anywhere.** Every color is solid. This aligns with the logo itself, which uses flat ecclesiastical colors — and it reads as more formal, trustworthy, and institutional. Church finance tools should feel like official documents, not tech dashboards.

---

## The Complete Palette (Flat Colors)

### Royal Purple — the RCCG signature
```
#0A0616   — Page background (deepest)
#13093B   — Card background, sidebar
#1A0F4D   — Table headers, section headers, hover states
#1F1450   — Secondary hover, subtle surfaces
#2D1A73   — Borders, dividers, RCCG ring color
#3D2590   — Active/focus accent
```

### Imperial Gold — the YAYA crest
```
#8B6A28   — Deep gold (rare, decorative)
#BB913B   — Primary gold (borders, active nav, CTAs)
#D4A843   — Bright gold (monetary amounts, headings)
```

### Forest Green — the YAYA banner
```
#0F4E1E   — Deep green background
#146428   — Mid green (border accents)
#5EBE7C   — Status green (department indicators)
#8EDC9E   — Completed status text
```

### Support / Text
```
#F5E8D3   — Primary text (warm cream)
#A89FB8   — Secondary text (muted purple-grey)
```

### Status Colors (solid fills with contrasting text)

| Status | Background | Text |
|--------|-----------|------|
| Submitted | `#3D2A0A` | `#FBBF24` |
| Finance Reviewed | `#1A2F4D` | `#60A5FA` |
| SATGO Approved | `#3D2D0F` | `#D4A843` |
| Partial Payment | `#2E1F4D` | `#B794F4` |
| Paid | `#123D2A` | `#34D399` |
| Receipted | `#0F3D38` | `#2DD4BF` |
| Completed | `#0F4E1E` | `#8EDC9E` |
| Rejected | `#3D1F1F` | `#F87171` |

Department indicator dots (on budget bars):
```
#BB913B, #5EBE7C, #9F7AEA, #F87171, #60A5FA, #2DD4BF
```

---

## Usage Rules

### Surfaces (What color goes where)

- **Page background**: `#0A0616` — flat, no gradient
- **Sidebar**: `#13093B` — flat purple
- **Cards**: `#13093B` with `1px solid #2D1A73` border
- **Card headers (inside cards)**: `#1A0F4D` background
- **Hover on rows/items**: `#1A0F4D`
- **Input fields**: `#13093B` background, `#2D1A73` border
- **Modals**: `#13093B` background, `#2D1A73` border, black overlay at 60% opacity

### Borders

Every card, button, input, and container has a visible border. This replaces the depth that gradients and shadows used to provide.

- **Default border**: `#2D1A73`
- **Hover border**: `#BB913B` (gold — the universal "hovered" signal)
- **Active/selected border**: `#BB913B` with a 3px gold bar on the left
- **Error border**: `#F87171`
- **Success border**: `#146428`

### No Box Shadows

Instead of shadows for elevation, use:
- Solid borders to separate elements
- Slight `translateY(-3px)` on hover
- Background color change on hover (`#13093B` → `#1A0F4D`)

### Text Colors

- **Primary text** (titles, important content): `#F5E8D3`
- **Secondary text** (labels, descriptions): `#A89FB8`
- **Muted text** (timestamps, hints): `#A89FB8` at smaller font size
- **Gold text** (amounts, branding): `#D4A843`
- **Never use pure white.** Always `#F5E8D3` (warm cream).

### Monetary Amounts

All ₦ values use **flat gold** `#D4A843` with DM Serif Display font. No gradient text. Example:
```css
.amount {
    color: #D4A843;
    font-family: 'DM Serif Display', Georgia, serif;
    font-weight: 400;
}
```

### Buttons

**Primary (Gold)**
```css
background: #BB913B;
color: #1A0F4D;
border: 1px solid #BB913B;
/* Hover */
background: #D4A843;
```

**Secondary (Outline)**
```css
background: #13093B;
color: #BB913B;
border: 1px solid #BB913B;
/* Hover */
background: #BB913B;
color: #1A0F4D;
```

**Ghost**
```css
background: transparent;
color: #A89FB8;
border: 1px solid #2D1A73;
/* Hover */
background: #1F1450;
color: #F5E8D3;
```

**Destructive**
```css
background: transparent;
color: #F87171;
border: 1px solid #F87171;
/* Hover */
background: #3D1F1F;
```

### Active Navigation

Active sidebar item:
- Background: `#2D1A73`
- Text: `#D4A843`
- 3px gold bar on the left edge (`#BB913B`)

### Animations

Animations still happen — just no animated gradients:
- Fade + slide entrances (opacity + transform only)
- Animated number counters
- Progress bars (solid color growing from 0 to final width)
- Pulse dots on pending statuses
- Hover `translateY` lifts

No shimmer animations. No animated gradient backgrounds.

---

## Tailwind Config

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0A0616',
          card: '#13093B',
          hover: '#1A0F4D',
          subtle: '#1F1450',
        },
        royal: {
          DEFAULT: '#2D1A73',
          light: '#3D2590',
          dark: '#13093B',
        },
        gold: {
          deep: '#8B6A28',
          DEFAULT: '#BB913B',
          bright: '#D4A843',
        },
        forest: {
          deep: '#0F4E1E',
          DEFAULT: '#146428',
          light: '#5EBE7C',
          bright: '#8EDC9E',
        },
        text: {
          primary: '#F5E8D3',
          muted: '#A89FB8',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', '-apple-system', 'sans-serif'],
      },
    }
  }
}
```

---

## Instructions for Claude Code

When applying this to the project:

1. **Remove every `linear-gradient()` and `radial-gradient()`** from the codebase. Replace with flat colors from the palette above.
2. **Remove every `box-shadow`** except for the subtle hover lift (which uses `translateY` instead).
3. **Replace gradient text effects** (`-webkit-background-clip: text`) with solid `#D4A843`.
4. **Ensure every card, button, and container has a visible border** — borders are how elements are separated.
5. **Use darker surfaces for "elevated" content** (e.g., `#1A0F4D` for card headers inside `#13093B` cards) instead of shadow.
6. **Keep all animations** — fades, slides, counters, bars, pulses are fine. Just no animated gradients or shimmer.

The final result reads as authoritative, institutional, and distinctly ecclesiastical — appropriate for a platform managing ₦513M on behalf of the church.