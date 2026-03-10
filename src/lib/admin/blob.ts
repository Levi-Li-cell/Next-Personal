import { del } from "@vercel/blob";

export async function deleteBlobUrls(urls: string[]) {
  const list = [...new Set(urls.filter(Boolean))];
  if (list.length === 0) {
    return;
  }

  await Promise.allSettled(list.map((url) => del(url)));
}
