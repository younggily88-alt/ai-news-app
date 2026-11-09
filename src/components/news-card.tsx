import type { ArticleListItem } from "@/db/queries";
import { NotionSaveButton } from "./notion-save-button";

// 한국 시간 기준 YYYY.MM.DD
function formatDate(date: Date) {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}.${get("month")}.${get("day")}`;
}

export function NewsCard({ article }: { article: ArticleListItem }) {
  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between gap-2">
        {article.categoryName ? (
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            {article.categoryName}
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            미분류
          </span>
        )}
        <span className="text-xs text-slate-500">
          {article.source} · {formatDate(article.publishedAt)}
        </span>
      </div>

      <h2 className="line-clamp-3 break-keep text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100">
        {article.titleKo}
      </h2>

      <p className="mt-2 line-clamp-4 break-keep text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {article.summaryKo}
      </p>

      <div className="mt-auto flex items-center justify-between pt-4">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-indigo-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-indigo-400"
        >
          원문 보기 ↗
        </a>
        <NotionSaveButton
          articleId={article.id}
          initialSaved={article.notionSaved}
        />
      </div>
    </article>
  );
}
