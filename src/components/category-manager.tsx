"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Category } from "@/db/schema";
import {
  MAX_CATEGORIES,
  MAX_CATEGORY_DESCRIPTION_LENGTH,
  MAX_CATEGORY_NAME_LENGTH,
} from "@/lib/categories";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const smallButton =
  "rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";
const primaryButton =
  "rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400";

// 카테고리 추가·수정·삭제 모달. 열기 버튼은 카테고리 칩 목록의 맨 끝에 놓인다.
export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const addNameRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      addNameRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function close() {
    setOpen(false);
    setError(null);
    setEditingId(null);
    setConfirmDeleteId(null);
  }

  // 요청을 보내고 성공하면 목록을 새로고침한다. 실패하면 서버가 준 안내를 보여준다.
  async function request(url: string, init: RequestInit) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        ...init,
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "요청을 처리하지 못했어요. 다시 시도해 주세요.");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("네트워크 오류가 발생했어요. 다시 시도해 주세요.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const ok = await request("/api/categories", {
      method: "POST",
      body: JSON.stringify({ name: newName, description: newDescription }),
    });
    if (ok) {
      setNewName("");
      setNewDescription("");
      addNameRef.current?.focus();
    }
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditName(category.name);
    setEditDescription(category.description ?? "");
    setConfirmDeleteId(null);
    setError(null);
  }

  async function handleSaveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (editingId === null) return;
    const ok = await request(`/api/categories/${editingId}`, {
      method: "PATCH",
      body: JSON.stringify({ name: editName, description: editDescription }),
    });
    if (ok) setEditingId(null);
  }

  async function handleDelete(id: number) {
    const ok = await request(`/api/categories/${id}`, { method: "DELETE" });
    if (ok) setConfirmDeleteId(null);
  }

  const atLimit = categories.length >= MAX_CATEGORIES;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="카테고리 추가"
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:border-indigo-400 hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-indigo-400 dark:hover:text-indigo-400"
      >
        <span aria-hidden>＋</span> 카테고리 추가
      </button>

      <dialog
        ref={dialogRef}
        onClose={close}
        onClick={(event) => {
          // 패널 바깥(배경)을 누르면 닫는다.
          if (event.target === dialogRef.current) close();
        }}
        aria-labelledby="category-manager-title"
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-0 text-slate-900 shadow-xl backdrop:bg-black/40 dark:bg-slate-900 dark:text-slate-100"
      >
        <div className="max-h-[85vh] overflow-y-auto p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="category-manager-title" className="text-lg font-semibold">
              카테고리 관리
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="닫기"
              className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          <p className="mb-4 text-xs leading-relaxed text-slate-500">
            카테고리를 바꿔도 이미 저장된 기사는 자동으로 다시 분류되지 않아요.
            미분류 기사는 목록 위의 ‘미분류 기사 재분류’ 버튼으로 분류할 수 있어요.
          </p>

          <ul className="mb-5 space-y-2">
            {categories.length === 0 && (
              <li className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-500 dark:border-slate-700">
                아직 카테고리가 없어요. 아래에서 추가해 보세요.
              </li>
            )}
            {categories.map((category) => (
              <li
                key={category.id}
                className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
              >
                {editingId === category.id ? (
                  <form onSubmit={handleSaveEdit} className="space-y-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={MAX_CATEGORY_NAME_LENGTH}
                      aria-label="카테고리 이름"
                      className={inputClass}
                    />
                    <input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      maxLength={MAX_CATEGORY_DESCRIPTION_LENGTH}
                      placeholder="설명 (분류 기준, 선택)"
                      aria-label="카테고리 설명"
                      className={inputClass}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className={smallButton}
                      >
                        취소
                      </button>
                      <button type="submit" disabled={busy} className={smallButton}>
                        저장
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-keep text-sm font-medium">{category.name}</p>
                      {category.description && (
                        <p className="mt-0.5 break-keep text-xs text-slate-500">
                          {category.description}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        onClick={() => startEdit(category)}
                        className={smallButton}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDeleteId(category.id);
                          setEditingId(null);
                          setError(null);
                        }}
                        className={smallButton}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                )}

                {confirmDeleteId === category.id && (
                  <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 dark:bg-red-950">
                    <p className="text-xs text-red-700 dark:text-red-300">
                      ‘{category.name}’을(를) 삭제할까요? 이 카테고리의 기사는 지워지지
                      않고 미분류로 남아요.
                    </p>
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className={smallButton}
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDelete(category.id)}
                        className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <form onSubmit={handleAdd} className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            <h3 className="text-sm font-semibold">새 카테고리</h3>
            <input
              ref={addNameRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={MAX_CATEGORY_NAME_LENGTH}
              placeholder="이름 (예: 오픈소스)"
              aria-label="새 카테고리 이름"
              disabled={atLimit}
              className={inputClass}
            />
            <input
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              maxLength={MAX_CATEGORY_DESCRIPTION_LENGTH}
              placeholder="설명 (분류 기준, 선택)"
              aria-label="새 카테고리 설명"
              disabled={atLimit}
              className={inputClass}
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                {atLimit
                  ? `최대 ${MAX_CATEGORIES}개까지 만들 수 있어요.`
                  : `${categories.length}/${MAX_CATEGORIES}`}
              </span>
              <button
                type="submit"
                disabled={busy || atLimit || !newName.trim()}
                className={primaryButton}
              >
                추가
              </button>
            </div>
          </form>

          {error && (
            <p
              role="alert"
              className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
            >
              {error}
            </p>
          )}
        </div>
      </dialog>
    </>
  );
}
