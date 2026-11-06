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

export type ArticleListItem = Awaited<ReturnType<typeof getArticles>>[number];
