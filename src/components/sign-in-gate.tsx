"use client";

import { SignInButton, useAuth, useClerk } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

// 비로그인 사용자가 접속하면 로그인 모달을 바로 띄운다.
// 모달을 닫아도 버튼으로 다시 열 수 있다.
export function SignInGate() {
  const { openSignIn } = useClerk();
  const { isLoaded, isSignedIn } = useAuth();
  const opened = useRef(false);

  useEffect(() => {
    // 세션 상태가 확정된 뒤(isLoaded)에만, 한 번만 연다.
    if (!isLoaded || isSignedIn || opened.current) return;
    opened.current = true;
    Promise.resolve(openSignIn()).catch(() => {});
  }, [isLoaded, isSignedIn, openSignIn]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">AI 뉴스 모음</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        해외 AI 뉴스를 한국어로 모아 보려면 먼저 로그인하세요.
      </p>
      <SignInButton mode="modal">
        <button
          type="button"
          className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          로그인
        </button>
      </SignInButton>
    </div>
  );
}
