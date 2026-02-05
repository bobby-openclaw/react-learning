---
id: 01-setup-first-component
sidebar_position: 2
title: "Chapter 1: Setup & Your First Component"
---

# Chapter 1: Setup & Your First Component

> Time to get your hands dirty. We'll scaffold the TaskFlow project with Vite, write JSX, understand props, and build your first real component — `<TaskCard />`.

> **📌 Prerequisites:** You've read Chapter 0 and understand React's mental model — declarative UI, components as functions, data flows down, state is immutable.

---

## 🧠 Concepts

### 1. Scaffolding with Vite + React 19 + TypeScript

Every React app needs a **build tool** — something that takes your JSX, TypeScript, and modern JavaScript and turns it into files the browser can run. We'll use **Vite** (pronounced "veet" — French for "fast").

Why Vite?
- **Instant dev server** — uses native ES modules, no bundling during development
- **Lightning-fast HMR** — Hot Module Replacement updates your browser in milliseconds
- **First-class TypeScript** — zero config
- **Tiny output** — optimized production builds with Rollup under the hood

Other options exist (Next.js, Remix, Parcel), but Vite is the best starting point for learning React because it stays out of your way. No server-side rendering magic, no file-system routing — just React.

#### The Project Structure

After scaffolding, here's what you get:

```
taskflow/
├── index.html            ← entry point (Vite serves this)
├── package.json          ← dependencies & scripts
├── tsconfig.json         ← TypeScript config
├── vite.config.ts        ← Vite config
├── public/               ← static assets (favicon, etc.)
└── src/
    ├── main.tsx          ← app entry: renders <App /> into DOM
    ├── App.tsx           ← root component
    ├── App.css           ← root styles
    └── vite-env.d.ts     ← Vite type declarations
```

**`index.html`** is the single HTML page. It has one `<div id="root">` — React takes over from there:

```html
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
```

**`main.tsx`** is where React mounts your app to the DOM:

```tsx
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);
```

`createRoot` is React 18+'s way of initializing — it enables concurrent features like automatic batching and transitions.

---

### 2. JSX Deep Dive

You saw in Chapter 0 that JSX compiles to `React.createElement()` calls. Now let's master the syntax.

#### JSX is Expressions, Not Statements

Inside `{}` you can use any JavaScript **expression** — something that produces a value:

```tsx
// ✅ Expressions — these all produce values
{2 + 2}                    // → 4
{user.name}                // → "Alice"
{isActive ? 'Yes' : 'No'} // → "Yes" or "No"
{items.length}             // → 3
{formatDate(new Date())}   // → "Feb 4, 2026"
```

You **cannot** use statements (things that don't produce values):

```tsx
// ❌ Statements — these won't work in JSX
{if (isActive) { return 'Yes' }}  // SyntaxError!
{for (let i = 0; i < 5; i++) {}} // SyntaxError!
{let x = 5}                       // SyntaxError!
```

#### Conditional Rendering

Three patterns, each for different situations:

**Ternary** — when you have two alternatives:

```tsx
// ✅ Recommended: ternary for either/or
{isLoggedIn ? <Dashboard /> : <LoginPage />}
```

**Early return** — when a condition means "don't render at all":

```tsx
const AdminPanel = ({ user }: { user: User }) => {
  if (!user.isAdmin) return null; // bail out early
  return <div>Secret admin stuff</div>;
}
```

**Logical AND (`&&`)** — tempting but has a gotcha:

```tsx
// ⚠️ Careful with &&
{count && <span>{count} items</span>}
// If count is 0, this renders "0" on screen! Not nothing.

// ✅ Better: explicit boolean check
{count > 0 ? <span>{count} items</span> : null}
```

> **💡 Vercel Best Practice:** Prefer ternary over `&&` for conditional rendering. The `&&` operator will render falsy values like `0` and `""` as visible text. Ternary makes the "else" case explicit — you decide what happens (usually `null`).

#### Rendering Lists

Use `.map()` to turn an array of data into an array of elements:

```tsx
const fruits = ['Apple', 'Banana', 'Cherry'];

const FruitList = () => {
  return (
    <ul>
      {fruits.map((fruit) => (
        <li key={fruit}>{fruit}</li>
      ))}
    </ul>
  );
}
```

Every list item needs a **`key`** prop. We'll dive into why next.

#### JSX Rules to Remember

1. **Return a single root element** — wrap siblings in `<div>` or `<>` (Fragment):
   ```tsx
   // ❌ Two root elements
   return (
     <h1>Title</h1>
     <p>Body</p>
   );

   // ✅ Fragment wrapper (no extra DOM node)
   return (
     <>
       <h1>Title</h1>
       <p>Body</p>
     </>
   );
   ```

2. **Close all tags** — `<img />`, `<input />`, `<br />` (self-closing required)

3. **CamelCase attributes** — `className`, `onClick`, `htmlFor`, `tabIndex`

4. **Style is an object** — `style={{ color: 'red', fontSize: 16 }}` (not a string)

---

### 3. Props: Passing Data to Components

Props (short for "properties") are how parent components pass data to children. They're the **function arguments** of your component:

```tsx
// Defining: what props does this component accept?
interface GreetingProps {
  name: string;
  excited?: boolean; // optional prop
}

const Greeting = ({ name, excited = false }: GreetingProps) => {
  return <h1>Hello, {name}{excited ? '!!!' : '.'}</h1>;
}

// Using: parent passes the data
<Greeting name="Alice" excited />
<Greeting name="Bob" />
```

**TypeScript makes props safe.** Define an interface, and you get autocomplete and type errors. This is one of the biggest wins of TypeScript + React.

#### Props Are Read-Only

A component must **never modify its own props**. They're like function arguments — you receive them, you use them, you don't change them.

```tsx
// ❌ NEVER do this
const BadComponent = (props: { name: string }) => {
  props.name = 'hacked'; // This is wrong (and TypeScript will yell at you)
  return <div>{props.name}</div>;
}
```

If a child needs to communicate back to the parent, the parent passes a **callback function** as a prop:

```tsx
// Parent passes a function
<TaskCard task={task} onDelete={() => deleteTask(task.id)} />

// Child calls it
const TaskCard = ({ task, onDelete }: TaskCardProps) => {
  return (
    <div>
      <span>{task.title}</span>
      <button onClick={onDelete}>Delete</button>
    </div>
  );
}
```

#### Default Props

Use JavaScript default parameters — no special React API needed:

```tsx
const Button = ({ variant = 'primary', size = 'md' }: ButtonProps) => {
  return <button className={`btn-${variant} btn-${size}`}>Click</button>;
}
```

---

### 4. The `key` Prop: Why Lists Need It

When React diffs a list of elements, it needs to match old elements with new ones. Without `key`, React can only compare by **position** — which breaks horribly when items are reordered, added, or removed.

```
Without keys (by position):
Old:  [Task A, Task B, Task C]
New:  [Task B, Task C]         ← removed Task A

React thinks:
- Position 0: Task A → Task B (update text)
- Position 1: Task B → Task C (update text)
- Position 2: Task C → (remove)

It updated TWO elements and removed one. Should have just removed one!
```

With keys, React matches by identity:

```
With keys:
Old:  [A(key=1), B(key=2), C(key=3)]
New:  [B(key=2), C(key=3)]

React knows:
- key=1 is gone → remove it
- key=2 and key=3 are unchanged → do nothing

One removal. Correct and fast.
```

**Rules for keys:**
- Must be **unique among siblings** (not globally)
- Must be **stable** — the same item always gets the same key
- **Never use array index** as key if the list can reorder/filter
  - Index-as-key causes bugs with component state (inputs, animations)
- Use **IDs from your data** — `task.id`, `user.email`, etc.

```tsx
// ❌ Bad — index changes when items are reordered
{tasks.map((task, index) => (
  <TaskCard key={index} task={task} />
))}

// ✅ Good — stable identifier from data
{tasks.map((task) => (
  <TaskCard key={task.id} task={task} />
))}
```

---

### 5. Your First Component: `<TaskCard />`

Let's put it all together. A component is just a function that:
1. Accepts props (typed with an interface)
2. Returns JSX

```tsx
interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskCardProps {
  task: Task;
}

const TaskCard = ({ task }: TaskCardProps) => {
  return (
    <div className="task-card">
      <span className={task.completed ? 'completed' : ''}>
        {task.title}
      </span>
    </div>
  );
}
```

This component is:
- **Pure** — same props always produce same output
- **Declarative** — describes what the UI looks like, not how to update it
- **Composable** — can be used inside any parent component
- **Typed** — TypeScript ensures you pass the right data

> ### 🆕 React 19: `ref` as a Regular Prop
>
> In React 18 and earlier, if you wanted to forward a `ref` to a DOM element inside your component, you had to wrap it in `forwardRef`:
>
> ```tsx
> // React 18 — boilerplate!
> const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(
>   const TaskCard = ({ task }, ref) => {
>     return <div ref={ref} className="task-card">...</div>;
>   }
> );
> ```
>
> **In React 19, `ref` is just a prop.** No wrapper needed:
>
> ```tsx
> // React 19 — clean!
> const TaskCard = ({ task, ref }: TaskCardProps & { ref?: React.Ref<HTMLDivElement> }) => {
>   return <div ref={ref} className="task-card">...</div>;
> }
> ```
>
> You don't need to understand refs yet (they let you directly access DOM elements), but know that React 19 killed a lot of boilerplate here. `forwardRef` will eventually be deprecated.

---

## 💡 Examples

### Example 1: JSX Expressions

```tsx
const UserGreeting = ({ user }: { user: { name: string; age: number; isVIP: boolean } }) => {
  return (
    <div>
      <h2>Welcome, {user.name}!</h2>
      <p>Age: {user.age} ({user.age >= 18 ? 'Adult' : 'Minor'})</p>
      {user.isVIP ? <span className="badge">⭐ VIP</span> : null}
      <p>Account created: {new Date().toLocaleDateString()}</p>
    </div>
  );
}
```

### Example 2: Rendering a List with Keys

```tsx
interface Pokemon {
  id: number;
  name: string;
  type: string;
}

const PokemonList = ({ pokemon }: { pokemon: Pokemon[] }) => {
  if (pokemon.length === 0) {
    return <p>No Pokémon found. Touch grass.</p>;
  }

  return (
    <ul>
      {pokemon.map((p) => (
        <li key={p.id}>
          <strong>{p.name}</strong> — {p.type}
        </li>
      ))}
    </ul>
  );
}
```

### Example 3: Component with Multiple Props

```tsx
interface AlertProps {
  message: string;
  severity: 'info' | 'warning' | 'error';
  dismissible?: boolean;
}

const Alert = ({ message, severity, dismissible = true }: AlertProps) => {
  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '🚨',
  };

  return (
    <div className={`alert alert-${severity}`}>
      <span>{icons[severity]}</span>
      <p>{message}</p>
      {dismissible ? <button>✕</button> : null}
    </div>
  );
}
```

### Example 4: Fragments and Multiple Elements

```tsx
const UserStats = ({ posts, followers }: { posts: number; followers: number }) => {
  return (
    <>
      <dt>Posts</dt>
      <dd>{posts.toLocaleString()}</dd>
      <dt>Followers</dt>
      <dd>{followers.toLocaleString()}</dd>
    </>
  );
}

// Usage — Fragment lets you return multiple <dt>/<dd> without wrapper div
const Profile = () => {
  return (
    <dl>
      <UserStats posts={142} followers={3800} />
    </dl>
  );
}
```

---

## 🔨 Project Task: Set Up TaskFlow

Time to build! By the end of this section, you'll have a running TaskFlow app that displays a list of tasks.

### Step 1: Create the Project

```bash
npm create vite@latest taskflow -- --template react-ts
cd taskflow
npm install
```

This gives you a React 19 + TypeScript project. Verify it works:

```bash
npm run dev
```

Open `http://localhost:5173` — you should see the Vite + React starter page.

### Step 2: Clean Up the Scaffold

Delete the files you don't need:

```bash
rm src/App.css src/assets/react.svg
```

Replace `src/App.tsx` with a clean starting point:

```tsx
const App = () => {
  return (
    <div className="app">
      <h1>TaskFlow</h1>
      <p>Your task management app.</p>
    </div>
  );
}

export default App;
```

Replace `src/index.css` with some minimal styles:

```css
:root {
  font-family: Inter, system-ui, -apple-system, sans-serif;
  line-height: 1.6;
  color: #213547;
  background-color: #f8f9fa;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app {
  max-width: 640px;
  margin: 2rem auto;
  padding: 0 1rem;
}

h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.task-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  margin-bottom: 0.5rem;
}

.task-card .completed {
  text-decoration: line-through;
  opacity: 0.6;
}

.task-list {
  margin-top: 1.5rem;
}
```

### Step 3: Define the Task Type

Create `src/types.ts`:

```tsx
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}
```

We'll use this type everywhere. Having it in a separate file avoids circular imports later.

### Step 4: Create `<TaskCard />`

Create `src/components/TaskCard.tsx`:

```tsx
import type { Task } from '../types';

interface TaskCardProps {
  task: Task;
}

const TaskCard = ({ task }: TaskCardProps) => {
  return (
    <div className="task-card">
      <span className={task.completed ? 'completed' : ''}>
        {task.title}
      </span>
      <small>
        {task.createdAt.toLocaleDateString()}
      </small>
    </div>
  );
}

export default TaskCard;
```

### Step 5: Render a List of Tasks

Update `src/App.tsx`:

```tsx
import TaskCard from './components/TaskCard';
import type { Task } from './types';

// Hardcoded for now — we'll add state in Chapter 2!
const SAMPLE_TASKS: Task[] = [
  {
    id: '1',
    title: 'Learn React fundamentals',
    completed: true,
    createdAt: new Date('2026-01-15'),
  },
  {
    id: '2',
    title: 'Build TaskFlow app',
    completed: false,
    createdAt: new Date('2026-02-01'),
  },
  {
    id: '3',
    title: 'Master TypeScript generics',
    completed: false,
    createdAt: new Date('2026-02-03'),
  },
];

const App = () => {
  return (
    <div className="app">
      <h1>📋 TaskFlow</h1>
      <p>{SAMPLE_TASKS.filter((t) => !t.completed).length} tasks remaining</p>

      <div className="task-list">
        {SAMPLE_TASKS.length > 0 ? (
          SAMPLE_TASKS.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))
        ) : (
          <p>No tasks yet. Add one!</p>
        )}
      </div>
    </div>
  );
}

export default App;
```

Notice:
- Each `<TaskCard>` gets a `key={task.id}` — stable, unique identifier
- We use ternary for the empty-state check (not `&&`)
- The count uses `.filter()` — derived from data, not stored separately

### Step 6: Verify

Run `npm run dev` and check your browser. You should see:

- "📋 TaskFlow" heading
- "2 tasks remaining" counter
- Three task cards, one with strikethrough (completed)

🎉 **Your first React components are alive!**

---

## 🧪 Challenge

1. **Add more fields to `Task`** — add a `priority` field (`'low' | 'medium' | 'high'`) and display a colored dot or emoji in `<TaskCard />` based on priority.

2. **Build a `<TaskStats />` component** that receives the full task array and displays: total tasks, completed count, and completion percentage.

3. **Conditional CSS classes** — create a helper function `cn(...classes: (string | false | undefined)[])` that joins class names, filtering out falsy values. Use it in `TaskCard`:
   ```tsx
   <div className={cn('task-card', task.completed && 'faded', task.priority === 'high' && 'urgent')}>
   ```

---

## 📚 Further Reading

- [React docs: Your First Component](https://react.dev/learn/your-first-component) — official guide to components and JSX
- [React docs: Writing Markup with JSX](https://react.dev/learn/writing-markup-with-jsx) — JSX rules and gotchas
- [React docs: Rendering Lists](https://react.dev/learn/rendering-lists) — everything about `map()`, `key`, and list rendering
- [React docs: Passing Props to a Component](https://react.dev/learn/passing-props-to-a-component) — props deep dive
- [Vite docs: Getting Started](https://vite.dev/guide/) — understanding your build tool

---

**Next up: [Chapter 2 — State & Events →](/chapters/02-state-and-events)**

Right now TaskFlow is static — a snapshot frozen in time. In the next chapter, we'll add state and event handling to make tasks addable, deletable, and completable.
