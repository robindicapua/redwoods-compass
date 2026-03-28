---
description: Update the JSON changelog whenever a JSON file is modified
---

Every time any JSON file in this project is modified (e.g., `src/redwoods_compass_questions_v0.6.json` or `resources/tokens.json`), you MUST update `docs/json-changelog.md` as part of the same change.

## Steps

1. Make the change to the JSON file.

2. Open `docs/json-changelog.md` and prepend a new entry at the top of the log (below the header), using this format:

```md
**Date:** YYYY-MM-DD  
**File:** `path/to/file.json`  
**Change:** [Field or question name] changed from "[old value]" to "[new value]"

---
```

3. Use today's actual date in `YYYY-MM-DD` format.

4. Be specific: quote the exact old and new text so the log is useful at a glance.
