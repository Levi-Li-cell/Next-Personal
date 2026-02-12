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
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        // 重置状态当文本改变时
        setDisplayedText('');
        setCurrentIndex(0);
        setIsComplete(false);
    }, [text]);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timer = setTimeout(() => {
                setDisplayedText(prev => prev + text[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, speed);
            return () => clearTimeout(timer);
        } else if (!isComplete && text.length > 0) {
            setIsComplete(true);
            onComplete?.();
        }
    }, [currentIndex, text, speed, isComplete, onComplete]);

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
