# RCCG YAYA Finance Portal — Frontend UI Redesign Prompt

## CONTEXT

You are working on the Next.js 14 frontend for **RCCG YAYA Finance Portal** (formerly "NYAYA Finance Platform"). The app lives in the `/web` directory of the monorepo. It uses App Router, Tailwind CSS, React Hook Form + Zod, and Lucide icons.

The app is used by the **RCCG Special Adviser to the General Overseer (SATGO) on Young Adults and Youth Affairs** and their team. It manages budget planning, financial requests, multi-tier approvals, and payment tracking for large-scale church events (₦513M+ budgets, 16 departments, 100,000+ attendees). This is a high-stakes organizational tool that needs to look and feel premium — not like a generic admin template.

## REBRANDING

Rename the application everywhere in the codebase:
- **Old name:** NYAYA Finance / NYAYA Finance Platform
- **New name:** RCCG YAYA Finance Portal
- **Short name:** YAYA Finance
- **Reference prefix change:** `NYAYA-2026-00001` → `YAYA-2026-00001`
- Update page titles, meta tags, sidebar logos, email templates, and any hardcoded references.

## DESIGN SYSTEM — "Royal Grace"

Apply this design system globally across ALL pages. Do NOT leave any page using the old/default styling.

### Color Palette (use CSS variables in `globals.css` and Tailwind config)

```
--color-bg-primary: #080E18          (main background)
--color-bg-surface: #0B1929          (sidebar, elevated surfaces)
--color-bg-card: rgba(255,255,255,0.02)  (card backgrounds)
--color-bg-card-hover: rgba(255,255,255,0.04)

--color-navy: #0A1628               (deep navy, alternative bg)
--color-navy-mid: #1E3A5F           (secondary surfaces, borders)

--color-gold: #D4A843               (primary accent — highlights, active states, amounts, CTAs)
--color-gold-light: #F0D78C         (gold shimmer, hover states)
--color-gold-muted: rgba(212,168,67,0.5)  (subtle gold text)
--color-gold-bg: rgba(212,168,67,0.08)    (gold tinted backgrounds)

--color-text-primary: #F0F2F5       (main text on dark)
--color-text-secondary: rgba(240,242,245,0.5)  (secondary/muted text)
--color-text-tertiary: rgba(240,242,245,0.35)  (timestamps, hints)

--color-border: rgba(255,255,255,0.06)
--color-border-gold: rgba(212,168,67,0.12)

--color-status-pending: #FBBF24
--color-status-recommended: #60A5FA
--color-status-approved: #34D399
--color-status-paid: #A78BFA
--color-status-rejected: #F87171
--color-status-completed: #2DD4BF

--color-success: #22C55E
--color-warning: #FBBF24
--color-danger: #F87171
```

### Typography

Install and configure two Google Fonts:

1. **DM Serif Display** — headings, page titles, monetary amounts, stat numbers
2. **Plus Jakarta Sans** — body text, labels, buttons, form inputs, table content

Add to `web/app/layout.tsx` via `next/font/google`:
```tsx
import { DM_Serif_Display, Plus_Jakarta_Sans } from 'next/font/google';

const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: '400', variable: '--font-display' });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['300','400','500','600','700','800'], variable: '--font-body' });
```

Update `tailwind.config.ts`:
```ts
fontFamily: {
  display: ['var(--font-display)', 'Georgia', 'serif'],
  body: ['var(--font-body)', '-apple-system', 'sans-serif'],
}
```

Usage rules:
- `font-display` on: page titles, section headings, stat numbers, monetary values, event names
- `font-body` on: everything else (nav labels, buttons, form fields, table text, descriptions)
- **NEVER** use Inter, Roboto, Arial, or system fonts

### Backgrounds & Depth

- Main page background: `#080E18` with subtle radial gradients for depth:
  ```css
  background: radial-gradient(ellipse at 20% 0%, rgba(30,58,95,0.15) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 100%, rgba(212,168,67,0.04) 0%, transparent 50%),
              #080E18;
  ```
- Cards: `rgba(255,255,255,0.02)` with `border: 1px solid rgba(255,255,255,0.06)` and optional `backdrop-filter: blur(10px)`
- Elevated hover state on cards: subtle `translateY(-4px)` lift with a color-matched glow shadow
- Top bar / sticky headers: `backdrop-filter: blur(20px)` with semi-transparent background

### Borders & Dividers

- Default border: `rgba(255,255,255,0.06)`
- Gold accent border (active/important): `rgba(212,168,67,0.12)`
- Section dividers inside cards: `rgba(255,255,255,0.03)`
- **No thick borders. No solid white borders. Everything should feel like glass on dark.**

## ANIMATIONS & MOTION

Install **Framer Motion** (`npm install framer-motion` in the `/web` directory) and use it as the primary animation library.

### Page-Level Animations

Create a reusable `<AnimateIn>` wrapper component at `web/components/ui/animate-in.tsx`:

```tsx
// Wraps children with staggered fade+slide entrance
// Props: delay (ms), direction ('up' | 'left' | 'right'), duration (s)
```

Apply to every page — content should stagger in on load, not appear all at once.

### Specific Animation Requirements

1. **Staggered card entrance** — On any page with a grid of cards (dashboard stats, department list, budget cards), each card fades in and slides up with incrementing delays (0ms, 80ms, 160ms, etc.). Use `framer-motion` variants with `staggerChildren`.

2. **Animated number counters** — All monetary values and key stats on dashboard pages should count up from 0 to their final value over ~1.5s with an ease-out curve. Create a reusable `<AnimatedNumber>` component at `web/components/ui/animated-number.tsx`. Use `useInView` from framer-motion to trigger only when visible.

3. **Progress bar animations** — Budget utilization bars should animate from 0% to actual width over ~1s with a slight delay after the card appears. Create `<AnimatedProgressBar>` at `web/components/ui/animated-progress-bar.tsx`.

4. **Status badge pulse** — The "Pending" status badge should have a small pulsing dot (CSS animation, not JS) to draw attention to items needing action.

5. **Hover micro-interactions:**
   - Cards: `translateY(-4px)` + subtle glow shadow matching the card's accent color
   - Table rows: background shifts to `rgba(255,255,255,0.02)` with smooth transition
   - Buttons: slight scale (1.02) + border color brightens
   - Sidebar nav items: text color brightens + subtle background appears

6. **Sidebar collapse/expand** — Smooth width transition (0.4s cubic-bezier) when toggling sidebar. Content inside fades in/out. Logo area reduces to just the "Y" icon.

7. **Page transitions** — Wrap page content in `<motion.div>` with `initial={{ opacity: 0, y: 12 }}` and `animate={{ opacity: 1, y: 0 }}`.

8. **Floating ambient elements** — On the dashboard event banner, add 2-3 absolutely positioned divs with soft radial gradients that slowly float up and down (`translateY` oscillation over 6-8s). Purely decorative depth.

9. **Shimmer effect** — The "Active Event" label on the dashboard should have a gold gradient that slides across the text infinitely (CSS `background-size: 200%` + `animation: shimmer 3s linear infinite`).

10. **Modal/dialog entrance** — Any modals (reject reason, upload receipt, etc.) should scale in from 0.95 with a backdrop fade.

## COMPONENT LIBRARY

Create these reusable components under `web/components/ui/`:

### StatusBadge (`status-badge.tsx`)
- Takes `status: 'pending' | 'recommended' | 'approved' | 'paid' | 'rejected' | 'completed'`
- Renders a pill with background tint + text in the status color
- "Pending" gets a pulsing dot
- Small, compact — `text-xs font-semibold px-3 py-1 rounded-full`

### StatCard (`stat-card.tsx`)
- Icon, label, animated number value, subtitle/trend text
- Hover lift + glow effect
- Uses `font-display` for the number, `font-body` for everything else

### GoldButton (`gold-button.tsx`)
- Primary CTA button with gold gradient background (`linear-gradient(135deg, #D4A843, #B8860B)`)
- White/dark text, subtle shadow, hover brightens
- Variants: `solid` (gold bg), `outline` (gold border, transparent bg), `ghost` (just gold text)

### SidebarLayout (`sidebar-layout.tsx`)
- Collapsible sidebar with the YAYA branding
- Gold "Y" logo icon
- Navigation items with gold active indicator (3px bar on left)
- Sticky top bar with notification bell, user avatar, breadcrumb
- Responsive: sidebar auto-collapses on mobile, becomes a slide-out drawer

### DataTable (`data-table.tsx`)
- Styled to match the dark theme — no white backgrounds
- Row hover: `rgba(255,255,255,0.02)` background
- Header row: slightly elevated with `rgba(255,255,255,0.04)` background
- Pagination controls styled in the dark theme
- Staggered row entrance animation on first load

### EmptyState (`empty-state.tsx`)
- Centered illustration/icon + title + description + optional CTA
- Used when a table or list has no data yet

### NairaAmount (`naira-amount.tsx`)
- Formats and displays monetary values with the ₦ symbol
- Uses `font-display` and gold color for amounts
- Optional `animated` prop to use the counter animation
- Formats with `en-NG` locale: `₦11,000,000` or `₦11.0M` (compact mode)

## PAGE-BY-PAGE REQUIREMENTS

Apply the design system to every page. Below are the pages and what each should look like:

### 1. Login Page (`web/app/(auth)/login/page.tsx`)
- Dark background with centered card
- YAYA logo prominently at top (gold "Y" icon + "RCCG YAYA Finance Portal" text)
- Clean form: email + password inputs with dark-themed styling
- Gold primary button "Sign In"
- Subtle floating gradient orbs in background for visual interest
- Form inputs: dark background (`rgba(255,255,255,0.04)`), light border, white text, gold focus ring

### 2. Registration Page (`web/app/(auth)/register/page.tsx`)
- Same aesthetic as login
- Additional fields: name, phone, department (dropdown)
- "Create Account" gold button

### 3. Dashboard (`web/app/(dashboard)/page.tsx` or `/dashboard/page.tsx`)
- This is the main page. Full redesign matching the "Royal Grace" design.
- **Event banner** at top: active event name, venue, date, attendance, total budget (animated counter)
- **4 stat cards** in a row: Total Requests, Pending Approval, Budget Utilized %, Departments Active — all with animated numbers
- **Recent Requests table**: 6-8 most recent, showing reference, title, department, amount (gold), status badge, date
- **Department Budget sidebar/panel**: Top 6 departments with name, animated progress bar (color-coded), spent/allocated amounts
- **Quick action buttons** at bottom: "New Finance Request", "Import Budget", "Export Report" — each with distinct accent colors
- Everything staggers in on load

### 4. Requests List (`web/app/(dashboard)/requests/page.tsx`)
- Top: filters bar (event dropdown, department dropdown, status multi-select, search input) — dark themed
- DataTable with columns: Reference, Title, Department, Amount, Status, Date, Actions
- Amount column uses gold `font-display`
- Status column uses `<StatusBadge>`
- Row click navigates to detail view
- Staggered row entrance
- Pagination at bottom

### 5. Request Detail (`web/app/(dashboard)/requests/[id]/page.tsx`)
- Two-column layout on desktop
- **Left column (wide):** Request info card (title, description, reference, type, quantity, unit cost, total amount), documents list with download links, receipt section
- **Right column (narrow):** Status timeline showing the approval chain vertically (pending → recommended → approved → paid → completed) with timestamps and actor names. Active step is gold, completed steps are green, future steps are muted.
- **Action buttons** at bottom based on `can` object from API: Recommend, Approve, Reject (opens modal for reason), Mark Paid, Upload Receipt
- Rejection modal: dark-themed with textarea for reason, gold-outlined "Reject" button in red accent

### 6. New Request Form (`web/app/(dashboard)/requests/new/page.tsx`)
- Dark-themed form card
- Fields: Event (dropdown), Department (auto-filled based on user), Title, Description (textarea), Request Type (radio: Cash Disbursement / Procurement), Quantity, Unit Cost, supporting documents (drag-and-drop upload area)
- Live total calculation: Quantity × Unit Cost = Total (displayed in gold `font-display`)
- "Submit Request" gold button
- Form validation with Zod — error messages in red-tinted badges below fields

### 7. Admin: Departments (`web/app/(dashboard)/admin/departments/page.tsx`)
- Grid of department cards — each showing name, description, team lead name, request count, budget status
- "Add Department" gold button in top right
- Card hover lifts with accent glow

### 8. Admin: Events (`web/app/(dashboard)/admin/events/page.tsx`)
- List/grid of events with status badge (planning/active/completed/cancelled)
- Each event card: name, date, venue, total budget, department count
- "Create Event" gold button

### 9. Event Dashboard (`web/app/(dashboard)/admin/events/[id]/dashboard/page.tsx`)
- The "Summary" view — most data-rich page
- Event header with key stats
- Budget breakdown by department (table + visual bars)
- Request distribution by status (could use a simple donut chart or segmented bar)
- Recent activity feed
- All monetary values animated

### 10. Budget Import (`web/app/(dashboard)/admin/events/[id]/import/page.tsx`)
- Step 1: Drag-and-drop Excel file upload area (dashed border, gold accent on hover/drag)
- Step 2: Preview table showing parsed departments + line items + amounts
- Step 3: Confirm & import button
- Progress indicator showing current step

### 11. Notifications Page (`web/app/(dashboard)/notifications/page.tsx`)
- List of notifications grouped by date
- Unread notifications have a subtle gold left border
- Mark all read button
- Each notification: icon, message, timestamp, link to relevant request

### 12. Team Lead Dashboard (`web/app/(dashboard)/team-lead/page.tsx`)
- Scoped view of their department only
- Department budget overview (allocated/spent/remaining with animated bar)
- Their department's pending requests that need recommendation
- Quick action: "Recommend" or "View" on each pending request

## GLOBAL LAYOUT CHANGES

### `web/app/layout.tsx`
- Set both font variables on `<body>`
- Background color: `#080E18`
- Default text color: `#F0F2F5`
- Import global CSS with the CSS variables defined above

### `web/app/(dashboard)/layout.tsx`
- Use `<SidebarLayout>` as the wrapper
- Sidebar on left, content area on right with top bar
- Top bar: "RCCG YAYA Finance Portal" subtitle, breadcrumb, notification bell with unread count badge, user avatar + name + role

### `web/tailwind.config.ts`
- Extend colors with all the CSS variable references
- Add the two font families
- Add custom animations: `fadeSlideIn`, `pulse`, `shimmer`, `float`
- Extend `transitionTimingFunction` with `cubic-bezier(0.16, 1, 0.3, 1)` as `'out-expo'`

### `web/globals.css`
- Define all CSS variables under `:root`
- Custom scrollbar styling (thin, gold-tinted thumb on transparent track)
- Base keyframe definitions for `shimmer`, `pulse`, `float`
- Selection color: gold tinted

## FILE UPLOAD AREAS

All file upload zones (documents, receipts, budget import) should use:
- Dashed border (`rgba(255,255,255,0.1)`)
- On drag-over: border turns gold, background gets subtle gold tint
- Icon + "Drag & drop or click to upload" text
- File type restrictions shown below
- After upload: file appears as a chip/card with filename, size, and remove button

## IMPORTANT CONSTRAINTS

1. **This is a dark theme application.** No white backgrounds anywhere. No light mode toggle needed for v1.
2. **Currency is NGN (₦).** Format all amounts using `en-NG` locale. Display large amounts in compact form where space is tight (₦11.0M instead of ₦11,000,000).
3. **Reference prefix is now `YAYA-`** not `NYAYA-`.
4. **Keep all existing functionality.** This is a UI redesign, not a feature change. All forms, API calls, validation, and business logic stay the same.
5. **Mobile responsive.** Sidebar collapses to a hamburger drawer. Stat cards stack to 2×2 grid. Tables become horizontally scrollable. Forms go full-width.
6. **Accessibility.** Maintain proper contrast ratios (the gold on dark navy passes WCAG AA for large text). All interactive elements must be keyboard-navigable. Proper aria labels on icon-only buttons.
7. **Do NOT install a UI component library** (no shadcn, no MUI, no Chakra). Build the components from scratch with Tailwind + Framer Motion. The existing Lucide icons are fine to keep.
8. **Performance.** Use `next/font` for fonts (not CDN links). Lazy-load animations below the fold. Don't animate more than opacity + transform (avoid animating layout properties).

## EXECUTION ORDER

1. Install Framer Motion: `cd web && npm install framer-motion`
2. Set up fonts in `layout.tsx` via `next/font/google`
3. Update `tailwind.config.ts` with new colors, fonts, animations
4. Update `globals.css` with CSS variables, keyframes, scrollbar styles
5. Build reusable components: `AnimateIn`, `AnimatedNumber`, `AnimatedProgressBar`, `StatusBadge`, `StatCard`, `GoldButton`, `NairaAmount`, `SidebarLayout`, `DataTable`, `EmptyState`
6. Redesign the dashboard layout (`(dashboard)/layout.tsx`) with sidebar
7. Redesign the main dashboard page
8. Redesign each subsequent page (login, requests list, request detail, new request form, admin pages, etc.)
9. Update all text references from "NYAYA" to "YAYA"
10. Test responsiveness on mobile viewport
11. Verify all existing functionality still works after the reskin