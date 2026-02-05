---
id: 04-side-effects-lifecycle
sidebar_position: 5
title: "Chapter 4: Side Effects & Lifecycle"
---

# Chapter 4: Side Effects & Lifecycle

> So far, our components are pure functions — data goes in, UI comes out. But real apps need to talk to the outside world: saving to localStorage, fetching from APIs, setting up event listeners, running timers. That's the world of **side effects** — and it's where most React bugs live.

> **📌 Prerequisites:** You've completed Chapter 3 — TaskFlow has a clean component architecture with `Layout`, `TaskList`, `TaskForm`, `TaskFilters`, and `TaskCard`.

---
id: 04-side-effects-lifecycle

## 🧠 Concepts

### 1. What Is a Side Effect?

A **pure function** always returns the same output for the same input and doesn't change anything outside itself. Most React components should be pure:

```tsx
// Pure — same task always produces the same card
const TaskCard = ({ task }: { task: Task }) => {
  return <div>{task.title}</div>;
}
```

A **side effect** is anything that reaches outside the component to interact with the world:

- Reading/writing to localStorage
- Fetching data from an API
- Setting up a timer (`setTimeout`, `setInterval`)
- Adding event listeners to `window` or `document`
- Changing the document title
- Logging analytics events
- Subscribing to a WebSocket

These can't happen inside the "render" (the return statement) because:
1. They're unpredictable (network might fail)
2. They shouldn't run on every render (you don't want to fetch data 60 times per second)
3. They often need cleanup (unsubscribe, remove listeners)

React gives you two places for side effects: **event handlers** and **useEffect**.

---
id: 04-side-effects-lifecycle

### 2. Event Handlers vs. useEffect

This distinction is crucial. Most beginners reach for `useEffect` when they should use an event handler.

#### Event Handlers: For User-Triggered Effects

If a side effect happens **because the user did something** (clicked, submitted, typed), put it in an event handler:

```tsx
// ✅ User action → side effect → do it in the handler
const handleSave = () => {
  localStorage.setItem('tasks', JSON.stringify(tasks));  // side effect
  showToast('Tasks saved!');                              // side effect
};

<button onClick={handleSave}>Save</button>
```

#### useEffect: For Synchronization

`useEffect` is for keeping your component **synchronized** with an external system. It runs *after* render.

```tsx
// ✅ Keep document title in sync with state
useEffect(() => {
  document.title = `TaskFlow — ${activeCount} tasks`;
}, [activeCount]);
```

> **💡 Vercel Best Practice:** If you can put the logic in an event handler, **do it**. Don't use effects for things triggered by user interactions. Effects are for synchronization, not for responding to events. This is one of the most common React mistakes.

The difference:
- **Event handler:** "When the user does X, do Y"
- **useEffect:** "Whenever X changes, synchronize Y"

---
id: 04-side-effects-lifecycle

### 3. useEffect In Depth

```tsx
useEffect(() => {
  // Effect code runs after render
  
  return () => {
    // Cleanup code runs before next effect or unmount
  };
}, [dependency1, dependency2]); // Only re-run when these change
```

Here's the complete lifecycle visualized:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         useEffect LIFECYCLE TIMELINE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  MOUNT                        UPDATE                       UNMOUNT          │
│    │                            │                             │              │
│    ▼                            ▼                             ▼              │
│ ┌──────┐                    ┌──────┐                      ┌──────┐          │
│ │Render│                    │Render│                      │      │          │
│ └──┬───┘                    └──┬───┘                      │      │          │
│    │                           │                          │      │          │
│    ▼                           ▼                          │      │          │
│ ┌──────┐                    ┌──────┐                      │      │          │
│ │Commit│                    │Commit│                      │      │          │
│ │to DOM│                    │to DOM│                      │      │          │
│ └──┬───┘                    └──┬───┘                      │      │          │
│    │                           │                          │      │          │
│    ▼                           ▼                          ▼      │          │
│ ┌──────┐    deps changed?   ┌──────┐                   ┌──────┐ │          │
│ │Effect│◀── YES ───────────▶│Cleanup│──────────────────▶│Cleanup│ │          │
│ │ runs │                    │ runs │                   │ runs │ │          │
│ └──────┘                    └──┬───┘                   └──────┘ │          │
│                                │                                 │          │
│                                ▼                                 │          │
│                             ┌──────┐                             │          │
│                             │Effect│                             │          │
│                             │ runs │                             │          │
│                             └──────┘                             │          │
│                                                                              │
│  TIME ─────────────────────────────────────────────────────────────────────▶ │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### The Three Dependency Array Flavors

**Empty array `[]`** — runs once, after first render:

```tsx
useEffect(() => {
  console.log('Component mounted!');
  // Set up subscriptions, fetch initial data, etc.
  
  return () => {
    console.log('Component unmounting!');
    // Clean up subscriptions
  };
}, []);
```

**Specific dependencies `[a, b]`** — runs when any dependency changes:

```tsx
useEffect(() => {
  document.title = `${count} items`;
  // Runs on mount AND whenever count changes
}, [count]);
```

**No array at all** — runs after **every** render (rarely what you want):

```tsx
useEffect(() => {
  // This runs after EVERY render. Usually a bug.
  console.log('I rendered!');
});
```

#### How React Decides to Re-Run Effects

React compares dependencies using `Object.is()` (similar to `===`). On each render:

1. React calls your component function
2. The component returns new JSX
3. React commits to DOM
4. React checks: did any dependency change since last time?
5. If yes → run cleanup of old effect, then run new effect
6. If no → skip the effect entirely

```
Render 1: deps = [0]    → run effect
Render 2: deps = [0]    → skip (0 === 0)
Render 3: deps = [1]    → cleanup old, run new (0 !== 1)
Render 4: deps = [1]    → skip (1 === 1)
```

> **💡 Vercel Best Practice:** Keep dependencies narrow and use **primitives** (strings, numbers, booleans) whenever possible. Objects and arrays create new references each render, causing effects to re-run unnecessarily.
>
> ```tsx
> // ❌ Object reference changes every render
> useEffect(() => {
>   fetchData(options);
> }, [options]); // options = { page: 1 } — new object every time!
> 
> // ✅ Narrow to primitive values
> useEffect(() => {
>   fetchData({ page, limit });
> }, [page, limit]); // primitives — stable comparison
> ```

---
id: 04-side-effects-lifecycle

### 4. Cleanup Functions

Effects that set up something must **clean up** after themselves. Otherwise you'll leak memory, create duplicate listeners, or cause bugs.

#### Timers

```tsx
useEffect(() => {
  const id = setInterval(() => {
    setSeconds((s) => s + 1);
  }, 1000);

  return () => clearInterval(id); // cleanup!
}, []);
```

#### Event Listeners

```tsx
useEffect(() => {
  const handleResize = () => {
    setWidth(window.innerWidth);
  };
  
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

#### Subscriptions

```tsx
useEffect(() => {
  const unsubscribe = chatAPI.subscribe(roomId, (message) => {
    setMessages((prev) => [...prev, message]);
  });

  return () => unsubscribe();
}, [roomId]); // re-subscribe when room changes
```

**The lifecycle of a cleanup:**

```
Mount:    effect runs (subscribe to room "general")
Update:   roomId changes to "random"
          → cleanup runs (unsubscribe from "general")
          → effect runs (subscribe to "random")
Unmount:  cleanup runs (unsubscribe from "random")
```

#### React Strict Mode Double-Fire

In development, React 19 (and 18) runs effects **twice** on mount in Strict Mode. This isn't a bug — it's intentional to help you find missing cleanup functions.

```
Mount (dev, Strict Mode):
  1. Effect runs → setup
  2. Cleanup runs → teardown
  3. Effect runs → setup again

If your effect breaks after this, your cleanup is incomplete.
```

This only happens in development. Production runs effects once.

---
id: 04-side-effects-lifecycle

### ⚠️ Common useEffect Mistakes

These mistakes account for 90% of useEffect bugs. Avoid them:

**Mistake 1: Using effects for derived state**

```tsx
// ❌ WRONG — using effect to compute derived state
const [items, setItems] = useState([]);
const [total, setTotal] = useState(0);

useEffect(() => {
  setTotal(items.reduce((sum, item) => sum + item.price, 0));
}, [items]);

// ✅ RIGHT — derive during render
const [items, setItems] = useState([]);
const total = items.reduce((sum, item) => sum + item.price, 0);
// No effect needed! Just compute it.
```

**Mistake 2: Using effects for user events**

```tsx
// ❌ WRONG — modeling a click as state + effect
const [submitted, setSubmitted] = useState(false);

useEffect(() => {
  if (submitted) {
    saveData();
    showToast('Saved!');
  }
}, [submitted]);

const handleClick = () => setSubmitted(true);

// ✅ RIGHT — just do it in the handler
const handleClick = () => {
  saveData();
  showToast('Saved!');
};
```

**Mistake 3: Missing dependencies**

```tsx
// ❌ WRONG — missing userId in deps (uses stale value!)
useEffect(() => {
  fetchUser(userId).then(setUser);
}, []); // ESLint will warn you

// ✅ RIGHT — include all values read inside the effect
useEffect(() => {
  fetchUser(userId).then(setUser);
}, [userId]);
```

**Mistake 4: Object/array dependencies causing infinite loops**

```tsx
// ❌ WRONG — new object every render = infinite loop!
useEffect(() => {
  fetchData(options);
}, [{ page: 1, limit: 10 }]); // New object reference each render!

// ✅ RIGHT — use primitive values
const page = 1;
const limit = 10;
useEffect(() => {
  fetchData({ page, limit });
}, [page, limit]);
```

The React docs article [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) is essential reading. Bookmark it.

---
id: 04-side-effects-lifecycle

### 5. Data Fetching: The Old Way (useEffect + useState)

The traditional pattern for fetching data:

```tsx
const UserProfile = ({ userId }: { userId: string }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false; // prevent setting state on unmounted component

    setLoading(true);
    setError(null);

    fetch(`/api/users/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setUser(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true; // cleanup: ignore stale responses
    };
  }, [userId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!user) return null;

  return <div>{user.name}</div>;
}
```

This works, but look at all that boilerplate! Three state variables, a cancelled flag, loading/error management. And we haven't even handled caching, deduplication, or race conditions properly.

**This is why libraries like TanStack Query exist** (Chapter 13). For now, understand this pattern — you'll see it in legacy code. But React 19 offers a better primitive.

---
id: 04-side-effects-lifecycle

### 6. React 19: The `use()` API

> ### 🆕 React 19: `use()` for Reading Promises
>
> React 19 introduces `use()` — a new way to read async data during render. Unlike hooks, `use()` can be called conditionally (inside `if` statements, loops, and after early returns).
>
> ```tsx
> import { use, Suspense } from 'react';
>
> const Comments = ({ commentsPromise }: { commentsPromise: Promise<Comment[]> }) => {
>   const comments = use(commentsPromise); // suspends until resolved
>
>   return (
>     <ul>
>       {comments.map((c) => (
>         <li key={c.id}>{c.text}</li>
>       ))}
>     </ul>
>   );
> }
>
> // Parent creates the promise and wraps with Suspense
> const Post = ({ postId }: { postId: string }) => {
>   const commentsPromise = fetchComments(postId); // start fetching
>
>   return (
>     <div>
>       <h1>Post {postId}</h1>
>       <Suspense fallback={<p>Loading comments...</p>}>
>         <Comments commentsPromise={commentsPromise} />
>       </Suspense>
>     </div>
>   );
> }
> ```
>
> **How it works:**
> 1. Parent creates a promise and passes it down as a prop
> 2. Child calls `use(promise)` — if the promise isn't resolved yet, React **suspends** the component
> 3. The nearest `<Suspense>` boundary shows its `fallback`
> 4. When the promise resolves, React renders the component with the data
> 5. If the promise rejects, the nearest Error Boundary catches it
>
> **Why this is better than useEffect for data fetching:**
> - No loading/error state boilerplate
> - No race conditions (React handles suspense)
> - Data fetching starts in the parent (no waterfall)
> - Suspense boundaries give you fine-grained loading states
>
> **Key rules:**
> - `use()` is NOT a hook — it doesn't follow hook rules
> - It CAN be called conditionally
> - The promise must be created **outside** the consuming component (usually in the parent or a cache)
> - Don't create a new promise on every render — that would re-trigger Suspense each time
>
> **Before vs. After:**
> ```tsx
> // BEFORE (React 18) — useEffect dance
> const Comments = ({ postId }) => {
>   const [comments, setComments] = useState(null);
>   const [loading, setLoading] = useState(true);
>   useEffect(() => {
>     fetchComments(postId).then(setComments).finally(() => setLoading(false));
>   }, [postId]);
>   if (loading) return <Spinner />;
>   return comments.map(c => <p key={c.id}>{c.text}</p>);
> }
>
> // AFTER (React 19) — use() + Suspense
> const Comments = ({ commentsPromise }) => {
>   const comments = use(commentsPromise);
>   return comments.map(c => <p key={c.id}>{c.text}</p>);
> }
> ```
>
> The loading state is gone from the component — `Suspense` handles it. The error state is gone too — `ErrorBoundary` handles it. The component just reads data and renders.

---
id: 04-side-effects-lifecycle

### 7. When NOT to useEffect

These are common anti-patterns — things developers put in effects that don't belong there:

#### ❌ Transforming data for display

```tsx
// ❌ Effect for derived state
const [items, setItems] = useState<Item[]>([]);
const [filteredItems, setFilteredItems] = useState<Item[]>([]);

useEffect(() => {
  setFilteredItems(items.filter((i) => i.active));
}, [items]);

// ✅ Just compute it during render
const [items, setItems] = useState<Item[]>([]);
const filteredItems = items.filter((i) => i.active);
```

#### ❌ Responding to user events

```tsx
// ❌ Effect to handle form submission
useEffect(() => {
  if (submitted) {
    saveData(formData);
    setSubmitted(false);
  }
}, [submitted, formData]);

// ✅ Handle in the event handler directly
const handleSubmit = () => {
  saveData(formData);
};
```

#### ❌ Resetting state when props change

```tsx
// ❌ Effect to reset form on edit target change
useEffect(() => {
  setFormData(defaultValues);
}, [editingId]);

// ✅ Use a key to remount the component
<EditForm key={editingId} defaultValues={defaultValues} />
```

When the `key` changes, React unmounts and remounts the component with fresh state. Clean and declarative.

---
id: 04-side-effects-lifecycle

## 💡 Examples

### Example 1: Document Title Sync

```tsx
function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

const App = () => {
  const [count, setCount] = useState(0);
  useDocumentTitle(`Count: ${count}`);

  return <button onClick={() => setCount((c) => c + 1)}>Increment</button>;
}
```

### Example 2: Window Size Tracker

```tsx
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

const ResponsiveInfo = () => {
  const { width, height } = useWindowSize();
  return (
    <p>
      Viewport: {width}×{height}
      {width < 768 ? ' (mobile)' : ' (desktop)'}
    </p>
  );
}
```

### Example 3: Debounced Search

```tsx
function SearchBox({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState('');

  // Debounce: wait 300ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) onSearch(query);
    }, 300);

    return () => clearTimeout(timer); // cleanup previous timer
  }, [query, onSearch]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### Example 4: use() with Suspense

```tsx
import { use, Suspense } from 'react';

interface Quote {
  text: string;
  author: string;
}

// Cache the promise — don't recreate on every render!
let quotePromise: Promise<Quote> | null = null;

function fetchQuote(): Promise<Quote> {
  if (!quotePromise) {
    quotePromise = fetch('https://api.example.com/quote')
      .then((r) => r.json());
  }
  return quotePromise;
}

const QuoteDisplay = () => {
  const quote = use(fetchQuote());
  return (
    <blockquote>
      <p>"{quote.text}"</p>
      <footer>— {quote.author}</footer>
    </blockquote>
  );
}

const App = () => {
  return (
    <Suspense fallback={<p>Loading quote...</p>}>
      <QuoteDisplay />
    </Suspense>
  );
}
```

---
id: 04-side-effects-lifecycle

## 🔨 Project Task: Persist Tasks & Mock API

### Step 1: Persist Tasks to localStorage

We want tasks to survive a page refresh. This is a perfect `useEffect` use case — synchronize React state with an external storage system.

Update `src/App.tsx`:

```tsx
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import TaskForm from './features/tasks/TaskForm';
import TaskFilters from './features/tasks/TaskFilters';
import TaskList from './features/tasks/TaskList';
import type { Task } from './types';

type Filter = 'all' | 'active' | 'completed';

const STORAGE_KEY = 'taskflow-tasks';

function loadTasks(): Task[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    // Restore Date objects (JSON serializes them as strings)
    return parsed.map((t: Task & { createdAt: string }) => ({
      ...t,
      createdAt: new Date(t.createdAt),
    }));
  } catch {
    return [];
  }
}

const App = () => {
  // Lazy initialization — only parse localStorage on first render
  const [tasks, setTasks] = useState<Task[]>(() => {
    const loaded = loadTasks();
    return loaded.length > 0 ? loaded : [
      { id: '1', title: 'Learn React fundamentals', completed: true, createdAt: new Date('2026-01-15') },
      { id: '2', title: 'Build TaskFlow app', completed: false, createdAt: new Date('2026-02-01') },
    ];
  });
  const [filter, setFilter] = useState<Filter>('all');

  // Sync tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // Update document title
  const activeCount = tasks.filter((t) => !t.completed).length;
  useEffect(() => {
    document.title = `TaskFlow — ${activeCount} tasks remaining`;
  }, [activeCount]);

  // Derived state
  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter((t) => (filter === 'completed' ? t.completed : !t.completed));

  // Handlers (same as before)
  const addTask = (title: string) => {
    setTasks((prev) => [
      { id: crypto.randomUUID(), title, completed: false, createdAt: new Date() },
      ...prev,
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

  return (
    <Layout>
      <p className="task-count">
        {activeCount} {activeCount === 1 ? 'task' : 'tasks'} remaining
      </p>
      <TaskForm onAdd={addTask} />
      <TaskFilters current={filter} onChange={setFilter} />
      <TaskList
        tasks={filteredTasks}
        emptyMessage={filter === 'all' ? 'No tasks yet. Add one!' : `No ${filter} tasks.`}
        onToggle={toggleTask}
        onDelete={deleteTask}
      />
    </Layout>
  );
}

export default App;
```

**Key points:**
- `useState(() => loadTasks())` — lazy init, only reads localStorage once
- `useEffect(..., [tasks])` — syncs to localStorage whenever tasks change
- `loadTasks()` handles JSON parsing errors and Date restoration
- The effect dependency is `tasks` — a new array reference triggers save

### Step 2: Add a Mock API Fetch

Let's simulate loading tasks from an API. Create `src/api/tasks.ts`:

```tsx
import type { Task } from '../types';

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_TASKS: Task[] = [
  { id: 'api-1', title: 'Review pull request', completed: false, createdAt: new Date('2026-02-04') },
  { id: 'api-2', title: 'Update documentation', completed: true, createdAt: new Date('2026-02-03') },
  { id: 'api-3', title: 'Fix login bug', completed: false, createdAt: new Date('2026-02-02') },
];

export async function fetchTasks(): Promise<Task[]> {
  await delay(1500); // simulate 1.5s network delay
  // Simulate random failure (10% chance)
  if (Math.random() < 0.1) {
    throw new Error('Failed to fetch tasks from server');
  }
  return MOCK_TASKS;
}
```

### Step 3: Load API Tasks with useEffect (Old Way)

Add a "Load from API" feature. Create `src/features/tasks/LoadApiTasks.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { fetchTasks } from '../../api/tasks';
import type { Task } from '../../types';

interface LoadApiTasksProps {
  onLoad: (tasks: Task[]) => void;
}

const LoadApiTasks = ({ onLoad }: LoadApiTasksProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = () => {
    setLoading(true);
    setError(null);
    fetchTasks()
      .then((tasks) => {
        onLoad(tasks);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  return (
    <div className="load-api">
      <button onClick={handleLoad} disabled={loading}>
        {loading ? 'Loading...' : '📡 Load Sample Tasks from API'}
      </button>
      {error ? <p className="error">Error: {error}. Try again!</p> : null}
    </div>
  );
}

export default LoadApiTasks;
```

**Wait — notice we used an event handler, not useEffect!** That's because this fetch is triggered by a user action (clicking "Load"). This follows the Vercel best practice: **put interaction logic in event handlers, not effects**.

### Step 4: Preview — use() with Suspense (New Way)

Here's how you *could* fetch with React 19's `use()` API — a preview of the modern approach:

Create `src/features/tasks/ApiTaskList.tsx`:

```tsx
import { use, Suspense } from 'react';
import type { Task } from '../../types';
import TaskCard from './TaskCard';

// The promise is created ONCE, outside the component
const apiTasksPromise = fetch('/api/tasks')
  .then((r) => r.json()) as Promise<Task[]>;

const ApiTaskListInner = () => {
  const tasks = use(apiTasksPromise);

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onToggle={() => {}}
          onDelete={() => {}}
        />
      ))}
    </div>
  );
}

// Wrap with Suspense — the loading state is declarative
const ApiTaskList = () => {
  return (
    <Suspense fallback={<p>Loading tasks from API...</p>}>
      <ApiTaskListInner />
    </Suspense>
  );
}

export default ApiTaskList;
```

We won't use this in TaskFlow yet (we don't have a real API), but understand the pattern:
- Promise created outside component (or in parent)
- `use()` reads the promise — suspends if pending
- `Suspense` handles the loading state
- Error boundaries handle errors (Chapter 10)
- Zero loading/error state variables!

### Step 5: Wire It Up

Add the `LoadApiTasks` button to `App.tsx`:

```tsx
import LoadApiTasks from './features/tasks/LoadApiTasks';

// In App's return, add before TaskList:
<LoadApiTasks
  onLoad={(apiTasks) => {
    setTasks((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const newTasks = apiTasks.filter((t) => !existingIds.has(t.id));
      return [...newTasks, ...prev];
    });
  }}
/>
```

This merges API tasks with existing ones, avoiding duplicates.

### Step 6: Verify

1. Add some tasks → refresh page → tasks persist ✅
2. Open DevTools → Application → Local Storage → see serialized tasks ✅
3. Click "Load Sample Tasks from API" → tasks appear after 1.5s delay ✅
4. Document title updates with active task count ✅

---
id: 04-side-effects-lifecycle

## 🧪 Challenge

1. **Auto-save indicator** — Show "Saving..." for 500ms after tasks change, then "Saved ✓". Use `useEffect` with a timeout.

2. **Online/offline status** — Track `navigator.onLine` and show a banner when the user loses connection. You'll need `useEffect` with `online`/`offline` event listeners on `window`.

3. **Keyboard shortcut** — Press `Ctrl+S` (or `Cmd+S`) to trigger a "save" action (for now, just log to console). Use `useEffect` with a `keydown` listener. Don't forget the cleanup!

4. **Refetch on focus** — When the user switches back to the TaskFlow tab, re-sync from localStorage (in case they edited in another tab). Use the `visibilitychange` event.

---
id: 04-side-effects-lifecycle

## 📚 Further Reading

- [React docs: Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects) — the definitive useEffect guide
- [React docs: You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) — critical reading! When NOT to useEffect
- [React docs: Lifecycle of Reactive Effects](https://react.dev/learn/lifecycle-of-reactive-effects) — dependency arrays and cleanup
- [React 19 Blog Post: use() API](https://react.dev/blog/2024/12/05/react-19#new-feature-use) — official docs on the `use()` API
- [TanStack Query docs](https://tanstack.com/query/latest) — the library that solves data fetching properly

---
id: 04-side-effects-lifecycle

**Next up: [Chapter 5 — Context & Global State →](/chapters/05-context-global-state)**

Our state lives in `App.tsx` and gets passed down through props. That works for TaskFlow's current size — but what about themes, user preferences, and truly global state? Enter Context.
