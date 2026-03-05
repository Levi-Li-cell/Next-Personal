import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';

interface ProfileCardProps {
  images: string[];
}

export default function ProfileCard({ images }: ProfileCardProps) {
  const validImages = useMemo(() => images.filter(Boolean), [images]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [cachedImages, setCachedImages] = useState<Record<string, string>>({});
  const [isMobile, setIsMobile] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    let disposed = false;
    const urlsToRevoke: string[] = [];

    const preload = async () => {
      const next: Record<string, string> = {};

      for (const url of validImages) {
        try {
          const response = await fetch(url, { cache: 'force-cache' });
          if (!response.ok) continue;
          const blob = await response.blob();
          const localUrl = URL.createObjectURL(blob);
          urlsToRevoke.push(localUrl);
          next[url] = localUrl;
        } catch {
          next[url] = url;
        }
      }

      if (!disposed) {
        setCachedImages((prev) => ({ ...prev, ...next }));
      }
    };

    preload();

    return () => {
      disposed = true;
      urlsToRevoke.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [validImages]);

  const nextImage = () => {
    if (validImages.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % validImages.length);
  };

  const prevImage = () => {
    if (validImages.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const getImageSrc = (url: string) => cachedImages[url] || url;

  const onViewerTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(event.changedTouches[0]?.clientX ?? null);
  };

  const onViewerTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX;
    const delta = endX - touchStartX;
    setTouchStartX(null);

    if (Math.abs(delta) < 40) return;
    if (delta > 0) {
      prevImage();
    } else {
      nextImage();
    }
  };

  if (validImages.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full max-w-md mx-auto" style={{ perspective: '1000px' }}>

      <div className="relative w-full aspect-[4/5] sm:aspect-[3/4]">
        {isMobile ? (
          <button
            type="button"
            className="relative block h-full w-full rounded-2xl overflow-hidden border border-white/20"
            onClick={() => setViewerOpen(true)}
          >
            <img
              src={getImageSrc(validImages[currentImageIndex])}
              alt={`李伟 ${currentImageIndex + 1}`}
              className="h-full w-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-x-0 bottom-0 bg-black/50 backdrop-blur px-3 py-2 flex items-center justify-between text-white text-xs">
              <span>{currentImageIndex + 1}/{validImages.length}</span>
              <span>点击预览</span>
            </div>
          </button>
        ) : (
        validImages.map((img, index) => {
          const isActive = index === currentImageIndex;
          const totalItems = validImages.length;
          const isPrev = index === (currentImageIndex - 1 + totalItems) % totalItems;
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
                  <img src={getImageSrc(img)} alt={`李伟 ${index + 1}`} className="w-full h-full object-cover" loading="eager" />

                  <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-white text-sm">{index + 1}/{validImages.length}</span>
                  </div>
                </div>
                <div className="absolute top-1 left-1 w-8 h-8 border-t-2 border-l-2 border-purple-500 rounded-tl-xl opacity-50"></div>
                <div className="absolute bottom-1 right-1 w-8 h-8 border-b-2 border-r-2 border-cyan-500 rounded-br-xl opacity-50"></div>
              </div>
            </motion.div>
          );
        })
        )}
      </div>

      <motion.div
        className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-white/60 text-xs sm:text-sm whitespace-nowrap"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <motion.span
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {isMobile ? '点击预览后左右切换' : '点击卡片切换'}
        </motion.span>
      </motion.div>

      {isMobile && (
        <div className="mt-16 flex items-center justify-center gap-2 sm:hidden">
          <button
            type="button"
            className="rounded-md bg-white/10 px-4 py-2 text-xs text-white"
            onClick={() => setViewerOpen(true)}
          >
            预览图片
          </button>
        </div>
      )}

      {viewerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 p-4 flex items-center justify-center"
          onTouchStart={onViewerTouchStart}
          onTouchEnd={onViewerTouchEnd}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white text-sm bg-white/10 px-3 py-2 rounded"
            onClick={() => setViewerOpen(false)}
          >
            关闭
          </button>
          <button
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-sm bg-white/10 px-3 py-2 rounded"
            onClick={prevImage}
          >
            上一张
          </button>
          <img
            src={getImageSrc(validImages[currentImageIndex])}
            alt={`预览 ${currentImageIndex + 1}`}
            className="max-h-[85vh] max-w-[92vw] rounded-lg object-contain"
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs text-white/90">
            {currentImageIndex + 1} / {validImages.length}
          </div>
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-sm bg-white/10 px-3 py-2 rounded"
            onClick={nextImage}
          >
            下一张
          </button>
        </div>
      )}
    </div>
  );
}
