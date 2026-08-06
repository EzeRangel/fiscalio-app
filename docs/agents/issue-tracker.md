# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v` — `gh` does this automatically when run inside a clone.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.

## Wayfinding operations

Wayfinder maps and tickets live as GitHub issues. **GitHub has no native blocking/dependency relationship**, so blocking falls back to a body convention (see below).

- **Map**: an issue labelled `wayfinder:map`. Its body follows the wayfinder map template (Destination / Notes / Decisions so far / Not yet specified / Out of scope).
- **Tickets**: child issues of the map, each labelled `wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling`, or `wayfinder:task`. Body is `## Question` plus a `## Blocked by` section.
- **Claiming**: a ticket is claimed by assigning it (`gh issue edit <n> --add-assignee @me`). An open, unassigned ticket is unclaimed.
- **Blocking** (body convention, GitHub has no native deps): a blocked ticket's body has a `## Blocked by` section listing the numbers of the tickets that block it. A ticket is unblocked when every number in that section is closed.
- **Frontier**: open, unassigned, unblocked `wayfinder:*` tickets. Query with `gh issue list --label wayfinder:<type> --state open --json number,title,assignees,state`, then filter out assigned and blocked ones by reading their `## Blocked by` sections.
- **Resolution**: post the answer as a comment, close the issue, append a context pointer to the map's "Decisions so far".
- **Children query**: `gh issue list --label wayfinder:map` won't return children (labels, not hierarchy). Children are found via the frontier query plus the blocking sections; the map issue links them in its body.
