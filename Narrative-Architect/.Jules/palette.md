## 2024-04-02 - Add ARIA labels to background action buttons
**Learning:** Screen reader users can lose context when background action buttons update their text and tooltip dynamically (e.g., from "Run System Audit" to "Scanning...").
**Action:** When buttons trigger background actions and use dynamic tooltips/text, explicitly set a static `aria-label` describing the full action (e.g., `aria-label="Run continuous integration audit"`) to guarantee consistent context.
