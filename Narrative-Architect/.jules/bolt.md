## 2024-03-19 - Replace O(N) Array/Set allocation with O(1) Map lookup
**Learning:** Using `new Set(entities.map(e => e.id))` to clean up cache entries per render in `entityLinkDictionary` caused O(N) array allocation and Set insertion, degrading performance.
**Action:** Replace inefficient O(N) operations inside `useMemo` blocks with O(1) map lookups via the precomputed `entitiesMap`.

## 2024-05-17 - Eliminate redundant Date object instantiation inside mapping callbacks
**Learning:** When generating large derived lists (like formatting `timelineEvents` or mapping `getAge`), evaluating `new Date()` or regex object creation repeatedly inside the loop causes excessive garbage collection pressure, leading to UI thread blocking.
**Action:** Memoize primitive-to-Object conversions using a module-level `Map` (e.g., `parsedDateCache` inside `parseDateString`) to ensure redundant string conversions return a constant reference in O(1) time.
## 2024-05-24 - Pre-allocate arrays to reduce intermediate allocations
**Learning:** Using chained array methods like `.map().map()` for array parsing inside computationally heavy `useMemo` hooks (like `timelineEventsProcessed`) creates temporary arrays that cause unnecessary memory churn and GC pauses.
**Action:** Replace chained higher-order array functions with single-pass `for` loops and pre-allocate target arrays (e.g., `new Array(length)`) to reduce garbage collection pressure.
