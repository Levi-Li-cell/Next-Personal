import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface TypewriterTextProps {
    text: string;
    speed?: number; // 打字速度 (毫秒/字符)
    onComplete?: () => void;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * 打字机效果组件 - 逐字显示文本，模拟AI打字效果
 */
export default function TypewriterText({
    text,
    speed = 30,
    onComplete,
    className,
    style
}: TypewriterTextProps) {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const isComplete = currentIndex >= text.length;

    useEffect(() => {
        setDisplayedText(text.slice(0, currentIndex));
    }, [text, currentIndex]);

    useEffect(() => {
        setCurrentIndex(0);
    }, [text]);

    useEffect(() => {
        if (isComplete) {
            if (text.length > 0) {
                onComplete?.();
            }
            return;
        }

        const timer = setTimeout(() => {
            setCurrentIndex((prev) => prev + 1);
        }, speed);
        return () => clearTimeout(timer);
    }, [currentIndex, text.length, speed, isComplete, onComplete, text]);

    return (
        <span className={className} style={style}>
            {displayedText}
            {!isComplete && (
                <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    style={{
                        display: 'inline-block',
                        width: '2px',
                        height: '1em',
                        background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                        marginLeft: '2px',
                        verticalAlign: 'text-bottom',
                        borderRadius: '1px'
                    }}
                />
            )}
        </span>
    );
}
