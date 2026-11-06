"use client";

import { SignInButton, SignOutButton, useClerk, useSession } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

const buttonClass =
  "rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200";

// 비로그인 사용자가 접속하면 로그인 모달을 바로 띄운다.
// 모달을 닫아도 버튼으로 다시 열 수 있다. 로그인 후에는 대시보드로 이동한다.
export function SignInGate() {
  const { openSignIn } = useClerk();
  const { isLoaded, session } = useSession();
  const opened = useRef(false);

  // 세션은 있는데 서버가 로그인으로 인정하지 않는 상태(예: 추가 단계가 남은 pending 세션)
  const hasStuckSession = isLoaded && !!session;

  useEffect(() => {
    // 세션 상태가 확정된 뒤(isLoaded)에만, 세션이 전혀 없을 때만, 한 번 연다.
    if (!isLoaded || session || opened.current) return;
    opened.current = true;
    Promise.resolve(openSignIn({ forceRedirectUrl: "/dashboard" })).catch(
      () => {},
    );
  }, [isLoaded, session, openSignIn]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">AI 뉴스 모음</h1>

      {hasStuckSession ? (
        <>
          <p className="max-w-md text-zinc-600 dark:text-zinc-400">
            로그인 세션은 있지만 아직 완료되지 않았어요
            {session.status !== "active" && (
              <>
                {" "}
                (상태: {session.status}
                {session.currentTask ? `, 남은 단계: ${session.currentTask.key}` : ""})
              </>
            )}
            . 로그아웃한 뒤 다시 로그인해 주세요.
          </p>
          <SignOutButton redirectUrl="/">
            <button type="button" className={buttonClass}>
              로그아웃 후 다시 시도
            </button>
          </SignOutButton>
        </>
      ) : (
        <>
          <p className="text-zinc-600 dark:text-zinc-400">
            해외 AI 뉴스를 한국어로 모아 보려면 먼저 로그인하세요.
          </p>
          <SignInButton mode="modal" forceRedirectUrl="/dashboard">
            <button type="button" className={buttonClass}>
              로그인
            </button>
          </SignInButton>
        </>
      )}
    </div>
  );
}
