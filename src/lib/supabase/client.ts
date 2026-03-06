import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 检查环境变量是否有效（不是占位符）
const isValidConfig = supabaseUrl &&
  supabaseAnonKey &&
  !supabaseAnonKey.includes('XXXXX') &&
  supabaseUrl.startsWith('https://');

// 只有在环境变量有效时才创建Supabase客户端
let supabase: ReturnType<typeof createClient> | null = null;
if (isValidConfig) {
  supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

export { supabase };

export type AdminNotificationRealtimePayload = {
  id: string;
  user_name: string;
  user_email: string;
  event_type: string;
  title: string | null;
  content: string | null;
  link: string | null;
  audience: string;
  read: boolean;
  created_at: string;
};

// 订阅用户表的 INSERT 事件
export const subscribeToNewUsers = (callback: (payload: any) => void) => {
  if (!supabase) {
    // 如果Supabase未配置，返回一个空的订阅对象
    return {
      unsubscribe: () => {}
    };
  }

  const subscription = supabase
    .channel('public:users')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'users',
      },
      callback
    )
    .subscribe();

  return subscription;
};

// 订阅后台通知表 INSERT 事件（WebSocket 实时）
export const subscribeToAdminNotifications = (
  callback: (payload: { new: AdminNotificationRealtimePayload }) => void
) => {
  if (!supabase) {
    return {
      unsubscribe: () => {},
    };
  }

  const subscription = supabase
    .channel('public:admin_notification')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_notification',
      },
      callback as (payload: { new: AdminNotificationRealtimePayload }) => void
    )
    .subscribe();

  return subscription;
};
