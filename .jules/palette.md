## 2024-05-24 - Modal Dismissal Icon Anxieties
**Learning:** Using destructive icons (like Trash2) and styles (like hover:text-rose-500) for non-destructive actions, such as dismissing a modal overlay, creates significant cognitive friction and user anxiety, especially in an auto-saving environment without an undo history. Users may fear they are about to delete data when they just want to cancel an action or close a dialog.
**Action:** Always use standard dismissal icons (e.g., 'X') for closing components, and reserve destructive icons strictly for actual destructive operations (like deleting records).

## 2024-05-15 - Explicit Focus States for Interactive Icons
**Learning:** For interactive icon-only buttons (like Settings, Merge Record, Send Message) that use specific color schemes and lack text labels, ensuring visible focus rings (`focus-visible:ring-2 focus-visible:ring-[theme-color]`) and comprehensive `title` attributes significantly improves accessibility and clarity, especially when states like `disabled` come into play.
**Action:** Always verify keyboard accessibility (`focus-visible` styles matching the theme color) and tooltips on icon-only interactive elements in future components.
