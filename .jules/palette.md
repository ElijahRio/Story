## 2024-05-24 - Inline Destructive Confirmation
**Learning:** Immediate destructive actions (like delete/purge) in applications utilizing local storage auto-save without an "undo" history present a severe risk of data loss. The previous single-click icon-only button caused anxiety.
**Action:** Implemented an inline, state-based confirmation step (Check/X icons) directly in the UI instead of a jarring modal, ensuring friction on destructive actions while maintaining the application's flow and accessible focus states.

## 2024-06-03 - Misleading Destructive Icons
**Learning:** Using destructive icons (like `<Trash2>`) for non-destructive actions, such as closing a modal or dismissing a pane, creates cognitive dissonance and user anxiety, especially in an app that auto-saves and has no undo function.
**Action:** Replaced the misleading icon with a standard `<X>` icon, added an appropriate `aria-label`, and ensured it has `focus-visible` styles for keyboard navigation. Always reserve destructive iconography exclusively for actual data deletion.