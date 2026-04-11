Generate a daily standup summary from recent git activity.

Steps:
1. Run `git log --oneline --since="yesterday" --author="$(git config user.name)"` to get recent commits
2. Run `git diff --stat main...HEAD` to see what files changed
3. Check `git stash list` for any stashed work in progress
4. Format the output as:

**Yesterday:**
- [list commits from the log]

**Today:**
- [infer next steps from the branch state and any TODOs in changed files]

**Blockers:**
- [flag any merge conflicts, failing tests, or unresolved TODOs]
