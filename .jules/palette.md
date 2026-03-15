## 2024-05-24 - Modal Dismissal Icon Anxieties
**Learning:** Using destructive icons (like Trash2) and styles (like hover:text-rose-500) for non-destructive actions, such as dismissing a modal overlay, creates significant cognitive friction and user anxiety, especially in an auto-saving environment without an undo history. Users may fear they are about to delete data when they just want to cancel an action or close a dialog.
**Action:** Always use standard dismissal icons (e.g., 'X') for closing components, and reserve destructive icons strictly for actual destructive operations (like deleting records).

## 2024-05-15 - Explicit Focus States for Interactive Icons
**Learning:** For interactive icon-only buttons (like Settings, Merge Record, Send Message) that use specific color schemes and lack text labels, ensuring visible focus rings (`focus-visible:ring-2 focus-visible:ring-[theme-color]`) and comprehensive `title` attributes significantly improves accessibility and clarity, especially when states like `disabled` come into play.
**Action:** Always verify keyboard accessibility (`focus-visible` styles matching the theme color) and tooltips on icon-only interactive elements in future components.

## 2024-05-25 - Focus Ring Clipping on Flex/Grid Tab Items
**Learning:** When adding `focus-visible:ring` styles to dense UI elements (like flexed `flex-1` tab buttons), the focus ring is often clipped by adjacent elements.
**Action:** Always combine `focus-visible:ring-2` with `focus-visible:z-10` and `relative` (if not already positioned) to ensure the focus ring visually overlays neighboring elements rather than getting hidden behind them.

## 2024-05-26 - Dynamic Focus Rings for Themed Entity Lists
**Learning:** When dealing with dynamic lists of entities that each have their own theme color (e.g. tech is teal, assets are rose), applying a generic focus ring color can look disjointed. Using dynamic Tailwind classes (e.g. `focus-visible:ring-${themeColor}-500`) along with `focus:outline-none focus-visible:ring-2` creates a much more cohesive and premium keyboard navigation experience that respects the app's design language.
**Action:** When adding focus states to dynamically themed elements, attempt to inherit or match the element's specific theme color for the focus ring rather than defaulting to a standard generic color.
