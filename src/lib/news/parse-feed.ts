import { XMLParser } from "fast-xml-parser";
import type { Feed } from "./feeds";

export type FeedItem = {
  url: string;
  source: string;
  title: string;
  summary: string;
  publishedAt: Date;
};

const FETCH_TIMEOUT_MS = 10_000;
const SUMMARY_MAX_LENGTH = 300;

const parser = new XMLParser({ ignoreAttributes: false });

// 텍스트 노드는 문자열이거나 { "#text": ... } (속성이 있을 때) 형태로 온다.
function text(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object" && "#text" in value) {
    return text((value as Record<string, unknown>)["#text"]);
  }
  return "";
}

function decodeEntities(input: string) {
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

// HTML 조각을 읽기 좋은 한 줄 텍스트로 바꾼다.
function htmlToText(html: string) {
  return decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(input: string, max: number) {
  return input.length > max ? `${input.slice(0, max).trimEnd()}…` : input;
}

// 추적용 파라미터와 해시를 제거해 같은 기사가 다른 URL로 저장되지 않게 한다.
export function normalizeUrl(raw: string) {
  const url = new URL(raw.trim());
  for (const key of [...url.searchParams.keys()]) {
    if (/^utm_/i.test(key) || key === "fbclid" || key === "gclid") {
      url.searchParams.delete(key);
    }
  }
  url.hash = "";
  return url.toString();
}

function toArray<T>(value: T | T[] | undefined): T[] {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}

function toItem(
  source: string,
  rawUrl: string,
  rawTitle: string,
  rawSummary: string,
  rawDate: string,
): FeedItem | null {
  const publishedAt = new Date(rawDate);
  const title = htmlToText(rawTitle);
  if (!rawUrl || !title || Number.isNaN(publishedAt.getTime())) return null;

  let url: string;
  try {
    url = normalizeUrl(rawUrl);
  } catch {
    return null;
  }

  return {
    url,
    source,
    title,
    summary: truncate(htmlToText(rawSummary), SUMMARY_MAX_LENGTH),
    publishedAt,
  };
}

// RSS 2.0 (TechCrunch)과 Atom (The Verge)을 같은 형태로 변환한다.
export async function parseFeed(feed: Feed): Promise<FeedItem[]> {
  const res = await fetch(feed.url, {
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ai-news-collector)",
      Accept: "application/rss+xml, application/atom+xml, application/xml",
    },
  });
  if (!res.ok) {
    throw new Error(`${feed.source}: HTTP ${res.status}`);
  }

  const doc = parser.parse(await res.text());
  const items: (FeedItem | null)[] = [];

  if (doc.rss?.channel) {
    for (const item of toArray<Record<string, unknown>>(doc.rss.channel.item)) {
      items.push(
        toItem(
          feed.source,
          text(item.link),
          text(item.title),
          text(item.description),
          text(item.pubDate),
        ),
      );
    }
  } else if (doc.feed) {
    for (const entry of toArray<Record<string, unknown>>(doc.feed.entry)) {
      const links = toArray<Record<string, string>>(
        entry.link as Record<string, string> | Record<string, string>[],
      );
      const link =
        links.find((l) => !l["@_rel"] || l["@_rel"] === "alternate") ?? links[0];
      items.push(
        toItem(
          feed.source,
          link?.["@_href"] ?? "",
          text(entry.title),
          text(entry.summary) || text(entry.content),
          text(entry.published) || text(entry.updated),
        ),
      );
    }
  } else {
    throw new Error(`${feed.source}: 알 수 없는 피드 형식`);
  }

  return items.filter((i): i is FeedItem => i !== null);
}
