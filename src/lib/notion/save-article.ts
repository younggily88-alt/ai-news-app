import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// 서버 전용. NOTION_TOKEN / NOTION_DATABASE_ID 는 환경변수에서만 읽는다.
// 노션 MCP 서버(@notionhq/notion-mcp-server)를 자식 프로세스(stdio)로 띄워 호출한다.

export type NotionArticle = {
  title: string;
  summary: string;
  categoryName: string | null;
  source: string;
  url: string;
  publishedAt: Date;
};

// 노션 텍스트 속성의 한 덩어리 최대 길이
const MAX_TEXT = 2000;

const MCP_SERVER_PATH = path.join(
  process.cwd(),
  "node_modules",
  "@notionhq",
  "notion-mcp-server",
  "bin",
  "cli.mjs",
);

// DB 아이디로 알아낸 데이터 소스 아이디는 바뀌지 않으므로 프로세스 안에서 재사용한다.
let cachedDataSourceId: string | null = null;

function getEnv() {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!token || !databaseId) {
    throw new Error("NOTION_TOKEN 또는 NOTION_DATABASE_ID 가 설정되지 않았어요.");
  }
  return { token, databaseId };
}

const richText = (value: string) => [
  { text: { content: value.slice(0, MAX_TEXT) } },
];

// MCP 도구 결과의 텍스트(JSON)를 꺼낸다. 도구가 오류를 돌려주면 예외로 바꾼다.
function readToolResult(result: Awaited<ReturnType<Client["callTool"]>>) {
  const content = Array.isArray(result.content) ? result.content : [];
  const text = content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");
  if (result.isError) {
    throw new Error(`노션 MCP 오류: ${text.slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : null;
}

async function resolveDataSourceId(client: Client, databaseId: string) {
  if (cachedDataSourceId) return cachedDataSourceId;

  const database = readToolResult(
    await client.callTool({
      name: "API-retrieve-a-database",
      arguments: { database_id: databaseId },
    }),
  );
  const id = database?.data_sources?.[0]?.id;
  if (typeof id !== "string") {
    throw new Error("노션 데이터베이스의 데이터 소스를 찾지 못했어요.");
  }
  cachedDataSourceId = id;
  return id;
}

// 노션 DB에 기사 한 건을 새 페이지로 저장하고 페이지 URL을 돌려준다.
// DB 속성: 제목(title), 요약·카테고리·출처(text), URL(url), 발행일(date)
export async function saveArticleToNotion(article: NotionArticle) {
  const { token, databaseId } = getEnv();

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [MCP_SERVER_PATH],
    env: { NOTION_TOKEN: token },
    stderr: "ignore",
  });
  const client = new Client({ name: "ai-news-collector", version: "0.1.0" });

  try {
    await client.connect(transport);
    const dataSourceId = await resolveDataSourceId(client, databaseId);

    const properties: Record<string, unknown> = {
      제목: { title: richText(article.title) },
      요약: { rich_text: richText(article.summary) },
      출처: { rich_text: richText(article.source) },
      URL: { url: article.url },
      발행일: { date: { start: article.publishedAt.toISOString() } },
    };
    if (article.categoryName) {
      properties["카테고리"] = { rich_text: richText(article.categoryName) };
    }

    const page = readToolResult(
      await client.callTool({
        name: "API-post-page",
        arguments: {
          parent: { type: "data_source_id", data_source_id: dataSourceId },
          properties,
        },
      }),
    );
    return typeof page?.url === "string" ? (page.url as string) : null;
  } finally {
    await client.close().catch(() => {});
  }
}
