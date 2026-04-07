-- ─────────────────────────────────────────────────────────────────────────────
-- 시드 데이터 예시 (개발/테스트 환경 전용)
-- Sample seed data — for local development and testing only
--
-- 적용 방법 / How to apply:
--   supabase db reset          # 로컬 DB 초기화 후 seed.sql 자동 실행
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.budget_store (key, value, updated_at)
values
  ('budget', '{"amount": 500000}', now()),
  ('transactions', '[]', now())
on conflict (key) do nothing;
