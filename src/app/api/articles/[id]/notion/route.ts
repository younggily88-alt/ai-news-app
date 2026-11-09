import { auth } from "@clerk/nextjs/server";
import {
  claimNotionSave,
  getArticleForNotion,
  releaseNotionSave,
} from "@/db/queries";
import { saveArticleToNotion } from "@/lib/notion/save-article";

// 노션 MCP 서버를 띄워 호출하는 시간을 확보한다.
export const maxDuration = 60;

// 카드의 '뉴스 저장' 버튼에서만 호출한다. 비로그인 요청은 proxy.ts 와 여기서 이중으로 막는다.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const articleId = Number(id);

  const article = await getArticleForNotion(userId, articleId);
  if (!article) {
    return Response.json({ error: "기사를 찾을 수 없어요." }, { status: 404 });
  }
  if (article.notionSaved) {
    return Response.json({ error: "이미 노션에 저장한 기사예요." }, { status: 409 });
  }

  // 저장 표시를 먼저 선점해 같은 기사가 노션에 두 번 들어가지 않게 한다.
  if (!(await claimNotionSave(userId, articleId))) {
    return Response.json({ error: "이미 노션에 저장한 기사예요." }, { status: 409 });
  }

  try {
    const notionUrl = await saveArticleToNotion({
      title: article.titleKo,
      summary: article.summaryKo,
      categoryName: article.categoryName,
      source: article.source,
      url: article.url,
      publishedAt: article.publishedAt,
    });
    return Response.json({ saved: true, notionUrl });
  } catch (error) {
    console.error("[notion] 저장 실패:", error);
    await releaseNotionSave(userId, articleId).catch(() => {});
    return Response.json(
      { error: "노션에 저장하지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 502 },
    );
  }
}
