import { Show, UserButton } from "@clerk/nextjs";
import { SignInGate } from "@/components/sign-in-gate";

// 로그인 여부를 요청 시점에 읽는 페이지라 정적 셸 검증(instant)을 끈다.
export const instant = false;

export default function Home() {
  return (
    <>
      <Show when="signed-out">
        <SignInGate />
      </Show>
      <Show when="signed-in">
        <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h1 className="text-lg font-semibold">AI 뉴스 모음</h1>
          <UserButton />
        </header>
        <main className="flex-1 p-6">{/* 뉴스 카드 목록은 이후 구현 */}</main>
      </Show>
    </>
  );
}
