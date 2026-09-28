# TAKOTIME POS Workspace Guidelines

## Speed & Testing Constraints
1. **No Automatic Screenshots**: Do not capture browser screenshots or run slow browser automation sessions (`playwright` / `browser_subagent`) unless the user explicitly requests visual verification or screenshots.
2. **Fast Execution**: Apply requested code changes swiftly. Rely on direct code reasoning and fast unit tests (`npm test`) instead of slow interactive browser roundtrips.
