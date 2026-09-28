---
trigger: always_on
---

# Browser Testing Guidelines
- Never use Playwright, browser tools, or screenshot tools unless explicitly asked by the user.
- Apply code changes directly and rely on fast unit tests (`npm test`) or user inspection.
