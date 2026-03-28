1. **Understand the code health issue:**
   The codebase in `Narrative-Architect/src/App.jsx` has duplicated event handlers for keyboard accessibility. Specifically, `onKeyDown` handlers on elements acting as buttons check for `Enter` and `Space` keys to execute a callback (e.g., `setSelectedId(event.id)`). This logic is duplicated.
2. **Assess the impact:**
   Creating a small reusable helper function prevents duplicated code, makes it easier to change keyboard accessibility behavior globally, and improves the readability of JSX components.
3. **Plan the refactoring:**
   - Define a helper function `createAccessibleKeyDownHandler(callback)` or `handleAccessibleKeyDown(e, callback)` in `Narrative-Architect/src/App.jsx`. I will use `handleAccessibleKeyDown(callback)` as a higher-order function to keep the JSX clean.
     ```javascript
     export const handleAccessibleKeyDown = (callback) => (e) => {
       if (e.key === 'Enter' || e.key === ' ') {
         e.preventDefault();
         callback(e);
       }
     };
     ```
   - Actually, since `App.jsx` is the primary file, I will add it to the top of `App.jsx` in the `// --- Utility Functions ---` section.
   - I will search for usages of `e.key === 'Enter' || e.key === ' '` across the codebase. From my `grep` searches, it is currently in `App.jsx` on lines 1746 and 1832. Both are `onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(event.id); } }}`.
   - Replace these with `onKeyDown={handleAccessibleKeyDown(() => setSelectedId(event.id))}`.
   - Note that `handleKeyPress` for `TextArea` is slightly different (`e.key === 'Enter' && !e.shiftKey`), so I will leave it as is or handle it separately. The main issue points to `e.key === 'Enter' || e.key === ' '`.
4. **Implementation:**
   - Modify `Narrative-Architect/src/App.jsx` to introduce `handleAccessibleKeyDown`.
   - Update `Narrative-Architect/src/App.jsx` to use it in the two identified locations.
5. **Verification:**
   - Run linter/format checks.
   - Run tests if available.
   - Start the dev server and test keyboard navigation visually/manually to ensure the cards are still clickable via Enter/Space.
6. **Pre-commit and Submit:**
   - Run `pre_commit_instructions` and follow them.
   - Submit a PR with the requested format.
