import TurndownService from "turndown";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
  bulletListMarker: "-",
});

export function htmlToMarkdown(html: string) {
  if (!html) {
    return "";
  }

  return turndown.turndown(html);
}

export function extractImageUrlsFromHtml(html: string) {
  if (!html) {
    return [] as string[];
  }

  const matches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)];
  return matches.map((match) => match[1]).filter(Boolean);
}

export function extractImageUrlsFromMarkdown(markdown: string) {
  if (!markdown) {
    return [] as string[];
  }

  const matches = [...markdown.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)];
  return matches.map((match) => match[1]).filter(Boolean);
}
