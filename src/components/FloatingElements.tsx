"use client";

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Code, Terminal, Cpu, Zap, Box, Layers } from 'lucide-react';

const icons = [Code, Terminal, Cpu, Zap, Box, Layers];

export default function FloatingElements() {
  const dots = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => {
        const left = (i * 13) % 100;
        const top = (i * 17) % 100;
        const moveY = ((i % 7) - 3) * 12;
        const moveX = ((i % 5) - 2) * 10;
        const duration = 6 + (i % 6);
        const delay = (i % 4) * 0.4;

        return { id: i, left, top, moveY, moveX, duration, delay };
      }),
    []
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {icons.map((Icon, index) => (
        <motion.div
          key={index}
          className="absolute text-white/5"
          style={{
            left: `${(index * 20) + 10}%`,
            top: `${(index * 15) % 80}%`,
          }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10 + index * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.5,
          }}
        >
          <Icon size={60 + index * 10} />
        </motion.div>
      ))}

      {/* Floating Dots */}
      {dots.map((dot) => (
        <motion.div
          key={`dot-${dot.id}`}
          className="absolute w-2 h-2 bg-purple-500/20 rounded-full"
          style={{
            left: `${dot.left}%`,
            top: `${dot.top}%`,
          }}
          animate={{
            y: [0, dot.moveY],
            x: [0, dot.moveX],
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: dot.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: dot.delay,
          }}
        />
      ))}
    </div>
  );
}
