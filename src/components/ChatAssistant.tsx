import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { v4 as uuidv4 } from 'uuid';
import { MessageCircle, X, Send, Loader2, Trash2, Bot, User, Sparkles, Mic, Square } from 'lucide-react';
import TypewriterText from './TypewriterText';
import { withApiBase } from '@/lib/api-url';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatAssistantProps {
    apiUrl?: string;
    hidePrompt?: boolean;
}

export default function ChatAssistant({ apiUrl = '', hidePrompt = false }: ChatAssistantProps) {
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string>('');
    const [isMobile, setIsMobile] = useState(false);
    const [typingMessageIndex, setTypingMessageIndex] = useState<number | null>(null); // 跟踪正在打字的消息索引
    const [isRecording, setIsRecording] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // 检测是否为移动端
    useEffect(() => {
        setMounted(true);
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 检查是否首次访问，显示引导（使用 sessionStorage，每次会话都会显示）
    useEffect(() => {
        const hasSeenGuide = sessionStorage.getItem('chat_guide_seen');
        if (!hasSeenGuide) {
            // 延迟显示引导，让页面先加载
            const timer = setTimeout(() => {
                setShowGuide(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    // 生成或恢复 sessionId（使用 sessionStorage，每次会话都是新的）
    useEffect(() => {
        const storedSessionId = sessionStorage.getItem('chat_session_id');
        if (storedSessionId) {
            setSessionId(storedSessionId);
            // 不加载历史记录，每次会话都是新的
        } else {
            const newSessionId = uuidv4();
            setSessionId(newSessionId);
            sessionStorage.setItem('chat_session_id', newSessionId);
        }
    }, []);

    // 自动滚动到底部
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 聊天窗口打开时聚焦输入框
    useEffect(() => {
        if (isOpen && !isMobile) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, isMobile]);

    // 关闭引导
    const dismissGuide = () => {
        setShowGuide(false);
        sessionStorage.setItem('chat_guide_seen', 'true');
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                const formData = new FormData();
                formData.append('file', audioBlob, 'recording.wav');

                setIsLoading(true);
                try {
                    const response = await fetch(withApiBase('/api/voice/transcribe', 'frontend', apiUrl), {
                        method: 'POST',
                        body: formData,
                    });
                    const data = await response.json();
                    if (data.transcript) {
                        setInput(prev => prev + (prev ? ' ' : '') + data.transcript);
                    } else if (data.error) {
                        console.error('Transcription error:', data.error);
                    }
                } catch (error) {
                    console.error('Error uploading audio:', error);
                } finally {
                    setIsLoading(false);
                    // Stop all tracks to release microphone
                    stream.getTracks().forEach(track => track.stop());
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('无法访问麦克风，请检查权限设置。');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    // 引导后打开聊天
    const handleGuideClick = () => {
        dismissGuide();
        setIsOpen(true);
    };

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(withApiBase('/api/chat', 'frontend', apiUrl), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    sessionId: sessionId
                })
            });

            const data = await response.json();

            if (data.success) {
                const assistantMessage: Message = {
                    role: 'assistant',
                    content: data.message,
                    timestamp: new Date()
                };
                setMessages(prev => {
                    const newMessages = [...prev, assistantMessage];
                    setTypingMessageIndex(newMessages.length - 1); // 设置打字动画索引
                    return newMessages;
                });

                if (data.sessionId && data.sessionId !== sessionId) {
                    setSessionId(data.sessionId);
                    sessionStorage.setItem('chat_session_id', data.sessionId);
                }
            } else {
                const errorMessage: Message = {
                    role: 'assistant',
                    content: data.error || '抱歉，发生了错误，请稍后再试。',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, errorMessage]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: '网络错误，请检查后端服务是否已启动。',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = async () => {
        try {
            await fetch(withApiBase(`/api/chat/history/${sessionId}`, 'frontend', apiUrl), {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Failed to clear history:', error);
        }
        setMessages([]);
        const newSessionId = uuidv4();
        setSessionId(newSessionId);
        sessionStorage.setItem('chat_session_id', newSessionId);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    if (!mounted) return null;

    return createPortal(
        <>
            {/* 新手引导蒙版 */}
            <AnimatePresence>
                {showGuide && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="fixed inset-0 z-[10000]"
                        onClick={dismissGuide}
                        style={{ cursor: 'pointer' }}
                    >
                        {/* 深色蒙版背景 */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'radial-gradient(circle at bottom right, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.85) 100%)',
                            backdropFilter: 'blur(4px)'
                        }} />

                        {/* 提示文字气泡 */}
                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 20 }}
                            style={{
                                position: 'fixed',
                                bottom: isMobile ? '7.5rem' : '9rem',
                                right: isMobile ? '1rem' : '1.5rem',
                                width: isMobile ? '280px' : '320px',
                                padding: '20px',
                                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
                                backdropFilter: 'blur(20px)',
                                borderRadius: '20px',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(168, 85, 247, 0.2)',
                                zIndex: 10001
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* 标题 */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                <motion.div
                                    animate={{ rotate: [0, 15, -15, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Sparkles style={{ width: '24px', height: '24px', color: '#facc15' }} />
                                </motion.div>
                                <span style={{ color: 'white', fontWeight: 600, fontSize: '18px' }}>AI 简历助手</span>
                            </div>
                            {/* 描述文字 */}
                            <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '15px', lineHeight: 1.7, margin: 0 }}>
                                👋 你好！点击下方按钮与我对话，我可以回答关于简历的任何问题。
                            </p>
                            {/* 点击提示 */}
                            <motion.p
                                style={{ color: 'rgba(168, 85, 247, 0.9)', fontSize: '13px', marginTop: '12px', marginBottom: 0 }}
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                点击任意位置关闭引导 →
                            </motion.p>
                            {/* 箭头指向按钮 */}
                            <div style={{
                                position: 'absolute',
                                bottom: '-8px',
                                right: '32px',
                                width: '16px',
                                height: '16px',
                                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
                                transform: 'rotate(45deg)',
                                borderRight: '1px solid rgba(255, 255, 255, 0.15)',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
                            }} />
                        </motion.div>

                        {/* 脉冲光环动画 */}
                        <motion.div
                            style={{
                                position: 'fixed',
                                bottom: isMobile ? 'calc(1.5rem + 32px)' : 'calc(2rem + 32px)',
                                right: isMobile ? 'calc(1.5rem + 32px)' : 'calc(2rem + 32px)',
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                border: '2px solid rgba(168, 85, 247, 0.5)',
                                transform: 'translate(50%, 50%)',
                                zIndex: 10000
                            }}
                            animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <motion.div
                            style={{
                                position: 'fixed',
                                bottom: isMobile ? 'calc(1.5rem + 32px)' : 'calc(2rem + 32px)',
                                right: isMobile ? 'calc(1.5rem + 32px)' : 'calc(2rem + 32px)',
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                border: '2px solid rgba(236, 72, 153, 0.5)',
                                transform: 'translate(50%, 50%)',
                                zIndex: 10000
                            }}
                            animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        />

                        {/* 高亮的按钮区域 */}
                        <motion.button
                            onClick={handleGuideClick}
                            style={{
                                position: 'fixed',
                                bottom: isMobile ? '1.5rem' : '2rem',
                                right: isMobile ? '1.5rem' : '2rem',
                                width: '64px',
                                height: '64px',
                                background: 'linear-gradient(135deg, #a855f7, #ec4899, #06b6d4)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                zIndex: 10001
                            }}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{
                                scale: [1, 1.1, 1],
                                rotate: 0,
                                boxShadow: [
                                    '0 0 30px rgba(168, 85, 247, 0.6), 0 0 60px rgba(236, 72, 153, 0.4)',
                                    '0 0 50px rgba(168, 85, 247, 0.9), 0 0 100px rgba(236, 72, 153, 0.7)',
                                    '0 0 30px rgba(168, 85, 247, 0.6), 0 0 60px rgba(236, 72, 153, 0.4)',
                                ]
                            }}
                            transition={{
                                scale: { duration: 1, repeat: Infinity },
                                rotate: { type: 'spring', stiffness: 200, damping: 15 },
                                boxShadow: { duration: 1.5, repeat: Infinity }
                            }}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <MessageCircle style={{ width: '28px', height: '28px' }} />
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* 浮动按钮 - 专业聊天组件风格 */}
            {!showGuide && !(isMobile && isOpen) && (
                <motion.div
                    style={{
                        position: 'fixed',
                        bottom: isMobile ? '5rem' : '2rem',
                        right: isMobile ? '1.5rem' : '2rem',
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '12px'
                    }}
                >
                    {/* 悬浮提示标签 */}
                    <AnimatePresence>
                        {!isOpen && !hidePrompt && (
                            <motion.div
                                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 20, scale: 0.8 }}
                                transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.95)',
                                    color: '#1f2937',
                                    padding: '10px 16px',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <motion.span
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    💬
                                </motion.span>
                                <span>有问题？问我！</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 主按钮 */}
                    <motion.button
                        onClick={() => setIsOpen(!isOpen)}
                        style={{
                            width: isMobile ? '56px' : '64px',
                            height: isMobile ? '56px' : '64px',
                            borderRadius: '50%',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15)',
                            position: 'relative',
                            overflow: 'visible'
                        }}
                        whileHover={{
                            scale: 1.1,
                            boxShadow: '0 12px 40px rgba(102, 126, 234, 0.5), 0 6px 16px rgba(0, 0, 0, 0.2)'
                        }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                            type: 'spring',
                            stiffness: 260,
                            damping: 20
                        }}
                    >
                        {/* 呼吸光环效果 */}
                        <motion.div
                            style={{
                                position: 'absolute',
                                inset: '-4px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                                opacity: 0.3,
                                zIndex: -1
                            }}
                            animate={{
                                scale: [1, 1.15, 1],
                                opacity: [0.3, 0.1, 0.3]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut'
                            }}
                        />

                        {/* 在线状态指示点 */}
                        {!isOpen && (
                            <motion.div
                                style={{
                                    position: 'absolute',
                                    top: '-2px',
                                    right: '-2px',
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    background: '#10b981',
                                    border: '3px solid white',
                                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
                                }}
                                animate={{
                                    scale: [1, 1.2, 1]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity
                                }}
                            />
                        )}

                        {/* 图标切换 */}
                        <AnimatePresence mode="wait">
                            {isOpen ? (
                                <motion.div
                                    key="close"
                                    initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                    exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <X style={{ width: '28px', height: '28px' }} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="open"
                                    initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                    exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <MessageCircle style={{ width: '28px', height: '28px' }} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </motion.div>
            )}

            {/* 聊天窗口 - 响应式适配 */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{
                            position: 'fixed',
                            zIndex: 9998,
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: 'rgba(0, 0, 0, 0.95)',
                            backdropFilter: 'blur(24px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            overflow: 'hidden',
                            ...(isMobile
                                ? {
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    borderRadius: 0
                                }
                                : {
                                    bottom: '6rem',
                                    right: '1.5rem',
                                    width: '400px',
                                    height: '550px',
                                    maxHeight: '80vh',
                                    borderRadius: '16px'
                                }
                            )
                        }}
                    >
                        {/* 头部 - 固定在顶部 */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            background: 'linear-gradient(to right, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))',
                            flexShrink: 0
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <motion.div
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}
                                    animate={{
                                        boxShadow: [
                                            '0 0 10px rgba(168, 85, 247, 0.3)',
                                            '0 0 20px rgba(168, 85, 247, 0.5)',
                                            '0 0 10px rgba(168, 85, 247, 0.3)',
                                        ]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Bot className="w-5 h-5 text-white" />
                                </motion.div>
                                <div>
                                    <h3 style={{ color: 'white', fontWeight: 500, margin: 0, fontSize: '16px' }}>简历助手</h3>
                                    <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px', margin: 0 }}>有什么想了解的？</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <motion.button
                                    onClick={clearChat}
                                    style={{
                                        padding: '8px',
                                        background: 'transparent',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        color: 'rgba(255, 255, 255, 0.5)'
                                    }}
                                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                                    whileTap={{ scale: 0.9 }}
                                    title="清空聊天"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </motion.button>
                                {isMobile && (
                                    <motion.button
                                        onClick={() => setIsOpen(false)}
                                        style={{
                                            padding: '8px',
                                            background: 'transparent',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            color: 'rgba(255, 255, 255, 0.5)'
                                        }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <X className="w-5 h-5" />
                                    </motion.button>
                                )}
                            </div>
                        </div>

                        {/* 消息列表 - 可滚动区域 */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                        }}>
                            {messages.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)', padding: '32px 0' }}
                                >
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.1, 1],
                                            rotate: [0, 5, -5, 0]
                                        }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                    >
                                        <Bot style={{ width: '64px', height: '64px', margin: '0 auto 16px', opacity: 0.5 }} />
                                    </motion.div>
                                    <p style={{ fontSize: '18px', margin: 0 }}>你好！我是李伟的简历助手</p>
                                    <p style={{ fontSize: '14px', marginTop: '8px', color: 'rgba(255, 255, 255, 0.3)' }}>问我任何关于简历的问题吧</p>
                                    <div style={{ marginTop: '24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
                                        {['介绍一下自己', '有什么技能', '联系方式'].map((suggestion, index) => (
                                            <motion.button
                                                key={suggestion}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 + index * 0.1 }}
                                                onClick={() => {
                                                    setInput(suggestion);
                                                    setTimeout(() => sendMessage(), 100);
                                                }}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: 'rgba(255, 255, 255, 0.05)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '20px',
                                                    fontSize: '14px',
                                                    color: 'rgba(255, 255, 255, 0.7)',
                                                    cursor: 'pointer'
                                                }}
                                                whileHover={{ scale: 1.05, borderColor: 'rgba(168, 85, 247, 0.5)' }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {suggestion}
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {messages.map((msg, index) => (
                                <motion.div
                                    key={index}
                                    initial={{
                                        opacity: 0,
                                        x: msg.role === 'user' ? 30 : -30,
                                        y: 10,
                                        scale: 0.95
                                    }}
                                    animate={{
                                        opacity: 1,
                                        x: 0,
                                        y: 0,
                                        scale: 1
                                    }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 25,
                                        delay: index === messages.length - 1 ? 0 : 0
                                    }}
                                    style={{
                                        display: 'flex',
                                        gap: '12px',
                                        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                                        alignItems: 'flex-start'
                                    }}
                                >
                                    {/* 头像 */}
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        background: msg.role === 'user'
                                            ? 'linear-gradient(135deg, #06b6d4, #3b82f6)'
                                            : 'linear-gradient(135deg, #a855f7, #ec4899)'
                                    }}>
                                        {msg.role === 'user' ? (
                                            <User className="w-4 h-4 text-white" />
                                        ) : (
                                            <Bot className="w-4 h-4 text-white" />
                                        )}
                                    </div>
                                    {/* 消息气泡 */}
                                    <div style={{
                                        maxWidth: '75%',
                                        padding: '12px 16px',
                                        borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                        background: msg.role === 'user'
                                            ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(59, 130, 246, 0.3))'
                                            : 'rgba(255, 255, 255, 0.1)',
                                        border: msg.role === 'user'
                                            ? '1px solid rgba(6, 182, 212, 0.4)'
                                            : '1px solid rgba(255, 255, 255, 0.1)'
                                    }}>
                                        {/* 使用打字机效果显示新的AI消息 */}
                                        {msg.role === 'assistant' && index === typingMessageIndex ? (
                                            <TypewriterText
                                                text={msg.content}
                                                speed={25}
                                                onComplete={() => setTypingMessageIndex(null)}
                                                style={{
                                                    color: 'white',
                                                    fontSize: '14px',
                                                    whiteSpace: 'pre-wrap',
                                                    lineHeight: 1.6,
                                                    wordBreak: 'break-word'
                                                }}
                                            />
                                        ) : (
                                            <p style={{
                                                color: 'white',
                                                fontSize: '14px',
                                                margin: 0,
                                                whiteSpace: 'pre-wrap',
                                                lineHeight: 1.6,
                                                wordBreak: 'break-word'
                                            }}>{msg.content}</p>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0, x: -30, scale: 0.9 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                    style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}
                                >
                                    {/* AI头像带旋转效果 */}
                                    <motion.div
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            position: 'relative'
                                        }}
                                    >
                                        {/* 旋转光环 */}
                                        <motion.div
                                            style={{
                                                position: 'absolute',
                                                inset: '-3px',
                                                borderRadius: '50%',
                                                border: '2px solid transparent',
                                                borderTopColor: '#a855f7',
                                                borderRightColor: '#ec4899'
                                            }}
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        />
                                        <Bot className="w-4 h-4 text-white" />
                                    </motion.div>

                                    {/* 加载动画气泡 */}
                                    <div style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        padding: '16px 24px',
                                        borderRadius: '16px 16px 16px 4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        {/* 三个跳动的圆点 */}
                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            {[0, 1, 2].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    style={{
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #a855f7, #ec4899)'
                                                    }}
                                                    animate={{
                                                        y: [-3, 3, -3],
                                                        opacity: [0.5, 1, 0.5]
                                                    }}
                                                    transition={{
                                                        duration: 0.6,
                                                        repeat: Infinity,
                                                        delay: i * 0.15
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* 输入区域 - 固定在底部 */}
                        <div style={{
                            padding: '16px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                            background: 'rgba(0, 0, 0, 0.5)',
                            flexShrink: 0
                        }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                                <motion.button
                                    onClick={isRecording ? stopRecording : startRecording}
                                    disabled={isLoading}
                                    style={{
                                        width: '44px',
                                        height: '44px',
                                        background: isRecording ? '#ef4444' : 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        cursor: isLoading ? 'not-allowed' : 'pointer',
                                        flexShrink: 0
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    animate={isRecording ? {
                                        scale: [1, 1.1, 1],
                                        boxShadow: ["0 0 0px #ef4444", "0 0 10px #ef4444", "0 0 0px #ef4444"]
                                    } : {}}
                                    transition={isRecording ? {
                                        duration: 1.5,
                                        repeat: Infinity
                                    } : {}}
                                    title={isRecording ? "停止录音" : "点击说话"}
                                >
                                    {isRecording ? <Square className="w-5 h-5" fill="currentColor" /> : <Mic className="w-5 h-5" />}
                                </motion.button>
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="输入您的问题..."
                                    style={{
                                        flex: 1,
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        color: 'white',
                                        fontSize: '14px',
                                        resize: 'none',
                                        outline: 'none',
                                        minHeight: '44px',
                                        maxHeight: '120px',
                                        fontFamily: 'inherit'
                                    }}
                                    rows={1}
                                    disabled={isLoading}
                                />
                                <motion.button
                                    onClick={sendMessage}
                                    disabled={!input.trim() || isLoading}
                                    style={{
                                        width: '44px',
                                        height: '44px',
                                        background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        border: 'none',
                                        cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
                                        opacity: !input.trim() || isLoading ? 0.5 : 1,
                                        flexShrink: 0
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>,
        document.body
    );
}
