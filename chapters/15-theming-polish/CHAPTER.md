# Chapter 15: Theming & Polish

> An app that *works* is one thing. An app that *feels* polished is another. This chapter dives into shadcn's CSS variable theming system, builds a multi-theme switcher, adds sidebar navigation, and makes TaskFlow responsive and accessible. It's the chapter where your app goes from "dev project" to "something you'd actually ship."

> **📌 Prerequisite:** Chapters 9-10 (Tailwind), 11-12 (shadcn setup and components), 13-14 (DataTable and forms).

---

## 🧠 Concepts

### 1. How shadcn Theming Actually Works

Most theming systems bolt on at the end. shadcn's is *the foundation*. Here's how the layers stack:

```
Layer 1: CSS Variables (globals.css)    ← defines colors as HSL values
    ↓
Layer 2: Tailwind Config               ← maps CSS vars to Tailwind classes
    ↓
Layer 3: shadcn Components             ← use Tailwind classes → resolve to CSS vars
    ↓
Layer 4: Your App                      ← switches themes by changing CSS vars
```

**Layer 1 — CSS Variables** in `globals.css`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --destructive: 0 84.2% 60.2%;
    /* ... more variables ... */
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    /* ... dark overrides ... */
  }
}
```

**Why HSL?** The values are stored as `hue saturation% lightness%` (without the `hsl()` wrapper) so Tailwind can add opacity modifiers. When you write `bg-primary/50`, Tailwind generates `hsl(222.2 47.4% 11.2% / 0.5)`. Neat.

**Layer 2 — Tailwind Config** maps these to utility classes:

```js
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... etc
      },
    },
  },
};
```

**Layer 3 — Components** use Tailwind classes. A Button's `"destructive"` variant uses `bg-destructive text-destructive-foreground`. These resolve to whatever `--destructive` is set to.

**Layer 4 — Theme switching** is just changing which CSS variables are active. Toggle a class on `<html>`, and *every component updates instantly*. No React re-render needed — it's pure CSS.

### 2. Beyond Light/Dark: Custom Themes

Most tutorials stop at light/dark. That's boring. shadcn's variable system supports *any number of themes*:

```css
/* Ocean theme */
.theme-ocean {
  --background: 210 50% 98%;
  --foreground: 210 50% 10%;
  --primary: 200 80% 50%;
  --primary-foreground: 200 80% 98%;
  --secondary: 190 40% 90%;
  --muted: 200 30% 94%;
  --muted-foreground: 200 20% 45%;
  --accent: 175 60% 45%;
  --destructive: 0 70% 55%;
  --border: 200 30% 88%;
  --ring: 200 80% 50%;
  --radius: 0.75rem;
}

/* Sunset theme */
.theme-sunset {
  --background: 30 50% 98%;
  --foreground: 20 50% 10%;
  --primary: 15 80% 55%;
  --primary-foreground: 30 80% 98%;
  --secondary: 35 40% 90%;
  --muted: 25 30% 94%;
  --muted-foreground: 20 20% 45%;
  --accent: 345 60% 55%;
  --destructive: 0 70% 55%;
  --border: 25 30% 88%;
  --ring: 15 80% 55%;
  --radius: 0.5rem;
}
```

**Each theme is just a CSS class** with variable overrides. Switching from "ocean" to "sunset" is:

```js
document.documentElement.className = "theme-sunset";
```

Every shadcn component — every Button, Card, Table, Dialog — instantly updates. Zero component changes.

### 3. The `cn()` Utility Deep Dive

You've been using `cn()` since Chapter 11. Let's understand what it *actually* does:

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Two libraries, two jobs:

**`clsx`** — conditional class joining:
```typescript
clsx("base", undefined, false && "nope", "always");
// → "base always"

clsx("p-4", { "bg-red-500": hasError, "bg-green-500": !hasError });
// → "p-4 bg-red-500" or "p-4 bg-green-500"
```

**`twMerge`** — Tailwind-aware class merging (the secret sauce):
```typescript
twMerge("p-4 p-6");           // → "p-6"  (last wins)
twMerge("px-2 py-1 p-4");     // → "p-4"  (p-4 overrides px/py)
twMerge("text-red-500 text-blue-500"); // → "text-blue-500"
```

Without `twMerge`, Tailwind classes from props would *add* to component classes instead of *overriding* them. You'd end up with `p-4 p-8` and wonder why padding is wrong.

**Why this matters for theming:** When you override component styles via className, `cn()` ensures the override actually wins:

```tsx
// Button has default "bg-primary"
// Your className="bg-accent" needs to REPLACE it, not coexist
<Button className={cn("bg-primary", className)}>
  {/* cn() resolves to just "bg-accent" when className="bg-accent" */}
</Button>
```

### 4. The Sidebar: App Navigation

shadcn's `<Sidebar>` component provides a complete navigation pattern:

```
┌──────────────────────────────────────────────┐
│ ┌──────────┐ ┌────────────────────────────┐  │
│ │          │ │                            │  │
│ │  Logo    │ │       Main Content         │  │
│ │          │ │                            │  │
│ │  ──────  │ │                            │  │
│ │  Tasks   │ │                            │  │
│ │  Calendar│ │                            │  │
│ │  Settings│ │                            │  │
│ │          │ │                            │  │
│ │          │ │                            │  │
│ │  ──────  │ │                            │  │
│ │  Profile │ │                            │  │
│ └──────────┘ └────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

Key sidebar features:
- **Collapsible** — icon-only mode on narrow screens
- **Keyboard accessible** — full keyboard navigation
- **Mobile-friendly** — slides in as a sheet on small screens
- **Composable** — header, content, footer, groups, menu items

### 5. Responsive Design with shadcn

shadcn components are built responsive by default, but your *layout* needs intentional responsive design. The key patterns:

**Mobile-first breakpoints** (Tailwind's defaults):
```
sm:  640px   → phones in landscape, small tablets
md:  768px   → tablets
lg:  1024px  → small laptops
xl:  1280px  → desktops
2xl: 1536px  → large screens
```

**Pattern: Stack → Side-by-side**
```tsx
<div className="flex flex-col gap-4 md:flex-row">
  <div className="w-full md:w-1/3">Sidebar content</div>
  <div className="w-full md:w-2/3">Main content</div>
</div>
```

**Pattern: Hide on mobile, show on desktop**
```tsx
<Button variant="ghost" className="md:hidden" onClick={toggleSidebar}>
  <Menu className="h-5 w-5" />
</Button>
<nav className="hidden md:flex">
  {/* full navigation */}
</nav>
```

**Pattern: Responsive DataTable**
Tables on mobile are tricky. Options:
1. Horizontal scroll (`overflow-x-auto`)
2. Hide non-essential columns on mobile (`hidden md:table-cell`)
3. Switch to a card layout on mobile

```tsx
// Column visibility based on screen size
{
  accessorKey: "createdAt",
  header: "Created",
  // Use a custom cell that hides on mobile
  meta: { className: "hidden md:table-cell" },
}
```

### 6. Accessibility Beyond ARIA

shadcn components handle ARIA attributes, but *your layout and interactions* need attention too:

**Focus management:**
- When a dialog opens, focus moves to the first interactive element (shadcn does this)
- When a dialog closes, focus returns to the trigger element (shadcn does this)
- Route changes should announce the new page to screen readers

**Color contrast:**
- Your themes need sufficient contrast ratios (WCAG 2.1 AA = 4.5:1 for text)
- Test every theme — it's easy to create a beautiful palette that fails contrast

**Reduced motion:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Keyboard navigation:**
- Every interactive element must be reachable via Tab
- Custom components need `role`, `tabIndex`, and keyboard event handlers
- shadcn components handle this — but verify your custom compositions

---

## 💡 Examples

### Example 1: Theme Provider with Multiple Themes

```tsx
// contexts/theme-context.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";

const themes = ["light", "dark", "ocean", "sunset"] as const;
type Theme = (typeof themes)[number];

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: readonly string[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem("taskflow-theme") as Theme) ?? "light";
  });

  useEffect(() => {
    const root = document.documentElement;

    // Remove all theme classes
    root.classList.remove(...themes.map((t) => (t === "light" ? "light" : t === "dark" ? "dark" : `theme-${t}`)));

    // Add the new theme class
    if (theme === "light") {
      root.classList.remove("dark");
    } else if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.add(`theme-${theme}`);
    }

    // Persist
    localStorage.setItem("taskflow-theme", theme);
  }, [theme]);

  return (
    // 🆕 React 19: <Context> as provider — no more .Provider!
    <ThemeContext value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
```

> 🆕 **React 19:** Notice `<ThemeContext value={...}>` instead of `<ThemeContext.Provider value={...}>`. Cleaner, simpler. `Context.Provider` will be deprecated in a future version.

### Example 2: Theme Switcher Component

```tsx
// components/theme-switcher.tsx
"use client";

import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sun, Moon, Waves, Sunset, Palette } from "lucide-react";

const themeConfig = {
  light: { label: "Light", icon: Sun, preview: "bg-white border" },
  dark: { label: "Dark", icon: Moon, preview: "bg-slate-900" },
  ocean: { label: "Ocean", icon: Waves, preview: "bg-sky-600" },
  sunset: { label: "Sunset", icon: Sunset, preview: "bg-orange-500" },
} as const;

export const ThemeSwitcher = () => {
  const { theme, setTheme, themes } = useTheme();
  const CurrentIcon = themeConfig[theme as keyof typeof themeConfig]?.icon ?? Palette;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <CurrentIcon className="h-5 w-5" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((t) => {
          const config = themeConfig[t as keyof typeof themeConfig];
          if (!config) return null;
          const Icon = config.icon;
          return (
            <DropdownMenuItem
              key={t}
              onClick={() => setTheme(t as any)}
              className="flex items-center gap-2"
            >
              <div className={`h-4 w-4 rounded-full ${config.preview}`} />
              <Icon className="h-4 w-4" />
              <span>{config.label}</span>
              {theme === t && <span className="ml-auto text-xs">✓</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Example 3: Complete Theme CSS Variables

```css
/* globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }

  .theme-ocean {
    --background: 200 50% 97%;
    --foreground: 210 50% 10%;
    --card: 200 40% 99%;
    --card-foreground: 210 50% 10%;
    --popover: 200 40% 99%;
    --popover-foreground: 210 50% 10%;
    --primary: 200 80% 45%;
    --primary-foreground: 200 80% 98%;
    --secondary: 190 30% 91%;
    --secondary-foreground: 200 50% 15%;
    --muted: 200 25% 93%;
    --muted-foreground: 200 15% 45%;
    --accent: 175 55% 40%;
    --accent-foreground: 175 55% 98%;
    --destructive: 0 70% 55%;
    --destructive-foreground: 0 0% 100%;
    --border: 200 25% 88%;
    --input: 200 25% 88%;
    --ring: 200 80% 45%;
    --radius: 0.75rem;
    --sidebar-background: 200 40% 95%;
    --sidebar-foreground: 210 50% 15%;
    --sidebar-primary: 200 80% 45%;
    --sidebar-primary-foreground: 200 80% 98%;
    --sidebar-accent: 195 35% 90%;
    --sidebar-accent-foreground: 200 50% 15%;
    --sidebar-border: 200 25% 85%;
    --sidebar-ring: 200 80% 45%;
  }

  .theme-sunset {
    --background: 30 50% 97%;
    --foreground: 20 50% 10%;
    --card: 30 40% 99%;
    --card-foreground: 20 50% 10%;
    --popover: 30 40% 99%;
    --popover-foreground: 20 50% 10%;
    --primary: 15 80% 52%;
    --primary-foreground: 30 80% 98%;
    --secondary: 35 35% 90%;
    --secondary-foreground: 20 50% 15%;
    --muted: 25 25% 93%;
    --muted-foreground: 20 15% 45%;
    --accent: 345 55% 52%;
    --accent-foreground: 345 55% 98%;
    --destructive: 0 70% 55%;
    --destructive-foreground: 0 0% 100%;
    --border: 25 25% 87%;
    --input: 25 25% 87%;
    --ring: 15 80% 52%;
    --radius: 0.5rem;
    --sidebar-background: 30 35% 95%;
    --sidebar-foreground: 20 50% 15%;
    --sidebar-primary: 15 80% 52%;
    --sidebar-primary-foreground: 30 80% 98%;
    --sidebar-accent: 30 30% 89%;
    --sidebar-accent-foreground: 20 50% 15%;
    --sidebar-border: 25 25% 84%;
    --sidebar-ring: 15 80% 52%;
  }
}
```

### Example 4: shadcn Sidebar Layout

```tsx
// components/layout/app-sidebar.tsx
"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  CheckSquare,
  Calendar,
  Settings,
  BarChart3,
  User,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ThemeSwitcher } from "@/components/theme-switcher";

const navItems = [
  { title: "Tasks", icon: CheckSquare, path: "/" },
  { title: "Calendar", icon: Calendar, path: "/calendar" },
  { title: "Analytics", icon: BarChart3, path: "/analytics" },
  { title: "Settings", icon: Settings, path: "/settings" },
];

export const AppSidebar = () => {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">TaskFlow</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.path}
                  >
                    <Link to={item.path}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="text-sm">You</span>
          </div>
          <ThemeSwitcher />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

// App layout wrapper
export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1">
          <header className="flex items-center gap-2 border-b px-4 py-3">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">TaskFlow</h1>
          </header>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
```

### Example 5: Responsive Card Layout

```tsx
// A dashboard that adapts from 1 column on mobile to 3 on desktop
const Dashboard = () => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">24</div>
          <p className="text-xs text-muted-foreground">+3 from yesterday</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">18</div>
          <p className="text-xs text-muted-foreground">75% completion rate</p>
        </CardContent>
      </Card>

      <Card className="sm:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">2</div>
          <p className="text-xs text-muted-foreground">Need attention</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Example 6: Prefers-Color-Scheme Awareness

Respect the user's system preference on first load:

```tsx
function getInitialTheme(): Theme {
  // Check localStorage first
  const stored = localStorage.getItem("taskflow-theme") as Theme | null;
  if (stored && themes.includes(stored)) return stored;

  // Fall back to system preference
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

// Also listen for system changes:
useEffect(() => {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = (e: MediaQueryListEvent) => {
    // Only auto-switch if user hasn't explicitly chosen a theme
    if (!localStorage.getItem("taskflow-theme")) {
      setTheme(e.matches ? "dark" : "light");
    }
  };
  mediaQuery.addEventListener("change", handler);
  return () => mediaQuery.removeEventListener("change", handler);
}, []);
```

---

## 🤔 Design Decisions That Matter

Theming and layout are full of "it depends" decisions. Here's guidance on the ones that trip people up most.

### When Dark Mode Is Enough vs When You Need Custom Themes

**Just dark mode** is the right call for most apps. It covers the primary use case (reducing eye strain, user preference) with minimal complexity. You need two sets of CSS variables, a toggle, and you're done.

**Custom themes** make sense when:
- **Branding matters** — your app is white-labeled or used by different organizations that want their colors
- **It's a creative/personal tool** — note-taking apps, code editors, social profiles where self-expression is part of the product
- **Accessibility requires it** — some users need high-contrast themes beyond what light/dark provides

**The cost of custom themes:** Every new theme is another set of 20+ CSS variables you need to maintain and test for contrast. Every UI change needs testing across all themes. If you have 4 themes, you have 4x the visual QA. Don't add themes for novelty — add them when users genuinely need the flexibility.

For TaskFlow, we added Ocean and Sunset themes because it's a *learning exercise* and it demonstrates the system's power. In a production app, you'd likely ship with just light + dark and add custom themes only if users asked for them.

### Sidebar vs Top Navigation

This isn't just an aesthetic choice — it has real UX implications.

**Sidebar navigation works when:**
- You have **5+ top-level sections** (the vertical space accommodates them)
- Users spend time **in one section** and switch occasionally
- You want to show **nested navigation** (sections with sub-items)
- Your content is **wide** (tables, dashboards, editors)

**Top navigation works when:**
- You have **3-5 sections** (fits horizontally)
- Your app is **content-focused** (blogs, docs, landing pages)
- You want **maximum content width**
- The navigation is **flat** (no nesting)

**The mobile question:** This is where the decision gets interesting. Top nav on desktop can become a hamburger menu or bottom tab bar on mobile. Sidebars on desktop typically become a Sheet (slide-in panel) on mobile — which is exactly what we built in Chapter 12.

```
Desktop sidebar     → Mobile Sheet (slide from left)
Desktop top nav     → Mobile hamburger OR bottom tabs
```

**Bottom tab bars** (like in iOS apps) are arguably the best mobile navigation pattern — they're always visible, reachable by thumb, and show where you are. But they're less common in web apps. If your app is heavily mobile-used, consider it.

### When to Use shadcn's Built-in Responsive Patterns vs Custom Breakpoints

shadcn components are responsive by default — Dialogs center themselves, Sheets slide from the right edge, Sidebars collapse. But your *layout* needs intentional breakpoint decisions.

**Use Tailwind's default breakpoints** (`sm`, `md`, `lg`, `xl`) for most cases. They're well-tested and cover the standard device landscape. Fighting the defaults creates maintenance burden with no real benefit.

**Add custom breakpoints only when:**
- Your design has a **specific width** where the layout breaks awkwardly between standard breakpoints
- You're building for **unusual form factors** (TV screens, kiosk displays, watch apps)
- You have **content-specific needs** (e.g., a three-column layout that only works above 1100px, which falls between `lg` and `xl`)

```js
// Usually unnecessary — the defaults are fine
// tailwind.config.ts
theme: {
  screens: {
    'xs': '475px',  // ← only if you genuinely need this
    // sm, md, lg, xl, 2xl are already defined
  }
}
```

### The "Polish" Checklist

These are the details that separate a dev project from a shippable product. Before calling any page "done," run through this list:

**🔵 Focus rings:** Can you Tab through every interactive element and see where focus is? shadcn handles this for its components, but verify your custom elements too. Focus rings should be visible in *both* light and dark themes.

**⏳ Loading states:** Every button that triggers an async action should show a loading state. Every page that fetches data should show a skeleton or spinner. Users should never stare at a blank screen wondering "did it work?"

```tsx
<Button disabled={isPending}>
  {isPending ? (
    <>
      <span className="mr-2 animate-spin">⏳</span>
      Saving...
    </>
  ) : (
    "Save Task"
  )}
</Button>
```

**❌ Error states:** What happens when the API fails? When validation fails? When the network is down? Every form needs error messages. Every data fetch needs an error fallback. Don't just `console.error` — show the user what went wrong and what they can do about it.

**📭 Empty states:** What does the page look like with zero items? An empty DataTable should say "No tasks yet — create one!" with a call to action, not just show an empty grid. Empty states are an opportunity to guide users.

```tsx
{tasks.length === 0 ? (
  <Card className="py-12 text-center">
    <CardContent>
      <p className="text-muted-foreground mb-4">No tasks yet!</p>
      <Button onClick={openCreateDialog}>Create your first task</Button>
    </CardContent>
  </Card>
) : (
  <DataTable columns={columns} data={tasks} />
)}
```

**✨ Transitions:** Abrupt state changes feel jarring. Add subtle transitions for:
- Theme switching (background-color transition, ~300ms)
- Page navigation (fade or slide, ~200ms)
- Element appearance/disappearance (opacity + transform, ~150ms)
- Hover states (already handled by Tailwind's `transition-colors`)

But respect `prefers-reduced-motion` — some users need these disabled for accessibility or health reasons. shadcn's components already include this check, but add it to your custom animations too.

---

## 🔨 Project Task: Polish TaskFlow

### Step 1: Install Sidebar Component

```bash
npx shadcn@latest add sidebar
```

### Step 2: Define Your Theme Variables

Update `globals.css` with four themes: light, dark, ocean, sunset. Use Example 3 as your starting point. Feel free to tweak colors to your taste.

**Pro tip:** Use [oklch.com](https://oklch.com) or [HSL color picker](https://hslpicker.com/) to choose colors, then test contrast with [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/).

### Step 3: Build the Theme Provider

Create `src/contexts/theme-context.tsx` following Example 1. Make sure it:
- Persists the user's choice to localStorage
- Respects `prefers-color-scheme` on first visit (Example 6)
- Applies the theme class to `<html>`

### Step 4: Build the Theme Switcher

Create `src/components/theme-switcher.tsx` following Example 2. Place it in the sidebar footer.

### Step 5: Build the App Sidebar

Create `src/components/layout/app-sidebar.tsx` following Example 4. Include:
- Logo and app name in the header
- Navigation items: Tasks, Calendar (placeholder), Analytics (placeholder), Settings (placeholder)
- Active state highlighting based on current route
- Theme switcher in the footer
- `<SidebarTrigger>` in the main header for mobile toggle

### Step 6: Create the App Layout

Wrap your router with `<AppLayout>`:

```tsx
const App = () => {
  return (
    <ThemeProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<TasksPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          {/* ... */}
        </Routes>
      </AppLayout>
    </ThemeProvider>
  );
}
```

### Step 7: Make the DataTable Responsive

- Add horizontal scroll wrapper: `<div className="overflow-x-auto">`
- Hide non-essential columns on mobile using Tailwind responsive classes
- Consider a card layout for mobile (optional but impressive)

### Step 8: Add Summary Cards

Above the DataTable, add summary cards (Example 5) showing total tasks, completed, overdue, etc. These should be derived from your task context — no extra state needed.

> **Vercel tip:** Derive state during render instead of syncing with effects. Calculate `completedCount` directly from `tasks.filter(t => t.status === "done").length` in the render — don't store it in a separate useState.

### Step 9: Test Every Theme

Switch through all four themes and verify:
- Text is readable (sufficient contrast)
- Interactive elements are visible (buttons, links)
- Borders are visible but subtle
- The sidebar looks good in each theme
- Toasts are readable

### Step 10: Test Responsiveness

Use browser DevTools to test at:
- 375px (iPhone SE)
- 768px (iPad)
- 1024px (laptop)
- 1440px (desktop)

Verify: sidebar collapses, table scrolls or adapts, forms stack vertically, cards reflow.

---

## 🧪 Challenge

**Theme Creator:**

Build a "Custom Theme" option where users can pick their own colors:

1. Add a Settings page with color pickers for primary, background, accent, etc.
2. Store custom colors in localStorage.
3. Apply them as CSS variables dynamically:

```tsx
function applyCustomTheme(colors: Record<string, string>) {
  const root = document.documentElement;
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
}
```

4. Add a "Reset to Default" button.

**Animated Theme Transitions:**

Add smooth transitions when switching themes:

```css
* {
  transition: background-color 0.3s ease, color 0.2s ease, border-color 0.3s ease;
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
```

Be careful — transitioning *everything* can cause performance issues. Target specific properties or use `will-change` strategically.

---

## 📚 Further Reading

- [shadcn Theming Guide](https://ui.shadcn.com/docs/theming) — official theming documentation
- [shadcn Sidebar](https://ui.shadcn.com/docs/components/sidebar) — sidebar component docs
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design) — breakpoint system
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) — verify your theme's accessibility
- [The Complete Guide to Dark Mode with CSS](https://css-tricks.com/a-complete-guide-to-dark-mode-on-the-web/) — deep dive on dark mode implementation
- [Radix Colors](https://www.radix-ui.com/colors) — well-designed, accessible color palettes for inspiration
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/) — accessibility guidelines

---

**Next up: [Chapter 16 — Performance →](/chapters/16-performance)**

TaskFlow looks great. Now let's make sure it *feels* great — profiling, memoization, code splitting, and the React Compiler that makes most of this automatic.
