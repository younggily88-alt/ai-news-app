import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { Suspense } from "react";
import { CategoryBar } from "@/components/category-bar";
import { NewsCard } from "@/components/news-card";
import { SignInGate } from "@/components/sign-in-gate";
import { getArticles, getCategories } from "@/db/queries";

// 로그인 여부를 요청 시점에 읽는 페이지라 정적 셸 검증(instant)을 끈다.
export const instant = false;

type SearchParams = Promise<{ category?: string | string[] }>;

export default function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="flex flex-1 flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Dashboard({ searchParams }: { searchParams: SearchParams }) {
  const { userId } = await auth();
  if (!userId) return <SignInGate />;

  const { category } = await searchParams;
  const selected = Array.isArray(category) ? category[0] : category;

  // "none" = 미분류, 숫자 = 카테고리 id, 그 외 값은 전체로 취급
  const categoryId =
    selected === "none"
      ? null
      : selected && /^\d+$/.test(selected)
        ? Number(selected)
        : undefined;

  const [categoryList, articleList] = await Promise.all([
    getCategories(userId),
    getArticles(userId, categoryId),
  ]);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <CategoryBar
          categories={categoryList}
          selected={categoryId === undefined ? undefined : selected}
        />

        {articleList.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-500 dark:border-slate-700">
            {categoryId === undefined
              ? "아직 수집한 뉴스가 없어요."
              : "이 카테고리에는 아직 뉴스가 없어요."}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {articleList.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <h1 className="text-lg font-bold tracking-tight">AI 뉴스 수집기</h1>
        <UserButton />
      </div>
    </header>
  );
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="불러오는 중" className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4 sm:px-6">
          <h1 className="text-lg font-bold tracking-tight">AI 뉴스 수집기</h1>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-8 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
