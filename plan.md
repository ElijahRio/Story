1. **Add a visual loading state to the send message button in the AI chat interface.**
   - In `Narrative-Architect/src/App.jsx`, locate the "Send message" button in the chat UI.
   - When `isTyping` is true, display a spinning `Activity` icon instead of the static `Send` icon.
   - This provides clearer feedback that the AI is processing the request, improving the user experience and matching the UX of other async operations in the app.
2. **Ensure proper testing, verification, review, and reflection are done**
   - Run the linter (`pnpm lint`) and build (`pnpm build`) to verify the changes.
   - Review the code to ensure it meets the `< 50 lines` requirement and doesn't introduce any regressions.
