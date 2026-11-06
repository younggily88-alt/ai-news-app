import { auth } from "@clerk/nextjs/server";
import { getCategories, getExistingUrls, insertArticles } from "@/db/queries";
import { enrichArticles } from "@/lib/ai/enrich";
import { collectRecentNews } from "@/lib/news/collect";

// Claude 호출 최대 20건(동시 5개)이 끝날 시간을 확보한다.
export const maxDuration = 60;

// 1회 처리 상한. 나머지는 다음 클릭에서 처리한다.
const MAX_NEW_ARTICLES = 20;

// 뉴스 가져오기 버튼에서만 호출한다. 비로그인 요청은 proxy.ts 와 여기서 이중으로 막는다.
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { items, failedSources } = await collectRecentNews();

    // 모든 출처가 실패했으면 성공으로 보이지 않게 에러로 응답한다.
    if (failedSources.length > 0 && items.length === 0) {
      return Response.json(
        { error: "뉴스를 가져오지 못했어요. 잠시 후 다시 시도해 주세요." },
        { status: 502 },
      );
    }

    // 이미 저장된 기사는 Claude 를 부르지 않고 건너뛴다. items 는 최신순이다.
    const existing = await getExistingUrls(
      userId,
      items.map((item) => item.url),
    );
    const fresh = items.filter((item) => !existing.has(item.url));
    const targets = fresh.slice(0, MAX_NEW_ARTICLES);

    if (targets.length === 0) {
      return Response.json({
        fetched: items.length,
        added: 0,
        skipped: items.length,
        failed: 0,
        remaining: 0,
        failedSources,
      });
    }

    const categories = await getCategories(userId);
    const { enriched, failed } = await enrichArticles(targets, categories);

    // 전부 실패했으면(키 오류 등) 성공처럼 보이지 않게 에러로 응답한다.
    if (enriched.length === 0) {
      return Response.json(
        { error: "AI 번역·요약에 실패했어요. 잠시 후 다시 시도해 주세요." },
        { status: 502 },
      );
    }

    const added = await insertArticles(userId, enriched);
    return Response.json({
      fetched: items.length,
      added,
      skipped: existing.size,
      failed,
      remaining: fresh.length - targets.length,
      failedSources,
    });
  } catch (error) {
    console.error("[news] 처리 실패:", error);
    return Response.json(
      { error: "뉴스를 처리하지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
