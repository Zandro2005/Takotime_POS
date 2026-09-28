# Fast Development & No Screenshot Testing Rule

- **Do Not Take Screenshots by Default**: Avoid using browser screenshot tools (`browser_take_screenshot`, `browser_subagent`) and lengthy browser automation runs during routine coding tasks unless the user explicitly requests a screenshot or visual recording.
- **Fast Turnaround**: Prioritize fast code delivery, direct styling adjustments, and quick unit tests (`npm test`). Do not run prolonged testing cycles or loops that delay answering the user.
- **Inspect Code Directly**: Verify layouts, responsiveness, and state handling via direct CSS and component code analysis.
