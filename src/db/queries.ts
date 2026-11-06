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
