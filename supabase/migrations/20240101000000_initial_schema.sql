-- supabase/migrations/20240101000000_initial_schema.sql
-- budget_store 테이블: 가계부 앱의 모든 데이터를 key-value 형태로 저장합니다.
-- key      : 데이터 식별자 (예: 'transactions', 'recurring', 'budgets', ...)
-- value    : JSONB 형태의 실제 데이터
-- updated_at: 최종 수정 시각

CREATE TABLE IF NOT EXISTS budget_store (
  key        TEXT        PRIMARY KEY,
  value      JSONB       NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 업데이트 시 updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_budget_store_updated_at ON budget_store;
CREATE TRIGGER trg_budget_store_updated_at
  BEFORE UPDATE ON budget_store
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security: anon 키로 읽기·쓰기 허용 (개인용 앱)
ALTER TABLE budget_store ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_for_anon" ON budget_store;
CREATE POLICY "allow_all_for_anon"
  ON budget_store
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
