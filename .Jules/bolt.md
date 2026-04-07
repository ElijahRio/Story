## 2024-04-12 - Hoisting String Operations Outside Loops
**Learning:** Calculating invariant string splits and lowercasing inside a `filter` loop causes redundant O(N) string allocations and slows down operations unnecessarily.
**Action:** Always identify invariant computations within loops (like calculating a `baseName` from a target entity) and hoist them outside the loop to eliminate repeated execution and reduce memory overhead.
