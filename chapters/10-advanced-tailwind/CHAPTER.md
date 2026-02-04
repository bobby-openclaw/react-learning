# Chapter 10: Advanced Tailwind CSS

> You've got the fundamentals — utility classes, responsive design, state modifiers. Now let's go deeper: custom themes, dark mode, animations, and patterns that turn a "looks okay" app into a polished product. This is where TaskFlow starts to feel *designed*.

---

## 🧠 Concepts

### 1. Custom Theme Configuration

Tailwind v4 uses CSS-based configuration instead of the old `tailwind.config.js`. You customize your theme directly in your CSS file:

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --color-brand-50: #eff6ff;
  --color-brand-500: #3b82f6;
  --color-brand-600: #2563eb;
  --color-brand-700: #1d4ed8;

  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}
```

Now you can use `text-brand-500`, `bg-brand-50`, `font-sans`, etc. throughout your code.

> **Tailwind v4 vs v3:** In v3, you edited `tailwind.config.js` with a JavaScript object. In v4, everything lives in CSS with `@theme`. Much simpler. If you see JavaScript config files in tutorials, that's the old way.

### 2. Extending vs Overriding

When you define values in `@theme`, you **extend** the defaults — your custom values coexist with Tailwind's built-in ones.

```css
@theme {
  /* This ADDS brand colors alongside gray, red, blue, etc. */
  --color-brand-500: #6366f1;

  /* To OVERRIDE the entire color palette, you'd prefix with -- and
     use the full set. But usually extending is what you want. */
}
```

### 3. The @apply Directive — Use It Sparingly

`@apply` lets you compose Tailwind utilities into a traditional CSS class:

```css
/* src/index.css */
@layer components {
  .btn-primary {
    @apply rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white
           hover:bg-blue-700 focus:outline-none focus:ring-2
           focus:ring-blue-500 focus:ring-offset-2;
  }
}
```

```tsx
<button className="btn-primary">Save</button>
```

**Why use it sparingly?**

1. It defeats Tailwind's colocation benefit — styles are back in a separate file
2. It makes your CSS larger (utilities get duplicated)
3. It doesn't support all Tailwind features (some modifiers behave differently)

**When it makes sense:**
- Prose/article styling where utilities would be absurd
- Third-party components you can't add classes to
- Truly repeated patterns across 10+ components (but consider a React component first!)

**The rule of thumb:** If you can solve it with a React component that has utilities in JSX, do that instead of `@apply`.

### 4. Dark Mode

Tailwind supports dark mode with the `dark:` modifier. There are two strategies:

**Media strategy** (follows OS preference):
```css
/* Automatic — respects prefers-color-scheme */
@media (prefers-color-scheme: dark) { ... }
```

**Class strategy** (you control it):
```css
/* In v4, configure in CSS: */
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));
```

This makes the `dark:` modifier activate when a `.dark` class is on an ancestor element — typically `<html>`.

```tsx
// Toggle dark mode by adding/removing the class
document.documentElement.classList.toggle("dark");
```

**Using dark mode utilities:**
```tsx
<div className="bg-white dark:bg-gray-900">
  <h1 className="text-gray-900 dark:text-gray-100">Dashboard</h1>
  <p className="text-gray-500 dark:text-gray-400">Welcome back!</p>
</div>
```

Every color/background needs a `dark:` counterpart. It's more work upfront, but the result is a seamless dark theme.

### 5. Animations & Transitions

**CSS Transitions** — Smooth property changes:

```tsx
{/* Transition on hover */}
<div className="transition-all duration-200 ease-in-out
               hover:scale-105 hover:shadow-lg">
  Smooth hover effect
</div>

{/* Transition specific properties */}
<button className="transition-colors duration-150 bg-blue-500 hover:bg-blue-600">
  Click me
</button>
```

**Built-in animations:**

```tsx
<div className="animate-spin">🔄</div>     {/* Continuous rotation */}
<div className="animate-bounce">⬇️</div>   {/* Bouncing */}
<div className="animate-pulse">...</div>     {/* Fade in/out (loading skeletons) */}
<div className="animate-ping">🔔</div>      {/* Ping (notification dot) */}
```

**Custom keyframes** (in v4 CSS config):

```css
@theme {
  --animate-slide-in: slide-in 0.3s ease-out;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

```tsx
<div className="animate-slide-in">I slide in!</div>
```

### 6. Group and Peer Modifiers in Depth

These are powerful for interactive UI without JavaScript:

**`group`** — Style children based on parent state:
```tsx
<Link to={`/task/${task.id}`} className="group block rounded-lg border p-4">
  <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
    {task.title}
  </h3>
  {/* Actions appear only on hover */}
  <div className="mt-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
    <button className="text-xs text-gray-400 hover:text-blue-500">Edit</button>
    <button className="text-xs text-gray-400 hover:text-red-500">Delete</button>
  </div>
</Link>
```

**Named groups** — Multiple group scopes:
```tsx
<div className="group/card">
  <div className="group/header">
    <h3 className="group-hover/header:underline">Title</h3>
  </div>
  <p className="group-hover/card:text-gray-600">Description</p>
</div>
```

**`peer`** — Style based on sibling state:
```tsx
<div>
  <input
    type="checkbox"
    className="peer sr-only"
    id="toggle-done"
  />
  <label
    htmlFor="toggle-done"
    className="cursor-pointer rounded-md border px-3 py-1
              peer-checked:bg-green-500 peer-checked:text-white"
  >
    Mark as Done
  </label>
</div>
```

### 7. Container Queries

Style elements based on their **container's** size, not the viewport. Perfect for reusable components:

```tsx
<div className="@container">
  <div className="flex flex-col @md:flex-row @md:items-center gap-4">
    <h3 className="text-sm @lg:text-lg">Task Title</h3>
    <span className="hidden @md:inline">Extra info shown in wider containers</span>
  </div>
</div>
```

Container queries use `@` prefixed breakpoints. The component adapts based on how much space it has, not the screen size. This is a game-changer for component libraries.

### 8. Performance: content-visibility for Long Lists

> **Vercel tip:** For lists with hundreds of items, use `content-visibility` to skip rendering off-screen content:

```tsx
<div className="[content-visibility:auto] [contain-intrinsic-size:auto_80px]">
  {/* Browser skips rendering this div's contents when off-screen */}
  <TaskCard task={task} />
</div>
```

This is a CSS property (not Tailwind-specific) that tells the browser to skip layout/paint for off-screen elements. Massive performance win for long task lists. The `contain-intrinsic-size` tells the browser the estimated height so scrollbar calculations stay accurate.

---

## 💡 Examples

### Theme Toggle Component

Wire this up with the `ThemeContext` from Chapter 5:

```tsx
import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleTheme}
      className="rounded-lg p-2 text-gray-500 transition-colors
                hover:bg-gray-100 hover:text-gray-700
                dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <span className="text-lg">🌙</span>
      ) : (
        <span className="text-lg">☀️</span>
      )}
    </button>
  );
}
```

In your `ThemeProvider`, apply the class to `<html>`:

```tsx
useEffect(() => {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}, [theme]);
```

### Priority Badge with Color Coding

```tsx
const priorityConfig = {
  low: {
    label: "Low",
    classes: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
    dot: "bg-green-500",
  },
  medium: {
    label: "Medium",
    classes: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
    dot: "bg-yellow-500",
  },
  high: {
    label: "High",
    classes: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    dot: "bg-red-500",
  },
} as const;

function PriorityBadge({ priority }: { priority: "low" | "medium" | "high" }) {
  const config = priorityConfig[priority];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5
                  text-xs font-medium ${config.classes}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
```

### Animated Task Card

```tsx
function TaskCard({ task, index }: { task: Task; index: number }) {
  return (
    <div
      className="animate-slide-in rounded-lg border border-gray-200 bg-white p-4
                shadow-sm transition-all duration-200 hover:-translate-y-0.5
                hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between">
        <h3 className="font-medium text-gray-900 dark:text-gray-100">
          {task.title}
        </h3>
        <PriorityBadge priority={task.priority} />
      </div>
      {task.description && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {task.description}
        </p>
      )}
    </div>
  );
}
```

The `style={{ animationDelay }}` creates a staggered entrance — each card slides in slightly after the previous one.

### Loading Skeleton

```tsx
function TaskCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-gray-200 bg-white p-4
                   dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between">
        <div className="h-5 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-700" />
        <div className="h-4 w-4/5 rounded bg-gray-100 dark:bg-gray-700" />
      </div>
    </div>
  );
}

function TaskListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <TaskCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

---

## 🔨 Project Task: Polish TaskFlow

### Step 1: Set Up Custom Theme

Update `src/index.css`:

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  /* Brand colors */
  --color-brand-50: #eef2ff;
  --color-brand-100: #e0e7ff;
  --color-brand-500: #6366f1;
  --color-brand-600: #4f46e5;
  --color-brand-700: #4338ca;

  /* Fonts */
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;

  /* Custom animation */
  --animate-slide-in: slide-in 0.3s ease-out forwards;
  --animate-fade-in: fade-in 0.2s ease-out;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Base styles */
@layer base {
  body {
    @apply bg-gray-50 text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100;
  }
}
```

### Step 2: Wire Up Dark Mode

Update your `ThemeContext` to persist preference and apply the class:

```tsx
// src/context/ThemeContext.tsx
import { createContext, useState, useEffect, type ReactNode } from "react";

interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem("taskflow-theme");
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("taskflow-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  return (
    <ThemeContext value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext>
  );
}
```

> 🆕 **React 19:** Notice `<ThemeContext value={...}>` instead of `<ThemeContext.Provider value={...}>`. The `.Provider` is no longer needed!

### Step 3: Add Dark Mode to All Components

Go through each component and add `dark:` variants:

```tsx
// Sidebar
<aside className="hidden w-64 flex-col border-r border-gray-200 bg-white p-4
                 md:flex dark:border-gray-800 dark:bg-gray-900">

// Cards
<div className="rounded-lg border border-gray-200 bg-white p-4
               dark:border-gray-700 dark:bg-gray-800">

// Text
<h1 className="text-gray-900 dark:text-gray-100">
<p className="text-gray-500 dark:text-gray-400">

// Inputs
<input className="border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800
                 dark:text-gray-100 dark:placeholder-gray-500" />
```

### Step 4: Add the Theme Toggle to the Sidebar

```tsx
import ThemeToggle from "./ThemeToggle";

// In Layout.tsx sidebar, before the version text:
<div className="mt-auto flex items-center justify-between border-t
               border-gray-200 pt-4 dark:border-gray-800">
  <p className="text-xs text-gray-400">TaskFlow v0.10</p>
  <ThemeToggle />
</div>
```

### Step 5: Add Priority Color Coding

Create `src/components/PriorityBadge.tsx`:

```tsx
const priorityConfig = {
  low: {
    label: "Low",
    classes:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
    dot: "bg-green-500",
  },
  medium: {
    label: "Medium",
    classes:
      "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
    dot: "bg-yellow-500",
  },
  high: {
    label: "High",
    classes:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    dot: "bg-red-500 animate-pulse",
  },
} as const;

export default function PriorityBadge({
  priority,
}: {
  priority: "low" | "medium" | "high";
}) {
  const config = priorityConfig[priority];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5
                  py-0.5 text-xs font-medium ${config.classes}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
```

Note the `animate-pulse` on the high priority dot — a subtle visual indicator that this task needs attention.

### Step 6: Add Animated Transitions

Update task cards to animate on entry and hover:

```tsx
// In Dashboard task list:
{tasks.map((task, index) => (
  <Link
    key={task.id}
    to={`/task/${task.id}`}
    className="flex items-center justify-between rounded-lg border
              border-gray-200 bg-white p-4 transition-all duration-200
              hover:-translate-y-0.5 hover:shadow-md
              dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600
              animate-slide-in opacity-0"
    style={{ animationDelay: `${index * 50}ms`, animationFillMode: "forwards" }}
  >
    <div className="flex items-center gap-3">
      <span className="font-medium text-gray-900 dark:text-gray-100">
        {task.title}
      </span>
    </div>
    <PriorityBadge priority={task.priority} />
  </Link>
))}
```

### Step 7: Content-Visibility for Performance

If you have many tasks, wrap the list in a performance-optimized container:

```tsx
<div className="space-y-2">
  {tasks.map((task) => (
    <div
      key={task.id}
      className="[content-visibility:auto] [contain-intrinsic-size:auto_72px]"
    >
      <TaskRow task={task} />
    </div>
  ))}
</div>
```

### Step 8: Verify

- [ ] Toggle dark mode — entire app switches theme smoothly
- [ ] Theme persists across page refreshes (localStorage)
- [ ] Priority badges show correct colors with animated dot for high priority
- [ ] Task cards animate in with staggered delay
- [ ] Hover effects: cards lift slightly with shadow
- [ ] Brand color (`brand-500`) used for primary actions
- [ ] Dark mode has proper contrast — no hard-to-read text
- [ ] Mobile layout still works correctly

---

## 🧪 Challenge

1. **System preference sync:** Add a "System" option to the theme toggle that follows `prefers-color-scheme`. Use `window.matchMedia("(prefers-color-scheme: dark)")` and listen for changes.

2. **Transition the theme toggle:** When switching themes, add a smooth transition to background/text colors:
   ```css
   @layer base {
     html {
       @apply transition-colors duration-300;
     }
   }
   ```

3. **Status column layout:** On desktop, show tasks in a Kanban-style three-column layout (To Do | In Progress | Done) using CSS Grid. On mobile, show as a single list with tabs.

4. **Animated empty state:** When there are no tasks, show an animated illustration (use SVG or emoji with `animate-bounce`).

---

## 📚 Further Reading

- [Tailwind v4 Documentation](https://tailwindcss.com/docs) — the definitive reference
- [Tailwind Dark Mode](https://tailwindcss.com/docs/dark-mode) — official dark mode guide
- [Container Queries on MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)
- [content-visibility on web.dev](https://web.dev/articles/content-visibility) — deep dive on the performance property
- [Vercel: Optimizing CSS](https://vercel.com/blog) — best practices for CSS performance

---

**Next up: [Chapter 11 — shadcn/ui Setup & Core Components →](../11-shadcn-setup-core/CHAPTER.md)**

We'll bring in a professional component library built on top of Tailwind — consistent, accessible, and fully customizable because you own the code.
