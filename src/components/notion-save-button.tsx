"use client";

import { useState } from "react";

type Props = {
  articleId: number;
  initialSaved: boolean;
};

const baseClass =
  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";

export function NotionSaveButton({ articleId, initialSaved }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/articles/${articleId}/notion`, {
        method: "POST",
      });
      if (res.ok || res.status === 409) {
        // 409 는 이미 저장된 기사라는 뜻이므로 저장됨으로 맞춘다.
        setSaved(true);
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "노션에 저장하지 못했어요. 다시 시도해 주세요.");
    } catch {
      setError("네트워크 오류로 저장하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <button
        type="button"
        disabled
        className={`${baseClass} cursor-default border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300`}
      >
        ✓ 저장됨
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={saving}
        aria-busy={saving}
        className={`${baseClass} border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800`}
      >
        {saving ? "저장 중…" : "뉴스 저장"}
      </button>
      {error && (
        <p role="alert" className="max-w-48 text-right text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
