---
description: Design a feature — delegates to the planner (Opus) agent to produce a plan in plans/
argument-hint: <feature description>
---

Use the `planner` agent to design the following feature for GrooveTracker:

$ARGUMENTS

The planner should read `CLAUDE.md`, produce a plan file in `plans/` from
`plans/TEMPLATE.md`, and end it with a task breakdown. When it returns, summarize the plan
for me and ask before we start implementing.
