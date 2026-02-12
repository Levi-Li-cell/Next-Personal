import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ProfileCardProps {
  images: string[];
}

export default function ProfileCard({ images }: ProfileCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="relative w-full max-w-md mx-auto perspective-1000" style={{ perspective: '1000px' }}>
      {/* Poker Card Stack */}
      <div className="relative w-full aspect-[3/4]">
        {images.map((img, index) => {
          const isActive = index === currentImageIndex;
          const isPrev = index === (currentImageIndex - 1 + images.length) % images.length;
          const offset = index - currentImageIndex;

          return (
            <motion.div
              key={index}
              className="absolute inset-0 cursor-pointer"
              style={{
                transformStyle: 'preserve-3d',
                zIndex: isActive ? 20 : isPrev ? 10 : 5,
              }}
              animate={{
                rotateY: isActive ? 0 : isPrev ? -15 : 15,
                rotateZ: isActive ? 0 : offset * 3,
                x: isActive ? 0 : offset * 20,
                y: isActive ? 0 : Math.abs(offset) * 10,
                scale: isActive ? 1 : 0.95 - Math.abs(offset) * 0.05,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              whileHover={isActive ? {
                scale: 1.05,
                rotateZ: -5,
                transition: { duration: 0.2 }
              } : {}}
              whileTap={isActive ? {
                scale: 0.95,
                transition: { duration: 0.1 }
              } : {}}
              onClick={() => {
                if (isActive) {
                  nextImage();
                } else {
                  setCurrentImageIndex(index);
                }
              }}
            >
              {/* Card Border & Shadow */}
              <div className="relative w-full h-full rounded-2xl bg-white p-3 shadow-2xl">
                {/* Inner Card */}
                <div className="relative w-full h-full rounded-xl overflow-hidden bg-white shadow-inner">
                  <img
                    src={img}
                    alt={`李伟 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Removed Shine Effect to fix blue overlay issue */}
                  {/* <motion.div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent" ... /> */}

                  {/* Card Number Badge */}
                  <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-white text-sm">{index + 1}/{images.length}</span>
                  </div>
                </div>

                {/* Card Corner Decorations */}
                <div className="absolute top-1 left-1 w-8 h-8 border-t-2 border-l-2 border-purple-500 rounded-tl-xl opacity-50"></div>
                <div className="absolute bottom-1 right-1 w-8 h-8 border-b-2 border-r-2 border-cyan-500 rounded-br-xl opacity-50"></div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Hint Text */}
      <motion.div
        className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-white/60 text-sm whitespace-nowrap"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <motion.span
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          点击卡片切换 →
        </motion.span>
      </motion.div>
    </div>
  );
}
