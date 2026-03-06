## 2024-05-14 - Inline Destructive Action Confirmation and Icon Clarity

**Learning:** Destructive actions (like purging records) need an inline, localized confirmation state, especially in dense UI views to prevent accidental clicks. Furthermore, icon ambiguity severely damages usability; utilizing a "Trash" icon for simply "closing" a modal contradicts user mental models and standard conventions (where "Trash" explicitly signifies "Delete" or "Purge").

**Action:** Ensure all delete or purge buttons in lists/record views implement an inline Yes/No confirmation toggle to capture mistaken clicks. For modal or panel closing actions, strictly use standard icons like the `X` (close) and reserve `Trash`/`Trash2` for actual deletion events.
