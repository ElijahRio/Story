## 2024-03-19 - Replace O(N) Array/Set allocation with O(1) Map lookup
**Learning:** Using `new Set(entities.map(e => e.id))` to clean up cache entries per render in `entityLinkDictionary` caused O(N) array allocation and Set insertion, degrading performance.
**Action:** Replace inefficient O(N) operations inside `useMemo` blocks with O(1) map lookups via the precomputed `entitiesMap`.
