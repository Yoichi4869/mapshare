-- ============================================================
-- MapShare RLS ポリシー
-- Supabase ダッシュボード > SQL Editor に貼り付けて実行してください。
-- 目的:
--   * anon（公開キー）からの DELETE を全面的に禁止する
--     （非表示は report_count 方式で行うため、削除は不要）
--   * contacts の閲覧を禁止し、問い合わせメールアドレスを保護する
--   * 読み取り / 登録 / 編集（通報カウント更新を含む）は従来どおり許可する
-- ============================================================

-- 実行前に、既存の緩いポリシーが残っていないか確認:
--   select schemaname, tablename, policyname, cmd, roles
--   from pg_policies where schemaname = 'public';
-- 「全操作許可」や DELETE を許すポリシーがあれば DROP POLICY で削除してください。

-- ------------------------------------------------------------
-- 位置情報テーブル（読み取り・登録・編集は許可、削除は不可）
-- ------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['firewood_locations', 'sake_locations', 'beer_locations']
  loop
    execute format('alter table public.%I enable row level security;', t);

    execute format('drop policy if exists "anon_select" on public.%I;', t);
    execute format('drop policy if exists "anon_insert" on public.%I;', t);
    execute format('drop policy if exists "anon_update" on public.%I;', t);

    execute format(
      'create policy "anon_select" on public.%I for select to anon using (true);', t);
    execute format(
      'create policy "anon_insert" on public.%I for insert to anon with check (true);', t);
    execute format(
      'create policy "anon_update" on public.%I for update to anon using (true) with check (true);', t);
    -- DELETE 用ポリシーを作らない => anon の DELETE は拒否される
  end loop;
end $$;

-- ------------------------------------------------------------
-- contacts（登録のみ許可。閲覧・編集・削除は禁止）
-- ------------------------------------------------------------
alter table public.contacts enable row level security;

drop policy if exists "anon_insert" on public.contacts;
create policy "anon_insert" on public.contacts
  for insert to anon with check (true);
-- select/update/delete のポリシーを作らない => 全て拒否

-- ------------------------------------------------------------
-- keepalive（Supabase スリープ防止用。読み取り・upsert を許可）
-- ------------------------------------------------------------
alter table public.keepalive enable row level security;

drop policy if exists "anon_select" on public.keepalive;
drop policy if exists "anon_insert" on public.keepalive;
drop policy if exists "anon_update" on public.keepalive;

create policy "anon_select" on public.keepalive for select to anon using (true);
create policy "anon_insert" on public.keepalive for insert to anon with check (true);
create policy "anon_update" on public.keepalive for update to anon using (true) with check (true);

-- ============================================================
-- 実行後の確認:
--   select tablename, policyname, cmd from pg_policies where schemaname='public';
-- DELETE(cmd='DELETE') のポリシーが1つも無いこと、
-- contacts に SELECT ポリシーが無いことを確認してください。
-- ============================================================
