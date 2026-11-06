import { auth } from "@clerk/nextjs/server";
import { insertArticles } from "@/db/queries";
import { collectRecentNews } from "@/lib/news/collect";

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

    const added = await insertArticles(userId, items);
    return Response.json({
      fetched: items.length,
      added,
      skipped: items.length - added,
      failedSources,
    });
  } catch (error) {
    console.error("[news] 저장 실패:", error);
    return Response.json(
      { error: "뉴스를 저장하지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
