import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Loader2 } from 'lucide-react';

interface ProfileCardProps {
  images: string[];
  onUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading?: boolean;
}

export default function ProfileCard({ images, onUpload, isUploading }: ProfileCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % (images.length + 1));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !onUpload) return;

    const uploadedUrls: string[] = [];

    // We handle the actual upload in the parent component for better state management
    // But we pass the files up
    // Actually, let's do the upload here for simplicity if the SDK is available
    // or let the parent handle it. Parent is better.
    // Let's just pass the FileList up.

    // Convert FileList to Array
    const fileArray = Array.from(files);
    // Note: The parent will handle the @vercel/blob upload
    // For now, let's assume the parent takes care of it and provides isUploading status
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative w-full max-w-md mx-auto perspective-1000" style={{ perspective: '1000px' }}>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && onUpload) {
            onUpload(e as any);
          }
        }}
        multiple
        accept="image/*"
        className="hidden"
      />

      {/* Poker Card Stack */}
      <div className="relative w-full aspect-[3/4]">
        {[...images, 'upload-button'].map((img, index) => {
          const isUploadButton = img === 'upload-button';
          const isActive = index === currentImageIndex;
          const totalItems = images.length + 1;
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
                  if (isUploadButton) {
                    triggerUpload();
                  } else {
                    nextImage();
                  }
                } else {
                  setCurrentImageIndex(index);
                }
              }}
            >
              {/* Card Border & Shadow */}
              <div className="relative w-full h-full rounded-2xl bg-white p-3 shadow-2xl">
                {/* Inner Card */}
                <div className={`relative w-full h-full rounded-xl overflow-hidden ${isUploadButton ? 'bg-gray-50 border-2 border-dashed border-purple-200 flex flex-col items-center justify-center gap-4' : 'bg-white shadow-inner'}`}>
                  {isUploadButton ? (
                    <>
                      <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                        {isUploading ? (
                          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                        ) : (
                          <Plus className="w-8 h-8 text-purple-500" />
                        )}
                      </div>
                      <div className="text-center px-4">
                        <p className="text-purple-600 font-medium">{isUploading ? '正在上传...' : '添加新头像'}</p>
                        <p className="text-gray-400 text-xs mt-1">支持多图上传</p>
                      </div>
                    </>
                  ) : (
                    <img
                      src={img}
                      alt={`李伟 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Card Number Badge */}
                  {!isUploadButton && (
                    <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-white text-sm">{index + 1}/{images.length}</span>
                    </div>
                  )}
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
          {currentImageIndex === images.length ? '点击“+”上传图片' : '点击卡片切换 →'}
        </motion.span>
      </motion.div>
    </div>
  );
}
