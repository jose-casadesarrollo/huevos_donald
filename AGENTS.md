<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:supabase-agent-rules -->
# Supabase development & security guidance

Distilled from the official Supabase agent skill (`supabase/agent-skills`). To install the
full skill locally, run `npx skills add supabase/agent-skills` (adds the `supabase` and
`supabase-postgres-best-practices` skills). Until then, follow these rules.

## Verify, don't guess
- Supabase changes frequently — **verify against current docs, not training data**. Fetch any
  docs page as markdown by appending `.md` to its URL, or use the MCP `search_docs` tool.
- Check the changelog for breaking changes before implementing. If stuck after 2–3 attempts,
  change approach instead of retry-looping.

## Migrations & schema changes
- Iterate with `execute_sql` (MCP) or `supabase db query` (CLI). **Do not** use `apply_migration`
  for exploratory iterations — it clutters migration history. Reserve `apply_migration` (or a
  committed file under `supabase/migrations/`) for finalized changes.
- After schema changes: run the **advisors** (`get_advisors` security + performance), review,
  then reconcile local migrations with `supabase db pull`.

## RLS & security checklist
- **Enable RLS on every table in any exposed schema** — defense in depth, even for "public" data.
- Newly created tables aren't auto-exposed via the REST API; grant `anon`/`authenticated`
  explicitly via SQL when intended.
- **Never use `user_metadata` for authorization** (user-editable) — use `app_metadata`.
- **Never expose the service role key in client code.** It bypasses RLS; use it only server-side
  (here: inside Edge Functions / the Next.js server). The Edge agent is the sole writer to the
  `orders`/`agent_*` tables via the service role.
- **Views bypass RLS by default** — create them with `security_invoker = true` (PG 15+).
- **`SECURITY DEFINER` functions bypass RLS** — don't use them for access control.
- An UPDATE policy also needs a matching SELECT policy, or updates silently affect 0 rows.
- `TO authenticated` alone is not row-level protection — combine with an ownership check
  (e.g. `user_id = auth.uid()`).
<!-- END:supabase-agent-rules -->
