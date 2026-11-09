// 예제 데이터 시드 (가상의 샘플). 실행:
//   npx tsx --env-file=.env.local src/db/seed.ts
import { eq } from "drizzle-orm";
import { db } from "./index";
import { DEFAULT_CATEGORIES } from "../lib/categories";
import { articles, categories } from "./schema";

const USER_ID = "user_3LWvuHWPCdMqoPMJxh6fqv9giN3"; // 내 Clerk 사용자 ID

const categorySeeds = DEFAULT_CATEGORIES;

const articleSeeds = [
  {
    source: "TechCrunch AI",
    originalTitle:
      "Startup unveils open-weight reasoning model that rivals leading closed models",
    titleKo: "한 스타트업, 선도적 비공개 모델에 필적하는 오픈 가중치 추론 모델 공개",
    summaryKo:
      "한 AI 스타트업이 가중치를 공개한 추론 특화 모델을 내놓았다. 수학·코딩 벤치마크에서 상위 비공개 모델과 비슷한 점수를 기록했다고 밝혔다. 연구자와 개발자가 자유롭게 내려받아 미세조정할 수 있어 오픈소스 진영의 경쟁력이 높아질 전망이다.",
    publishedAt: new Date("2026-11-02T14:30:00Z"),
    category: "연구&논문",
  },
  {
    source: "The Verge AI",
    originalTitle:
      "AI chip maker raises $2B as demand for data center capacity surges",
    titleKo: "AI 반도체 업체, 데이터센터 수요 급증 속에 20억 달러 투자 유치",
    summaryKo:
      "AI 반도체 설계 기업이 20억 달러 규모의 신규 투자를 받았다. 생성형 AI 확산으로 데이터센터 증설 수요가 커지면서 투자자들의 관심이 몰렸다. 회사는 조달 자금을 차세대 칩 개발과 생산 확대에 쓸 계획이다.",
    publishedAt: new Date("2026-11-02T09:10:00Z"),
    category: "산업&비즈니스",
  },
  {
    source: "TechCrunch AI",
    originalTitle:
      "Lawmakers propose transparency rules for AI-generated political ads",
    titleKo: "의원들, AI 생성 정치 광고에 투명성 규정 도입 제안",
    summaryKo:
      "의회에서 AI로 만든 정치 광고에 'AI 생성' 표기를 의무화하는 법안이 발의됐다. 딥페이크를 이용한 선거 여론 조작을 막으려는 취지다. 업계는 표기 기준이 모호하다며 구체적인 가이드라인을 요구하고 있다.",
    publishedAt: new Date("2026-11-01T18:45:00Z"),
    category: "정책&규제",
  },
  {
    source: "The Verge AI",
    originalTitle:
      "Photo app adds AI assistant that edits images from plain-language requests",
    titleKo: "사진 앱, 일상 언어 요청으로 이미지를 편집하는 AI 어시스턴트 추가",
    summaryKo:
      '인기 사진 앱이 "배경을 노을로 바꿔줘"처럼 말로 지시하면 이미지를 편집해 주는 AI 어시스턴트를 도입했다. 기본 기능은 무료이고 고해상도 내보내기는 유료 구독에서 제공된다. 이번 주부터 순차적으로 적용된다.',
    publishedAt: new Date("2026-10-31T16:00:00Z"),
    category: "제품&출시",
  },
  {
    source: "The Verge AI",
    originalTitle: "Why researchers are rethinking how we measure AI progress",
    titleKo: "연구자들이 AI 발전을 측정하는 방식을 다시 고민하는 이유",
    summaryKo:
      "기존 벤치마크가 모델 학습 데이터에 노출되면서 점수가 실제 능력을 반영하지 못한다는 지적이 커지고 있다. 연구자들은 실제 업무 수행과 장기 과제 중심의 새로운 평가 방식을 논의 중이다.",
    publishedAt: new Date("2026-10-30T12:20:00Z"),
    category: null, // 미분류
  },
];

async function main() {
  // categories에는 유니크 제약이 없으므로 재실행 시 중복 방지를 위해 먼저 확인
  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.userId, USER_ID))
    .limit(1);
  if (existing.length > 0) {
    console.log(`${USER_ID} 의 카테고리가 이미 있어 시드를 건너뜁니다.`);
    return;
  }

  const inserted = await db
    .insert(categories)
    .values(categorySeeds.map((c) => ({ ...c, userId: USER_ID })))
    .returning({ id: categories.id, name: categories.name });
  const idByName = new Map(inserted.map((c) => [c.name, c.id]));

  await db
    .insert(articles)
    .values(
      articleSeeds.map(({ category, ...a }, i) => ({
        ...a,
        userId: USER_ID,
        url: `https://example.com/sample/ai-news-${i + 1}`,
        categoryId: category ? (idByName.get(category) ?? null) : null,
      })),
    )
    .onConflictDoNothing();

  console.log(`categories ${inserted.length}건, articles ${articleSeeds.length}건 저장`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
