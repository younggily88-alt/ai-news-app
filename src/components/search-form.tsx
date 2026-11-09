// 제목·요약 검색. 서버 컴포넌트의 GET 폼이라 주소에 ?q= 로 반영된다.
// 카테고리를 고른 상태에서 검색해도 카테고리가 유지되도록 hidden 으로 함께 보낸다.
export function SearchForm({
  search,
  category,
}: {
  search?: string;
  category?: string;
}) {
  return (
    <form
      action="/dashboard"
      role="search"
      className="mb-4 flex max-w-md items-center gap-2"
    >
      {category && <input type="hidden" name="category" value={category} />}
      <input
        type="search"
        name="q"
        defaultValue={search}
        placeholder="제목·요약 검색"
        aria-label="뉴스 검색"
        maxLength={100}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
      <button
        type="submit"
        className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        검색
      </button>
    </form>
  );
}
