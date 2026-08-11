import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://liwei.coilleaf.xyz";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/projects`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/guestbook`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  // 动态博客文章
  try {
    const { db } = await import("@/db");
    const { blog } = await import("@/db/schema/blog");
    const { eq } = await import("drizzle-orm");

    const posts = await db.query.blog.findMany({
      where: eq(blog.status, "published"),
      columns: { slug: true, updatedAt: true },
    });

    const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    // 动态项目
    const { project } = await import("@/db/schema/project");
    const projects = await db.query.project.findMany({
      where: eq(project.status, "published"),
      columns: { id: true, updatedAt: true },
    });

    const projectRoutes: MetadataRoute.Sitemap = projects.map((proj) => ({
      url: `${SITE_URL}/projects/${proj.id}`,
      lastModified: proj.updatedAt ? new Date(proj.updatedAt) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    return [...staticRoutes, ...blogRoutes, ...projectRoutes];
  } catch {
    // 如果数据库不可用，只返回静态路由
    return staticRoutes;
  }
}
