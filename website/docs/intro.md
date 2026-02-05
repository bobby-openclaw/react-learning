---
sidebar_position: 0
title: Welcome
slug: /
---

# Learn React by Building 🚀

A project-based React 19 curriculum. One app (**TaskFlow**), built chapter by chapter — from mental models to production-grade UI.

## What You'll Build

**TaskFlow** — a task management dashboard that evolves from a simple todo list to a polished app with:
- React 19's latest features (Actions, `use()`, `useActionState`)
- React Router for navigation
- React Hook Form + Zod for validation
- Tailwind CSS for styling
- shadcn/ui for beautiful, accessible components
- Performance optimization and testing

## Course Structure

| Part | Chapters | What You'll Learn |
|------|----------|-------------------|
| **1** | 0-6 | React fundamentals: components, state, effects, context, hooks |
| **2** | 7-8 | Routing and forms with React 19's new primitives |
| **3** | 9-10 | Tailwind CSS from basics to advanced (dark mode, animations) |
| **4** | 11-15 | shadcn/ui: buttons to data tables to theme systems |
| **5** | 16-17 | Performance optimization and testing |

## Prerequisites

- JavaScript fundamentals (variables, functions, arrays, objects, destructuring, async/await)
- Basic HTML/CSS
- A code editor (VS Code recommended)
- Node.js 18+ installed

**No prior React experience needed.** That's the whole point.

## How to Use This Course

### Option 1: Read + Build Along
Follow each chapter and build TaskFlow yourself. The **🔨 Project Task** section in each chapter gives step-by-step instructions.

### Option 2: Reference + Skip Ahead
Already know some React? Jump to any chapter. Each chapter states prerequisites and the project state at the start.

### Option 3: Code First, Read Later
Clone the [TaskFlow companion repo](https://github.com/bobby-openclaw/taskflow-app), check out any chapter branch, and read the corresponding chapter when you need explanation.

## Interactive Features

- **Live Code Blocks** — Edit code examples and see results instantly
- **Chapter Checkpoints** — Each chapter has a corresponding branch in the TaskFlow repo
- **Challenges** — Optional stretch goals at the end of each chapter

## Let's Go!

Ready? Start with [Chapter 0: React Architecture](/chapters/00-react-architecture) — no code, just the mental models that make everything else click.

```jsx live
function HelloReact() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>You clicked {count} times</h2>
      <button 
        onClick={() => setCount(count + 1)}
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px',
          cursor: 'pointer'
        }}
      >
        Click me!
      </button>
    </div>
  );
}
```

☝️ **Try it!** Edit the code above and see it update live. This is how code examples work throughout the course.
