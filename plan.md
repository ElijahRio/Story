1. **Optimize `getDetectedLinks` caching in `App.jsx`**
   - The current `detectedLinksCacheRef` caches only one entry per `currentId`.
   - However, `getDetectedLinks` is called multiple times for the same entity (e.g., for `description`, `systemic_inputs`, `systemic_outputs`, etc.) during render.
   - This causes cache thrashing where the cache is constantly overwritten and never hits, resulting in O(N) regex evaluations repeatedly.
   - I will modify `getDetectedLinks` to take a cache key or store multiple texts per `currentId`. The easiest fix is to make the inner cache a Map or Object keyed by the text itself (or a field name if provided), so that multiple texts for the same entity can be cached simultaneously.
2. **Implementation details**
   - Modify `detectedLinksCacheRef.current.cache` to store a Map for each `currentId`, which then maps `text` to `result`.
   - Update `getDetectedLinks` to use this nested map.
3. **Add a pre-commit step**
   - Ensure proper testing, verification, review, and reflection are done.
4. **Submit PR**
   - Use Bolt formatting for the PR title and description, explaining the fix and the impact.
