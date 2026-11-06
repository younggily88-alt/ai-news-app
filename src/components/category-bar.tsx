import Link from "next/link";
import type { Category } from "@/db/schema";

const chipBase =
  "rounded-full px-4 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";
const chipOn = "bg-indigo-600 text-white dark:bg-indigo-500";
const chipOff =
  "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800";

// selected: undefined = 전체, "none" = 미분류, 그 외 카테고리 id 문자열
export function CategoryBar({
  categories,
  selected,
}: {
  categories: Category[];
  selected?: string;
}) {
  const items = [
    { key: undefined, label: "전체", href: "/dashboard" },
    ...categories.map((c) => ({
      key: String(c.id),
      label: c.name,
      href: `/dashboard?category=${c.id}`,
    })),
    { key: "none", label: "미분류", href: "/dashboard?category=none" },
  ];

  return (
    <nav aria-label="카테고리" className="mb-6 flex flex-wrap items-center gap-2">
      {items.map((item) => {
        const active = item.key === selected;
        return (
          <Link
            key={item.key ?? "all"}
            href={item.href}
            aria-current={active ? "true" : undefined}
            className={`${chipBase} ${active ? chipOn : chipOff}`}
          >
            {item.label}
          </Link>
        );
      })}

      {/* 카테고리 추가: 항상 목록의 마지막. 추가 기능은 이후 구현 */}
      <button
        type="button"
        disabled
        aria-label="카테고리 추가"
        title="준비 중"
        className="inline-flex cursor-not-allowed items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-500 opacity-70 dark:border-slate-700 dark:text-slate-400"
      >
        <span aria-hidden>＋</span> 카테고리 추가
      </button>
    </nav>
  );
}
