import { motion, MotionValue } from 'motion/react';
import { useState, useEffect } from 'react';

interface CustomCursorProps {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  smoothMouseX: MotionValue<number>;
  smoothMouseY: MotionValue<number>;
}

export default function CustomCursor({ mouseX, mouseY, smoothMouseX, smoothMouseY }: CustomCursorProps) {
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    const interactiveElements = document.querySelectorAll('button, a, [role="button"]');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    return () => {
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, []);

  return (
    <>
      {/* Main Cursor - 即时跟手 */}
      <motion.div
        className="fixed top-0 left-0 w-6 h-6 pointer-events-none z-[100] mix-blend-difference"
        style={{
          x: mouseX,
          y: mouseY,
        }}
        animate={{
          scale: isHovering ? 2 : 1,
        }}
        transition={{
          scale: { type: "spring", stiffness: 500, damping: 28 }
        }}
      >
        <div className="w-full h-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
      </motion.div>

      {/* Trailing Cursor - 即时跟手 */}
      <motion.div
        className="fixed top-0 left-0 w-12 h-12 pointer-events-none z-[99] border-2 border-white/50 rounded-full mix-blend-difference"
        style={{
          x: mouseX,
          y: mouseY,
        }}
        animate={{
          scale: isHovering ? 1.5 : 1,
        }}
        transition={{
          scale: { type: "spring", stiffness: 300, damping: 20 }
        }}
      >
        <div className="w-full h-full -translate-x-1/2 -translate-y-1/2" />
      </motion.div>

      {/* Glow Effect - 使用平滑过渡保持视觉美感 */}
      <motion.div
        className="fixed top-0 left-0 w-32 h-32 pointer-events-none z-[98]"
        style={{
          x: smoothMouseX,
          y: smoothMouseY,
        }}
      >
        <div className="w-full h-full -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-2xl opacity-20" />
      </motion.div>
    </>
  );
}
