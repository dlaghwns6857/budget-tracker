-- supabase/seed.sql
-- 로컬 개발용 초기 데이터 시드
-- `supabase db reset` 실행 시 자동 적용됩니다.

INSERT INTO budget_store (key, value) VALUES
  ('transactions', '[]'::jsonb),
  ('recurring',    '[]'::jsonb),
  ('budgets',      '{}'::jsonb),
  ('expense-cats', '["식비","카페/간식","교통/차량","주거/관리비","통신","구독서비스","의료/건강","쇼핑/뷰티","문화/여가","교육","보험/세금","경조사/선물","반려동물","생활용품","기타"]'::jsonb),
  ('income-cats',  '["월급","부수입","용돈","상여금","금융소득","중고거래","기타수입"]'::jsonb),
  ('cat-colors',   '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;
