# UI 가이드: AI 뉴스 수집기

앱 이름은 **AI 뉴스 수집기**. 메인 화면은 뉴스를 카드로 보여 주는 대시보드다. Tailwind CSS 4 유틸리티 클래스만 사용하며, 깔끔하고 읽기 편한 것을 최우선으로 한다.

## 1. 디자인 원칙

- **여백이 넉넉하고 차분하게.** 장식은 최소화하고 텍스트 가독성을 우선한다.
- **색은 절제.** 중립 회색(slate)을 기본으로, 강조색(indigo) 하나만 쓴다.
- **정보 위계가 분명하게.** 카드에서는 제목 > 요약 > 메타 정보 순으로 눈에 들어와야 한다.
- **라이트/다크 모두 지원.** 모든 색 클래스에 `dark:` 짝을 둔다.
- **모든 상태를 설계.** 로딩, 빈 목록, 에러, 호버, 포커스를 빠뜨리지 않는다.

## 2. 디자인 토큰

### 색상

| 용도 | 라이트 | 다크 |
|---|---|---|
| 페이지 배경 | `bg-slate-50` | `dark:bg-slate-950` |
| 카드/헤더 배경 | `bg-white` | `dark:bg-slate-900` |
| 테두리 | `border-slate-200` | `dark:border-slate-800` |
| 본문 텍스트 | `text-slate-900` | `dark:text-slate-100` |
| 보조 텍스트 | `text-slate-600` | `dark:text-slate-400` |
| 흐린 텍스트(메타) | `text-slate-500` | `dark:text-slate-500` |
| 강조(주 버튼, 선택된 칩) | `bg-indigo-600 text-white` | `dark:bg-indigo-500` |
| 강조 호버 | `hover:bg-indigo-700` | `dark:hover:bg-indigo-400` |
| 에러 | `bg-red-50 text-red-700 border-red-200` | `dark:bg-red-950 dark:text-red-300 dark:border-red-900` |
| 성공(저장됨) | `text-emerald-600` | `dark:text-emerald-400` |

### 타이포그래피

- 한글 가독성을 위해 본문 `leading-relaxed`(1.625), 요약은 `leading-7`까지 허용.
- 앱 이름: `text-lg font-bold tracking-tight`
- 카드 제목: `text-lg font-semibold leading-snug`
- 요약: `text-sm leading-relaxed text-slate-600 dark:text-slate-400`
- 메타 정보: `text-xs text-slate-500`
- 한글 줄바꿈: 제목·요약에 `break-keep` 적용(단어 중간에서 끊기지 않게).

### 형태

- 모서리: 카드 `rounded-xl`, 버튼 `rounded-lg`, 칩 `rounded-full`
- 그림자: 카드 기본 `shadow-sm`, 호버 시 `hover:shadow-md`
- 간격 단위는 4의 배수(`gap-2`, `gap-4`, `p-5`, `py-8` 등)로 통일.

## 3. 레이아웃

```
┌──────────────────────────────────────────────┐
│ 헤더: [AI 뉴스 수집기]        [뉴스 가져오기] [사용자] │  sticky
├──────────────────────────────────────────────┤
│  카테고리 바                                    │
│  (전체) (모델·연구) (기업·투자) … (미분류) (+ 추가) │
│                                              │
│  ┌────────┐ ┌────────┐ ┌────────┐            │
│  │ 카드    │ │ 카드    │ │ 카드    │            │
│  └────────┘ └────────┘ └────────┘            │
│  ┌────────┐ ┌────────┐ ┌────────┐            │
│  │ 카드    │ │ 카드    │ │ 카드    │            │
│  └────────┘ └────────┘ └────────┘            │
└──────────────────────────────────────────────┘
```

- 본문 컨테이너: `mx-auto w-full max-w-6xl px-4 sm:px-6`
- 섹션 세로 간격: `py-6` (카테고리 바와 카드 그리드 사이 `mb-6`)
- 카드 그리드: `grid gap-5 sm:grid-cols-2 lg:grid-cols-3`
- 페이지 배경은 `bg-slate-50 dark:bg-slate-950`, 최소 높이 `min-h-screen`.

## 4. 컴포넌트

### 4.1 헤더

상단에 고정하고, 스크롤해도 앱 이름과 가져오기 버튼에 접근할 수 있게 한다.

```tsx
<header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
  <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
    <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
      AI 뉴스 수집기
    </h1>
    <div className="flex items-center gap-3">
      {/* 뉴스 가져오기 버튼, Clerk UserButton */}
    </div>
  </div>
</header>
```

### 4.2 버튼

| 종류 | 용도 | 클래스 |
|---|---|---|
| 주 버튼 | 뉴스 가져오기 | `inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400` |
| 보조 버튼 | 노션에 저장, 미분류 기사 재분류 | `inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800` |
| 텍스트 링크 | 원문 보기 | `text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400` |

- 버튼 터치 영역은 최소 높이 36px 이상(`py-1.5` + `text-sm`) 유지.
- 비활성화 상태는 `disabled:` 변형으로, 로딩 중에는 `aria-busy="true"`를 건다.

### 4.3 카테고리 바 (뉴스 카드 목록 바로 위)

- 가로로 나열되는 칩(pill) 형태. 맨 앞에 **전체**, 이어서 사용자 카테고리들, 필요 시 **미분류**, **맨 끝에 카테고리 추가 버튼**.
- 칩이 많아 한 줄을 넘으면 줄바꿈(`flex-wrap`). 모바일에서도 가로 스크롤 없이 줄바꿈한다.
- 선택된 칩은 강조색으로 채우고, 나머지는 테두리 있는 흰 칩.

```tsx
<nav aria-label="카테고리" className="mb-6 flex flex-wrap items-center gap-2">
  {/* 선택됨 */}
  <button className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white dark:bg-indigo-500">
    전체
  </button>
  {/* 선택 안 됨 */}
  <button className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
    모델·연구
  </button>
  {/* … 나머지 카테고리 … */}

  {/* 카테고리 추가: 항상 목록의 마지막 */}
  <button
    aria-label="카테고리 추가"
    className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-indigo-400 dark:hover:text-indigo-400"
  >
    <span aria-hidden>＋</span> 카테고리 추가
  </button>
</nav>
```

- 추가 버튼은 **점선 테두리**로 일반 카테고리 칩과 구별한다.
- 선택된 칩에는 `aria-pressed="true"`를 건다.
- 카테고리 추가/수정/삭제는 모달(또는 인라인 입력)로 처리한다. 모달은 `fixed inset-0 bg-black/40` 오버레이 위에 `max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900` 패널.
- 카테고리 칩 호버 시 수정·삭제 진입점을 노출한다(`group` + `group-hover:`). 삭제 전에는 "해당 기사는 미분류로 남습니다"라고 확인 문구를 보여 준다.

### 4.4 뉴스 카드

```tsx
<article className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
  <div className="mb-3 flex items-center justify-between gap-2">
    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
      모델·연구
    </span>
    <span className="text-xs text-slate-500">TechCrunch · 2026.11.06</span>
  </div>

  <h2 className="break-keep text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100">
    한국어로 번역된 기사 제목
  </h2>

  <p className="mt-2 line-clamp-4 break-keep text-sm leading-relaxed text-slate-600 dark:text-slate-400">
    한국어 요약 본문
  </p>

  <div className="mt-auto flex items-center justify-between pt-4">
    <a href="…" target="_blank" rel="noopener noreferrer"
       className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
      원문 보기 ↗
    </a>
    {/* 보조 버튼: 노션에 저장 / 저장됨 */}
  </div>
</article>
```

카드 구성(위에서 아래로):
1. 상단 줄: 카테고리 배지(왼쪽) / 출처 · 게시일(오른쪽)
2. 한국어 제목 (최대 3줄: `line-clamp-3`)
3. 한국어 요약 (최대 4줄: `line-clamp-4`)
4. 하단 줄(`mt-auto`로 카드 높이가 달라도 바닥 정렬): 원문 링크 / 노션 저장 버튼

규칙:
- 카드 전체를 링크로 만들지 않는다. 클릭 대상은 "원문 보기"와 "노션에 저장" 두 곳뿐.
- 외부 링크는 항상 `target="_blank" rel="noopener noreferrer"`.
- **미분류** 배지는 회색 톤(`bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300`)으로 구별.
- **노션 저장 상태:** 저장 전 `노션에 저장`(보조 버튼) → 저장 중 `저장 중…`(비활성화) → 저장 후 `✓ 저장됨`(`text-emerald-600`, 클릭 불가, 중복 저장 방지).
- 날짜는 `YYYY.MM.DD` 형식, 한국 시간 기준.

### 4.5 가져오기 상태

- **로딩:** 버튼을 비활성화하고 `뉴스 가져오는 중…` + 작은 스피너(`animate-spin`). 카드 목록 위치에는 스켈레톤 카드(`animate-pulse`, `bg-slate-200 dark:bg-slate-800`)를 3~6개 보여 준다.
- **성공:** 버튼 아래/카드 위에 한 줄 안내(예: "새 기사 12개를 추가했어요"). `text-sm text-slate-600`.
- **에러:** 카드 목록 위에 알림 박스. 문구는 원인과 다음 행동을 함께 적는다("뉴스를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.").

```tsx
<div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
  뉴스를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.
</div>
```

### 4.6 빈 상태

- 기사가 하나도 없을 때: 중앙 정렬 안내 + 주 버튼. "아직 수집한 뉴스가 없어요. 위의 ‘뉴스 가져오기’를 눌러 시작해 보세요."
- 선택한 카테고리에 기사가 없을 때: "이 카테고리에는 아직 뉴스가 없어요."
- 미분류 기사가 있을 때만 카테고리 바 아래에 보조 버튼 `미분류 기사 재분류` 노출.
- 빈 상태 박스: `rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-500 dark:border-slate-700`.

## 5. 반응형

| 구간 | 카드 열 수 | 비고 |
|---|---|---|
| 기본(모바일) | 1열 | 좌우 여백 `px-4` |
| `sm` (640px~) | 2열 | 좌우 여백 `px-6` |
| `lg` (1024px~) | 3열 | 컨테이너 `max-w-6xl` 고정 |

- 모바일에서 헤더의 `뉴스 가져오기` 버튼은 유지하되 패딩을 줄인다(`px-3`).
- 카테고리 칩은 줄바꿈으로 처리하고 가로 스크롤을 만들지 않는다.

## 6. 접근성

- 본문 텍스트 대비 4.5:1 이상(위 색 조합 기준 충족).
- 모든 버튼·링크에 키보드 포커스 표시(`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600`).
- 아이콘만 있는 버튼은 `aria-label` 필수.
- 로딩/에러 변화는 `role="status"`(로딩·성공) 또는 `role="alert"`(에러)로 스크린리더에 알린다.
- 모달은 열릴 때 첫 입력에 포커스, `Esc`로 닫기, 닫으면 호출한 버튼으로 포커스 복귀.
- 색만으로 상태를 구분하지 않는다(저장됨은 `✓` 아이콘/텍스트 병기).

## 7. 구현 시 참고

- 현재 `src/app/globals.css`는 `body`에 `font-family: Arial`이 지정되어 있어 한글이 시스템 기본 글꼴로 표시된다. 구현 단계에서 `body`의 `font-family`를 제거하고 Tailwind `font-sans`(한글은 시스템 폴백) 또는 Pretendard 같은 한글 웹폰트로 교체한다.
- 라이트/다크는 현재 `prefers-color-scheme` 기반이다. Tailwind 4의 `dark:` 변형은 기본이 이 설정을 따르므로 별도 설정 없이 쓸 수 있다.
- 컴포넌트 분리 제안: `Header`, `CategoryBar`, `NewsCard`, `NewsGrid`, `EmptyState`, `ErrorAlert`, `CategoryModal` (`src/components/`).
- 상호작용이 있는 컴포넌트(카테고리 선택, 가져오기, 노션 저장)만 `"use client"`로 두고, 나머지는 서버 컴포넌트로 유지한다.
