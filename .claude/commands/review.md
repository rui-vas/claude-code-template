Review the code changes on the current branch compared to main.

Steps:
1. Run `git diff main...HEAD` to see all changes
2. For each changed file, analyze:
   - Correctness: Are there bugs, logic errors, or edge cases?
   - Security: Any injection risks, hardcoded secrets, or OWASP top 10 issues?
   - Performance: Any unnecessary loops, missing indexes, or N+1 queries?
   - Readability: Is the code clear and well-structured?
3. Provide a summary with:
   - What the changes do (1-2 sentences)
   - Issues found (critical first, then suggestions)
   - An overall verdict: ship it, needs changes, or needs discussion
