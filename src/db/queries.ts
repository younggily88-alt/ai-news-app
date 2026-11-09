import { and, count, desc, eq, ilike, inArray, isNull, or } from "drizzle-orm";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
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

// 카테고리도 기사도 없는 신규 사용자에게만 기본 카테고리를 만들어 준다.
// (기사가 있는 사용자가 카테고리를 모두 지운 경우에는 다시 만들지 않는다.)
export async function ensureDefaultCategories(userId: string) {
  const [[{ categoryCount }], [{ articleCount }]] = await Promise.all([
    db
      .select({ categoryCount: count() })
      .from(categories)
      .where(eq(categories.userId, userId)),
    db
      .select({ articleCount: count() })
      .from(articles)
      .where(eq(articles.userId, userId)),
  ]);
  if (categoryCount > 0 || articleCount > 0) return;

  await db
    .insert(categories)
    .values(DEFAULT_CATEGORIES.map((c) => ({ ...c, userId })));
}

export async function createCategory(
  userId: string,
  data: { name: string; description: string | null },
) {
  const [row] = await db
    .insert(categories)
    .values({ userId, ...data })
    .returning();
  return row;
}

export async function updateCategory(
  userId: string,
  categoryId: number,
  data: { name: string; description: string | null },
) {
  const [row] = await db
    .update(categories)
    .set(data)
    .where(and(eq(categories.userId, userId), eq(categories.id, categoryId)))
    .returning();
  return row ?? null;
}

// 삭제하면 해당 기사는 FK(on delete set null)에 의해 미분류가 된다. 기사는 지워지지 않는다.
export async function deleteCategory(userId: string, categoryId: number) {
  const deleted = await db
    .delete(categories)
    .where(and(eq(categories.userId, userId), eq(categories.id, categoryId)))
    .returning({ id: categories.id });
  return deleted.length > 0;
}

// 같은 사용자 안에서 이름이 겹치는지(대소문자 무시). excludeId 는 수정 중인 자기 자신.
export async function isCategoryNameTaken(
  userId: string,
  name: string,
  excludeId?: number,
) {
  const rows = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.userId, userId));
  const target = name.trim().toLowerCase();
  return rows.some(
    (row) => row.id !== excludeId && row.name.trim().toLowerCase() === target,
  );
}

// LIKE 와일드카드(% _ \)를 일반 문자로 취급하게 한다.
function likePattern(search: string) {
  return `%${search.replace(/[\\%_]/g, "\\$&")}%`;
}

// categoryId: undefined = 전체, null = 미분류, number = 해당 카테고리
// search: 제목(한국어·원문)과 요약에 포함된 글자(대소문자 무시)
export async function getArticles(
  userId: string,
  categoryId?: number | null,
  search?: string,
) {
  const filter =
    categoryId === undefined
      ? undefined
      : categoryId === null
        ? isNull(articles.categoryId)
        : eq(articles.categoryId, categoryId);

  const pattern = search ? likePattern(search) : null;
  const searchFilter = pattern
    ? or(
        ilike(articles.titleKo, pattern),
        ilike(articles.originalTitle, pattern),
        ilike(articles.summaryKo, pattern),
      )
    : undefined;

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
    .where(and(eq(articles.userId, userId), filter, searchFilter))
    .orderBy(desc(articles.publishedAt), desc(articles.id));
}

export async function countUnclassified(userId: string) {
  const [{ total }] = await db
    .select({ total: count() })
    .from(articles)
    .where(and(eq(articles.userId, userId), isNull(articles.categoryId)));
  return total;
}

// 미분류 기사(최신순). 재분류에서 한 번에 처리할 만큼만 가져온다.
export async function getUnclassifiedArticles(userId: string, limit: number) {
  return db
    .select({
      id: articles.id,
      titleKo: articles.titleKo,
      summaryKo: articles.summaryKo,
    })
    .from(articles)
    .where(and(eq(articles.userId, userId), isNull(articles.categoryId)))
    .orderBy(desc(articles.publishedAt), desc(articles.id))
    .limit(limit);
}

export async function setArticleCategory(
  userId: string,
  articleId: number,
  categoryId: number,
) {
  await db
    .update(articles)
    .set({ categoryId })
    .where(and(eq(articles.userId, userId), eq(articles.id, articleId)));
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
