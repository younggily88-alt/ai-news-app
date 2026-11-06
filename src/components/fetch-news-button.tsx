"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Notice = { kind: "success" | "error"; message: string };

type FetchResult = {
  added: number;
  skipped: number;
  failed: number;
  remaining: number;
  failedSources: string[];
};

function successMessage({ added, failed, remaining, failedSources }: FetchResult) {
  let message =
    added > 0 ? `새 기사 ${added}개를 추가했어요.` : "새로 추가할 기사가 없어요.";
  if (remaining > 0) message += ` 남은 ${remaining}개는 다시 눌러 가져오세요.`;
  if (failed > 0) message += ` (${failed}개는 AI 처리에 실패해 다음에 다시 시도해요)`;
  if (failedSources.length > 0) {
    message += ` (${failedSources.join(", ")} 가져오기 실패)`;
  }
  return message;
}

export function FetchNewsButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  // 성공 안내는 잠시 후 사라지고, 에러는 다음 시도 전까지 남긴다.
  useEffect(() => {
    if (notice?.kind !== "success") return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  async function handleClick() {
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch("/api/news/fetch", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setNotice({
          kind: "error",
          message:
            data?.error ?? "뉴스를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.",
        });
        return;
      }
      setNotice({ kind: "success", message: successMessage(data) });
      router.refresh();
    } catch {
      setNotice({
        kind: "error",
        message: "네트워크 오류로 뉴스를 가져오지 못했어요. 다시 시도해 주세요.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-busy={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        {loading && (
          <svg
            className="size-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-25"
            />
            <path
              d="M4 12a8 8 0 0 1 8-8"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        )}
        {loading ? "뉴스 가져오는 중…" : "뉴스 가져오기"}
      </button>

      {notice && (
        <div
          role={notice.kind === "error" ? "alert" : "status"}
          className={`fixed right-4 top-16 z-20 max-w-xs rounded-lg border px-4 py-3 text-sm shadow-md sm:right-6 ${
            notice.kind === "error"
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
              : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          }`}
        >
          {notice.message}
        </div>
      )}
    </>
  );
}
