# Chapter 3: Component Composition

> A React app isn't one massive component — it's a tree of small, focused ones. This chapter teaches you the art of breaking UI apart, putting it back together, and organizing your files so you don't lose your mind at 2 AM.

> **📌 Prerequisites:** You've completed Chapter 2 — TaskFlow has state, event handlers, add/delete/toggle/filter functionality all working inside a growing `App.tsx`.

---

## 🧠 Concepts

### 1. Thinking in Components

The single most important React skill isn't hooks or state management — it's knowing **when and where to split components**. Let's build that intuition.

#### The Single Responsibility Principle

Each component should do **one thing well**. If you can describe what a component does and you need the word "and," it might be doing too much:

- ✅ "TaskCard displays a single task"
- ✅ "TaskForm handles new task input"
- ❌ "App manages tasks AND renders the form AND renders the list AND handles filtering" ← too much

#### When to Split

Split when you see any of these signals:

1. **Reusability** — You'll use this UI chunk in multiple places
2. **Complexity** — The component is over ~100 lines and doing many things
3. **Separate concerns** — Form logic shouldn't be tangled with list rendering
4. **State isolation** — Part of the UI has its own state that doesn't affect the rest (e.g., "is this dropdown open?")
5. **Performance** — A frequently updating piece can be isolated so it doesn't re-render siblings (more in Chapter 16)

#### When NOT to Split

Don't create a component for every `<div>`. Premature abstraction is real:

1. **If it's only used once and it's simple** — inline JSX is fine
2. **If splitting means you need 5 props just to pass data through** — that's worse
3. **If the "component" is 3 lines** — a variable or helper function might be better

**The gut check:** "If someone new joined the team, would this file be easy to understand?" If a component is getting hard to read, split it. If it's still clear, leave it.

---

### 2. Props Drilling

Props drilling is when you pass data through multiple layers of components to reach a deeply nested one:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PROPS DRILLING PROBLEM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   App                                                                        │
│   ├── state: { tasks, onToggle, onDelete }                                   │
│   │                                                                          │
│   └── Main ◄─────────────────── receives: tasks, onToggle, onDelete         │
│       │                         uses: NONE (just passes through!)            │
│       │                                                                      │
│       └── TaskSection ◄──────── receives: tasks, onToggle, onDelete         │
│           │                     uses: NONE (just passes through!)            │
│           │                                                                  │
│           └── TaskList ◄─────── receives: tasks, onToggle, onDelete         │
│               │                 uses: tasks (maps over them)                 │
│               │                                                              │
│               └── TaskCard ◄─── receives: task, onToggle, onDelete          │
│                                 uses: ALL ✓                                  │
│                                                                              │
│   Main and TaskSection don't use the props — they just forward them.        │
│   Every new prop = edit 4 files. This is the "drilling" problem.            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

Every intermediate component (`Main`, `TaskSection`) must accept and pass down props it doesn't use itself.

```tsx
// App → Main → TaskSection → TaskList → TaskCard
// Every layer just passing things through 😩

function Main({ tasks, onToggle, onDelete }: MainProps) {
  return (
    <main>
      <TaskSection tasks={tasks} onToggle={onToggle} onDelete={onDelete} />
    </main>
  );
}
```

#### When Drilling is Fine

- **2-3 levels deep** — totally normal, don't over-engineer
- **Explicit data flow** — you can trace where data comes from
- **Simple apps** — if your component tree is shallow, drilling is the simplest solution

#### When Drilling Becomes a Problem

- **5+ levels** — intermediate components are just "pass-through" wrappers
- **Many props** — a component accepts 10 props just to forward most of them
- **Frequent changes** — adding a new piece of data means editing 5 files

Solutions we'll learn later:
- **Component composition** (below) — restructure to reduce depth
- **Context API** (Chapter 5) — skip intermediate levels
- **External state** (Chapter 14) — Zustand, Redux, etc.

---

### 3. The `children` Prop and Composition

The `children` prop is React's most powerful composition tool. It lets a component **wrap** other components without knowing what's inside:

```tsx
interface CardProps {
  title: string;
  children: React.ReactNode;
}

function Card({ title, children }: CardProps) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="card-body">{children}</div>
    </div>
  );
}

// Usage — Card doesn't need to know what's inside it
<Card title="User Info">
  <p>Name: Alice</p>
  <p>Email: alice@example.com</p>
</Card>

<Card title="Settings">
  <SettingsForm />
</Card>
```

#### Why This Matters: Solving Props Drilling with Composition

Here's the key insight. Instead of this:

```tsx
// ❌ Drilling: App passes tasks through Layout to reach TaskList
function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  return <Layout tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} />;
}

function Layout({ tasks, onToggle, onDelete }: LayoutProps) {
  return (
    <main>
      <TaskList tasks={tasks} onToggle={onToggle} onDelete={onDelete} />
    </main>
  );
}
```

Use composition:

```tsx
// ✅ Composition: App renders TaskList directly, Layout just wraps
function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  return (
    <Layout>
      <TaskList tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} />
    </Layout>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return <main className="layout">{children}</main>;
}
```

`Layout` doesn't need to know about tasks at all! It just provides structure. The data flows directly from `App` to `TaskList`, skipping `Layout` entirely.

**This is the #1 way to avoid props drilling** — restructure your component tree so that data providers are closer to data consumers.

#### Slot Pattern: Multiple Children Areas

Sometimes a layout has multiple "slots" for different content. Use named props:

```tsx
interface PageLayoutProps {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

function PageLayout({ header, sidebar, children }: PageLayoutProps) {
  return (
    <div className="page">
      <header>{header}</header>
      <aside>{sidebar}</aside>
      <main>{children}</main>
    </div>
  );
}

// Usage
<PageLayout
  header={<Header title="TaskFlow" />}
  sidebar={<Sidebar filters={filters} />}
>
  <TaskList tasks={tasks} />
</PageLayout>
```

This is the **compound layout pattern** — each area is independently composable.

#### Render Props (Less Common Now, But Know It Exists)

Before hooks, render props were the main way to share logic. You might still see them in libraries:

```tsx
interface MouseTrackerProps {
  children: (position: { x: number; y: number }) => React.ReactNode;
}

function MouseTracker({ children }: MouseTrackerProps) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}>
      {children(pos)}
    </div>
  );
}

// Usage
<MouseTracker>
  {({ x, y }) => <p>Mouse at: {x}, {y}</p>}
</MouseTracker>
```

Today you'd usually use a custom hook for this (Chapter 6), but the pattern is worth recognizing.

---

### 4. Component Organization

As your app grows, throwing everything into `src/components/` becomes chaos. Here's a practical structure for TaskFlow:

#### Feature-Based Structure (Recommended)

```
src/
├── components/          ← shared, reusable components
│   ├── Button.tsx
│   ├── Card.tsx
│   └── Layout.tsx
├── features/            ← feature-specific components
│   └── tasks/
│       ├── TaskCard.tsx
│       ├── TaskForm.tsx
│       ├── TaskFilter.tsx
│       └── TaskList.tsx
├── types.ts             ← shared TypeScript types
├── App.tsx              ← root composition
└── main.tsx             ← entry point
```

#### Rules of Thumb

1. **One component per file** — `TaskCard.tsx` exports `TaskCard`. Always.
2. **Name the file after the component** — `TaskCard.tsx`, not `task-card.tsx` or `Card1.tsx`
3. **Co-locate related files** — a component's styles, tests, and types live near it
4. **Shared components go in `components/`** — used by multiple features
5. **Feature components go in `features/`** — specific to one feature domain
6. **Index files are optional** — barrel exports (`index.ts`) can simplify imports but slow bundling

> **💡 Vercel Best Practice:** Avoid barrel exports (`export * from './TaskCard'` in `index.ts`) for large projects. Bundlers have to parse the entire barrel to tree-shake, which slows builds. Import directly from the file: `import TaskCard from '../features/tasks/TaskCard'`.

#### Extracting Shared Components

Look for components that have **no domain knowledge** — they don't know about tasks, users, or any specific feature. These belong in `components/`:

```tsx
// src/components/Button.tsx — generic, reusable
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  onClick?: () => void;
}

function Button({ children, variant = 'primary', disabled, onClick }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default Button;
```

This `Button` knows nothing about tasks. It's pure UI infrastructure.

---

### 5. TypeScript Tip: Extracting Common Types

When multiple components share the same prop types, extract them:

```tsx
// src/types.ts
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export type Filter = 'all' | 'active' | 'completed';

// Callback types used by multiple components
export interface TaskActions {
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}
```

Now components import what they need:

```tsx
import type { Task, TaskActions } from '../types';

interface TaskCardProps extends TaskActions {
  task: Task;
}
```

---

## 💡 Examples

### Example 1: Container/Presentational Split

A pattern where one component handles **logic** and another handles **display**:

```tsx
// EmptyState.tsx — presentational (just UI)
interface EmptyStateProps {
  icon: string;
  message: string;
  action?: React.ReactNode;
}

function EmptyState({ icon, message, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="icon">{icon}</span>
      <p>{message}</p>
      {action ? action : null}
    </div>
  );
}

// Usage in TaskList — the container decides the content
{filteredTasks.length > 0 ? (
  filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)
) : (
  <EmptyState
    icon="📝"
    message="No tasks found"
    action={<button onClick={onReset}>Clear filters</button>}
  />
)}
```

### Example 2: Composition over Configuration

Instead of one component with 15 props ("configuration approach"), compose smaller pieces:

```tsx
// ❌ Configuration: one mega-component
<DataTable
  data={users}
  columns={['name', 'email', 'role']}
  sortable
  filterable
  paginated
  pageSize={20}
  onRowClick={handleClick}
  emptyMessage="No users found"
  loadingSpinner={<Spinner />}
  headerActions={<Button>Add User</Button>}
/>

// ✅ Composition: smaller, focused pieces
<DataTable data={users}>
  <DataTable.Header>
    <DataTable.Sort />
    <DataTable.Filter />
    <Button>Add User</Button>
  </DataTable.Header>
  <DataTable.Body
    columns={['name', 'email', 'role']}
    onRowClick={handleClick}
  />
  <DataTable.Pagination pageSize={20} />
  <DataTable.Empty>
    <p>No users found</p>
  </DataTable.Empty>
</DataTable>
```

The second approach is more flexible — you can rearrange, remove, or add sections without changing the `DataTable` component's API.

### Example 3: Wrapper Component

```tsx
// GlassCard — adds visual styling, delegates content via children
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div className={`glass-card ${className}`}>
      {children}
    </div>
  );
}

// Usage
<GlassCard>
  <h3>Task Statistics</h3>
  <p>12 tasks completed this week</p>
</GlassCard>

<GlassCard className="highlight">
  <TaskForm onAdd={addTask} />
</GlassCard>
```

---

## 🔨 Project Task: Decompose TaskFlow

Right now, `App.tsx` is doing everything. Let's break it into a clean component architecture.

### Target Structure

```
src/
├── components/
│   ├── Layout.tsx        ← app shell with header
│   └── EmptyState.tsx    ← reusable empty state
├── features/
│   └── tasks/
│       ├── TaskCard.tsx   ← single task display
│       ├── TaskForm.tsx   ← new task input
│       ├── TaskFilters.tsx ← filter buttons
│       └── TaskList.tsx   ← task list with empty state
├── types.ts
├── App.tsx               ← composition root
├── main.tsx
└── index.css
```

### Step 1: Create `<Layout />`

Create `src/components/Layout.tsx`:

```tsx
interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="app">
      <header className="app-header">
        <h1>📋 TaskFlow</h1>
      </header>
      <main>{children}</main>
    </div>
  );
}

export default Layout;
```

Notice: `Layout` knows nothing about tasks. It provides structure and branding. The `children` prop means any content can go inside.

### Step 2: Create `<EmptyState />`

Create `src/components/EmptyState.tsx`:

```tsx
interface EmptyStateProps {
  icon?: string;
  message: string;
}

function EmptyState({ icon = '📝', message }: EmptyStateProps) {
  return (
    <div className="empty">
      <span style={{ fontSize: '2rem' }}>{icon}</span>
      <p>{message}</p>
    </div>
  );
}

export default EmptyState;
```

This is a **generic** empty state — not tied to tasks. We could reuse it anywhere.

### Step 3: Create `<TaskList />`

Create `src/features/tasks/TaskList.tsx`:

```tsx
import type { Task } from '../../types';
import TaskCard from './TaskCard';
import EmptyState from '../../components/EmptyState';

interface TaskListProps {
  tasks: Task[];
  emptyMessage?: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function TaskList({ tasks, emptyMessage = 'No tasks yet.', onToggle, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onToggle={() => onToggle(task.id)}
          onDelete={() => onDelete(task.id)}
        />
      ))}
    </div>
  );
}

export default TaskList;
```

`TaskList` owns the logic of "how to render a list of tasks," including the empty state. The parent doesn't need to handle that anymore.

### Step 4: Move Task Components

Move your existing components into `src/features/tasks/`:

- `src/components/TaskCard.tsx` → `src/features/tasks/TaskCard.tsx`
- `src/components/TaskForm.tsx` → `src/features/tasks/TaskForm.tsx`
- `src/components/TaskFilters.tsx` → `src/features/tasks/TaskFilters.tsx`

Update the imports in each file accordingly.

### Step 5: Simplify `App.tsx`

Now `App.tsx` becomes a clean **composition root** — it owns state and wires components together:

```tsx
import { useState } from 'react';
import Layout from './components/Layout';
import TaskForm from './features/tasks/TaskForm';
import TaskFilters from './features/tasks/TaskFilters';
import TaskList from './features/tasks/TaskList';
import type { Task } from './types';

type Filter = 'all' | 'active' | 'completed';

const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Learn React fundamentals', completed: true, createdAt: new Date('2026-01-15') },
  { id: '2', title: 'Build TaskFlow app', completed: false, createdAt: new Date('2026-02-01') },
  { id: '3', title: 'Master TypeScript', completed: false, createdAt: new Date('2026-02-03') },
];

function App() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [filter, setFilter] = useState<Filter>('all');

  // Derived state
  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter((t) => (filter === 'completed' ? t.completed : !t.completed));
  const activeCount = tasks.filter((t) => !t.completed).length;

  // Handlers
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

Look how clean this is! `App` is now a **composition root**:
- It owns the state (tasks, filter)
- It computes derived values (filteredTasks, activeCount)
- It defines handlers (addTask, toggleTask, deleteTask)
- It composes components together via `<Layout>` and children

Each child component is focused and independent.

### Step 6: Verify

Everything should still work exactly as before:
- Add, complete, delete tasks
- Filter by all/active/completed
- Empty state shows appropriate messages

But now the code is organized, and each component has a clear purpose.

---

## 🧪 Challenge

1. **`<Header />` component** — Extract the header from `Layout` into its own component. Pass the `activeCount` to it so it can display "TaskFlow — 3 tasks remaining" in the header bar. This is a valid case for props passing (only 1 level deep).

2. **`<TaskStats />` component** — Create a component that shows a progress bar: "5/8 tasks completed (62%)". Place it between the header and the form. It receives the full task array and computes everything.

3. **Compound component experiment** — Create a `<Card>` component that has sub-components: `<Card.Header>`, `<Card.Body>`, `<Card.Footer>`. Wrap `TaskCard` in it.

4. **Spot the drill** — In the current architecture, how many levels deep do `onToggle` and `onDelete` travel? (Answer: just 2 — App → TaskList → TaskCard.) When would you switch to Context? (Think about this; we'll solve it in Chapter 5.)

---

## 📚 Further Reading

- [React docs: Thinking in React](https://react.dev/learn/thinking-in-react) — the definitive guide to component design
- [React docs: Passing Props to a Component](https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children) — the children prop section
- [React docs: Keeping Components Pure](https://react.dev/learn/keeping-components-pure) — why purity matters
- [Kent C. Dodds: Colocation](https://kentcdodds.com/blog/colocation) — why you should keep related files together
- [Patterns.dev: Compound Pattern](https://www.patterns.dev/react/compound-pattern/) — compound components deep dive

---

**Next up: [Chapter 4 — Side Effects & Lifecycle →](../04-side-effects-lifecycle/CHAPTER.md)**

TaskFlow is well-organized but ephemeral — refresh the page and your tasks vanish. Next, we'll learn about side effects, data persistence, and the lifecycle of components.
