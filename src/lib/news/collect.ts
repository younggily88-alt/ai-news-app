import { FEEDS, RECENT_WINDOW_MS } from "./feeds";
import { parseFeed, type FeedItem } from "./parse-feed";

export type CollectResult = {
  // 최근 24시간 이내 기사 (최신순, URL 중복 제거)
  items: FeedItem[];
  // 가져오지 못한 출처 이름
  failedSources: string[];
};

// 모든 피드를 동시에 가져온다. 한쪽이 실패해도 나머지 결과는 사용한다.
export async function collectRecentNews(now = new Date()): Promise<CollectResult> {
  const cutoff = now.getTime() - RECENT_WINDOW_MS;
  const results = await Promise.allSettled(FEEDS.map(parseFeed));

  const byUrl = new Map<string, FeedItem>();
  const failedSources: string[] = [];

  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(`[news] ${FEEDS[i].source} 가져오기 실패:`, result.reason);
      failedSources.push(FEEDS[i].source);
      return;
    }
    for (const item of result.value) {
      if (item.publishedAt.getTime() >= cutoff && !byUrl.has(item.url)) {
        byUrl.set(item.url, item);
      }
    }
  });

  const items = [...byUrl.values()].sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime(),
  );
  return { items, failedSources };
}
