# Budget App

Vite + React 프론트엔드와 Supabase 저장소를 사용하는 가계부 앱입니다. 현재 운영 방식은 Vercel의 Git 연동으로 프론트 배포를 처리하고, GitHub Actions는 코드 검증과 Supabase migration 반영을 담당하도록 분리되어 있습니다.

## 현재 구조

```text
budget-app/
├─ .env.example
├─ .github/
│  └─ workflows/
│     ├─ ci.yml
│     └─ deploy.yml
├─ scripts/
│  └─ validate-env.mjs
├─ src/
│  ├─ BudgetTracker.jsx
│  ├─ db.js
│  └─ main.jsx
├─ supabase/
│  ├─ config.toml
│  └─ migrations/
│     └─ 20260408_create_budget_store.sql
├─ vercel.json
└─ package.json
```

## 이번에 반영된 UI 변경

- 내역 추가 모달 하단 버튼을 2개로 분리했습니다.
- 왼쪽 `추가`는 저장 후 모달을 닫습니다.
- 오른쪽 `계속입력`은 저장 후 모달을 유지합니다.
- `계속입력` 동작 시:
  - 날짜 유지
  - 지출/수입 탭 유지
  - 카테고리만 `선택`으로 초기화
  - 금액, 메모 초기화
  - 금액 입력칸에 자동 포커스
- 저장 중에는 버튼과 닫기 동작을 비활성화하고 `저장 중...` 상태를 표시합니다.

## 환경변수 관리 원칙

클라이언트에 들어가는 값과 GitHub Actions 전용 비밀값을 분리합니다.

### 로컬 `.env.local`

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

### GitHub Secrets

다음 항목을 GitHub 저장소의 `Settings > Secrets and variables > Actions`에 등록합니다.

- `SUPABASE_PROJECT_ID`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_ACCESS_TOKEN`

추가로 Vercel 프로젝트 설정에는 아래 두 값을 등록합니다.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

이 구조를 쓰면 코드에는 키를 하드코딩하지 않고, 데이터베이스 자동화는 GitHub에서, 프론트 배포는 Vercel에서 안정적으로 나눠 관리할 수 있습니다.

## 로컬 개발 시작

### 사전 준비

- Node.js 20 이상
- npm 10 이상 권장
- Supabase 프로젝트 또는 테스트용 Supabase 인스턴스

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 준비

```bash
cp .env.example .env.local
```

실제로는 `.env.example` 전체를 복사한 뒤, 최소한 아래 두 개는 반드시 채워야 합니다.

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### 3. 개발 서버 실행

```bash
npm run dev
```

## Supabase 운영 방식

### 로컬에서 migration 추가

```bash
supabase migration new add_some_feature
```

생성된 SQL 파일을 `supabase/migrations/` 아래에서 수정합니다.

### 원격 DB에 반영

로컬에서 직접 반영할 때:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

운영에서는 기본적으로 `main` 브랜치에 push하면 GitHub Actions가 migration을 반영하고, 같은 push를 감지한 Vercel이 프론트를 배포합니다.

## 운영 자동화 흐름

### CI

`.github/workflows/ci.yml`

- PR / main push 시 실행
- 필수 클라이언트 환경변수 검사
- Vite 빌드 검증

### Supabase Migration Sync

`.github/workflows/deploy.yml`

- `main` push 또는 수동 실행 시 동작
- Supabase CLI로 migration 반영

즉, 기본 운영 플로우는 아래처럼 단순화됩니다.

1. 기능 개발
2. migration 포함 커밋
3. GitHub push
4. Actions가 migration 반영
5. Vercel Git 연동이 production 배포

## Vercel 연결 방식

이 저장소는 `vercel.json`과 GitHub Actions를 함께 둡니다.

- `vercel.json`: 빌드 방식과 출력 폴더를 코드로 관리
- `deploy.yml`: Supabase migration을 GitHub에서 관리

권장 설정:

1. Vercel에서 이 GitHub 저장소를 연결합니다.
2. Project Settings에서 Environment Variables에도 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 등록합니다.
3. 실제 프론트 배포는 Vercel Git integration 하나만 메인으로 사용합니다.

현재 예시는 `Vercel 배포 + GitHub migration` 분리형입니다. 이 구성이 중복 배포와 `.vercel` 충돌을 피하기 가장 쉽습니다.

## 팀 온보딩 체크리스트

새 팀원이 합류하면 아래 순서로 끝납니다.

1. 저장소 clone
2. `npm install`
3. `.env.local` 생성 후 `VITE_SUPABASE_*` 입력
4. 필요하면 Supabase CLI 로그인
5. `npm run dev` 실행
6. migration이 필요하면 `supabase migration new ...` 후 PR 생성

## 데이터 저장 구조

현재 앱은 `budget_store` 테이블에 key-value 형태로 저장합니다.

예시 키:

- `transactions`
- `recurring`
- `expense-cats`
- `income-cats`
- `budgets`
- `cat-colors`

이 구조는 빠르게 운영하기에는 단순하지만, 장기적으로는 사용자별 정규화 테이블로 분리하는 것이 맞습니다.

## 추천 다음 단계

1. Supabase Auth 도입 후 사용자별 데이터 분리
2. `budget_store`를 `transactions`, `budgets`, `categories` 테이블로 정규화
3. PR 단위 Preview 배포와 production 배포를 분리
4. 테스트 러너 추가 후 폼 저장 흐름에 대한 UI 테스트 작성
