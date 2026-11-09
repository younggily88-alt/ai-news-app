# AI 뉴스 수집기

해외 AI 뉴스를 RSS로 모으고, Claude가 **한국어로 번역·요약하고 카테고리를 분류**해서 카드로 보여 주는 웹 앱입니다. 마음에 드는 기사는 버튼 한 번으로 노션 데이터베이스에 저장할 수 있습니다.

## 주요 기능

- **뉴스 가져오기:** 버튼을 눌렀을 때만 TechCrunch AI, The Verge AI 피드에서 최근 24시간 기사를 수집합니다.
- **AI 번역·요약·분류:** 새 기사만 Claude로 한국어 제목 번역, 1~2문장 요약, 카테고리 분류를 합니다. 이미 저장된 기사(URL 기준)는 다시 처리하지 않고, 한 번에 최대 20개까지만 처리해 비용을 제한합니다.
- **카드 대시보드:** 최신순 카드 목록과 카테고리 칩 필터, 제목·요약 검색을 제공합니다.
- **카테고리 관리:** 화면에서 추가·수정·삭제합니다. 삭제해도 기사는 지워지지 않고 "미분류"가 됩니다. 카테고리를 바꿔도 기존 기사는 자동으로 재분류되지 않으며, "미분류 기사 재분류" 버튼으로 직접 분류합니다.
- **노션 저장:** 카드의 "뉴스 저장" 버튼으로 노션 DB에 저장하고, 저장 후에는 "저장됨"으로 바뀌어 중복 저장을 막습니다.
- **로그인:** Clerk로 로그인한 사용자만 쓸 수 있고, 기사와 카테고리는 사용자별로 분리됩니다.

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router, Cache Components), React 19, TypeScript |
| 스타일 | Tailwind CSS 4 |
| 인증 | Clerk |
| DB | Neon (Postgres) + Drizzle ORM |
| AI | Claude API (`@anthropic-ai/sdk`, 모델 `claude-haiku-5-5`) |
| 노션 연동 | 노션 MCP 서버(`@notionhq/notion-mcp-server`) + MCP 클라이언트(`@modelcontextprotocol/sdk`) |
| RSS 파싱 | `fast-xml-parser` |

## 시작하기

### 1. 준비물

- Node.js 20 이상
- [Clerk](https://clerk.com) 애플리케이션
- [Neon](https://neon.tech) Postgres 데이터베이스
- [Anthropic](https://console.anthropic.com) API 키
- 노션 통합(Integration) 토큰과, 아래 속성을 가진 노션 데이터베이스 (노션 저장 기능을 쓸 때)

### 2. 설치

```bash
npm install
```

### 3. 환경 변수

프로젝트 루트에 `.env.local` 파일을 만들고 아래 값을 채웁니다. 이 파일은 `.gitignore`에 포함되어 있어 저장소에 올라가지 않습니다. 모든 키는 서버에서만 읽으며 클라이언트에 노출되지 않습니다.

| 변수 | 설명 |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk 공개 키 |
| `CLERK_SECRET_KEY` | Clerk 비밀 키 |
| `DATABASE_URL` | Neon Postgres 연결 문자열 |
| `ANTHROPIC_API_KEY` | Claude API 키 |
| `NOTION_TOKEN` | 노션 통합 토큰 |
| `NOTION_DATABASE_ID` | 뉴스를 저장할 노션 데이터베이스 ID |

### 4. 데이터베이스 준비

```bash
npm run db:migrate
```

테이블(`categories`, `articles`)이 만들어집니다. 스키마를 바꿨다면 먼저 `npm run db:generate`로 마이그레이션을 만듭니다.

### 5. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 로그인한 뒤 대시보드로 이동합니다. 처음 들어가면 기본 카테고리 7개(연구&논문, 제품&출시, 산업&비즈니스, 정책&규제, 튜토리얼, 인프라&하드웨어, 기타)가 자동으로 만들어집니다.

> 개발 중 로그인이 계속 풀리거나 "이미 로그인됨" 오류가 나면 PC 시계가 어긋나 있는지 확인하세요. Clerk 토큰은 시간 기준으로 검증되므로 시계가 몇십 초만 틀려도 서버가 로그인을 인식하지 못합니다. Windows는 시간 자동 동기화를 켜면 됩니다.

## 노션 데이터베이스 설정

노션 저장을 쓰려면 미리 데이터베이스를 만들어 두어야 합니다. 앱이 DB를 만들지는 않습니다.

1. 아래 속성으로 데이터베이스를 만듭니다. 속성 이름과 형식이 같아야 합니다.

   | 속성 | 형식 |
   |---|---|
   | 제목 | 제목(Title) |
   | 요약 | 텍스트 |
   | 카테고리 | 텍스트 |
   | 출처 | 텍스트 |
   | URL | URL |
   | 발행일 | 날짜 |

2. [노션 통합](https://www.notion.so/profile/integrations)을 만들어 토큰을 `NOTION_TOKEN`에 넣습니다.
3. 데이터베이스 페이지의 `…` → 연결(Connections)에서 만든 통합을 추가합니다. 연결하지 않으면 저장이 실패합니다.
4. 데이터베이스 주소의 ID(32자리)를 `NOTION_DATABASE_ID`에 넣습니다.

## 사용 방법

1. 대시보드 오른쪽 위의 **뉴스 가져오기**를 누릅니다. 새 기사가 번역·요약·분류되어 카드로 나타납니다. 20개를 넘는 새 기사는 다시 눌러 가져옵니다.
2. 카테고리 칩이나 검색창으로 원하는 기사만 봅니다.
3. 카테고리 칩 끝의 **＋ 카테고리 추가**에서 카테고리를 관리합니다. 바꾼 뒤 기존 기사를 새 기준으로 나누려면 **미분류 기사 재분류** 버튼을 누릅니다.
4. 카드의 **뉴스 저장**을 누르면 노션 DB에 저장됩니다.

## 명령어

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` / `npm start` | 프로덕션 빌드 / 실행 |
| `npm run lint` | ESLint |
| `npm run db:generate` | 스키마 변경으로 마이그레이션 생성 |
| `npm run db:migrate` | 마이그레이션 적용 |
| `npm run db:studio` | Drizzle Studio (DB 보기) |
| `npx tsx --env-file=.env.local src/db/seed.ts` | 예제 데이터 입력 (`seed.ts`의 `USER_ID`를 본인 Clerk ID로 바꿔서 사용) |
| `npx tsx --env-file=.env.local src/db/set-categories.ts <user id>` | 한 사용자의 카테고리를 기본 7개로 교체 |

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx                      로그인 확인 후 대시보드로 이동
│   ├── dashboard/page.tsx            메인 대시보드
│   └── api/
│       ├── news/fetch/               뉴스 수집 + AI 처리 + 저장
│       ├── articles/reclassify/      미분류 기사 재분류
│       ├── articles/[id]/notion/     노션에 저장
│       └── categories/               카테고리 추가·수정·삭제
├── components/                       카드, 카테고리 바·관리 모달, 버튼 등
├── db/                               Drizzle 스키마, 쿼리, 시드·스크립트
├── lib/
│   ├── news/                         RSS 수집·파싱
│   ├── ai/                           Claude 번역·요약·분류
│   ├── notion/                       노션 MCP 호출
│   └── categories.ts                 기본 카테고리와 입력 검증
└── proxy.ts                          Clerk 미들웨어 (API 로그인 필수)
```

## 설계 메모

- **사용자별 데이터 분리:** 모든 DB 쿼리는 Clerk 사용자 ID로 범위를 제한합니다. `articles`는 `(user_id, url)`이 유일합니다.
- **비용 통제:** Claude는 버튼을 눌렀을 때만, 이미 저장된 URL을 제외한 새 기사에만 호출합니다. 한 번에 최대 20개를 동시 5개씩 처리합니다. 처리에 실패한 기사는 저장하지 않아 다음 가져오기에서 다시 시도합니다.
- **중복 저장 방지:** 노션 저장은 `notion_saved` 표시를 먼저 선점한 요청 하나만 진행하고, 저장에 실패하면 표시를 되돌립니다.
- **UI 가이드:** 색, 간격, 컴포넌트 규칙은 [`ui.md`](ui.md)를, 제품 요구사항은 [`PRD.md`](PRD.md)를 참고하세요.

## 알려진 제한

- **노션 MCP 서버를 서버가 자식 프로세스로 실행합니다.** 로컬과 일반 Node 서버에서는 동작하지만, Vercel 같은 서버리스 환경에서는 프로세스를 띄울 수 없어 동작하지 않을 수 있습니다. 배포할 때는 노션 공식 API 호출로 바꾸는 것을 검토해야 합니다.
- RSS 피드 구조가 바뀌면 `src/lib/news/parse-feed.ts`를 손봐야 할 수 있습니다.
- 개인 학습용 프로젝트라 자동 테스트는 아직 없습니다.
