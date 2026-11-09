import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "./index";
import { articles, categories } from "./schema";

// 모든 조회는 Clerk user_id로 범위를 제한한다.

export async function getCategories(userId: string) {
  return db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(categories.id);
}

// categoryId: undefined = 전체, null = 미분류, number = 해당 카테고리
export async function getArticles(userId: string, categoryId?: number | null) {
  const filter =
    categoryId === undefined
      ? undefined
      : categoryId === null
        ? isNull(articles.categoryId)
        : eq(articles.categoryId, categoryId);

  return db
    .select({
      id: articles.id,
      url: articles.url,
      source: articles.source,
      titleKo: articles.titleKo,
      summaryKo: articles.summaryKo,
      publishedAt: articles.publishedAt,
      notionSaved: articles.notionSaved,
      categoryName: categories.name,
    })
    .from(articles)
    .leftJoin(
      categories,
      and(
        eq(articles.categoryId, categories.id),
        eq(categories.userId, userId),
      ),
    )
    .where(and(eq(articles.userId, userId), filter))
    .orderBy(desc(articles.publishedAt), desc(articles.id));
}

// 노션 저장에 쓸 기사 한 건. 다른 사용자의 기사는 찾지 못한다.
export async function getArticleForNotion(userId: string, articleId: number) {
  const [row] = await db
    .select({
      titleKo: articles.titleKo,
      summaryKo: articles.summaryKo,
      source: articles.source,
      url: articles.url,
      publishedAt: articles.publishedAt,
      notionSaved: articles.notionSaved,
      categoryName: categories.name,
    })
    .from(articles)
    .leftJoin(
      categories,
      and(
        eq(articles.categoryId, categories.id),
        eq(categories.userId, userId),
      ),
    )
    .where(and(eq(articles.userId, userId), eq(articles.id, articleId)));
  return row ?? null;
}

// notion_saved 를 false -> true 로 바꾸는 데 성공한 요청 하나만 true 를 돌려준다.
// 중복 클릭이나 동시 요청이 와도 노션에는 한 번만 저장되게 막는 장치다.
export async function claimNotionSave(userId: string, articleId: number) {
  const claimed = await db
    .update(articles)
    .set({ notionSaved: true })
    .where(
      and(
        eq(articles.userId, userId),
        eq(articles.id, articleId),
        eq(articles.notionSaved, false),
      ),
    )
    .returning({ id: articles.id });
  return claimed.length > 0;
}

// 노션 저장에 실패했을 때 표시를 되돌려 다시 시도할 수 있게 한다.
export async function releaseNotionSave(userId: string, articleId: number) {
  await db
    .update(articles)
    .set({ notionSaved: false })
    .where(and(eq(articles.userId, userId), eq(articles.id, articleId)));
}

// 주어진 URL 중 이 사용자가 이미 저장한 것만 돌려준다.
export async function getExistingUrls(userId: string, urls: string[]) {
  if (urls.length === 0) return new Set<string>();

  const rows = await db
    .select({ url: articles.url })
    .from(articles)
    .where(and(eq(articles.userId, userId), inArray(articles.url, urls)));
  return new Set(rows.map((row) => row.url));
}

type EnrichedNewsItem = {
  url: string;
  source: string;
  title: string;
  titleKo: string;
  summaryKo: string;
  categoryId: number | null;
  publishedAt: Date;
};

// 이미 저장된 URL((user_id, url) 기준)은 건너뛰고, 새로 저장된 개수를 반환한다.
export async function insertArticles(userId: string, items: EnrichedNewsItem[]) {
  if (items.length === 0) return 0;

  const inserted = await db
    .insert(articles)
    .values(
      items.map((item) => ({
        userId,
        url: item.url,
        source: item.source,
        originalTitle: item.title,
        titleKo: item.titleKo,
        summaryKo: item.summaryKo,
        categoryId: item.categoryId,
        publishedAt: item.publishedAt,
      })),
    )
    .onConflictDoNothing({ target: [articles.userId, articles.url] })
    .returning({ id: articles.id });

  return inserted.length;
}

export type ArticleListItem = Awaited<ReturnType<typeof getArticles>>[number];
