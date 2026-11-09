import Link from "next/link";
import type { Category } from "@/db/schema";
import { CategoryManager } from "./category-manager";

const chipBase =
  "rounded-full px-4 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";
const chipOn = "bg-indigo-600 text-white dark:bg-indigo-500";
const chipOff =
  "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800";

// 카테고리를 고른 채로도 검색어가 유지되도록 링크에 q 를 함께 싣는다.
function href(category: string | undefined, search?: string) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (search) params.set("q", search);
  const query = params.toString();
  return query ? `/dashboard?${query}` : "/dashboard";
}

// selected: undefined = 전체, "none" = 미분류, 그 외 카테고리 id 문자열
export function CategoryBar({
  categories,
  selected,
  search,
}: {
  categories: Category[];
  selected?: string;
  search?: string;
}) {
  const items = [
    { key: undefined, label: "전체" },
    ...categories.map((c) => ({ key: String(c.id), label: c.name })),
    { key: "none", label: "미분류" },
  ];

  return (
    <nav aria-label="카테고리" className="mb-6 flex flex-wrap items-center gap-2">
      {items.map((item) => {
        const active = item.key === selected;
        return (
          <Link
            key={item.key ?? "all"}
            href={href(item.key, search)}
            aria-current={active ? "true" : undefined}
            className={`${chipBase} ${active ? chipOn : chipOff}`}
          >
            {item.label}
          </Link>
        );
      })}

      {/* 카테고리 추가: 항상 목록의 마지막 */}
      <CategoryManager categories={categories} />
    </nav>
  );
}
