# 🚀 TaskFlow — Learn React by Building

A project-based React curriculum. One app, built chapter by chapter — from mental models to production-grade UI.

## The Project

**TaskFlow** — a task management dashboard. Starts as a simple todo, evolves into a polished app with shadcn/ui, Tailwind CSS, routing, state management, and more.

## Curriculum

### Part 1: React Fundamentals

| Ch  | Topic                        | Key Concepts                                         |
| --- | ---------------------------- | ---------------------------------------------------- |
| 00  | React Architecture           | Virtual DOM, reconciliation, one-way data flow, JSX  |
| 01  | Setup & First Component      | Vite, TypeScript, JSX, props, rendering lists        |
| 02  | State & Events               | useState, event handling, conditional rendering      |
| 03  | Component Composition        | Props drilling, children, thinking in components     |
| 04  | Side Effects & Lifecycle     | useEffect, cleanup, data fetching                    |
| 05  | Context & Global State       | useContext, useReducer, theme toggle                  |
| 06  | Custom Hooks                 | Extracting logic, rules of hooks                     |
| 07  | React Router                 | Pages, dynamic routes, layouts, nested routes        |
| 08  | Forms & Validation           | React Hook Form, Zod, error handling                 |

### Part 2: Tailwind CSS Deep Dive

| Ch  | Topic                        | Key Concepts                                         |
| --- | ---------------------------- | ---------------------------------------------------- |
| 09  | Tailwind Fundamentals        | Utility-first, responsive, flexbox/grid              |
| 10  | Advanced Tailwind            | Custom themes, animations, dark mode, modifiers      |

### Part 3: shadcn/ui Mastery

| Ch  | Topic                        | Key Concepts                                         |
| --- | ---------------------------- | ---------------------------------------------------- |
| 11  | shadcn Setup & Core          | Philosophy, Button, Input, Card, Badge, cva          |
| 12  | Complex Components           | Dialog, DropdownMenu, Command palette, Sheet         |
| 13  | Data Display                 | DataTable, TanStack Table, Tabs, Toast               |
| 14  | Forms the shadcn Way         | Form component, Select, DatePicker, Combobox         |
| 15  | Theming & Polish             | CSS variables, theme switcher, cn() utility          |

### Bonus

| Ch  | Topic                        | Key Concepts                                         |
| --- | ---------------------------- | ---------------------------------------------------- |
| 16  | Performance                  | memo, useMemo, useCallback, lazy loading, profiling  |
| 17  | Testing                      | Vitest, React Testing Library, testing patterns      |

## Chapter Format

Each chapter lives in `chapters/XX-topic-name/` and contains:

```
CHAPTER.md        ← 🧠 Concepts → 💡 Examples → 🔨 Project Task → 🧪 Challenge
examples/         ← Runnable code snippets for each concept
project/          ← Step-by-step project instructions
solution/         ← Reference implementation
```

## How to Use

1. Read `CHAPTER.md` — understand the concepts first
2. Run the examples — tinker, break things, rebuild
3. Do the project task — build the feature into TaskFlow
4. Only check the solution if you're truly stuck
5. Try the challenge if you want to go deeper

## Prerequisites

- JavaScript fundamentals (variables, functions, arrays, objects, destructuring, promises)
- Basic HTML/CSS
- A code editor (VS Code recommended)
- Node.js 18+ installed

**No prior React experience needed.** That's the whole point.
