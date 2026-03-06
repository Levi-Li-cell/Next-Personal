import nodemailer from "nodemailer";
import { getAdminNotifyReceivers } from "@/lib/admin/notify-settings";

const SMTP_HOST = process.env.QQ_SMTP_HOST || "smtp.qq.com";
const SMTP_PORT = Number(process.env.QQ_SMTP_PORT || "465");
const SMTP_USER = process.env.QQ_SMTP_USER;
const SMTP_PASS = process.env.QQ_SMTP_PASS;
const ADMIN_EMAILS = process.env.ADMIN_NOTIFY_EMAILS || "";

function getEnvAdminEmailList() {
  return ADMIN_EMAILS.split(",").map((item) => item.trim()).filter(Boolean);
}

function dedupeEmails(list: string[]) {
  return Array.from(new Set(list.map((item) => item.trim()).filter(Boolean)));
}

function createSmtpTransport() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

function escapeHtml(value: string) {
  return value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendAdminNotificationEmail(input: {
  eventType: string;
  userName: string;
  userEmail: string;
  content?: string;
  at?: Date;
}) {
  const titleMap: Record<string, string> = {
    user_signup: "新用户注册通知",
    guestbook_message: "留言板新留言通知",
    guestbook_warning: "留言板风险留言警告",
    blog_comment: "评论区新评论通知",
    comment_reply: "评论区新回复通知",
    guestbook_reply: "留言板回复通知",
  };

  const title = titleMap[input.eventType] || "后台新消息通知";
  const atText = (input.at || new Date()).toLocaleString("zh-CN", { hour12: false });
  const contentText = input.content ? `\n内容: ${input.content}` : "";

  if (!SMTP_USER || !SMTP_PASS) {
    console.warn("[NotifyEmail] SMTP 未配置，跳过发送");
    return {
      sent: false,
      status: "skipped",
      eventType: input.eventType,
      recipients: [],
      subject: `${title} - ${input.userName}`,
      textContent: `${title}\n\n触发用户: ${input.userName}\n邮箱: ${input.userEmail}${contentText}\n时间: ${atText}\n\n请前往后台查看详情。`,
      error: "SMTP 未配置",
    };
  }

  let dbReceivers: string[] = [];
  try {
    dbReceivers = await getAdminNotifyReceivers();
  } catch (error) {
    console.error("[NotifyEmail] 读取管理员通知配置失败，回退到环境变量:", error);
  }

  const receivers = dedupeEmails([
    ...dbReceivers,
    ...getEnvAdminEmailList(),
    SMTP_USER,
  ]);

  if (receivers.length === 0) {
    console.warn("[NotifyEmail] 未找到可用收件人，跳过发送");
    return {
      sent: false,
      status: "skipped",
      eventType: input.eventType,
      recipients: [],
      subject: `${title} - ${input.userName}`,
      textContent: `${title}\n\n触发用户: ${input.userName}\n邮箱: ${input.userEmail}${contentText}\n时间: ${atText}\n\n请前往后台查看详情。`,
      error: "未找到可用收件人",
    };
  }

  const transporter = createSmtpTransport();

  const contentHtml = input.content
    ? `<p><strong>内容:</strong> ${escapeHtml(input.content)}</p>`
    : "";

  const subject = `${title} - ${input.userName}`;
  const textContent = `${title}\n\n触发用户: ${input.userName}\n邮箱: ${input.userEmail}${contentText}\n时间: ${atText}\n\n请前往后台查看详情。`;

  try {
    const result = await transporter.sendMail({
      from: `"后台通知" <${SMTP_USER}>`,
      to: receivers.join(","),
      subject,
      text: textContent,
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.6; color:#222;">
          <h3 style="margin:0 0 12px;">${title}</h3>
          <p><strong>触发用户:</strong> ${input.userName}</p>
          <p><strong>邮箱:</strong> ${input.userEmail}</p>
          ${contentHtml}
          <p><strong>时间:</strong> ${atText}</p>
          <p style="margin-top:16px;">请前往后台通知中心查看详情。</p>
        </div>
      `,
    });

    console.info("[NotifyEmail] 邮件发送成功", {
      eventType: input.eventType,
      to: receivers,
      messageId: result.messageId,
    });

    return {
      sent: true,
      status: "sent",
      eventType: input.eventType,
      recipients: receivers,
      subject,
      textContent,
      messageId: result.messageId,
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "邮件发送失败";
    console.error("[NotifyEmail] 邮件发送失败", { eventType: input.eventType, message });
    return {
      sent: false,
      status: "failed",
      eventType: input.eventType,
      recipients: receivers,
      subject,
      textContent,
      error: message,
    };
  }
}

export async function sendTestEmailToAdmin(input: {
  to: string;
  adminName?: string;
}) {
  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error("QQ SMTP 未配置，请先设置 QQ_SMTP_USER 和 QQ_SMTP_PASS");
  }

  const transporter = createSmtpTransport();

  const atText = new Date().toLocaleString("zh-CN", { hour12: false });
  const nameText = input.adminName || "管理员";

  await transporter.sendMail({
    from: `"后台通知" <${SMTP_USER}>`,
    to: input.to,
    subject: `通知系统测试邮件 - ${nameText}`,
    text: `这是一封通知系统测试邮件。\n\n管理员: ${nameText}\n收件邮箱: ${input.to}\n时间: ${atText}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height:1.6; color:#222;">
        <h3 style="margin:0 0 12px;">通知系统测试邮件</h3>
        <p><strong>管理员:</strong> ${nameText}</p>
        <p><strong>收件邮箱:</strong> ${input.to}</p>
        <p><strong>时间:</strong> ${atText}</p>
        <p style="margin-top:16px;">如果你收到这封邮件，说明通知邮箱配置可用。</p>
      </div>
    `,
  });
}

export async function sendGuestbookReplyEmail(input: {
  to: string;
  guestName: string;
  status: string;
  replyContent?: string;
}) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn("[NotifyEmail] SMTP 未配置，跳过留言回复通知");
    return;
  }

  const to = String(input.to || "").trim();
  if (!to || !to.includes("@")) {
    return;
  }

  const statusText =
    input.status === "approved"
      ? "已通过"
      : input.status === "rejected"
        ? "未通过"
        : input.status === "flagged"
          ? "风险警告"
        : "已更新";

  const replyText = input.replyContent ? `\n\n回复内容:\n${input.replyContent}` : "";
  const replyHtml = input.replyContent
    ? `<p><strong>回复内容:</strong><br/>${escapeHtml(input.replyContent)}</p>`
    : "";

  const transporter = createSmtpTransport();
  await transporter.sendMail({
    from: `"留言板通知" <${SMTP_USER}>`,
    to,
    subject: `留言状态更新通知 - ${input.guestName}`,
    text: `您好，${input.guestName}：\n\n您的留言状态已更新为：${statusText}${replyText}\n\n感谢您的留言！`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height:1.6; color:#222;">
        <h3 style="margin:0 0 12px;">留言状态更新通知</h3>
        <p><strong>称呼:</strong> ${escapeHtml(input.guestName)}</p>
        <p><strong>当前状态:</strong> ${escapeHtml(statusText)}</p>
        ${replyHtml}
        <p style="margin-top:16px;">感谢您的留言与支持。</p>
      </div>
    `,
  });
}
