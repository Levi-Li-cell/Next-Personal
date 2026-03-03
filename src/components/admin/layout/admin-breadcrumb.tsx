"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";

// 路径名称映射
const routeNameMap: Record<string, string> = {
  admin: "后台管理",
  users: "用户管理",
  blog: "博客管理",
  projects: "项目管理",
  comments: "评论管理",
  settings: "系统设置",
  profile: "个人资料",
  create: "新建",
  edit: "编辑",
};

export function AdminBreadcrumb() {
  const pathname = usePathname();

  // 移除开头的斜杠并分割路径
  const segments = pathname.split("/").filter(Boolean);

  // 构建面包屑项
  const breadcrumbItems = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;
    const name = routeNameMap[segment] || segment;

    return {
      name,
      href,
      isLast,
    };
  });

  // 如果在根路径，显示仪表盘
  if (breadcrumbItems.length === 0 || (breadcrumbItems.length === 1 && breadcrumbItems[0].name === "后台管理")) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>仪表盘</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // 过滤掉 "后台管理" 项，只显示具体功能
  const filteredItems = breadcrumbItems.filter(item => item.name !== "后台管理");

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/admin">仪表盘</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {filteredItems.map((item, index) => (
          <Fragment key={item.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage>{item.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.name}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
