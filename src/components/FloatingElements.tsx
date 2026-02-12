"use client";

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Code, Terminal, Cpu, Zap, Box, Layers } from 'lucide-react';

const icons = [Code, Terminal, Cpu, Zap, Box, Layers];

export default function FloatingElements() {
  const [dots, setDots] = useState<Array<{ id: number; left: number; top: number; moveY: number; moveX: number; duration: number; delay: number }>>([]);

  useEffect(() => {
    setDots([...Array(20)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      moveY: Math.random() * 100 - 50,
      moveX: Math.random() * 100 - 50,
      duration: 5 + Math.random() * 5,
      delay: Math.random() * 2,
    })));
  }, []);

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
