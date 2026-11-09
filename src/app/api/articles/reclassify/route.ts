import { auth } from "@clerk/nextjs/server";
import {
  countUnclassified,
  getCategories,
  getUnclassifiedArticles,
  setArticleCategory,
} from "@/db/queries";
import { classifyArticles } from "@/lib/ai/classify";

// Claude 호출 최대 20건(동시 5개)이 끝날 시간을 확보한다.
export const maxDuration = 60;

// 1회 처리 상한(API 비용 통제). 나머지는 다음 클릭에서 처리한다.
const MAX_PER_RUN = 20;

// '미분류 기사 재분류' 버튼에서만 호출한다. 비로그인 요청은 proxy.ts 와 여기서 이중으로 막는다.
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const categories = await getCategories(userId);
    if (categories.length === 0) {
      return Response.json(
        { error: "카테고리가 없어요. 카테고리를 먼저 추가해 주세요." },
        { status: 400 },
      );
    }

    const targets = await getUnclassifiedArticles(userId, MAX_PER_RUN);
    if (targets.length === 0) {
      return Response.json({ updated: 0, unmatched: 0, failed: 0, remaining: 0 });
    }

    const { classified, unmatched, failed } = await classifyArticles(
      targets,
      categories,
    );

    // 전부 실패했으면(키 오류 등) 성공처럼 보이지 않게 에러로 응답한다.
    if (classified.length === 0 && failed === targets.length) {
      return Response.json(
        { error: "AI 분류에 실패했어요. 잠시 후 다시 시도해 주세요." },
        { status: 502 },
      );
    }

    await Promise.all(
      classified.map(({ id, categoryId }) =>
        setArticleCategory(userId, id, categoryId),
      ),
    );

    // 이번에 분류되지 않은 미분류(맞는 카테고리 없음·실패 포함)를 뺀 나머지 = 아직 처리 못 한 개수
    const stillUnclassified = await countUnclassified(userId);
    return Response.json({
      updated: classified.length,
      unmatched,
      failed,
      remaining: Math.max(0, stillUnclassified - unmatched - failed),
    });
  } catch (error) {
    console.error("[ai] 재분류 처리 실패:", error);
    return Response.json(
      { error: "재분류하지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
