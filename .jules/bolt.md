## 2024-05-24 - React Render Loop RegExp Compilation Anti-Pattern
**Learning:** Compiling dynamic Regular Expressions for every entity inside a render helper function (like `getDetectedLinks` in `App.jsx`) is a massive performance bottleneck. The overhead of instantiating `new RegExp` thousands of times per render cycle severely degrades latency. However, when optimizing this by moving the regex compilation into a `useMemo` dictionary, returning a mapped object that only contains the new RegExps and omitting the original object's properties causes functional regressions because downstream components rely on the original entity properties (like `type`, `description`, etc.).
**Action:** When creating a memoized dictionary of compiled objects or RegExp matchers based on an array of entities, always ensure to spread (`...e`) or pass through the original entity properties alongside the new compiled properties to avoid breaking the application state.

## 2023-10-27 - Debouncing Auto-save for Large Data
**Learning:** Saving an entire large dataset (e.g., thousands of entities) to `localStorage` synchronously via `useEffect` on every keystroke causes significant main-thread blocking due to `JSON.stringify` overhead. This leads to severe typing latency.
**Action:** Always debounce expensive serialization and `localStorage` writes when they are tied to high-frequency events like typing, especially as the data payload scales.

## 2025-03-11 - Array Allocation in Hot Loops (Network Graph)
**Learning:** `[a, b].sort().join('|')` inside an O(N²) nested loop for semantic similarity weighting causes extreme performance degradation due to continuous Array instantiation, method calls, and garbage collection. JS string comparison (`a < b ? a + '|' + b : b + '|' + a`) is dramatically faster and achieves the exact same bidirectional key consistency.
**Action:** Always use primitive string concatenation with simple conditionals for generating bidirectional hash keys in computationally heavy nested loops, avoiding temporary object creation.
