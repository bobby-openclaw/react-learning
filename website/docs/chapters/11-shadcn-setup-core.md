---
id: 11-shadcn-setup-core
sidebar_position: 12
title: "Chapter 11: shadcn/ui — Setup & Core Components"
---

# Chapter 11: shadcn/ui — Setup & Core Components

> You've built TaskFlow's UI from scratch with Tailwind. It works, but you're reinventing the wheel — building buttons with consistent variants, accessible inputs with proper focus states, card layouts that handle edge cases. **shadcn/ui** gives you production-quality, accessible components that you *own* (not import from a library). It's copy-paste, not a dependency.

> **📌 Where we are:** TaskFlow has Tailwind styling with dark mode (Ch 9-10). The UI is custom-built and looks decent, but we're maintaining our own button variants, input states, and card styles. Time to replace that handcrafted code with battle-tested shadcn components.

---
id: 11-shadcn-setup-core

## 🧠 Concepts

### 1. What shadcn/ui Is — And Isn't

**shadcn/ui is NOT a component library.** You don't `npm install` it and import from `@shadcn/ui`. Instead, it's a **collection of copy-paste components** that get added directly to your project.

When you run `npx shadcn@latest add button`, it copies the `Button` component source code into your project (typically `src/components/ui/button.tsx`). You own it. You can edit it, customize it, break it, fix it. No version conflicts, no upgrade headaches.

```
Traditional library:     node_modules/@mui/material/Button → import { Button }
                         ↓ You can't edit this. Upgrade = breaking changes.

shadcn/ui approach:      src/components/ui/button.tsx → import { Button }
                         ↓ It's YOUR code. Change anything.
```

### 2. How It Differs from MUI, Chakra, Ant Design

| | MUI / Chakra / Ant | shadcn/ui |
|---|---|---|
| **Installation** | npm dependency | Copy into your project |
| **Updates** | `npm update` (breaking changes) | Re-run CLI to update individual components |
| **Customization** | Theme overrides, limited | Edit the source code directly |
| **Bundle size** | Large (even with tree-shaking) | Only what you copy |
| **Styling** | Emotion/styled-components/CSS-in-JS | Tailwind CSS (zero runtime) |
| **Accessibility** | Built-in | Built-in (via Radix primitives) |
| **Learning curve** | Learn the library's API | Learn the primitives (Radix + Tailwind) |
| **Lock-in** | High (migration is painful) | None (it's just React code) |

**The philosophy:** Instead of abstracting everything behind a black-box API, shadcn/ui gives you the building blocks and says "here, make it yours." You understand every line of your component code.

### 3. The Architecture: Radix + Tailwind

shadcn/ui components are built on two foundations:

**Radix UI Primitives** — Headless (unstyled) accessible UI primitives. They handle:
- Keyboard navigation
- Focus management
- ARIA attributes
- Screen reader support
- Portal rendering (for modals, dropdowns)

**Tailwind CSS** — All visual styling. Radix provides the behavior, Tailwind provides the look.

```
┌─────────────────────────────────┐
│  shadcn/ui component            │
│  ┌───────────────────────────┐  │
│  │  Radix Primitive          │  │
│  │  (accessibility, behavior)│  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │  Tailwind classes         │  │
│  │  (visual styling)         │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │  cva (variant management) │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### 4. class-variance-authority (cva) — Component Variants

`cva` is a tiny utility for managing component variants. Instead of a messy chain of ternaries for different button styles, you declare variants declaratively:

```tsx
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  // Base classes (always applied)
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2",
  {
    variants: {
      // Named variant groups
      variant: {
        default: "bg-brand-600 text-white hover:bg-brand-700",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-gray-300 bg-white hover:bg-gray-50",
        ghost: "hover:bg-gray-100",
        link: "text-brand-600 underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    // Default values
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Usage:
buttonVariants({ variant: "destructive", size: "sm" })
// → "inline-flex items-center ... bg-red-600 text-white ... h-8 px-3 text-xs"
```

This is vastly cleaner than:
```tsx
// Don't do this
className={`btn ${variant === "destructive" ? "bg-red-600" : variant === "outline" ? "border ..." : "bg-brand-600 ..."} ${size === "sm" ? "h-8 px-3" : size === "lg" ? "h-12 px-6" : "h-10 px-4"}`}
```

### 5. The cn() Utility — Merging Classes Safely

shadcn/ui components use a `cn()` helper that combines `clsx` (conditional classes) with `tailwind-merge` (deduplication):

```tsx
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Why is this needed? Because Tailwind classes can conflict:

```tsx
// Without tailwind-merge:
clsx("px-4 py-2", "px-8")
// → "px-4 py-2 px-8" — both px-4 AND px-8 apply! Which wins? Last one? Specificity?

// With tailwind-merge (via cn):
cn("px-4 py-2", "px-8")
// → "py-2 px-8" — px-4 is removed, px-8 wins cleanly
```

This lets consumers override component styles safely:

```tsx
<Button className="px-8">Wide Button</Button>
// The component's default px-4 gets replaced by px-8. No conflict.
```

### 6. The Component Pattern

Every shadcn/ui component follows this pattern:

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("base-classes...", {
  variants: { /* ... */ },
  defaultVariants: { /* ... */ },
});

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
```

Key patterns:
1. **Extends native HTML attributes** — accepts everything a `<button>` does
2. **`className` passthrough** — consumers can add/override styles via `cn()`
3. **Variant props** — type-safe via `VariantProps<typeof buttonVariants>`
4. **Spread remaining props** — `{...props}` passes through `onClick`, `disabled`, etc.

> 🆕 **React 19:** Notice there's no `forwardRef` wrapper! In React 19, `ref` is just a prop, so shadcn components can accept refs naturally without the `forwardRef` dance.

---
id: 11-shadcn-setup-core

## 💡 Examples

### Installing shadcn/ui with Vite

```bash
npx shadcn@latest init
```

The CLI asks you some questions:

```
Which style would you like to use? → New York
Which color would you like to use as base color? → Slate
Would you like to use CSS variables for colors? → Yes
```

This creates:
- `components.json` — configuration file
- `src/lib/utils.ts` — the `cn()` helper
- Updates your CSS with shadcn's CSS variables

### Adding Components

```bash
# Add individual components
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add separator
```

Each command copies the component to `src/components/ui/`. Let's look at what you get:

### Button — The Workhorse

```tsx
import { Button } from "@/components/ui/button";

// Variants
<Button variant="default">Primary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Subtle</Button>
<Button variant="link">Learn more</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><PlusIcon /></Button>

// With loading state
<Button disabled>
  <span className="animate-spin mr-2">⏳</span>
  Saving...
</Button>

// As a link (using asChild from Radix)
<Button asChild>
  <Link to="/settings">Go to Settings</Link>
</Button>
```

### Input — Accessible by Default

```tsx
import { Input } from "@/components/ui/input";

<div className="space-y-2">
  <label htmlFor="title" className="text-sm font-medium">
    Task Title
  </label>
  <Input
    id="title"
    placeholder="What needs to be done?"
    {...register("title")}
  />
  {errors.title && (
    <p className="text-sm text-red-500">{errors.title.message}</p>
  )}
</div>
```

### Card — Structured Content

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Task Summary</CardTitle>
    <CardDescription>Overview of your current tasks</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center">
        <p className="text-2xl font-bold">12</p>
        <p className="text-sm text-muted-foreground">To Do</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-blue-500">5</p>
        <p className="text-sm text-muted-foreground">In Progress</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-green-500">28</p>
        <p className="text-sm text-muted-foreground">Done</p>
      </div>
    </div>
  </CardContent>
  <CardFooter>
    <p className="text-xs text-muted-foreground">Last updated: just now</p>
  </CardFooter>
</Card>
```

### Badge — Status Indicators

```tsx
import { Badge } from "@/components/ui/badge";

<Badge>Default</Badge>
<Badge variant="secondary">In Progress</Badge>
<Badge variant="destructive">Overdue</Badge>
<Badge variant="outline">Draft</Badge>
```

### Customizing a Component

Open the source file and edit it directly. Want a new badge variant for priority?

```tsx
// src/components/ui/badge.tsx — add to the variants
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        // ✨ Custom variants for TaskFlow:
        low: "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300",
        medium: "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
        high: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);
```

Now use it:
```tsx
<Badge variant="high">High Priority</Badge>
<Badge variant="low">Low Priority</Badge>
```

**This is the power of owning your components.** You didn't fork a library, you didn't fight with theme overrides — you just edited the code.

---
id: 11-shadcn-setup-core

## 🔨 Project Task: Upgrade TaskFlow with shadcn/ui

### Step 1: Initialize shadcn/ui

```bash
npx shadcn@latest init
```

Choose:
- Style: **New York**
- Base color: **Slate**
- CSS variables: **Yes**

Verify it created `components.json` and `src/lib/utils.ts`.

### Step 2: Install Core Components

```bash
npx shadcn@latest add button input card badge separator
```

### Step 3: Set Up Path Aliases

shadcn/ui uses `@/` imports. Configure in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

And in `vite.config.ts`:

```ts
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### Step 4: Replace Buttons

Find every hand-built button and replace with the shadcn `Button`:

```tsx
// BEFORE
<button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium
                  text-white hover:bg-blue-700 ...">
  Create Task
</button>

// AFTER
import { Button } from "@/components/ui/button";
<Button>Create Task</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost" size="icon">⚙️</Button>
```

### Step 5: Replace Inputs

```tsx
// BEFORE
<input className="w-full rounded-md border border-gray-300 px-3 py-2 ..." />

// AFTER
import { Input } from "@/components/ui/input";
<Input placeholder="What needs to be done?" {...register("title")} />
```

### Step 6: Replace Cards

Update the Dashboard summary cards and TaskDetail:

```tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Dashboard summary
<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        To Do
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold">{counts.todo}</p>
    </CardContent>
  </Card>
  {/* Repeat for In Progress and Done */}
</div>
```

### Step 7: Create a Custom TaskCard Component

Build a TaskCard that combines shadcn's Card with your custom needs:

```tsx
// src/components/TaskCard.tsx
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/task";

const statusMap = {
  todo: { label: "To Do", variant: "secondary" as const },
  "in-progress": { label: "In Progress", variant: "default" as const },
  done: { label: "Done", variant: "outline" as const },
};

const priorityMap = {
  low: "low" as const,
  medium: "medium" as const,
  high: "high" as const,
};

interface TaskCardProps {
  task: Task;
  className?: string;
}

export default function TaskCard({ task, className }: TaskCardProps) {
  const status = statusMap[task.status];

  return (
    <Link to={`/task/${task.id}`}>
      <Card
        className={cn(
          "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
          className
        )}
      >
        <CardContent className="flex items-center justify-between p-4">
          <div className="space-y-1">
            <p className="font-medium leading-none">{task.title}</p>
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {task.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={priorityMap[task.priority]}>{task.priority}</Badge>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

### Step 8: Update the Dashboard

```tsx
import TaskCard from "@/components/TaskCard";
import { Separator } from "@/components/ui/separator";

export default function Dashboard() {
  const { tasks } = useContext(TaskContext);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {tasks.length} total tasks
        </p>
      </div>

      {/* Summary cards... */}

      <Separator />

      <QuickAdd />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">All Tasks</h2>
        {tasks.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center text-muted-foreground">
              No tasks yet. Add one above! ☝️
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
```

### Step 9: Verify

- [ ] All buttons use the shadcn `Button` component with appropriate variants
- [ ] Inputs have consistent styling and focus rings
- [ ] Cards have proper structure (Header, Content, Footer)
- [ ] Badges show priority and status with custom variants
- [ ] The `className` prop works on all components (can override styles)
- [ ] Dark mode still works with shadcn components (they use CSS variables)
- [ ] Keyboard navigation works (Tab through buttons, Enter to activate)
- [ ] No visual regressions from the component swap

---
id: 11-shadcn-setup-core

## 🧪 Challenge

1. **Custom Button variant:** Add a `success` variant to the Button (green) for "Mark as Done" actions.

2. **Animated Badge:** Create a `Badge` wrapper that adds a subtle entrance animation when it first mounts.

3. **asChild pattern:** Use Button's `asChild` prop to make a Link look like a button:
   ```tsx
   <Button asChild variant="outline">
     <Link to="/task/create">+ New Task</Link>
   </Button>
   ```

4. **Build a Stat Card component:** Create a reusable `StatCard` that wraps the shadcn Card:
   ```tsx
   <StatCard title="To Do" value={12} trend="+3 this week" />
   ```

---
id: 11-shadcn-setup-core

## 📚 Further Reading

- [shadcn/ui Documentation](https://ui.shadcn.com/) — official docs and component gallery
- [Radix UI Primitives](https://www.radix-ui.com/primitives) — the accessibility primitives underneath
- [class-variance-authority](https://cva.style/docs) — docs for the variant utility
- [tailwind-merge](https://github.com/dcastil/tailwind-merge) — how class deduplication works
- [shadcn/ui with Vite](https://ui.shadcn.com/docs/installation/vite) — official Vite installation guide

---
id: 11-shadcn-setup-core

**Next up: [Chapter 12 — shadcn Complex Components →](/chapters/12-shadcn-complex-components)**

Dialogs, dropdowns, command palettes, and mobile sidebars — the interactive components that make TaskFlow feel like a real product.
