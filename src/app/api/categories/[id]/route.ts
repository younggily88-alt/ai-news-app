import { auth } from "@clerk/nextjs/server";
import { deleteCategory, isCategoryNameTaken, updateCategory } from "@/db/queries";
import { parseCategoryInput } from "@/lib/categories";

type Context = { params: Promise<{ id: string }> };

// 카테고리 수정. 수정해도 기존 기사는 자동으로 재분류하지 않는다.
export async function PATCH(request: Request, { params }: Context) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const categoryId = Number(id);

  const input = parseCategoryInput(await request.json().catch(() => null));
  if ("error" in input) {
    return Response.json({ error: input.error }, { status: 400 });
  }
  if (await isCategoryNameTaken(userId, input.name, categoryId)) {
    return Response.json({ error: "이미 있는 카테고리 이름이에요." }, { status: 409 });
  }

  const category = await updateCategory(userId, categoryId, input);
  if (!category) {
    return Response.json({ error: "카테고리를 찾을 수 없어요." }, { status: 404 });
  }
  return Response.json({ category });
}

// 카테고리 삭제. 해당 기사는 지워지지 않고 미분류가 된다.
export async function DELETE(_request: Request, { params }: Context) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (!(await deleteCategory(userId, Number(id)))) {
    return Response.json({ error: "카테고리를 찾을 수 없어요." }, { status: 404 });
  }
  return Response.json({ deleted: true });
}
