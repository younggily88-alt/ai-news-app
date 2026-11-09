// 한 사용자의 카테고리를 기본 카테고리로 교체한다. 실행:
//   npx tsx --env-file=.env.local src/db/set-categories.ts <clerk user id>
// 기존 카테고리를 지우면 해당 기사는 삭제되지 않고 미분류(category_id = null)가 된다.
import { and, count, eq, isNull } from "drizzle-orm";
import { DEFAULT_CATEGORIES } from "../lib/categories";
import { db } from "./index";
import { articles, categories } from "./schema";

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error("사용법: set-categories.ts <clerk user id>");
    process.exit(1);
  }

  const before = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.userId, userId));
  console.log("기존 카테고리:", before.map((c) => c.name).join(", ") || "(없음)");

  await db.delete(categories).where(eq(categories.userId, userId));
  const inserted = await db
    .insert(categories)
    .values(DEFAULT_CATEGORIES.map((c) => ({ ...c, userId })))
    .returning({ name: categories.name });
  console.log("새 카테고리:", inserted.map((c) => c.name).join(", "));

  const [{ total }] = await db
    .select({ total: count() })
    .from(articles)
    .where(and(eq(articles.userId, userId), isNull(articles.categoryId)));
  console.log(`미분류 기사: ${total}개 (대시보드의 '미분류 기사 재분류' 버튼으로 분류)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
