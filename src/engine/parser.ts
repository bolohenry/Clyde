import { StructuredContent, StructuredItem } from "@/types";

interface ParsedResponse {
  text: string;
  structured?: StructuredContent;
}

export function parseResponse(raw: string): ParsedResponse {
  const blockMatch = raw.match(
    /```(checklist|plan|comparison|draft)\n([\s\S]*?)```/
  );

  if (!blockMatch) {
    return { text: raw.trim() };
  }

  const blockType = blockMatch[1] as
    | "checklist"
    | "plan"
    | "comparison"
    | "draft";
  const blockContent = blockMatch[2].trim();
  const textBefore = raw.slice(0, blockMatch.index).trim();
  const textAfter = raw.slice(blockMatch.index! + blockMatch[0].length).trim();
  const text = [textBefore, textAfter].filter(Boolean).join("\n\n");

  const structured = parseStructuredBlock(blockType, blockContent);

  return { text, structured };
}

function parseStructuredBlock(
  type: "checklist" | "plan" | "comparison" | "draft",
  content: string
): StructuredContent {
  switch (type) {
    case "checklist":
      return parseChecklist(content);
    case "plan":
      return parsePlan(content);
    case "comparison":
      return parseComparison(content);
    case "draft":
      return parseDraft(content);
  }
}

function parseChecklist(content: string): StructuredContent {
  const lines = content.split("\n").filter((l) => l.trim());
  const title = lines[0]?.startsWith("-") ? "Checklist" : lines.shift() || "Checklist";

  const items: StructuredItem[] = lines
    .filter((l) => l.trim().startsWith("- ["))
    .map((l, i) => {
      const checked = l.includes("[x]") || l.includes("[X]");
      const text = l.replace(/^-\s*\[[ xX]?\]\s*/, "").trim();
      return { id: `c${i}`, text, checked };
    });

  if (items.length === 0) {
    const fallbackItems = lines
      .filter((l) => l.trim().startsWith("-"))
      .map((l, i) => ({
        id: `c${i}`,
        text: l.replace(/^-\s*/, "").trim(),
        checked: false,
      }));
    return { type: "checklist", title, items: fallbackItems };
  }

  return { type: "checklist", title, items };
}

function parsePlan(content: string): StructuredContent {
  const lines = content.split("\n");
  const title = lines[0]?.startsWith("#") ? "Plan" : lines.shift()?.trim() || "Plan";

  const items: StructuredItem[] = [];
  let currentItem: StructuredItem | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ") || trimmed.startsWith("### ")) {
      if (currentItem) items.push(currentItem);
      currentItem = {
        id: `p${items.length}`,
        text: trimmed.replace(/^#{2,3}\s*/, ""),
        subItems: [],
      };
    } else if (trimmed.startsWith("- ") && currentItem) {
      currentItem.subItems = currentItem.subItems || [];
      currentItem.subItems.push(trimmed.replace(/^-\s*/, ""));
    } else if (trimmed.startsWith("- ") && !currentItem) {
      currentItem = {
        id: `p${items.length}`,
        text: trimmed.replace(/^-\s*/, ""),
        subItems: [],
      };
    }
  }
  if (currentItem) items.push(currentItem);

  return { type: "plan", title, items };
}

function parseComparison(content: string): StructuredContent {
  const lines = content.split("\n");
  const title = lines[0]?.startsWith("#") ? "Comparison" : lines.shift()?.trim() || "Comparison";

  const items: StructuredItem[] = [];
  let currentItem: StructuredItem | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("### ")) {
      if (currentItem) items.push(currentItem);
      currentItem = {
        id: `opt${items.length}`,
        text: trimmed.replace(/^###\s*/, ""),
        subItems: [],
        pro: true,
      };
    } else if (trimmed.startsWith("- ") && currentItem) {
      currentItem.subItems = currentItem.subItems || [];
      currentItem.subItems.push(trimmed.replace(/^-\s*/, ""));
    }
  }
  if (currentItem) items.push(currentItem);

  return { type: "comparison", title, items };
}

function parseDraft(content: string): StructuredContent {
  const lines = content.split("\n");
  const title = lines.shift()?.trim() || "Draft";
  const body = lines.join("\n").trim();

  return {
    type: "draft",
    title,
    items: [{ id: "d1", text: body }],
  };
}
