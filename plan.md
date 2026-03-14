1. Open `Narrative-Architect/src/App.jsx`.
2. Find the Network Graph computation `useEffect` (around line 419).
3. Introduce a `useRef` for caching text-based links per entity:
```jsx
  // ⚡ Bolt: Cache text-based links per entity to prevent O(N^2) string matching on every network render
  const textLinksCacheRef = useRef({ namesHash: '', cache: new Map() });
```
4. Inside the `useEffect`, check if the hash of all entity names has changed.
If it has, clear the cache. This ensures that when a new entity is created or renamed, the text-link matchers are re-evaluated globally.
5. In the `entities.forEach(entity => ...)` loop, build the `allText` string.
6. Check the cache for the entity ID. If it exists and the `allText` matches, reuse the cached array of detected link IDs.
7. If the cache misses or the text changed, call `getDetectedLinks`, extract the IDs, and store them in the cache.
8. Add the link weights based on the array of target IDs.
9. Complete pre commit instructions to ensure quality.
10. Submit PR with Bolt format.
