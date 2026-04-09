## 2024-03-19 - Replace O(N) Array/Set allocation with O(1) Map lookup
**Learning:** Using `new Set(entities.map(e => e.id))` to clean up cache entries per render in `entityLinkDictionary` caused O(N) array allocation and Set insertion, degrading performance.
**Action:** Replace inefficient O(N) operations inside `useMemo` blocks with O(1) map lookups via the precomputed `entitiesMap`.

## 2024-05-17 - Eliminate redundant Date object instantiation inside mapping callbacks
**Learning:** When generating large derived lists (like formatting `timelineEvents` or mapping `getAge`), evaluating `new Date()` or regex object creation repeatedly inside the loop causes excessive garbage collection pressure, leading to UI thread blocking.
**Action:** Memoize primitive-to-Object conversions using a module-level `Map` (e.g., `parsedDateCache` inside `parseDateString`) to ensure redundant string conversions return a constant reference in O(1) time.
## 2025-02-28 - [Optimize Array Iteration in Network Graph Computation]
**Learning:** In the network view graph `useEffect`, using higher-order array methods like `.map()` and `.forEach()` on the large `entities` array on every keystroke introduces unnecessary callback execution overhead. Furthermore, using `.map()` without pre-allocating the resulting array causes memory expansion overhead.
**Action:** Replace `.map()` and `.forEach()` with standard `for` loops in performance-critical `useEffect` hooks that iterate over large collections. Pre-allocate arrays like `nodes` and `linkIds` using `new Array(len)` to optimize memory usage and reduce main-thread blocking during editing.
