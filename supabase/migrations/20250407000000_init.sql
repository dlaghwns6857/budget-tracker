-- ─────────────────────────────────────────────────────────────────────────────
-- 초기 스키마: budget_store 테이블
-- Initial schema: budget_store table
--
-- 적용 방법 / How to apply:
--   supabase db push          # 원격 Supabase 프로젝트에 적용
--   supabase db reset         # 로컬 Supabase에 처음부터 재적용
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.budget_store (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 업데이트 시 updated_at 자동 갱신 트리거
-- Trigger to auto-update updated_at on row update
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_budget_store_updated_at on public.budget_store;
create trigger trg_budget_store_updated_at
  before update on public.budget_store
  for each row execute procedure public.set_updated_at();

-- RLS(Row Level Security) 활성화 — 필요에 따라 정책 추가
-- Enable RLS — add policies as needed
alter table public.budget_store enable row level security;

-- 예시 정책: anon/authenticated 모두 읽기/쓰기 허용 (현재 앱 방식과 동일)
-- Example policy: allow read & write for anon role (matches current app behaviour)
create policy "allow_all_for_anon" on public.budget_store
  for all
  to anon
  using (true)
  with check (true);
