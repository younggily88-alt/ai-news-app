import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 페이지는 로그인 모달로 막고(src/app/page.tsx), API는 여기서 비로그인 요청을 차단한다.
const isProtectedApi = createRouteMatcher(["/api(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedApi(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Next.js 내부 파일과 정적 파일은 제외
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // API 라우트는 항상 실행
    "/(api|trpc)(.*)",
  ],
};
