import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignInGate } from "@/components/sign-in-gate";

// 로그인 여부를 요청 시점에 읽는 페이지라 정적 셸 검증(instant)을 끈다.
export const instant = false;

export default function Home() {
  return (
    <Suspense>
      <HomeGate />
    </Suspense>
  );
}

// 로그인되어 있으면 바로 대시보드로, 아니면 로그인 화면을 보여준다.
async function HomeGate() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");
  return <SignInGate />;
}
