import { and, desc, eq, isNull } from "drizzle-orm";
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

type NewsItem = {
  url: string;
  source: string;
  title: string;
  summary: string;
  publishedAt: Date;
};

// 이미 저장된 URL((user_id, url) 기준)은 건너뛰고, 새로 저장된 개수를 반환한다.
// 번역·분류 전이므로 title_ko/summary_ko 에는 원문 제목과 RSS 요약을 임시로 넣고,
// category_id 는 비워 둔다(미분류).
export async function insertArticles(userId: string, items: NewsItem[]) {
  if (items.length === 0) return 0;

  const inserted = await db
    .insert(articles)
    .values(
      items.map((item) => ({
        userId,
        url: item.url,
        source: item.source,
        originalTitle: item.title,
        titleKo: item.title,
        summaryKo: item.summary,
        publishedAt: item.publishedAt,
      })),
    )
    .onConflictDoNothing({ target: [articles.userId, articles.url] })
    .returning({ id: articles.id });

  return inserted.length;
}

export type ArticleListItem = Awaited<ReturnType<typeof getArticles>>[number];
