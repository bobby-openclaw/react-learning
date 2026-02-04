# Reference Material for Chapter Authors

## React 19 Key Features (highlight these throughout!)

### New Hooks & APIs
1. **`useActionState`** — replaces manual isPending/error/state management for form actions
   - `const [error, submitAction, isPending] = useActionState(actionFn, initialState)`
   - Wraps an async function, returns state + wrapped action + pending boolean
   - Previously called `useFormState` in canaries

2. **`useFormStatus`** — read parent `<form>` status without prop drilling
   - `const { pending } = useFormStatus()` inside any child of `<form>`
   - Great for design system submit buttons

3. **`useOptimistic`** — optimistic UI updates during async actions
   - `const [optimisticValue, setOptimisticValue] = useOptimistic(currentValue)`
   - Auto-reverts to real value when action completes/errors

4. **`use()`** — read promises and context in render
   - `const data = use(promise)` — suspends until resolved
   - `const theme = use(ThemeContext)` — can be called conditionally (after early returns!)
   - NOT a hook — can be called inside if/loops

5. **Actions** — async functions in transitions
   - `<form action={asyncFn}>` — auto form handling + reset
   - `startTransition(async () => { ... })` — async transitions with isPending
   - Automatic pending state, error handling, optimistic updates

### Improvements (no more boilerplate!)
6. **`ref` as a prop** — NO MORE `forwardRef`!
   - `function MyInput({ placeholder, ref }) { ... }` — just a prop now
   - `forwardRef` will be deprecated

7. **`<Context>` as provider** — NO MORE `<Context.Provider>`!
   - `<ThemeContext value="dark">` instead of `<ThemeContext.Provider value="dark">`

8. **Ref cleanup functions** — return a cleanup from ref callbacks
   - `ref={(el) => { setup(el); return () => cleanup(el) }}`

9. **`useDeferredValue` initial value** — `useDeferredValue(value, initialValue)`

10. **Document Metadata** — `<title>`, `<meta>`, `<link>` work anywhere in component tree

11. **Stylesheet support** — `<link rel="stylesheet" precedence="default" href="...">`

12. **Resource preloading** — `prefetchDNS`, `preconnect`, `preload`, `preinit`

13. **Better hydration error diffs** — shows actual diff instead of useless warnings

14. **React Compiler** (experimental) — auto-memoization, no more manual memo/useMemo/useCallback

### What's Removed/Changed
- `forwardRef` → ref is just a prop
- `<Context.Provider>` → `<Context>` directly
- `useFormState` → renamed to `useActionState`
- Better error reporting across the board

## React 19 "Before vs After" Patterns

### Form Handling
```jsx
// BEFORE (React 18) — manual everything
function UpdateName() {
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [isPending, setIsPending] = useState(false);
  
  const handleSubmit = async () => {
    setIsPending(true);
    const error = await updateName(name);
    setIsPending(false);
    if (error) { setError(error); return; }
    redirect("/path");
  };
}

// AFTER (React 19) — useActionState handles it all
function UpdateName() {
  const [error, submitAction, isPending] = useActionState(
    async (prev, formData) => {
      const error = await updateName(formData.get("name"));
      if (error) return error;
      redirect("/path");
      return null;
    },
    null
  );
  return (
    <form action={submitAction}>
      <input name="name" />
      <button disabled={isPending}>Update</button>
      {error && <p>{error}</p>}
    </form>
  );
}
```

### Ref Forwarding
```jsx
// BEFORE — forwardRef wrapper
const MyInput = forwardRef(function MyInput(props, ref) {
  return <input ref={ref} {...props} />;
});

// AFTER — ref is just a prop
function MyInput({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}
```

### Context Provider
```jsx
// BEFORE
<ThemeContext.Provider value="dark">{children}</ThemeContext.Provider>

// AFTER
<ThemeContext value="dark">{children}</ThemeContext>
```

### Reading Promises
```jsx
// BEFORE — useEffect + useState dance
function Comments({ postId }) {
  const [comments, setComments] = useState(null);
  useEffect(() => {
    fetchComments(postId).then(setComments);
  }, [postId]);
  if (!comments) return <Loading />;
  return comments.map(c => <p key={c.id}>{c.text}</p>);
}

// AFTER — use() + Suspense
function Comments({ commentsPromise }) {
  const comments = use(commentsPromise);
  return comments.map(c => <p key={c.id}>{c.text}</p>);
}
// Parent wraps in <Suspense fallback={<Loading />}>
```

## Vercel Best Practices (integrate where relevant)
- Eliminate waterfalls: Promise.all for independent ops, defer await, Suspense boundaries
- Bundle size: avoid barrel imports, dynamic imports for heavy components, preload on intent
- Re-render optimization: derive state during render (not effects), functional setState, lazy state init
- Use transitions for non-urgent updates (useTransition, startTransition)
- Narrow effect dependencies to primitives
- Put interaction logic in event handlers, not effects
- Content-visibility CSS for long lists
- Use ternary not && for conditional rendering (avoids rendering 0/empty string)
