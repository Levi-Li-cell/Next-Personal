import { motion } from 'motion/react';
import { Award, Trophy, Star } from 'lucide-react';

interface HonorCardProps {
  title: string;
  highlight?: boolean;
}

export default function HonorCard({ title, highlight = false }: HonorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      whileHover={{ scale: 1.05, rotate: 2 }}
      className={`
        bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl border transition-all
        ${highlight 
          ? 'border-yellow-400/50 hover:border-yellow-400' 
          : 'border-white/20 hover:border-white/40'
        }
      `}
    >
      <div className="flex items-center gap-3">
        {highlight ? (
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg p-3">
            <Trophy className="w-6 h-6 text-white" />
          </div>
        ) : (
          <div className="bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg p-3">
            <Award className="w-6 h-6 text-white" />
          </div>
        )}
        <p className="text-white flex-1">{title}</p>
        {highlight && (
          <motion.div
            animate={{
              rotate: [0, 20, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
