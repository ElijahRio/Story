## 2024-05-24 - [Accessible Dynamic Form Labels with useId]
**Learning:** Reusable form components (`InputField`, `TextAreaField`) that can be instantiated multiple times on a single screen risk rendering multiple form fields mapped to identical `id` strings, causing screen-reader accessibility issues (A11y).
**Action:** Use `React.useId()` to generate deterministic unique identifiers inside reusable functional form components mapping `<label htmlFor={id}>` to `<input id={id}>`.
