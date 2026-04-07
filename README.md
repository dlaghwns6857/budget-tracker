# 가계부 (Budget Tracker)

개인 가계부 앱 — React + Vite 프론트엔드, Supabase(PostgreSQL) 백엔드, Vercel 배포.  
**모든 인프라·환경·자동화가 이 저장소 하나에서 관리됩니다.**

---

## 📁 저장소 구조

```
budget/
├── src/
│   ├── BudgetTracker.jsx   # 메인 앱 컴포넌트
│   ├── db.js               # Supabase 클라이언트 & CRUD 헬퍼
│   └── main.jsx            # React 진입점
├── supabase/
│   ├── config.toml         # Supabase CLI 로컬 설정
│   ├── seed.sql            # 로컬 개발용 초기 데이터
│   └── migrations/
│       └── 20240101000000_initial_schema.sql  # DB 스키마
├── .github/
│   └── workflows/
│       ├── deploy.yml            # Vercel 자동 배포 (push/PR)
│       └── supabase-migrate.yml  # DB 마이그레이션 자동화
├── .env.example            # 환경변수 예시 (실제 값은 커밋 금지)
├── vercel.json             # Vercel 빌드·라우팅 설정
├── index.html
├── package.json
└── vite.config.js
```

---

## 🚀 빠른 시작 (로컬 개발)

### 1. 저장소 클론 & 의존성 설치

```bash
git clone https://github.com/dlaghwns6857/budget.git
cd budget
npm install
```

### 2. 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local`에 Supabase 프로젝트 URL과 anon 키를 입력합니다.

```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

> Supabase 대시보드 → **Settings → API** 에서 확인할 수 있습니다.

### 3. 개발 서버 실행

```bash
npm run dev
# http://localhost:5173 에서 확인
```

---

## 🗄️ Supabase 설정

### 처음 설정 (운영 DB)

1. [supabase.com](https://supabase.com) 에서 새 프로젝트 생성
2. `supabase/migrations/20240101000000_initial_schema.sql` 내용을 **SQL Editor**에서 실행하거나  
   아래 CLI 명령어를 사용합니다:

```bash
# Supabase CLI 설치 (최초 1회)
npm install -g supabase

# 프로젝트 연결 (project ref는 Supabase 대시보드 URL에서 확인)
supabase link --project-ref <project-ref>

# 마이그레이션 적용
supabase db push
```

### 로컬 Supabase 개발 환경

```bash
# Docker 필요
supabase start          # 로컬 Supabase 스택 시작
supabase db reset       # 스키마 초기화 + seed.sql 적용
supabase stop           # 종료
```

### 새 마이그레이션 추가

```bash
supabase migration new <migration-name>
# supabase/migrations/<timestamp>_<migration-name>.sql 파일이 생성됩니다.
# SQL 작성 후 supabase db push 로 운영 DB에 적용
```

---

## ▲ Vercel 배포

### 처음 연결 (최초 1회, 수동)

1. [vercel.com](https://vercel.com) → **Add New Project** → GitHub 저장소 `dlaghwns6857/budget` 선택
2. **Environment Variables** 에 아래 항목 추가:

   | 이름 | 값 |
   |---|---|
   | `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
   | `VITE_SUPABASE_ANON_KEY` | Supabase anon 키 |

3. **Deploy** 클릭 → 이후 `git push`만으로 자동 배포됩니다.

### GitHub Actions로 자동 배포 설정 (선택)

`.github/workflows/deploy.yml`을 사용하면 Actions에서 직접 Vercel에 배포할 수 있습니다.  
GitHub 저장소 **Settings → Secrets and variables → Actions** 에 아래 시크릿을 추가하세요:

| Secret 이름 | 설명 |
|---|---|
| `VERCEL_TOKEN` | Vercel 계정 토큰 ([vercel.com/account/tokens](https://vercel.com/account/tokens)) |
| `VERCEL_ORG_ID` | Vercel 팀/조직 ID (`.vercel/project.json` 또는 대시보드에서 확인) |
| `VERCEL_PROJECT_ID` | Vercel 프로젝트 ID |
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon 키 |

### GitHub Actions로 DB 마이그레이션 자동화 (선택)

`.github/workflows/supabase-migrate.yml`을 사용하면 `supabase/migrations/` 변경 시 자동으로 DB에 적용됩니다.  
추가로 필요한 시크릿:

| Secret 이름 | 설명 |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | `supabase access-token generate` 또는 대시보드 Account → Access Tokens |
| `SUPABASE_PROJECT_REF` | Supabase 프로젝트 Ref (URL의 서브도메인) |
| `SUPABASE_DB_PASSWORD` | 프로젝트 DB 비밀번호 |

---

## 🔑 환경변수 정리

| 변수 | 위치 | 설명 |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env.local`, Vercel, GitHub Secrets | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | `.env.local`, Vercel, GitHub Secrets | Supabase anon 공개 키 |
| `VERCEL_TOKEN` | GitHub Secrets | Vercel 배포 토큰 (Actions 전용) |
| `SUPABASE_ACCESS_TOKEN` | GitHub Secrets | Supabase CLI 인증 토큰 (Actions 전용) |

> ⚠️ `.env.local` 파일은 절대 커밋하지 마세요. `.gitignore`에 포함되어 있습니다.

---

## 🔄 일반적인 개발 워크플로

```bash
# 기능 개발
git checkout -b feature/my-feature
# ... 코드 수정 ...
git add .
git commit -m "feat: 새 기능 추가"
git push origin feature/my-feature
# → Vercel Preview 배포 자동 생성 (PR 생성 시)

# 운영 배포
git checkout main
git merge feature/my-feature
git push origin main
# → Vercel Production 자동 배포
# → supabase/migrations/ 변경 시 DB 마이그레이션 자동 실행
```

---

## 🛠️ 빌드 & 미리보기

```bash
npm run build    # dist/ 폴더로 프로덕션 빌드
npm run preview  # 빌드 결과물 로컬 미리보기
```

---

## 📝 라이선스

개인 프로젝트 — All rights reserved.
