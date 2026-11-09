import { auth } from "@clerk/nextjs/server";
import { createCategory, getCategories, isCategoryNameTaken } from "@/db/queries";
import { MAX_CATEGORIES, parseCategoryInput } from "@/lib/categories";

// 카테고리 추가. 비로그인 요청은 proxy.ts 와 여기서 이중으로 막는다.
// 추가해도 기존 기사는 자동으로 재분류하지 않는다(API 비용 절약).
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const input = parseCategoryInput(await request.json().catch(() => null));
  if ("error" in input) {
    return Response.json({ error: input.error }, { status: 400 });
  }

  if ((await getCategories(userId)).length >= MAX_CATEGORIES) {
    return Response.json(
      { error: `카테고리는 최대 ${MAX_CATEGORIES}개까지 만들 수 있어요.` },
      { status: 400 },
    );
  }
  if (await isCategoryNameTaken(userId, input.name)) {
    return Response.json({ error: "이미 있는 카테고리 이름이에요." }, { status: 409 });
  }

  const category = await createCategory(userId, input);
  return Response.json({ category }, { status: 201 });
}
