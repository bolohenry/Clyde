import { StructuredContent, StructuredItem } from "@/types";

interface ParsedResponse {
  text: string;
  structured?: StructuredContent;
  searchQuery?: string;
}

function extractSearchQuery(text: string): { text: string; searchQuery?: string } {
  const searchMatch = text.match(/\[SEARCH:\s*(.+?)\]\s*$/m);
  if (!searchMatch) return { text };
  const searchQuery = searchMatch[1].trim();
  const cleaned = text.slice(0, searchMatch.index).trimEnd();
  return { text: cleaned, searchQuery };
}

export function parseResponse(raw: string): ParsedResponse {
  const blockMatch = raw.match(
    /```(checklist|plan|comparison|draft|breakdown|table|timeline)\n([\s\S]*?)```/
  );

  if (!blockMatch) {
    const { text, searchQuery } = extractSearchQuery(raw.trim());
    return { text, searchQuery };
  }

  const blockType = blockMatch[1] as
    | "checklist"
    | "plan"
    | "comparison"
    | "draft"
    | "breakdown"
    | "table"
    | "timeline";
  const blockContent = blockMatch[2].trim();
  const textBefore = raw.slice(0, blockMatch.index).trim();
  const textAfterRaw = raw.slice(blockMatch.index! + blockMatch[0].length).trim();

  const { text: textAfter, searchQuery } = extractSearchQuery(textAfterRaw);
  const text = [textBefore, textAfter].filter(Boolean).join("\n\n");

  const structured = parseStructuredBlock(blockType, blockContent);

  return { text, structured, searchQuery };
}

function parseStructuredBlock(
  type: "checklist" | "plan" | "comparison" | "draft" | "breakdown" | "table" | "timeline",
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
    case "breakdown":
      return parseBreakdown(content);
    case "table":
      return parseTable(content);
    case "timeline":
      return parseTimeline(content);
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

function parseBreakdown(content: string): StructuredContent {
  const lines = content.split("\n");
  const title = lines[0]?.startsWith("#") ? "Breakdown" : lines.shift()?.trim() || "Breakdown";

  const items: StructuredItem[] = [];
  let currentItem: StructuredItem | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ") || trimmed.startsWith("### ")) {
      if (currentItem) items.push(currentItem);
      currentItem = {
        id: `b${items.length}`,
        text: trimmed.replace(/^#{2,3}\s*/, ""),
        subItems: [],
      };
    } else if (trimmed.startsWith("- ") && currentItem) {
      currentItem.subItems = currentItem.subItems || [];
      currentItem.subItems.push(trimmed.replace(/^-\s*/, ""));
    } else if (trimmed.startsWith("- ") && !currentItem) {
      currentItem = {
        id: `b${items.length}`,
        text: trimmed.replace(/^-\s*/, ""),
        subItems: [],
      };
    }
  }
  if (currentItem) items.push(currentItem);

  return { type: "breakdown", title, items };
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

function parseTable(content: string): StructuredContent {
  const lines = content.split("\n").filter((l) => l.trim());
  const title = lines.shift()?.trim() || "Table";

  // Normalize a pipe-separated line into an array of trimmed, non-empty cells
  const parseCells = (line: string): string[] => {
    const cells = line.split("|").map((c) => c.trim());
    // Drop empty leading/trailing cells from surrounding pipes
    const start = cells[0] === "" ? 1 : 0;
    const end = cells[cells.length - 1] === "" ? cells.length - 1 : cells.length;
    return cells.slice(start, end).filter(Boolean);
  };

  // Only process lines that contain pipes; skip markdown separator rows (---|:--- etc.)
  const pipeLines = lines.filter(
    (l) => l.includes("|") && !l.match(/^\s*[\|:\-\s]+$/)
  );

  const headerLine = pipeLines.shift();
  const headers = headerLine ? parseCells(headerLine) : [];

  const items: StructuredItem[] = pipeLines.map((l, i) => {
    const cells = parseCells(l);
    return {
      id: `t${i}`,
      text: cells[0] || "",
      subItems: cells.slice(1),
    };
  });

  return { type: "table", title, headers, items };
}

function parseTimeline(content: string): StructuredContent {
  const lines = content.split("\n");
  const title = lines[0]?.startsWith("#") ? "Timeline" : lines.shift()?.trim() || "Timeline";

  const items: StructuredItem[] = [];
  let currentItem: StructuredItem | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ") || trimmed.startsWith("### ")) {
      if (currentItem) items.push(currentItem);
      currentItem = {
        id: `tl${items.length}`,
        text: trimmed.replace(/^#{2,3}\s*/, ""),
        subItems: [],
      };
    } else if (trimmed.startsWith("- ") && currentItem) {
      currentItem.subItems = currentItem.subItems || [];
      currentItem.subItems.push(trimmed.replace(/^-\s*/, ""));
    } else if (trimmed.startsWith("- ") && !currentItem) {
      currentItem = {
        id: `tl${items.length}`,
        text: trimmed.replace(/^-\s*/, ""),
        subItems: [],
      };
    }
  }
  if (currentItem) items.push(currentItem);

  return { type: "timeline", title, items };
}
