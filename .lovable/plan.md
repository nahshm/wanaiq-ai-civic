
Goal: eliminate all `vectors` 400 errors and make the RAG Knowledge Base flow reliable and secure.

What I found
- Root cause #1 (confirmed): `public.vectors` does not have a `title` column, but the app requests and inserts `title`.
  - Failing query pattern: `select id, source_type, title, content, created_at ...`
  - Failing insert pattern: `.insert({ title, content, source_type, embedding: null })`
- Root cause #2 (will surface right after #1 is fixed): `vectors` has only a SELECT RLS policy; there is no INSERT policy for client writes.
- `source_type=eq.kenya_constitution` is not the primary issue; it fails because the select includes missing `title`.

Implementation plan
1) Database migration (schema + secure access)
- Add `title text null` to `public.vectors` so existing dashboard query/insert shape is valid.
- Add admin-only write policies on `vectors` using server-side role check:
  - INSERT/UPDATE/DELETE allowed only when `public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')`.
- Keep or tighten SELECT policy based on desired visibility:
  - Recommended: allow read for admin/super_admin only (since this is an internal knowledge base), unless regular authenticated users must browse raw vectors.

2) Frontend fix in `SuperAdminDashboard.tsx`
- Keep `title` in select and insert (once column exists).
- Add robust error handling:
  - `fetchVectors`: if error, show toast with message and stop silently setting empty data.
  - `handleAddDoc`: surface exact DB/RLS error in toast.
- Keep source filter list as-is (`kenya_constitution`, etc.) since it matches intended taxonomy.

3) Optional consistency improvement (edge pipeline)
- In `supabase/functions/civic-scout/index.ts`, include `title` when writing to `vectors` so feed-ingested docs display readable titles in the admin viewer.
- This is optional but improves UX and debugging.

4) Verification checklist
- Open RAG Viewer:
  - GET `/rest/v1/vectors?...title...` returns 200 (no 400).
  - Filtering by `source_type=kenya_constitution` returns 200.
- Add document from UI:
  - POST `/rest/v1/vectors` returns 201 for admin/super_admin.
  - Non-admin users are blocked by RLS (expected).
- Confirm no repeated vector 400s in console/network.

Technical details (exact changes)
- DB:
  - `ALTER TABLE public.vectors ADD COLUMN IF NOT EXISTS title text;`
  - Create RLS policies for INSERT/UPDATE/DELETE using `public.has_role(...)`.
- App file:
  - `src/features/admin/pages/SuperAdminDashboard.tsx`:
    - retain `select('id, source_type, title, content, created_at')`
    - retain insert payload with `title`
    - add explicit `error` handling branches for both read/write.
- Optional edge function:
  - `supabase/functions/civic-scout/index.ts` vector insert payload add `title: item.title`.

Order of execution
1. Apply DB migration (column + policies)
2. Update dashboard error handling
3. (Optional) add scout title propagation
4. End-to-end retest of RAG viewer + add document flow
