"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Result = {
  updated: number;
  unmatched: number;
  failed: number;
  remaining: number;
};

type Notice = { kind: "success" | "error"; message: string };

function resultMessage({ updated, unmatched, failed, remaining }: Result) {
  let message =
    updated > 0 ? `${updated}개를 분류했어요.` : "새로 분류된 기사가 없어요.";
  if (remaining > 0) message += ` 남은 ${remaining}개는 다시 눌러 분류하세요.`;
  if (unmatched > 0) message += ` (${unmatched}개는 맞는 카테고리가 없어 미분류로 남았어요)`;
  if (failed > 0) message += ` (${failed}개는 AI 처리에 실패했어요)`;
  return message;
}

// 미분류 기사를 Claude 로 다시 분류한다. 비용이 드는 작업이라 누를 때만 실행한다.
export function ReclassifyButton({ count }: { count: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  async function handleClick() {
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch("/api/articles/reclassify", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setNotice({
          kind: "error",
          message: data?.error ?? "재분류하지 못했어요. 잠시 후 다시 시도해 주세요.",
        });
        return;
      }
      setNotice({ kind: "success", message: resultMessage(data) });
      router.refresh();
    } catch {
      setNotice({
        kind: "error",
        message: "네트워크 오류로 재분류하지 못했어요. 다시 시도해 주세요.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-busy={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        {loading ? "재분류하는 중…" : `미분류 기사 재분류 (${count})`}
      </button>
      {notice && (
        <p
          role={notice.kind === "error" ? "alert" : "status"}
          className={`text-sm ${
            notice.kind === "error"
              ? "text-red-600 dark:text-red-400"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          {notice.message}
        </p>
      )}
    </div>
  );
}
