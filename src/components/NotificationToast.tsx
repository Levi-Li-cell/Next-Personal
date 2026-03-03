"use client";

import { useState, useEffect } from 'react';
import { X, User, Mail, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { subscribeToNewUsers } from '@/lib/supabase/client';

interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface Notification {
  id: string;
  user: User;
  timestamp: number;
  read: boolean;
}

export function NotificationToast() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);

  useEffect(() => {
    // 订阅新用户事件
    const subscription = subscribeToNewUsers((payload) => {
      const newUser = payload.new as User;
      const newNotification: Notification = {
        id: `notification-${Date.now()}`,
        user: newUser,
        timestamp: Date.now(),
        read: false,
      };

      setNotifications((prev) => [newNotification, ...prev]);
      setCurrentNotification(newNotification);
      setShowToast(true);

      // 5秒后自动关闭
      setTimeout(() => {
        setShowToast(false);
      }, 5000);
    });

    // 清理订阅
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleClose = () => {
    setShowToast(false);
    if (currentNotification) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === currentNotification.id ? { ...n, read: true } : n
        )
      );
    }
  };

  const handleViewDetails = () => {
    // 这里可以导航到用户详情页
    console.log('View user details:', currentNotification?.user);
    setShowToast(false);
  };

  if (!showToast || !currentNotification) return null;

  const { user } = currentNotification;
  const formattedTime = new Date(user.created_at).toLocaleString('zh-CN');

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg p-4 w-80 animate-slide-up">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="font-medium text-white">新用户注册</h3>
              <p className="text-white/60 text-sm">{user.name}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <Mail className="w-4 h-4" />
            <span>{user.email}</span>
          </div>
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <Clock className="w-4 h-4" />
            <span>{formattedTime}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={handleViewDetails}
            className="flex-1 text-purple-400 hover:text-purple-300 hover:bg-white/10"
          >
            查看详情
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          <Button
            variant="ghost"
            onClick={handleClose}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            关闭
          </Button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
