/** 客户端游客身份：localStorage 生成并持久化 visitorId，作为评分/点赞的去重键 */

const STORAGE_KEY = "games_visitor_id";

export function getVisitorVoterKey(): string {
  if (typeof window === "undefined") return "guest:ssr";
  try {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    return `guest:${id}`;
  } catch {
    return `guest:${crypto.randomUUID()}`;
  }
}
