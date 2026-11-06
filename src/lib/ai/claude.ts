import Anthropic from "@anthropic-ai/sdk";

// 서버 전용. ANTHROPIC_API_KEY 는 환경변수에서 자동으로 읽는다.
let client: Anthropic | null = null;

export function getClaude() {
  client ??= new Anthropic();
  return client;
}

// 번역·요약·분류처럼 단순한 작업용 모델.
export const ENRICH_MODEL = "claude-haiku-5-5";
