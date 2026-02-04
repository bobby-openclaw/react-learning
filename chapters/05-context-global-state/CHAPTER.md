# Chapter 5: Context & Global State

> Some state belongs to the whole app — the current theme, the logged-in user, the language. Passing it through every component via props is maddening. Context lets you teleport data to any component that needs it, no matter how deep.

> **📌 Prerequisites:** You've completed Chapter 4 — TaskFlow persists tasks to localStorage, has a mock API fetch, and you understand useEffect and cleanup functions.

---

## 🧠 Concepts

### 1. The Problem: Props Drilling at Scale

Remember props drilling from Chapter 3? When it's 2-3 levels, it's fine. But imagine adding a theme to TaskFlow:

```
App (theme state)
  └─ Layout (needs theme for background)
      ├─ Header (needs theme for text color)
      │   └─ Logo (needs theme for icon variant)
      └─ Main
          ├─ TaskForm (needs theme for input styling)
          ├─ TaskFilters (needs theme for button colors)
          └─ TaskList
              └─ TaskCard (needs theme for card background)
```

Every single component needs `theme` as a prop. If you add a new theme property, you edit **every** intermediate component's prop types. This is the problem Context solves.

---

### 2. Context: How It Works

Context is React's built-in dependency injection. It has three parts:

1. **Create** — define a context with a default value
2. **Provide** — wrap a subtree and supply the actual value
3. **Consume** — any descendant reads the value directly

```
        <ThemeContext value="dark">     ← Provider
            /          \
      <Header>       <Main>             ← These don't need theme props
         |              |
      <Logo>        <TaskCard>          ← These consume context directly
    use(ThemeContext)  use(ThemeContext)
```

The data "teleports" from provider to consumer, skipping all intermediate components.

---

### 3. createContext + useContext (Classic Pattern)

```tsx
import { createContext, useContext, useState } from 'react';

// 1. Create — define the shape and default value
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// 2. Provider component — manages the state and provides it
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext>
  );
}

// 3. Custom hook for consuming — adds type safety and error handling
function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// 4. Use it anywhere!
function Header() {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className={`header-${theme}`}>
      <h1>TaskFlow</h1>
      <button onClick={toggleTheme}>
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </header>
  );
}
```

> ### 🆕 React 19: `<Context>` as Provider — No More `.Provider`!
>
> In React 18, you had to use `<ThemeContext.Provider>`:
>
> ```tsx
> // React 18 — verbose
> <ThemeContext.Provider value={{ theme, toggleTheme }}>
>   {children}
> </ThemeContext.Provider>
> ```
>
> **In React 19, you use the context directly as a JSX element:**
>
> ```tsx
> // React 19 — clean!
> <ThemeContext value={{ theme, toggleTheme }}>
>   {children}
> </ThemeContext>
> ```
>
> Less boilerplate, same behavior. `<Context.Provider>` still works but will be deprecated in a future version. Use the new syntax going forward.

#### The `null` Default + Custom Hook Pattern

Notice we used `null` as the default context value and threw an error in the hook:

```tsx
const ThemeContext = createContext<ThemeContextType | null>(null);

function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

**Why?** This gives you a clear error message if someone uses `useTheme()` outside a `<ThemeProvider>`. Without this, you'd get `undefined` errors at random places — much harder to debug.

**Always create a custom hook for each context.** It encapsulates the null check and provides a clean API.

---

### 4. React 19: `use(Context)` — Conditional Context

> ### 🆕 React 19: `use()` for Context
>
> Remember `use()` from Chapter 4 (reading promises)? It also reads context — and unlike `useContext`, it can be called **conditionally**.
>
> ```tsx
> import { use } from 'react';
>
> function Tooltip({ show }: { show: boolean }) {
>   if (!show) return null; // early return
>
>   // ✅ use() works after early return — useContext wouldn't!
>   const { theme } = use(ThemeContext)!;
>
>   return <div className={`tooltip-${theme}`}>Helpful info</div>;
> }
> ```
>
> With `useContext`, you'd have to call it **before** any conditional returns (hooks rules). With `use()`, you're free:
>
> ```tsx
> // ❌ useContext — can't call after early return
> function Tooltip({ show }: { show: boolean }) {
>   const { theme } = useContext(ThemeContext)!; // must be before if
>   if (!show) return null;
>   return <div className={`tooltip-${theme}`}>...</div>;
> }
>
> // ✅ use() — can call anywhere
> function Tooltip({ show }: { show: boolean }) {
>   if (!show) return null;
>   const { theme } = use(ThemeContext)!; // after early return!
>   return <div className={`tooltip-${theme}`}>...</div>;
> }
> ```
>
> **When to use which:**
> - `useContext` — when you always need the context (most cases)
> - `use(Context)` — when you need context conditionally, or inside loops

---

### 5. useReducer: State Machines for Complex Logic

`useState` is great for simple state. But when your state updates involve complex logic with many actions, `useReducer` brings order to chaos.

```tsx
const [state, dispatch] = useReducer(reducer, initialState);
```

A **reducer** is a pure function: `(currentState, action) => newState`

```tsx
// Define the state shape
interface TaskState {
  tasks: Task[];
  filter: Filter;
}

// Define all possible actions
type TaskAction =
  | { type: 'ADD_TASK'; payload: { title: string } }
  | { type: 'TOGGLE_TASK'; payload: { id: string } }
  | { type: 'DELETE_TASK'; payload: { id: string } }
  | { type: 'SET_FILTER'; payload: { filter: Filter } }
  | { type: 'LOAD_TASKS'; payload: { tasks: Task[] } };

// The reducer — pure function, easy to test
function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [
          {
            id: crypto.randomUUID(),
            title: action.payload.title,
            completed: false,
            createdAt: new Date(),
          },
          ...state.tasks,
        ],
      };
    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id ? { ...t, completed: !t.completed } : t
        ),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.payload.id),
      };
    case 'SET_FILTER':
      return {
        ...state,
        filter: action.payload.filter,
      };
    case 'LOAD_TASKS':
      return {
        ...state,
        tasks: [...action.payload.tasks, ...state.tasks],
      };
    default:
      return state;
  }
}
```

#### Using the Reducer

```tsx
function App() {
  const [state, dispatch] = useReducer(taskReducer, {
    tasks: loadTasks(),
    filter: 'all',
  });

  // Actions are declarative — describe WHAT happened, not HOW to update
  const addTask = (title: string) => {
    dispatch({ type: 'ADD_TASK', payload: { title } });
  };

  const toggleTask = (id: string) => {
    dispatch({ type: 'TOGGLE_TASK', payload: { id } });
  };

  const deleteTask = (id: string) => {
    dispatch({ type: 'DELETE_TASK', payload: { id } });
  };

  // ...
}
```

#### Why useReducer?

- **All state transitions in one place** — the reducer function is your single source of truth for how state changes
- **Easy to test** — it's a pure function: `reducer(state, action) → newState`
- **Actions are descriptive** — `dispatch({ type: 'TOGGLE_TASK', payload: { id } })` reads like a log of what happened
- **Works great with Context** — pass `dispatch` via context; any component can trigger actions

#### useState vs. useReducer

| Scenario | Use |
|----------|-----|
| Single value (boolean, string, number) | `useState` |
| Simple object with independent fields | `useState` |
| Complex state with many update patterns | `useReducer` |
| State transitions depend on current state | `useReducer` |
| Multiple components need to trigger different updates | `useReducer` + Context |
| You want testable state logic | `useReducer` |

---

### 6. Context + useReducer = Global State

The real power comes from combining context and reducer. Context provides the data, reducer manages transitions:

```tsx
// TaskContext.tsx
import { createContext, useContext, useReducer } from 'react';

interface TaskContextType {
  state: TaskState;
  dispatch: React.Dispatch<TaskAction>;
}

const TaskContext = createContext<TaskContextType | null>(null);

function TaskProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, {
    tasks: loadTasks(),
    filter: 'all',
  });

  return (
    <TaskContext value={{ state, dispatch }}>
      {children}
    </TaskContext>
  );
}

function useTaskContext(): TaskContextType {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within TaskProvider');
  }
  return context;
}
```

Now any component can read tasks and dispatch actions — no prop drilling:

```tsx
// TaskCard — deep in the tree, no props needed for actions
function TaskCard({ task }: { task: Task }) {
  const { dispatch } = useTaskContext();

  return (
    <div className="task-card">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => dispatch({ type: 'TOGGLE_TASK', payload: { id: task.id } })}
      />
      <span>{task.title}</span>
      <button onClick={() => dispatch({ type: 'DELETE_TASK', payload: { id: task.id } })}>
        🗑️
      </button>
    </div>
  );
}
```

---

### 7. When to Use What

This decision tree will save you hours:

```
Do you need to share state between components?
├─ No → useState in the component that owns it
├─ Yes, just parent-child (1-2 levels)?
│   └─ Props — simple and explicit
├─ Yes, across many levels?
│   ├─ Simple value (theme, locale, user)?
│   │   └─ Context + useState
│   ├─ Complex state with many actions?
│   │   └─ Context + useReducer
│   └─ High-frequency updates (every keystroke, animations)?
│       └─ External library (Zustand, Jotai) — Context re-renders too much
```

**Context caveats:**
- Every consumer re-renders when the context value changes
- Split contexts by update frequency (theme rarely changes, tasks change often)
- Don't put everything in one mega-context
- For high-frequency updates (real-time, animations), use Zustand or Jotai instead

---

## 💡 Examples

### Example 1: Auth Context

```tsx
import { createContext, useContext, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (user: User) => setUser(user);
  const logout = () => setUser(null);

  return (
    <AuthContext value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext>
  );
}

function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Usage
function NavBar() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <nav>
      {isAuthenticated ? (
        <>
          <span>Welcome, {user!.name}</span>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <a href="/login">Login</a>
      )}
    </nav>
  );
}
```

### Example 2: Notification System with useReducer

```tsx
interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

type NotifAction =
  | { type: 'ADD'; payload: Notification }
  | { type: 'DISMISS'; payload: { id: string } }
  | { type: 'CLEAR_ALL' };

function notifReducer(state: Notification[], action: NotifAction): Notification[] {
  switch (action.type) {
    case 'ADD':
      return [...state, action.payload];
    case 'DISMISS':
      return state.filter((n) => n.id !== action.payload.id);
    case 'CLEAR_ALL':
      return [];
    default:
      return state;
  }
}

// In the provider:
const [notifications, dispatch] = useReducer(notifReducer, []);

const notify = (message: string, type: Notification['type'] = 'info') => {
  dispatch({
    type: 'ADD',
    payload: { id: crypto.randomUUID(), message, type },
  });
};
```

### Example 3: use(Context) — Conditional Theme

```tsx
import { use } from 'react';

function ConditionalWidget({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return <p>Widget disabled</p>;
  }

  // use() works after conditional — useContext wouldn't!
  const { theme } = use(ThemeContext)!;

  return (
    <div className={`widget widget-${theme}`}>
      <p>Active widget with {theme} theme</p>
    </div>
  );
}
```

---

## 🔨 Project Task: Theme Toggle & Task Context

### Step 1: Create Theme Context

Create `src/context/ThemeContext.tsx`:

```tsx
import { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('taskflow-theme');
    return (stored === 'dark' || stored === 'light') ? stored : 'light';
  });

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Sync theme to document and localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('taskflow-theme', theme);
  }, [theme]);

  return (
    <ThemeContext value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export default ThemeContext;
```

### Step 2: Create Task Context

Create `src/context/TaskContext.tsx`:

```tsx
import { createContext, useContext, useReducer, useEffect } from 'react';
import type { Task } from '../types';

// State shape
type Filter = 'all' | 'active' | 'completed';

interface TaskState {
  tasks: Task[];
  filter: Filter;
}

// Actions
type TaskAction =
  | { type: 'ADD_TASK'; payload: { title: string } }
  | { type: 'TOGGLE_TASK'; payload: { id: string } }
  | { type: 'DELETE_TASK'; payload: { id: string } }
  | { type: 'SET_FILTER'; payload: { filter: Filter } }
  | { type: 'LOAD_TASKS'; payload: { tasks: Task[] } };

// Reducer
function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [
          {
            id: crypto.randomUUID(),
            title: action.payload.title,
            completed: false,
            createdAt: new Date(),
          },
          ...state.tasks,
        ],
      };
    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id ? { ...t, completed: !t.completed } : t
        ),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.payload.id),
      };
    case 'SET_FILTER':
      return { ...state, filter: action.payload.filter };
    case 'LOAD_TASKS': {
      const existingIds = new Set(state.tasks.map((t) => t.id));
      const newTasks = action.payload.tasks.filter((t) => !existingIds.has(t.id));
      return { ...state, tasks: [...newTasks, ...state.tasks] };
    }
    default:
      return state;
  }
}

// Storage helpers
const STORAGE_KEY = 'taskflow-tasks';

function loadTasks(): Task[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored).map((t: Task & { createdAt: string }) => ({
      ...t,
      createdAt: new Date(t.createdAt),
    }));
  } catch {
    return [];
  }
}

// Context
interface TaskContextType {
  state: TaskState;
  dispatch: React.Dispatch<TaskAction>;
  // Derived values
  filteredTasks: Task[];
  activeCount: number;
}

const TaskContext = createContext<TaskContextType | null>(null);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, {
    tasks: [],
    filter: 'all' as Filter,
  }, () => ({
    tasks: loadTasks().length > 0 ? loadTasks() : [
      { id: '1', title: 'Learn React fundamentals', completed: true, createdAt: new Date('2026-01-15') },
      { id: '2', title: 'Build TaskFlow app', completed: false, createdAt: new Date('2026-02-01') },
    ],
    filter: 'all' as Filter,
  }));

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
  }, [state.tasks]);

  // Derived values
  const filteredTasks = state.filter === 'all'
    ? state.tasks
    : state.tasks.filter((t) =>
        state.filter === 'completed' ? t.completed : !t.completed
      );
  const activeCount = state.tasks.filter((t) => !t.completed).length;

  return (
    <TaskContext value={{ state, dispatch, filteredTasks, activeCount }}>
      {children}
    </TaskContext>
  );
}

export function useTaskContext(): TaskContextType {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within TaskProvider');
  }
  return context;
}

export type { TaskAction, Filter };
export default TaskContext;
```

### Step 3: Add Theme CSS

Update `src/index.css` — add theme variables:

```css
:root,
[data-theme='light'] {
  --bg-primary: #f8f9fa;
  --bg-card: #ffffff;
  --text-primary: #213547;
  --text-secondary: #64748b;
  --border: #e2e8f0;
  --accent: #3b82f6;
}

[data-theme='dark'] {
  --bg-primary: #0f172a;
  --bg-card: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --border: #334155;
  --accent: #60a5fa;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s, color 0.3s;
}

.task-card {
  background: var(--bg-card);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.task-form input {
  background: var(--bg-card);
  color: var(--text-primary);
  border-color: var(--border);
}

.task-filters button {
  background: var(--bg-card);
  color: var(--text-primary);
  border-color: var(--border);
}

.task-filters button.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}
```

### Step 4: Update Layout with Theme Toggle

Update `src/components/Layout.tsx`:

```tsx
import { useTheme } from '../context/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app">
      <header className="app-header">
        <h1>📋 TaskFlow</h1>
        <button onClick={toggleTheme} className="theme-toggle">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </header>
      <main>{children}</main>
    </div>
  );
}

export default Layout;
```

### Step 5: Update Components to Use Context

Update `src/features/tasks/TaskForm.tsx`:

```tsx
import { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';

function TaskForm() {
  const [title, setTitle] = useState('');
  const { dispatch } = useTaskContext();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    dispatch({ type: 'ADD_TASK', payload: { title: trimmed } });
    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        autoFocus
      />
      <button type="submit" disabled={!title.trim()}>Add Task</button>
    </form>
  );
}

export default TaskForm;
```

Notice — `TaskForm` no longer needs an `onAdd` prop! It reads `dispatch` directly from context.

### Step 6: Simplify App.tsx

```tsx
import { ThemeProvider } from './context/ThemeContext';
import { TaskProvider, useTaskContext } from './context/TaskContext';
import Layout from './components/Layout';
import TaskForm from './features/tasks/TaskForm';
import TaskFilters from './features/tasks/TaskFilters';
import TaskList from './features/tasks/TaskList';

function TaskFlowContent() {
  const { activeCount } = useTaskContext();

  return (
    <Layout>
      <p className="task-count">
        {activeCount} {activeCount === 1 ? 'task' : 'tasks'} remaining
      </p>
      <TaskForm />
      <TaskFilters />
      <TaskList />
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <TaskProvider>
        <TaskFlowContent />
      </TaskProvider>
    </ThemeProvider>
  );
}

export default App;
```

Look how clean `App` is now! No props being passed at all. Each component reads what it needs from context. The providers wrap the tree, and everything just works.

### Step 7: Verify

- ✅ Theme toggle works — click 🌙/☀️ to switch
- ✅ Theme persists across refresh (localStorage)
- ✅ All task operations still work (add, toggle, delete, filter)
- ✅ Tasks persist across refresh
- ✅ No props drilling for tasks or theme

---

## 🧪 Challenge

1. **Separate contexts for performance** — Right now, changing the filter re-renders every component that reads `TaskContext`. Split into `TaskDataContext` (tasks, dispatch) and `TaskFilterContext` (filter, filteredTasks). This way, typing in `TaskForm` doesn't re-render `TaskFilters`.

2. **Notification context** — Create a `NotificationProvider` that exposes `notify(message, type)` and `dismiss(id)`. Display notifications as a floating stack in the bottom-right corner. Auto-dismiss after 5 seconds.

3. **Undo/Redo with useReducer** — Extend the task reducer to maintain a history stack. Add `UNDO` and `REDO` action types. Each action pushes the previous state onto the undo stack. Hint: your state shape becomes `{ present: TaskState, past: TaskState[], future: TaskState[] }`.

4. **use(Context) experiment** — Refactor one component to use `use(ThemeContext)` instead of `useTheme()`. Put it behind an `if` statement to see conditional context reading in action.

---

## 📚 Further Reading

- [React docs: Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context) — official context guide
- [React docs: Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context) — the pattern we just built
- [React docs: useReducer](https://react.dev/reference/react/useReducer) — API reference
- [React 19 Blog Post](https://react.dev/blog/2024/12/05/react-19) — `<Context>` as provider and `use()` API
- [Kent C. Dodds: How to Use React Context Effectively](https://kentcdodds.com/blog/how-to-use-react-context-effectively) — patterns and anti-patterns

---

**Next up: [Chapter 6 — Custom Hooks →](../06-custom-hooks/CHAPTER.md)**

Our context files are getting beefy. The localStorage logic is duplicated. Event handlers are spread across components. Time to extract reusable logic into custom hooks — React's ultimate abstraction.
