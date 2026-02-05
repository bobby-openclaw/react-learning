---
id: 17-testing
sidebar_position: 18
title: "Chapter 17: Testing"
---

# Chapter 17: Testing

> You've built TaskFlow. Now make sure it *stays* working. Testing isn't about proving your code works today — it's about catching when it breaks tomorrow.

> **📌 Where we are:** TaskFlow is complete — routing, forms, shadcn UI, theming, optimized performance (Ch 16). It works great... until someone refactors a hook and breaks task creation. This chapter adds the safety net.

---
id: 17-testing

## 🧠 Concepts

### 1. The Testing Trophy

Forget the testing pyramid. In React, Kent C. Dodds' **testing trophy** is the mental model:

```
          ╭──────────╮
          │  E2E     │  ← Few (slow, expensive, high confidence)
        ╭─┴──────────┴─╮
        │ Integration   │  ← MOST TESTS HERE
      ╭─┴──────────────┴─╮
      │   Component       │  ← Moderate amount
    ╭─┴──────────────────┴─╮
    │   Static Analysis     │  ← TypeScript + ESLint (free!)
    ╰──────────────────────╯
```

**Where to focus:**
- **Static analysis** (TypeScript + ESLint) catches typos and type errors for free
- **Component tests** — render a component, interact with it, check the output
- **Integration tests** — multiple components working together (forms, context, routing)
- **E2E tests** — full browser tests (Playwright/Cypress) — valuable but expensive

The sweet spot for React: **component + integration tests** using React Testing Library. They give the best confidence-to-effort ratio.

---
id: 17-testing

### 2. The Testing Philosophy

React Testing Library is opinionated and that's a feature:

> "The more your tests resemble the way your software is used, the more confidence they can give you."
> — Kent C. Dodds

This means:

**Test user behavior, not implementation details.**

```tsx
// ❌ BAD — testing implementation
expect(component.state.count).toBe(1);
expect(wrapper.instance().handleClick).toHaveBeenCalled();

// ✅ GOOD — testing what the user sees
expect(screen.getByText("Count: 1")).toBeInTheDocument();
await userEvent.click(screen.getByRole("button", { name: "Increment" }));
expect(screen.getByText("Count: 2")).toBeInTheDocument();
```

**Why?** If you refactor `useState` to `useReducer`, or rename a handler from `handleClick` to `increment`, your implementation tests break even though nothing changed for the user. Behavior tests survive refactors.

---
id: 17-testing

### 3. The Testing Stack

| Tool | Purpose |
|---|---|
| **Vitest** | Test runner (like Jest, but Vite-native — fast!) |
| **jsdom** / **happy-dom** | Simulated browser DOM |
| **@testing-library/react** | Render components, query the DOM |
| **@testing-library/user-event** | Simulate realistic user interactions |
| **@testing-library/jest-dom** | Extra DOM matchers (toBeVisible, toHaveTextContent, etc.) |

---
id: 17-testing

### 4. Setup

Install everything:

```bash
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: true,
  },
});
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

This adds matchers like `toBeInTheDocument()`, `toBeVisible()`, `toHaveTextContent()`, etc.

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

Now `npm test` runs in watch mode, `npm run test:run` runs once.

---
id: 17-testing

### 5. Querying Elements

React Testing Library gives you queries that mirror how users find elements:

#### Priority Order (use the highest priority that works)

| Priority | Query | When to use |
|---|---|---|
| 1 | `getByRole` | **Almost always** — buttons, headings, inputs, checkboxes |
| 2 | `getByLabelText` | Form fields with labels |
| 3 | `getByPlaceholderText` | Inputs with placeholder |
| 4 | `getByText` | Non-interactive content (paragraphs, spans) |
| 5 | `getByDisplayValue` | Current value of input/select |
| 6 | `getByAltText` | Images |
| 7 | `getByTestId` | **Last resort** — when nothing else works |

```tsx
// ✅ Best — queries by accessible role
screen.getByRole("button", { name: "Delete Task" });
screen.getByRole("heading", { name: "TaskFlow" });
screen.getByRole("textbox", { name: "Task title" }); // input with label
screen.getByRole("checkbox", { name: "Mark as complete" });

// ✅ Good — queries by label (form fields)
screen.getByLabelText("Email address");

// ⚠️ Okay — when role isn't available
screen.getByText("3 tasks remaining");

// ❌ Avoid — fragile, breaks on restructuring
screen.getByTestId("task-card-123");
```

**Why `getByRole` first?** It tests accessibility too. If `getByRole("button")` can't find your button, a screen reader can't either.

#### Query Variants

| Variant | 0 matches | 1 match | 2+ matches | Async? |
|---|---|---|---|---|
| `getBy` | ❌ throws | ✅ returns | ❌ throws | No |
| `queryBy` | ✅ returns null | ✅ returns | ❌ throws | No |
| `findBy` | ❌ throws | ✅ returns | ❌ throws | **Yes** (waits) |
| `getAllBy` | ❌ throws | ✅ array | ✅ array | No |
| `queryAllBy` | ✅ empty array | ✅ array | ✅ array | No |
| `findAllBy` | ❌ throws | ✅ array | ✅ array | **Yes** |

**When to use which:**
- `getBy` — element should be there RIGHT NOW
- `queryBy` — checking something is NOT there (`expect(queryByText("Error")).not.toBeInTheDocument()`)
- `findBy` — element appears after async operation (data fetch, state update)

---
id: 17-testing

### 6. User Events

Always prefer `userEvent` over `fireEvent`. It simulates real browser behavior:

```tsx
import userEvent from "@testing-library/user-event";

// Setup — creates a user instance per test
const user = userEvent.setup();

// Clicking
await user.click(screen.getByRole("button", { name: "Submit" }));

// Typing
await user.type(screen.getByRole("textbox"), "Buy groceries");

// Clearing then typing
await user.clear(screen.getByRole("textbox"));
await user.type(screen.getByRole("textbox"), "New value");

// Keyboard
await user.keyboard("{Enter}");
await user.keyboard("{Shift>}{Tab}{/Shift}"); // Shift+Tab

// Hovering
await user.hover(screen.getByText("Hover me"));

// Selecting dropdown
await user.selectOptions(screen.getByRole("combobox"), "high");
```

**Why `userEvent` over `fireEvent`?**

`fireEvent.click()` dispatches a single click event. `userEvent.click()` fires the full sequence: pointerdown → mousedown → pointerup → mouseup → click. It catches bugs that only appear with the full event chain.

---
id: 17-testing

### 7. Testing Patterns

#### Pattern 1: Rendering and Asserting

```tsx
import { render, screen } from "@testing-library/react";
import { TaskCard } from "./TaskCard";

describe("TaskCard", () => {
  const mockTask = {
    id: "1",
    title: "Learn React Testing",
    completed: false,
    createdAt: "2026-01-15T10:00:00Z",
  };

  it("renders the task title", () => {
    render(<TaskCard task={mockTask} onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Learn React Testing")).toBeInTheDocument();
  });

  it("shows a checkbox that reflects completion status", () => {
    render(<TaskCard task={mockTask} onToggle={vi.fn()} onDelete={vi.fn()} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
  });

  it("renders as completed when task.completed is true", () => {
    render(
      <TaskCard
        task={{ ...mockTask, completed: true }}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByRole("checkbox")).toBeChecked();
  });
});
```

#### Pattern 2: User Interactions

```tsx
describe("TaskCard interactions", () => {
  it("calls onToggle when checkbox is clicked", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();

    render(<TaskCard task={mockTask} onToggle={onToggle} onDelete={vi.fn()} />);
    
    await user.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledWith("1");
  });

  it("calls onDelete when delete button is clicked", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();

    render(<TaskCard task={mockTask} onToggle={vi.fn()} onDelete={onDelete} />);
    
    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith("1");
  });
});
```

#### Pattern 3: Form Submission

```tsx
import { TaskForm } from "./TaskForm";

describe("TaskForm", () => {
  it("submits the form with the entered task title", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();

    render(<TaskForm onAdd={onAdd} />);

    const input = screen.getByRole("textbox", { name: /task/i });
    await user.type(input, "Buy milk");
    await user.click(screen.getByRole("button", { name: /add/i }));

    expect(onAdd).toHaveBeenCalledWith("Buy milk");
  });

  it("clears the input after submission", async () => {
    const user = userEvent.setup();
    render(<TaskForm onAdd={vi.fn()} />);

    const input = screen.getByRole("textbox", { name: /task/i });
    await user.type(input, "Buy milk");
    await user.click(screen.getByRole("button", { name: /add/i }));

    expect(input).toHaveValue("");
  });

  it("does not submit an empty task", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();

    render(<TaskForm onAdd={onAdd} />);
    await user.click(screen.getByRole("button", { name: /add/i }));

    expect(onAdd).not.toHaveBeenCalled();
  });
});
```

#### Pattern 4: Async Operations

```tsx
describe("TaskList with API", () => {
  it("shows loading state then tasks", async () => {
    render(<TaskList />);

    // Initially shows loading
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // Wait for tasks to appear
    const taskItems = await screen.findAllByRole("listitem");
    expect(taskItems).toHaveLength(3);

    // Loading should be gone
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });
});
```

#### Pattern 5: Testing with Context Providers

When components need context, create a wrapper:

```tsx
import { ThemeContext } from "./ThemeContext";
import { TaskProvider } from "./TaskContext";

function renderWithProviders(
  ui: React.ReactElement,
  { theme = "light", ...options } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeContext value={theme}>
        <TaskProvider>{children}</TaskProvider>
      </ThemeContext>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// Usage
it("renders in dark mode", () => {
  renderWithProviders(<Header />, { theme: "dark" });
  expect(screen.getByRole("banner")).toHaveClass("dark");
});
```

> 🆕 **React 19:** Notice `<ThemeContext value={theme}>` — we use the new Context-as-provider syntax in our test wrapper too.

#### Pattern 6: Testing Custom Hooks

Use `renderHook` for testing hooks in isolation:

```tsx
import { renderHook, act } from "@testing-library/react";
import { useToggle } from "./useToggle";

describe("useToggle", () => {
  it("starts with the initial value", () => {
    const { result } = renderHook(() => useToggle(false));
    expect(result.current.value).toBe(false);
  });

  it("toggles the value", () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      result.current.toggle();
    });

    expect(result.current.value).toBe(true);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.value).toBe(false);
  });
});
```

Testing `useLocalStorage`:

```tsx
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "./useLocalStorage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns the initial value when nothing is stored", () => {
    const { result } = renderHook(() => useLocalStorage("key", "default"));
    expect(result.current[0]).toBe("default");
  });

  it("persists value to localStorage", () => {
    const { result } = renderHook(() => useLocalStorage("key", "default"));

    act(() => {
      result.current[1]("new value");
    });

    expect(result.current[0]).toBe("new value");
    expect(JSON.parse(localStorage.getItem("key")!)).toBe("new value");
  });

  it("reads existing value from localStorage", () => {
    localStorage.setItem("key", JSON.stringify("stored value"));

    const { result } = renderHook(() => useLocalStorage("key", "default"));
    expect(result.current[0]).toBe("stored value");
  });

  it("handles JSON parse errors gracefully", () => {
    localStorage.setItem("key", "not-valid-json");

    const { result } = renderHook(() => useLocalStorage("key", "fallback"));
    expect(result.current[0]).toBe("fallback");
  });
});
```

---
id: 17-testing

### 8. What NOT to Test

Just as important as knowing what to test:

| Don't test | Why |
|---|---|
| Implementation details (state values, hook internals) | Breaks on refactor, doesn't test user experience |
| Third-party libraries (React Router, shadcn, etc.) | They have their own tests |
| Pure CSS/styling | Use visual regression testing if you need this |
| `console.log` output | Not user-facing behavior |
| Every possible prop combination | Focus on meaningful scenarios, not exhaustive combos |

**The golden rule:** Would a user notice if this test fails? If no, you probably don't need the test.

---
id: 17-testing

### 9. Mocking

Sometimes you need to mock dependencies:

#### Mocking API calls

```tsx
// Mock fetch globally
beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

it("fetches and displays tasks", async () => {
  (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve([
      { id: "1", title: "Task 1", completed: false },
    ]),
  });

  render(<TaskList />);

  expect(await screen.findByText("Task 1")).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith("/api/tasks");
});
```

#### Mocking modules

```tsx
// Mock an entire module
vi.mock("./api", () => ({
  fetchTasks: vi.fn(() =>
    Promise.resolve([{ id: "1", title: "Mocked Task", completed: false }])
  ),
}));
```

#### When to mock vs not

| Mock when | Don't mock when |
|---|---|
| Network requests (APIs) | Child components — render the real ones |
| Browser APIs not in jsdom (IntersectionObserver) | State management (Context, hooks) |
| Timers (use `vi.useFakeTimers()`) | Your own utility functions |
| Heavy external services | Anything you can reasonably render |

**Prefer integration over mocks.** The more you mock, the less you're testing.

---
id: 17-testing

### 10. Test Organization

```
src/
  components/
    TaskCard/
      TaskCard.tsx
      TaskCard.test.tsx       ← co-located!
    TaskForm/
      TaskForm.tsx
      TaskForm.test.tsx
  hooks/
    useLocalStorage.ts
    useLocalStorage.test.ts   ← co-located!
    useTasks.ts
    useTasks.test.ts
  test/
    setup.ts                  ← global test setup
    helpers.ts                ← renderWithProviders, etc.
```

**Co-locate tests with source.** The test file lives right next to the code it tests. No separate `__tests__` directory needed.

---
id: 17-testing

## 🔨 Project Task: Test TaskFlow

Write tests for the core features of TaskFlow.

### Step 1: Test `TaskCard`

Create `src/components/TaskCard/TaskCard.test.tsx`:

- Renders the task title
- Shows unchecked checkbox for incomplete tasks
- Shows checked checkbox for completed tasks
- Calls `onToggle` with task ID when checkbox clicked
- Calls `onDelete` with task ID when delete button clicked
- Applies a visual distinction for completed tasks (strikethrough, opacity, etc.)

### Step 2: Test `TaskForm`

Create `src/components/TaskForm/TaskForm.test.tsx`:

- Submits with the entered text
- Clears input after successful submission
- Does NOT submit when input is empty
- Handles Enter key submission
- Trims whitespace before submitting

### Step 3: Test `useLocalStorage`

Create `src/hooks/useLocalStorage.test.ts`:

- Returns initial value when key doesn't exist
- Reads existing value from localStorage
- Updates value and syncs to localStorage
- Handles invalid JSON gracefully
- Works with objects and arrays

### Step 4: Test `useFilteredTasks` (Integration)

Create `src/hooks/useFilteredTasks.test.ts`:

- Returns all tasks when filter is "all"
- Returns only incomplete tasks when filter is "active"
- Returns only completed tasks when filter is "completed"
- Adding a task appears in the correct filter
- Toggling a task moves it between filters
- Returns correct counts

### Step 5: Test a User Flow (Integration)

Create `src/test/task-flow.test.tsx`:

```tsx
describe("TaskFlow: complete user flow", () => {
  it("creates a task, completes it, and filters", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Add a task
    await user.type(screen.getByRole("textbox"), "Write tests");
    await user.click(screen.getByRole("button", { name: /add/i }));

    // Task appears
    expect(screen.getByText("Write tests")).toBeInTheDocument();

    // Complete the task
    await user.click(screen.getByRole("checkbox"));

    // Filter to active — task should disappear
    await user.click(screen.getByRole("button", { name: /active/i }));
    expect(screen.queryByText("Write tests")).not.toBeInTheDocument();

    // Filter to completed — task should appear
    await user.click(screen.getByRole("button", { name: /completed/i }));
    expect(screen.getByText("Write tests")).toBeInTheDocument();
  });
});
```

### Acceptance Criteria

- [ ] `npm test` runs without errors
- [ ] At least 10 meaningful test cases
- [ ] Tests cover: rendering, user interactions, hooks, and one integration flow
- [ ] No tests for implementation details (no checking state directly)
- [ ] All tests use `userEvent` for interactions (not `fireEvent`)
- [ ] Tests use accessible queries (`getByRole`, `getByLabelText`) as primary selectors

---
id: 17-testing

## 🧪 Challenge: Add Coverage Reporting

1. Install `@vitest/coverage-v8`:
   ```bash
   npm install -D @vitest/coverage-v8
   ```

2. Run `npm run test:coverage`

3. Aim for:
   - 80%+ coverage on your hooks
   - 70%+ coverage on core components (TaskCard, TaskForm)
   - Don't chase 100% — focus on meaningful coverage

4. Look at the uncovered lines. Ask yourself: "Would a user care if this line broke?" If yes, write a test. If no, leave it.

---
id: 17-testing

## 📚 Further Reading

- [Testing Library docs](https://testing-library.com/docs/react-testing-library/intro/) — official docs and API reference
- [Common mistakes with React Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library) — must-read
- [Which query should I use?](https://testing-library.com/docs/queries/about#priority) — the priority guide
- [Vitest docs](https://vitest.dev/) — test runner docs
- [React docs: Testing](https://react.dev/learn/testing) — official React testing guidance

---
id: 17-testing

**🎉 Congratulations!** You've built a complete React application from scratch — from mental models to tested, polished, production-grade UI with shadcn, Tailwind, and React 19.

The best way to solidify all this? **Build something new.** Take what you've learned and create your own project. The concepts transfer; the muscle memory comes from repetition.

Happy building! 🚀
