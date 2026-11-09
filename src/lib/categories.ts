// 신규 사용자에게 처음 만들어 주는 기본 카테고리.
// description 은 Claude 가 기사를 분류할 때 기준으로 쓰므로 구체적으로 적는다.
export const DEFAULT_CATEGORIES = [
  { name: "연구&논문", description: "새 AI 모델 발표, 논문, 벤치마크, 연구 성과" },
  { name: "제품&출시", description: "AI 제품·서비스·기능의 출시와 업데이트" },
  { name: "산업&비즈니스", description: "기업 동향, 투자, 인수합병, 시장 전망" },
  { name: "정책&규제", description: "법안, 정부 정책, 규제, 소송, 저작권" },
  { name: "튜토리얼", description: "사용법, 가이드, 실습, 팁" },
  { name: "인프라&하드웨어", description: "반도체, GPU, 데이터센터, 클라우드 인프라" },
  { name: "기타", description: "위에 해당하지 않는 기사" },
] as const;

// 한 사용자가 만들 수 있는 카테고리 수. 너무 많으면 분류 기준이 흐려진다.
export const MAX_CATEGORIES = 12;
export const MAX_CATEGORY_NAME_LENGTH = 20;
export const MAX_CATEGORY_DESCRIPTION_LENGTH = 100;

// 요청 본문에서 카테고리 이름·설명을 꺼내 검증한다.
export function parseCategoryInput(
  body: unknown,
): { name: string; description: string | null } | { error: string } {
  const raw = (body ?? {}) as { name?: unknown; description?: unknown };
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const description =
    typeof raw.description === "string" ? raw.description.trim() : "";

  if (!name) return { error: "카테고리 이름을 입력해 주세요." };
  if (name.length > MAX_CATEGORY_NAME_LENGTH) {
    return { error: `이름은 ${MAX_CATEGORY_NAME_LENGTH}자 이하로 입력해 주세요.` };
  }
  if (description.length > MAX_CATEGORY_DESCRIPTION_LENGTH) {
    return {
      error: `설명은 ${MAX_CATEGORY_DESCRIPTION_LENGTH}자 이하로 입력해 주세요.`,
    };
  }
  return { name, description: description || null };
}
