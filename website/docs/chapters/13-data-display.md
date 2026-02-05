---
id: 13-data-display
sidebar_position: 14
title: "Chapter 13: Data Display — Tables, Tabs, Toasts & Skeletons"
---

# Chapter 13: Data Display — Tables, Tabs, Toasts & Skeletons

> Your task data deserves better than a `<ul>`. This chapter replaces the simple task list with a **powerful, sortable, filterable data table**, adds tab-based navigation, notification toasts, and loading skeletons. It's the chapter where TaskFlow starts *feeling* like a real app.

> **📌 Prerequisite:** You should have shadcn/ui installed and working (Chapters 11-12), along with React Router and context-based state management from earlier chapters.

---
id: 13-data-display

## 🧠 Concepts

### 1. Why TanStack Table?

You might think "I'll just map over an array and render `<tr>` elements." That works for 5 tasks. It falls apart at 50 — when users want to sort by due date, filter by status, search by title, and paginate through results.

**TanStack Table** (formerly React Table v8) is the standard for data tables in React. It's:

- **Headless** — it provides the logic (sorting, filtering, pagination), you provide the UI
- **Type-safe** — first-class TypeScript support with column definitions
- **Framework-agnostic** — the core logic works anywhere, `@tanstack/react-table` is the React adapter
- **Composable** — you opt into features (sorting, filtering) individually

The "headless" part is key. TanStack Table doesn't render a single `<div>`. It gives you state and handlers, and you render whatever you want. This pairs *perfectly* with shadcn's DataTable pattern.

```
TanStack Table (logic)  +  shadcn UI (components)  =  Beautiful, functional tables
```

### 2. Column Definitions: The Blueprint

The core concept in TanStack Table is the **column definition**. It's a TypeScript object that tells the table:

- What data to access (`accessorKey` or `accessorFn`)
- How to render the header and cell
- Whether this column is sortable, filterable, etc.

Think of column definitions as a *schema* for your table — they're the contract between your data and your UI.

```typescript
import { ColumnDef } from "@tanstack/react-table";

type Task = {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  createdAt: Date;
};

const columns: ColumnDef<Task>[] = [
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string;
      return <Badge variant={priority === "high" ? "destructive" : "secondary"}>{priority}</Badge>;
    },
  },
];
```

Notice the `cell` property on priority — that's where you customize rendering. The header and cells can be plain strings or full React components.

### 3. The Table Instance

Once you have columns and data, you create a **table instance**. This is where all the magic happens:

```typescript
import { useReactTable, getCoreRowModel, getSortedRowModel } from "@tanstack/react-table";

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
});
```

The `useReactTable` hook returns an object with methods to:
- Get header groups (`table.getHeaderGroups()`)
- Get rows (`table.getRowModel().rows`)
- Control sorting, filtering, pagination state
- Toggle column visibility

Each `get*RowModel()` function you add opts into a feature. No sorting import? No sorting overhead.

### 4. shadcn DataTable Pattern

shadcn doesn't ship a `<DataTable>` component out of the box — instead, it provides a **pattern** for building one. The docs show you how to compose TanStack Table with shadcn's `<Table>` component:

```
shadcn <Table>          → styled <table> wrapper
shadcn <TableHeader>    → styled <thead>
shadcn <TableRow>       → styled <tr>
shadcn <TableHead>      → styled <th>
shadcn <TableCell>      → styled <td>
TanStack Table          → sorting, filtering, pagination logic
```

You wire them together in a reusable `<DataTable>` component. This is the pattern we'll build.

### 5. Tabs: Categorical Views

shadcn's `<Tabs>` component gives you accessible, styled tab navigation. For TaskFlow, we'll use tabs to filter tasks by category: **All**, **Active**, **Completed**.

Tabs are *controlled* or *uncontrolled*:
- **Uncontrolled:** `<Tabs defaultValue="all">` — tabs manage their own state
- **Controlled:** `<Tabs value={activeTab} onValueChange={setActiveTab}>` — you own the state

We'll use controlled tabs so we can sync the active tab with our table's filter state.

### 6. Toast Notifications

When a user creates, edits, or deletes a task, they need feedback. A toast notification is a non-intrusive message that slides in, stays briefly, and disappears.

shadcn integrates with **Sonner** — a lightweight toast library by Emil Kowalski. It's elegant and simple:

```typescript
import { toast } from "sonner";

toast.success("Task created successfully!");
toast.error("Failed to delete task.");
toast.info("You have 3 overdue tasks.");
```

You drop a `<Toaster />` component in your layout once, and then call `toast()` from anywhere. No context providers, no state management — it's beautifully simple.

### 7. Skeleton Loading States

A blank screen while data loads is jarring. A spinner is... okay. But the best UX is a **skeleton** — a placeholder that mimics the shape of the content about to load.

shadcn's `<Skeleton>` is a pulsing gray block you size to match your content:

```tsx
<Skeleton className="h-4 w-[250px]" />   {/* text line */}
<Skeleton className="h-10 w-full" />       {/* table row */}
<Skeleton className="h-8 w-8 rounded-full" /> {/* avatar */}
```

The key insight: skeletons work best when they **match the layout** of the real content. Users perceive the page loading faster because the layout doesn't shift when real data appears.

---
id: 13-data-display

## 💡 Examples

### Example 1: Basic TanStack Table with shadcn

```tsx
// components/data-table.tsx
"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

**What's happening:** `flexRender` is TanStack Table's render helper — it takes a column definition's `header` or `cell` (which can be a string, function, or component) and renders it with the proper context. This is the glue between TanStack's headless logic and your shadcn UI.

### Example 2: Adding Sorting

```tsx
"use client";

import { useState } from "react";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

// Make a column sortable by customizing the header
const columns: ColumnDef<Task>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "priority",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Priority
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
];

// In your DataTable component:
export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  // ... same render as before
}
```

**The pattern:** TanStack Table uses a state-handler pattern. You provide the state (`sorting`) and the setter (`onSortingChange: setSorting`). The table reads the state to determine sort order, and calls the setter when the user clicks a header. You're always in control.

### Example 3: Column Filtering

```tsx
import {
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";

// Inside your DataTable:
const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  onColumnFiltersChange: setColumnFilters,
  state: {
    columnFilters,
  },
});

// Add a filter input above the table:
<Input
  placeholder="Filter tasks..."
  value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
  onChange={(event) =>
    table.getColumn("title")?.setFilterValue(event.target.value)
  }
  className="max-w-sm"
/>
```

### Example 4: Pagination

```tsx
import { getPaginationRowModel } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

// Add to useReactTable:
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
});

// Pagination controls:
<div className="flex items-center justify-end space-x-2 py-4">
  <Button
    variant="outline"
    size="sm"
    onClick={() => table.previousPage()}
    disabled={!table.getCanPreviousPage()}
  >
    Previous
  </Button>
  <span className="text-sm text-muted-foreground">
    Page {table.getState().pagination.pageIndex + 1} of{" "}
    {table.getPageCount()}
  </span>
  <Button
    variant="outline"
    size="sm"
    onClick={() => table.nextPage()}
    disabled={!table.getCanNextPage()}
  >
    Next
  </Button>
</div>
```

### Example 5: Tabs for Category Filtering

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TaskCategory = "all" | "active" | "completed";

function TaskDashboard() {
  const [activeTab, setActiveTab] = useState<TaskCategory>("all");
  const { tasks } = useTaskContext();

  const filteredTasks = (() => {
    switch (activeTab) {
      case "active":
        return tasks.filter((t) => t.status !== "done");
      case "completed":
        return tasks.filter((t) => t.status === "done");
      default:
        return tasks;
    }
  })();

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TaskCategory)}>
      <TabsList>
        <TabsTrigger value="all">
          All <span className="ml-1 text-muted-foreground">({tasks.length})</span>
        </TabsTrigger>
        <TabsTrigger value="active">
          Active <span className="ml-1 text-muted-foreground">
            ({tasks.filter((t) => t.status !== "done").length})
          </span>
        </TabsTrigger>
        <TabsTrigger value="completed">
          Completed <span className="ml-1 text-muted-foreground">
            ({tasks.filter((t) => t.status === "done").length})
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value={activeTab}>
        <DataTable columns={columns} data={filteredTasks} />
      </TabsContent>
    </Tabs>
  );
}
```

**Key design decision:** We're using a single `<TabsContent>` that renders for *any* active tab, rather than three separate `<TabsContent>` blocks. This is because the DataTable is the same component — only the data changes. Simpler, less duplication.

### Example 6: Toast Notifications with Sonner

```tsx
// In your layout (once):
import { Toaster } from "@/components/ui/sonner";

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

// Anywhere in your app:
import { toast } from "sonner";

function useTaskActions() {
  const { addTask, removeTask, updateTask } = useTaskContext();

  const createTask = (task: NewTask) => {
    addTask(task);
    toast.success("Task created", {
      description: `"${task.title}" has been added to your list.`,
    });
  };

  const deleteTask = (id: string) => {
    removeTask(id);
    toast.success("Task deleted", {
      description: "The task has been removed.",
      action: {
        label: "Undo",
        onClick: () => {
          // Restore the task — we'll implement this properly later
          toast.info("Undo is not yet implemented");
        },
      },
    });
  };

  return { createTask, deleteTask };
}
```

Notice the `action` property — Sonner lets you add an action button right in the toast. This is perfect for undo functionality.

### Example 7: Skeleton Loading States

```tsx
import { Skeleton } from "@/components/ui/skeleton";

function TaskTableSkeleton() {
  return (
    <div className="rounded-md border">
      {/* Header skeleton */}
      <div className="border-b p-4">
        <div className="flex gap-4">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[120px]" />
        </div>
      </div>

      {/* Row skeletons */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b p-4">
          <Skeleton className="h-4 w-4" />           {/* checkbox */}
          <Skeleton className="h-4 w-[200px]" />     {/* title */}
          <Skeleton className="h-6 w-[60px] rounded-full" /> {/* badge */}
          <Skeleton className="h-4 w-[80px]" />      {/* date */}
        </div>
      ))}
    </div>
  );
}

// Usage with Suspense or loading state:
function TaskPage() {
  const { tasks, isLoading } = useTaskContext();

  if (isLoading) {
    return <TaskTableSkeleton />;
  }

  return <DataTable columns={columns} data={tasks} />;
}
```

---
id: 13-data-display

## 🔨 Project Task: Build the TaskFlow Data Table

Time to replace that basic task list with a proper data table. Here's the plan:

### Step 1: Install Dependencies

```bash
npm install @tanstack/react-table

# Add shadcn components
npx shadcn@latest add table tabs skeleton
npx shadcn@latest add sonner
```

### Step 2: Define Your Task Columns

Create `src/components/tasks/columns.tsx`:

```tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Task } from "@/types/task";

export const columns: ColumnDef<Task>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Title
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variant = status === "done" ? "default" : status === "in-progress" ? "secondary" : "outline";
      return <Badge variant={variant}>{status}</Badge>;
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Priority
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string;
      const variant = priority === "high" ? "destructive" : priority === "medium" ? "default" : "secondary";
      return <Badge variant={variant}>{priority}</Badge>;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Created
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return <span>{date.toLocaleDateString()}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const task = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(task.id)}>
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
```

### Step 3: Build the DataTable Component

Create `src/components/ui/data-table.tsx` — use Example 1 as the base, then add sorting (Example 2), filtering (Example 3), and pagination (Example 4). Combine them all:

```tsx
"use client";

import { useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterColumn?: string;
  filterPlaceholder?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterColumn = "title",
  filterPlaceholder = "Filter tasks...",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters },
  });

  return (
    <div>
      {/* Filter input */}
      <div className="flex items-center py-4">
        <Input
          placeholder={filterPlaceholder}
          value={(table.getColumn(filterColumn)?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table.getColumn(filterColumn)?.setFilterValue(e.target.value)
          }
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between py-4">
        <span className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} task(s) total
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### Step 4: Add Category Tabs

Create `src/components/tasks/task-dashboard.tsx` — follow Example 5. Wire up tabs to filter the data passed to `<DataTable>`.

### Step 5: Wire Up Toast Notifications

1. Add `<Toaster />` to your root layout.
2. Import `toast` from `sonner` in your task action handlers.
3. Add toasts for: task created, task updated, task deleted, task completed.
4. Bonus: add an undo action to the delete toast.

### Step 6: Add Loading Skeletons

1. Create `src/components/tasks/task-table-skeleton.tsx` following Example 7.
2. Show the skeleton while tasks are being loaded from localStorage (simulate a delay with `setTimeout` if needed to see it in action).
3. Make your skeleton match the actual table layout — same number of "columns," similar widths.

### Step 7: Bring It All Together

Your task page should now look like:

```tsx
function TasksPage() {
  const { tasks, isLoading } = useTaskContext();

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Tasks</h1>

      {isLoading ? (
        <TaskTableSkeleton />
      ) : (
        <TaskDashboard tasks={tasks} />
      )}
    </div>
  );
}
```

Where `<TaskDashboard>` contains the tabs and data table.

---
id: 13-data-display

## 🧪 Challenge

**Row Selection & Bulk Actions:**

1. Enable row selection on the DataTable (the checkbox column is already in the column definitions).
2. Track selected rows: `const [rowSelection, setRowSelection] = useState({})` and pass to table state.
3. When rows are selected, show a toolbar with bulk actions: "Mark Complete", "Delete Selected".
4. Implement the bulk actions — update/delete all selected tasks at once.
5. Show a toast: "3 tasks marked as complete" with an undo option.

**Column Visibility Toggle:**

Add a dropdown button that lets users show/hide columns. TanStack Table supports this natively:

```tsx
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" className="ml-auto">Columns</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    {table
      .getAllColumns()
      .filter((column) => column.getCanHide())
      .map((column) => (
        <DropdownMenuCheckboxItem
          key={column.id}
          checked={column.getIsVisible()}
          onCheckedChange={(value) => column.toggleVisibility(!!value)}
        >
          {column.id}
        </DropdownMenuCheckboxItem>
      ))}
  </DropdownMenuContent>
</DropdownMenu>
```

---
id: 13-data-display

## 📚 Further Reading

- [TanStack Table Docs](https://tanstack.com/table/latest) — comprehensive API reference
- [shadcn DataTable Guide](https://ui.shadcn.com/docs/components/data-table) — the official pattern we followed
- [shadcn Tabs](https://ui.shadcn.com/docs/components/tabs) — API and examples
- [Sonner](https://sonner.emilkowal.ski/) — the toast library behind shadcn's toast
- [shadcn Skeleton](https://ui.shadcn.com/docs/components/skeleton) — loading placeholder component
- [Designing Effective Data Tables](https://medium.com/nextux/design-better-data-tables-4ecc99d23356) — UX best practices

---
id: 13-data-display

**Next up: [Chapter 14 — Forms the shadcn Way →](/chapters/14-shadcn-forms)**

We'll rebuild TaskFlow's forms with shadcn's Form component — combining React Hook Form, Zod validation, and beautiful accessible UI components.
