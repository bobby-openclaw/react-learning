---
id: 09-tailwind-fundamentals
sidebar_position: 10
title: "Chapter 9: Tailwind CSS Fundamentals"
---

# Chapter 9: Tailwind CSS Fundamentals

> You've been writing CSS the traditional way — class names, separate files, specificity battles. Tailwind CSS flips the model: instead of writing custom CSS, you compose pre-built utility classes directly in your markup. It sounds weird. Then it clicks, and you never go back.

> **📌 Where we are:** TaskFlow is fully functional — routing (Ch 7), validated forms (Ch 8), custom hooks, context. But it looks like a 1995 website. This chapter (and Ch 10) fix that. By the end, TaskFlow will have a modern, responsive design.

---

## 🧠 Concepts

### 1. Why Utility-First CSS?

Let's compare the approaches you've probably seen:

**Traditional CSS** — Custom class names, separate files:
```css
/* styles.css */
.task-card {
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.task-card:hover {
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
```
```tsx
<div className="task-card">...</div>
```

Problems: naming things is hard, styles drift from markup, dead CSS accumulates, specificity wars.

**CSS Modules** — Scoped styles per component:
```tsx
import styles from "./TaskCard.module.css";
<div className={styles.card}>...</div>
```

Better scoping, but still separate files and naming.

**Styled Components / CSS-in-JS** — Styles in JavaScript:
```tsx
const Card = styled.div`
  padding: 1rem;
  border-radius: 0.5rem;
`;
```

Runtime cost, bundle bloat, SSR complexity.

**Tailwind CSS** — Utility classes directly in markup:
```tsx
<div className="p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md">
  ...
</div>
```

No naming. No separate files. No dead CSS. What you see is what you get.

### 2. The Mental Shift

The initial reaction to Tailwind is always: *"That looks ugly! The HTML is full of classes!"*

Here's why it works:

1. **Colocation** — Styles live with the component, not in a separate file. When you delete a component, its styles are gone too. Zero dead CSS.

2. **Consistency** — Tailwind uses a design system (spacing scale, color palette, etc.). You can't accidentally use `padding: 13px` — you pick from a constrained set of values.

3. **Speed** — Once you learn the utility names, you style faster than writing custom CSS. No context switching between files.

4. **Tiny bundles** — Tailwind's compiler scans your code and only includes the utilities you actually use. A full Tailwind build is typically 8-15KB gzipped.

5. **No specificity issues** — Every utility has the same specificity. No `!important` wars.

### 3. How Tailwind Works Under the Hood

Tailwind is a **build-time** tool, not a runtime library:

```
Your JSX files → Tailwind scans for class names → Generates only the CSS you use → Tiny CSS output
```

Write `className="p-4 text-blue-500"` → Tailwind generates:
```css
.p-4 { padding: 1rem; }
.text-blue-500 { color: rgb(59 130 246); }
```

Nothing else. If you never use `text-red-500`, it's not in your CSS.

### 4. The Spacing Scale

Tailwind's spacing system is based on a `0.25rem` (4px) unit scale. Each number = that many 4px units:

- `p-1` → 4px, `p-2` → 8px, `p-4` → 16px, `p-8` → 32px

The same scale applies to `margin` (`m-`), `gap`, `width`, `height`, and more. You'll internalize the common ones (`p-2`, `p-4`, `p-6`, `p-8`) quickly — for the full list, see the [Tailwind spacing docs](https://tailwindcss.com/docs/padding).

**Arbitrary values:** Need a specific value not in the scale? Use brackets: `p-[13px]`, `w-[calc(100%-2rem)]`.

### 5. Responsive Design

Tailwind is **mobile-first**. Unprefixed utilities apply to all screen sizes. Breakpoint prefixes apply at that size *and up*:

- `sm:` (640px) → `md:` (768px) → `lg:` (1024px) → `xl:` (1280px) → `2xl:` (1536px)

Full breakpoint reference: [Tailwind responsive docs](https://tailwindcss.com/docs/responsive-design).

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 column on mobile, 2 on tablet, 3 on desktop */}
</div>
```

**Think mobile-first:** Start with the mobile layout, then add breakpoints for larger screens.

### 6. State Modifiers

Apply styles on specific states:

```tsx
<button className="
  bg-blue-500
  hover:bg-blue-600      /* mouse hover */
  focus:ring-2            /* keyboard focus */
  focus:ring-blue-400
  active:bg-blue-700      /* while clicking */
  disabled:opacity-50     /* disabled state */
  disabled:cursor-not-allowed
">
  Save
</button>
```

**Group and Peer** — Style children based on parent or sibling state:

```tsx
{/* Group: style children when parent is hovered */}
<div className="group cursor-pointer">
  <h3 className="group-hover:text-blue-500">Task Title</h3>
  <p className="group-hover:underline">Click to view</p>
</div>

{/* Peer: style element based on sibling state */}
<input className="peer" type="text" placeholder="Search..." />
<p className="hidden peer-focus:block text-sm text-gray-500">
  Type to search tasks
</p>
```

---

## 💡 Examples

### Installing Tailwind v4 with Vite

Tailwind CSS v4 (current) uses a new setup — it's simpler than v3:

```bash
npm install tailwindcss @tailwindcss/vite
```

Add the plugin to `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

Replace the contents of your `src/index.css`:

```css
@import "tailwindcss";
```

That's it. No `tailwind.config.js` needed for basic usage (v4 auto-detects content).

### Common Patterns at a Glance

You'll pick up utility names fast — they map directly to CSS properties. Here are the categories you'll use most: **typography** (`text-sm`, `font-bold`, `text-gray-500`), **spacing** (`p-4`, `m-2`, `space-y-4`), **borders** (`border`, `rounded-lg`, `shadow-sm`), and **colors** (`bg-blue-500`, `text-white`). Browse the full list at [tailwindcss.com/docs](https://tailwindcss.com/docs).

### Flexbox & Grid

```tsx
{/* Flexbox: horizontal bar with space between */}
<div className="flex items-center justify-between p-4">
  <h2 className="text-lg font-semibold">Tasks</h2>
  <button className="px-3 py-1.5 bg-blue-500 text-white rounded-md">+ Add Task</button>
</div>

{/* Grid: responsive columns */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <div className="bg-white p-4 rounded-lg shadow-sm">Card 1</div>
  <div className="bg-white p-4 rounded-lg shadow-sm">Card 2</div>
  <div className="bg-white p-4 rounded-lg shadow-sm">Card 3</div>
</div>
```

Flexbox docs: [tailwindcss.com/docs/flex](https://tailwindcss.com/docs/flex) · Grid docs: [tailwindcss.com/docs/grid-template-columns](https://tailwindcss.com/docs/grid-template-columns)

### A Complete Card Component in Tailwind

```tsx
interface TaskCardProps {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  status: string;
}

const priorityStyles = {
  low: "text-green-700 bg-green-50 border-green-200",
  medium: "text-yellow-700 bg-yellow-50 border-yellow-200",
  high: "text-red-700 bg-red-50 border-red-200",
};

export default function TaskCard({
  title,
  description,
  priority,
  status,
}: TaskCardProps) {
  return (
    <div className="group rounded-lg border border-gray-200 bg-white p-4
                    shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <h3 className="font-medium text-gray-900 group-hover:text-blue-600
                       transition-colors">
          {title}
        </h3>
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5
                      text-xs font-medium ${priorityStyles[priority]}`}
        >
          {priority}
        </span>
      </div>

      {description && (
        <p className="mt-2 text-sm text-gray-500 line-clamp-2">
          {description}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">{status}</span>
        <button className="text-xs text-gray-400 opacity-0 transition-opacity
                          group-hover:opacity-100 hover:text-blue-500">
          View →
        </button>
      </div>
    </div>
  );
}
```

Notice: `group` on the parent + `group-hover:` on children. The "View →" link only appears when you hover the card. No JavaScript needed.

---

## 🔨 Project Task: Rebuild TaskFlow with Tailwind

Time for a visual overhaul. We're ripping out all custom CSS and rebuilding with Tailwind utilities.

### Step 1: Install Tailwind

```bash
npm install tailwindcss @tailwindcss/vite
```

Update `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

Replace `src/index.css`:

```css
@import "tailwindcss";
```

Delete any component-specific `.css` files.

### Step 2: Rebuild the Layout

**`src/components/Layout.tsx`**
```tsx
import { Outlet, NavLink } from "react-router-dom";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-gray-100 text-gray-900"
      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
  }`;

const Layout = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white p-4 md:flex">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">📋 TaskFlow</h1>
        </div>

        <nav className="flex flex-col gap-1">
          <NavLink to="/" end className={navLinkClass}>
            📊 Dashboard
          </NavLink>
          <NavLink to="/settings" className={navLinkClass}>
            ⚙️ Settings
          </NavLink>
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">TaskFlow v0.9.0</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
```

### Step 3: Rebuild the Dashboard

Apply the same Tailwind patterns to `src/pages/Dashboard.tsx`:

- **Summary cards:** Use `grid grid-cols-1 gap-4 sm:grid-cols-3` for a responsive stats row
- **Task list:** `space-y-2` for vertical spacing, `hover:shadow-md` + `transition-shadow` on each Link
- **Status badges:** Dynamic classes with a `statusStyles` map (same pattern as `priorityStyles` in the card example above)
- **Empty state:** `py-8 text-center text-gray-400`

The full code follows the same patterns as the Layout — you have all the building blocks now.

### Step 4: Style the TaskForm

```tsx
// Inside TaskForm — replace className strings with Tailwind utilities:

<form onSubmit={handleSubmit(onValid)} noValidate className="space-y-4">
  <div className="space-y-1.5">
    <label htmlFor="title" className="text-sm font-medium text-gray-700">
      Title <span className="text-red-500">*</span>
    </label>
    <input
      id="title"
      type="text"
      placeholder="What needs to be done?"
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                focus:border-blue-500 focus:outline-none focus:ring-1
                focus:ring-blue-500"
      {...register("title")}
    />
    {errors.title && (
      <p className="text-sm text-red-600">{errors.title.message}</p>
    )}
  </div>

  {/* Repeat pattern for other fields... */}

  <button
    type="submit"
    disabled={isSubmitting}
    className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium
              text-white hover:bg-blue-700 focus:outline-none focus:ring-2
              focus:ring-blue-500 focus:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50"
  >
    {isSubmitting ? "Saving..." : submitLabel}
  </button>
</form>
```

### Step 5: Responsive Sidebar

The sidebar should collapse on mobile. Add a mobile header:

```tsx
// In Layout.tsx — add above <main>:
<div className="flex items-center justify-between border-b border-gray-200
               bg-white p-4 md:hidden">
  <h1 className="text-lg font-bold">📋 TaskFlow</h1>
  <button className="rounded-md p-2 text-gray-600 hover:bg-gray-100">
    {/* Hamburger icon — we'll replace with a proper icon later */}
    <span className="text-xl">☰</span>
  </button>
</div>
```

The sidebar uses `hidden md:flex` — invisible on mobile, visible from `md` breakpoint up.

### Step 6: Verify

- [ ] All custom CSS files are deleted
- [ ] Layout renders correctly — sidebar on desktop, hidden on mobile
- [ ] Cards have proper padding, borders, and shadows
- [ ] Hover states work (cards lift, nav items highlight)
- [ ] Text is readable and properly sized
- [ ] Form inputs have focus rings
- [ ] Responsive: stack to single column on mobile, multi-column on desktop
- [ ] No visual regressions from the CSS rewrite

---

## 🧪 Challenge

1. **Custom utility patterns:** Create a reusable set of Tailwind classes for badges. Define a `badgeVariants` object and use it throughout the app:

   ```tsx
   const badgeVariants = {
     todo: "bg-gray-100 text-gray-700",
     "in-progress": "bg-blue-50 text-blue-700",
     done: "bg-green-50 text-green-700",
   } as const;
   ```

2. **Skeleton loading:** Build a skeleton loader using Tailwind's `animate-pulse`:

   ```tsx
   <div className="animate-pulse space-y-3">
     <div className="h-4 w-3/4 rounded bg-gray-200" />
     <div className="h-4 w-1/2 rounded bg-gray-200" />
   </div>
   ```

3. **Responsive detail page:** Make the TaskDetail page show the sidebar info below the main content on mobile, and beside it on desktop using `flex-col md:flex-row`.

---

## 📚 Further Reading

- [Tailwind CSS Documentation](https://tailwindcss.com/docs) — the official docs (excellent search!)
- [Tailwind CSS v4 Blog Post](https://tailwindcss.com/blog/tailwindcss-v4) — what's new in v4
- [Tailwind Play](https://play.tailwindcss.com/) — live playground to experiment
- [Refactoring UI](https://www.refactoringui.com/) — the design book by Tailwind's creators
- [Why Tailwind (by its creator)](https://adamwathan.me/css-utility-classes-and-separation-of-concerns/) — the philosophy explained

---

**Next up: [Chapter 10 — Advanced Tailwind →](/chapters/10-advanced-tailwind)**

Custom themes, dark mode, animations, and advanced patterns to make TaskFlow look polished and professional.
