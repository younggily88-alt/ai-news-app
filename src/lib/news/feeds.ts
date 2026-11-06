export type Feed = {
  // articles.source 에 저장되는 출처 이름
  source: string;
  url: string;
};

export const FEEDS: Feed[] = [
  {
    source: "TechCrunch AI",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
  },
  {
    source: "The Verge AI",
    url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
  },
];

// 이 시간 안에 게시된 기사만 수집한다.
export const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000;
