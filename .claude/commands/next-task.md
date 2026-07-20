---
description: Pick up the next open task and implement it via the implementer (Sonnet) agent
argument-hint: [optional task number]
---

Look at `tasks/TASKS.md` and identify the next open task$ARGUMENTS. Then delegate it to the
`implementer` agent, pointing it at the task and its parent plan in `plans/`.

When the implementer finishes, run the `reviewer` agent on the diff before we mark the
task done. Report both results to me.
