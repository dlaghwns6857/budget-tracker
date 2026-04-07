# 가계부 (Budget Tracker)

React + Vite 기반 개인 가계부 앱으로, **Vercel**(프론트엔드 배포)과 **Supabase**(데이터베이스)를 사용합니다.

> **이 문서는 팀원 온보딩, 배포 관리, 로컬 개발 환경 세팅을 위한 가이드입니다.**

---

## 목차

1. [기술 스택](#기술-스택)
2. [빠른 시작 (로컬 개발)](#빠른-시작-로컬-개발)
3. [환경변수 설정](#환경변수-설정)
4. [Vercel 배포 관리](#vercel-배포-관리)
5. [Supabase DB 관리](#supabase-db-관리)
6. [GitHub Actions 자동화](#github-actions-자동화)
7. [필요한 GitHub Secrets 목록](#필요한-github-secrets-목록)
8. [디렉토리 구조](#디렉토리-구조)

---

## 기술 스택

| 구분 | 도구 |
|------|------|
| 프레임워크 | React 18 + Vite 5 |
| 데이터베이스 | [Supabase](https://supabase.com) (PostgreSQL) |
| 배포 | [Vercel](https://vercel.com) |
| CI/CD | GitHub Actions |

---

## 빠른 시작 (로컬 개발)

```bash
# 1. 저장소 클론
git clone https://github.com/dlaghwns6857/budget.git
cd budget

# 2. 의존성 설치
npm install

# 3. 환경변수 설정 (아래 섹션 참고)
cp .env.example .env.local
# .env.local 파일을 열어 실제 값 입력

# 4. 개발 서버 실행
npm run dev
```

---

## 환경변수 설정

`.env.example`을 복사해 `.env.local`을 만들고 실제 값을 입력하세요.  
`.env.local`은 `.gitignore`에 포함되어 있어 git에 커밋되지 않습니다.

```dotenv
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
```

실제 값은 **Supabase 대시보드 → Settings → API** 에서 확인할 수 있습니다.

### Vercel 환경변수 설정

Vercel에 배포할 때는 위 변수를 **Vercel 대시보드 → Project → Settings → Environment Variables**에 추가해야 합니다.

| 변수명 | 설명 | 적용 환경 |
|--------|------|-----------|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | Supabase 익명 키 (공개 가능) | Production, Preview, Development |

> **주의:** `VITE_` 접두사가 있는 변수만 Vite 빌드 결과물에 포함됩니다. Secret 키(service_role key)는 절대 `VITE_` 변수로 넣지 마세요.

---

## Vercel 배포 관리

### 자동 배포 흐름

```
git push (main)  →  Vercel 자동 빌드  →  프로덕션 배포
git push (기타 브랜치) / PR 열기  →  Vercel 자동 빌드  →  Preview URL 생성
```

Vercel이 이 저장소와 연결되어 있으면 위 흐름이 자동으로 동작합니다.  
각 PR에는 고유한 Preview URL이 댓글로 달립니다.

### `vercel.json` 설정

`vercel.json`에 빌드 명령어, 출력 디렉토리, SPA 라우팅을 위한 리라이트 규칙이 정의되어 있습니다.

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Vercel 처음 연결하는 경우

1. [vercel.com](https://vercel.com) 에서 로그인
2. **Add New Project** → GitHub 저장소(`dlaghwns6857/budget`) 선택
3. **Environment Variables**에 위 표의 변수 추가
4. **Deploy** 클릭

이후부터는 `git push`만 해도 자동 배포됩니다.

---

## Supabase DB 관리

DB 스키마 변경(테이블 추가/수정/삭제 등)은 모두 `supabase/migrations/` 폴더의 `.sql` 파일로 관리합니다.

### Supabase CLI 설치

```bash
# npm을 통한 설치 (권장)
npm install supabase --save-dev

# 또는 전역 설치
npm install -g supabase
```

### 로컬 Supabase 환경 시작

```bash
# Docker가 설치되어 있어야 합니다
npx supabase start

# 로컬 Studio 접속: http://localhost:54323
```

### 원격 프로젝트 연결 (최초 1회)

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
# project-ref: Supabase 대시보드 URL의 subdomain (예: agswuqrreubaodrawntn)
```

### Migration 파일 생성 및 적용

```bash
# 새 migration 파일 생성
npx supabase migration new <설명>
# 예: npx supabase migration new add_category_column

# 생성된 파일(supabase/migrations/YYYYMMDDHHMMSS_<설명>.sql)에 SQL 작성

# 로컬 DB에 적용 (로컬 Supabase 실행 중이어야 함)
npx supabase db reset

# 원격 프로젝트에 적용
npx supabase db push
```

### 현재 원격 DB 스키마를 파일로 가져오기

```bash
npx supabase db pull
```

### 시드 데이터 적용 (로컬 개발용)

```bash
# supabase/seed.sql을 편집한 뒤
npx supabase db reset   # DB 초기화 + migrations + seed.sql 자동 적용
```

---

## GitHub Actions 자동화

### `supabase-migrate.yml`

`supabase/migrations/` 아래 파일이 변경되어 `main` 브랜치에 push되면 자동으로 원격 Supabase 프로젝트에 migration을 적용합니다.

**동작 흐름:**
```
main 브랜치에 push
  → migrations 파일 변경 감지
  → Supabase CLI 설치
  → supabase link
  → supabase db push  ← 원격 DB에 실제 적용
```

워크플로를 활성화하려면 아래 GitHub Secrets를 설정해야 합니다.

---

## 필요한 GitHub Secrets 목록

**Settings → Secrets and variables → Actions → New repository secret**에서 추가하세요.

| Secret 이름 | 설명 | 확인 위치 |
|-------------|------|-----------|
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI 인증 토큰 | [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_PROJECT_REF` | 프로젝트 참조 ID | Supabase 대시보드 URL의 subdomain |
| `SUPABASE_DB_PASSWORD` | DB 비밀번호 | Supabase 대시보드 → Settings → Database |

> Vercel 배포는 Vercel이 GitHub App을 통해 직접 처리하므로 별도 Secret이 필요 없습니다.

---

## 디렉토리 구조

```
budget/
├── .github/
│   └── workflows/
│       └── supabase-migrate.yml   # DB migration 자동화
├── supabase/
│   ├── config.toml                # Supabase CLI 프로젝트 설정
│   ├── seed.sql                   # 로컬 개발용 초기 데이터
│   └── migrations/
│       └── 20250407000000_init.sql  # 초기 DB 스키마
├── src/
│   ├── BudgetTracker.jsx          # 메인 컴포넌트
│   ├── db.js                      # Supabase 클라이언트 (env var 사용)
│   └── main.jsx
├── .env.example                   # 환경변수 템플릿 (커밋 O)
├── .gitignore
├── vercel.json                    # Vercel 배포 설정
├── index.html
├── package.json
└── vite.config.js
```

---

## 자주 묻는 질문

**Q. 새 팀원이 들어왔을 때 가장 먼저 해야 할 것은?**  
A. `cp .env.example .env.local` 후 Supabase 대시보드에서 URL과 Anon Key를 복사해 넣으면 됩니다.

**Q. DB 구조를 바꾸고 싶으면?**  
A. `supabase migration new <이름>`으로 파일을 만들고 SQL을 작성한 뒤 PR을 올리세요. main에 병합되면 GitHub Actions가 자동으로 원격 DB에 반영합니다.

**Q. Vercel Preview 배포가 Supabase에 연결되려면?**  
A. Vercel 대시보드에서 Preview 환경에도 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`를 추가해 주세요.

**Q. Anon Key를 코드에 넣어도 괜찮은가요?**  
A. Supabase Anon Key는 공개용(public)이며 RLS(Row Level Security)로 접근을 제어합니다. 단, service_role key는 절대 클라이언트 코드에 포함하면 안 됩니다.
