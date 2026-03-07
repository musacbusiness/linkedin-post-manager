# Claude

## Projects

| Project | Path | Stack | Port |
|---------|------|-------|------|
| AIO Platform | `aio-platform/` | Next.js 16, React 19, Supabase, Tailwind v4 | 3000 |
| LinkedIn Post Manager | `linkedin-post-manager/` | Next.js 14, Supabase, Anthropic SDK, Replicate | 3000 |
| LinkedIn Automation | `linkedin_automation/` | Python (legacy, deprecated) | — |

See each project's CLAUDE.md for commands, structure, and reference docs.

## Boundaries

- Do not read `node_modules/`, `.next/`, `dist/`, `*.lock` files unless explicitly asked
- When working in one project, do not read files from the other project unless explicitly needed
- Large log files at workspace root (`*.log`) are runtime artifacts — do not read unless debugging a specific logged error
- Never read entire directories — read specific files only when required for the task
- Never summarize files that haven't been explicitly requested for summarization
- Before reading any file, confirm it is necessary for the current task
- Prefer targeted edits over full file rewrites unless >50% of file is changing

## Output Rules

- Never create checklist files, summary files, progress reports, or status documents
- If information needs to persist, update the relevant project docs/memory.md
- If information is only needed now, deliver it in the conversation
- Do not create README files unless explicitly requested
- Do not create .md files as task artifacts — memory.md is the only persistent output file

## Agent Task Completion Policy

**Complete every task that can be done autonomously. Only escalate what cannot be completed.**

1. **Execute fully**: Implement end-to-end — don't stop at planning or asking permission
2. **Fix, don't report**: If you find bugs while executing, fix them immediately
3. **Run tests and verify**: After changes, run lint/type-check/tests and confirm they pass
4. **Commit**: Save work to git with conventional commit messages (feat:, fix:, docs:, refactor:)
5. **Only defer when blocked by**:
   - Missing external credentials (API keys not in .env.local)
   - Unspecified design/product decisions
   - Operations outside agent scope (physical device testing, infra access)

**Execution pattern**: Understand → Execute → Verify → Commit → Report
