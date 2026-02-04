# Chapter 6: Custom Hooks

> React's real superpower isn't components — it's the ability to extract and share **stateful logic** without changing your component tree. Custom hooks are how you build your own toolkit.

---

## 🧠 Concepts

### 1. What Are Custom Hooks?

A custom hook is just a function that starts with `use` and calls other hooks inside. That's it. No magic API, no registration, no special syntax.

```tsx
// This is a custom hook
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return width;
}
```

**Why do they matter?**

Without custom hooks, you'd copy-paste the same `useState` + `useEffect` patterns across components. Custom hooks let you:

1. **Extract logic** — pull complex state/effect combos out of components
2. **Reuse across components** — share the same logic without shared state
3. **Test independently** — test the logic without rendering a component
4. **Name your intentions** — `useLocalStorage` says more than 10 lines of useState+useEffect

**Critical mental model:** Each component that calls a custom hook gets its **own independent copy** of that hook's state. Hooks share *logic*, not *state*.

```tsx
function ComponentA() {
  const width = useWindowWidth(); // ComponentA's own width state
}

function ComponentB() {
  const width = useWindowWidth(); // ComponentB's own SEPARATE width state
}
```

Both components track window width, but they each have their own `useState` internally. If you need shared state, that's what Context is for (Chapter 5).

---

### 2. Rules of Hooks

These aren't guidelines — they're hard rules that React depends on. Break them and things **will** break.

#### Rule 1: Only call hooks at the top level

```tsx
// ❌ WRONG — inside a condition
function SearchResults({ query }) {
  if (query === "") {
    return <p>Type something...</p>;
  }
  
  // React calls hooks by ORDER. If the early return 
  // sometimes fires, hook order changes → crash
  const [results, setResults] = useState([]);
  // ...
}

// ✅ RIGHT — hooks before any returns
function SearchResults({ query }) {
  const [results, setResults] = useState([]);
  
  if (query === "") {
    return <p>Type something...</p>;
  }
  // ...
}
```

**Why?** React identifies hooks by their **call order** in each render. If you put a hook inside a condition, the order changes between renders, and React pairs the wrong state with the wrong hook.

```
// Render 1: condition true
useState(0)     ← hook #1
useEffect(...)  ← hook #2

// Render 2: condition false, hook inside if is skipped
useEffect(...)  ← hook #1 ← React thinks this is useState! 💥
```

#### Rule 2: Only call hooks from React functions

Hooks can only be called from:
- React function components
- Other custom hooks

NOT from regular JavaScript functions, classes, event handlers, or async callbacks.

```tsx
// ❌ WRONG — regular function
function fetchData() {
  const [data, setData] = useState(null); // 💥
}

// ✅ RIGHT — custom hook
function useFetchData() {
  const [data, setData] = useState(null);
  // ...
  return data;
}
```

#### Rule 3: The `use` prefix is mandatory

React uses the `use` prefix to identify hooks and apply its rules. If you name a function `getWindowWidth` instead of `useWindowWidth`, React won't check it for rule violations.

```tsx
// ❌ React won't enforce hook rules
function getLocalStorage(key) {
  const [value, setValue] = useState(...); // Works but no rule checking
}

// ✅ React knows this is a hook
function useLocalStorage(key) {
  const [value, setValue] = useState(...); // Rules enforced
}
```

> 🆕 **React 19 + React Compiler:** The upcoming React Compiler (experimental in React 19) relies even more heavily on these rules. The compiler analyzes your hooks to auto-optimize, so violating the rules won't just cause bugs — it'll prevent optimizations.

---

### 3. Patterns for Custom Hooks

#### Pattern 1: Wrapping a Browser API

The most common pattern — wrap a browser API in a reactive way.

```tsx
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return isOnline;
}

// Usage
function StatusBar() {
  const isOnline = useOnlineStatus();
  return <span>{isOnline ? "🟢 Online" : "🔴 Offline"}</span>;
}
```

#### Pattern 2: Abstracting localStorage

Persistent state that survives page reloads.

```tsx
function useLocalStorage<T>(key: string, initialValue: T) {
  // Lazy initialization — only reads localStorage once
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Sync to localStorage whenever value changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage might be full or disabled
    }
  }, [key, value]);

  return [value, setValue] as const;
}

// Usage — works exactly like useState, but persists
function Settings() {
  const [theme, setTheme] = useLocalStorage("theme", "light");
  const [fontSize, setFontSize] = useLocalStorage("fontSize", 16);
  // Values survive page reloads!
}
```

> 💡 **Vercel Tip:** Notice the lazy state initialization — `useState(() => ...)`. Without the function form, `localStorage.getItem` would run on *every* render even though the value is only used once.

#### Pattern 3: Domain Logic Hook

Encapsulate your app's business logic.

```tsx
interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

function useTasks() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("tasks", []);

  const addTask = (title: string) => {
    setTasks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title,
        completed: false,
        createdAt: new Date(),
      },
    ]);
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  return {
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    completedCount,
    totalCount,
  };
}
```

> 💡 **Vercel Tip:** We use functional `setTasks(prev => ...)` everywhere. This means the callbacks don't depend on `tasks` in their closure — they always use the latest state. Stable references, no stale closures.

#### Pattern 4: Composing Hooks

Custom hooks can call other custom hooks!

```tsx
function useFilteredTasks() {
  const { tasks, ...actions } = useTasks();
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const filteredTasks = (() => {
    switch (filter) {
      case "active":
        return tasks.filter((t) => !t.completed);
      case "completed":
        return tasks.filter((t) => t.completed);
      default:
        return tasks;
    }
  })();

  return {
    tasks: filteredTasks,
    allTasks: tasks,
    filter,
    setFilter,
    ...actions,
  };
}
```

Notice how `useFilteredTasks` builds on `useTasks`, which builds on `useLocalStorage`, which uses `useState` + `useEffect`. Hooks compose like LEGO.

#### Pattern 5: Debounced Value

Useful for search inputs — don't fire on every keystroke.

```tsx
function useDebouncedValue<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer); // Cleanup: cancel if value changes again
  }, [value, delayMs]);

  return debouncedValue;
}

// Usage
function TaskSearch() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);

  // Only fires API call when user stops typing for 300ms
  useEffect(() => {
    if (debouncedQuery) {
      searchTasks(debouncedQuery);
    }
  }, [debouncedQuery]);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

---

### 4. When to Extract a Custom Hook

Not every `useState` needs to be a hook. Extract when:

| Extract when... | Example |
|---|---|
| Logic is reused across 2+ components | `useLocalStorage`, `useWindowWidth` |
| A component has too many hooks tangled together | 5+ useState/useEffect in one component |
| The logic has a clear name/concept | `useTasks`, `useAuth`, `useDebounce` |
| You want to test the logic independently | Business logic separate from UI |

**Don't extract when:**
- The logic is only used once and is simple (2-3 lines)
- You're just trying to make a component "look clean" — sometimes inline is clearer
- The abstraction doesn't have a good name (if you can't name it, it's not a real concept)

---

### 5. Return Value Patterns

Hooks can return anything. Choose based on usage:

```tsx
// Single value — simplest
function useOnlineStatus(): boolean { ... }
const isOnline = useOnlineStatus();

// Tuple — like useState (value + setter pair)
function useLocalStorage<T>(key: string, init: T): [T, (v: T) => void] { ... }
const [theme, setTheme] = useLocalStorage("theme", "light");

// Object — when returning many things (most common for domain hooks)
function useTasks(): { tasks: Task[]; addTask: (t: string) => void; ... } { ... }
const { tasks, addTask, deleteTask } = useTasks();
```

**Rule of thumb:** Tuple for 2 values (like useState), object for 3+.

---

### 6. Custom Hooks vs. Utility Functions

Not everything needs to be a hook!

```tsx
// This does NOT need to be a hook — no React state or effects
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { 
    day: "numeric", month: "short", year: "numeric" 
  });
}

// This NEEDS to be a hook — uses useState and useEffect
function useCurrentTime(intervalMs: number = 1000) {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  
  return time;
}
```

If your function doesn't call any hooks, it's just a utility function. Don't put `use` in front of it.

---

## 💡 Examples

### Example 1: useMediaQuery

A hook that reacts to CSS media query changes:

```tsx
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => 
    window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

// Usage
function Layout() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

  return (
    <div className={prefersDark ? "dark" : "light"}>
      {isMobile ? <MobileNav /> : <DesktopSidebar />}
    </div>
  );
}
```

> 💡 **Vercel Tip:** This subscribes to a derived boolean (matches/doesn't match) rather than a continuous value (pixel width). The component only re-renders when the boolean flips, not on every pixel of resize.

### Example 2: usePrevious

Track the previous value of any state — useful for animations and comparisons:

```tsx
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  
  useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
}

// Usage
function Counter() {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);

  return (
    <div>
      <p>Current: {count}, Previous: {prevCount ?? "none"}</p>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  );
}
```

### Example 3: useToggle

Simple but useful — saves writing the same pattern everywhere:

```tsx
function useToggle(initial: boolean = false) {
  const [value, setValue] = useState(initial);
  
  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  
  return { value, toggle, setTrue, setFalse } as const;
}

// Usage
function TaskItem({ task }: { task: Task }) {
  const { value: isEditing, setTrue: startEdit, setFalse: stopEdit } = useToggle();

  return isEditing 
    ? <TaskEditForm task={task} onDone={stopEdit} />
    : <TaskCard task={task} onEdit={startEdit} />;
}
```

---

## 🔨 Project Task: Refactor TaskFlow with Custom Hooks

Time to clean up TaskFlow! Extract the tangled logic from your components into clean, reusable hooks.

### Step 1: Create `useLocalStorage`

Create `src/hooks/useLocalStorage.ts`:

```tsx
import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Silently fail (quota exceeded, private browsing, etc.)
    }
  }, [key, value]);

  return [value, setValue] as const;
}
```

### Step 2: Create `useTasks`

Create `src/hooks/useTasks.ts`:

```tsx
import { useLocalStorage } from "./useLocalStorage";
import type { Task } from "../types";

export function useTasks() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("taskflow-tasks", []);

  const addTask = (title: string) => {
    setTasks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title,
        completed: false,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTask = (id: string, updates: Partial<Omit<Task, "id">>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  return { tasks, addTask, toggleTask, deleteTask, updateTask };
}
```

### Step 3: Create `useFilteredTasks`

Create `src/hooks/useFilteredTasks.ts`:

```tsx
import { useState, useMemo } from "react";
import { useTasks } from "./useTasks";

export type FilterStatus = "all" | "active" | "completed";

export function useFilteredTasks() {
  const taskActions = useTasks();
  const [filter, setFilter] = useState<FilterStatus>("all");

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case "active":
        return taskActions.tasks.filter((t) => !t.completed);
      case "completed":
        return taskActions.tasks.filter((t) => t.completed);
      default:
        return taskActions.tasks;
    }
  }, [taskActions.tasks, filter]);

  const counts = useMemo(
    () => ({
      total: taskActions.tasks.length,
      active: taskActions.tasks.filter((t) => !t.completed).length,
      completed: taskActions.tasks.filter((t) => t.completed).length,
    }),
    [taskActions.tasks]
  );

  return {
    ...taskActions,
    filteredTasks,
    filter,
    setFilter,
    counts,
  };
}
```

### Step 4: Create `useTheme`

Create `src/hooks/useTheme.ts`:

```tsx
import { useLocalStorage } from "./useLocalStorage";
import { useEffect } from "react";

type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>("taskflow-theme", "light");

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return { theme, setTheme, toggleTheme };
}
```

### Step 5: Refactor Your Components

Now update your main `App` component. Before:

```tsx
// ❌ Before — everything tangled in the component
function App() {
  const [tasks, setTasks] = useState(() => {
    const stored = localStorage.getItem("tasks");
    return stored ? JSON.parse(stored) : [];
  });
  const [filter, setFilter] = useState("all");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const addTask = (title) => { /* ... 8 lines ... */ };
  const deleteTask = (id) => { /* ... */ };
  const toggleTask = (id) => { /* ... */ };
  const filteredTasks = tasks.filter(/* ... */);
  
  // 50 lines of logic before any JSX!
}
```

After:

```tsx
// ✅ After — clean, readable, logic extracted
function App() {
  const { filteredTasks, filter, setFilter, addTask, toggleTask, deleteTask, counts } = 
    useFilteredTasks();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`app ${theme}`}>
      <Header 
        theme={theme} 
        onToggleTheme={toggleTheme} 
        taskCount={counts.total} 
      />
      <TaskFilter filter={filter} onFilterChange={setFilter} counts={counts} />
      <TaskForm onAdd={addTask} />
      <TaskList 
        tasks={filteredTasks} 
        onToggle={toggleTask} 
        onDelete={deleteTask} 
      />
    </div>
  );
}
```

### Step 6: Organize Your Hooks

Your hooks folder should look like:

```
src/
  hooks/
    useLocalStorage.ts    ← generic, reusable anywhere
    useTasks.ts           ← domain-specific (TaskFlow business logic)
    useFilteredTasks.ts   ← domain-specific (builds on useTasks)
    useTheme.ts           ← generic, reusable
    index.ts              ← barrel export
```

Create `src/hooks/index.ts`:

```tsx
export { useLocalStorage } from "./useLocalStorage";
export { useTasks } from "./useTasks";
export { useFilteredTasks } from "./useFilteredTasks";
export { useTheme } from "./useTheme";
```

### Acceptance Criteria

You're done when:
- [ ] All task CRUD logic lives in `useTasks`, not in components
- [ ] Filtering logic lives in `useFilteredTasks`
- [ ] Theme logic lives in `useTheme`
- [ ] localStorage persistence lives in `useLocalStorage`
- [ ] No component has more than ~2 hook calls (aside from the root)
- [ ] Everything still works exactly as before
- [ ] You could reuse `useLocalStorage` in any other project

---

## 🧪 Challenge: Build `useAsyncAction`

Create a hook that wraps any async function with loading/error states:

```tsx
function useAsyncAction<T>(asyncFn: () => Promise<T>) {
  // Your implementation here
  // Returns: { execute, data, isLoading, error }
}

// Usage:
function TaskList() {
  const { execute: loadTasks, data: tasks, isLoading, error } = 
    useAsyncAction(() => fetch("/api/tasks").then(r => r.json()));

  useEffect(() => { loadTasks(); }, []);

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  return <ul>{tasks?.map(t => <TaskCard key={t.id} task={t} />)}</ul>;
}
```

**Hints:**
- You need `useState` for `data`, `isLoading`, and `error`
- Wrap the async call in a try/catch
- Use `useCallback` to stabilize the execute function
- Consider: what happens if the component unmounts during the async call?

---

## 📚 Further Reading

- [React docs: Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [React docs: Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [usehooks.com](https://usehooks.com/) — collection of useful custom hooks with source code
- [React docs: You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) — helps you decide what should be a hook vs a plain function

---

**Next up: [Chapter 7 — React Router →](../07-react-router/CHAPTER.md)**

We'll add pages to TaskFlow — dashboard, task detail, and settings — with client-side routing.
