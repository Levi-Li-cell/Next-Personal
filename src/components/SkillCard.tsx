import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

interface SkillCardProps {
  index: number;
  skill: string;
}

export default function SkillCard({ index, skill }: SkillCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="bg-white/10 backdrop-blur-lg rounded-xl p-5 shadow-xl border border-white/20 hover:border-cyan-400/50 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg p-2 mt-1">
          <CheckCircle2 className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <span className="text-cyan-400 mr-2">{index}.</span>
          <span className="text-white/90">{skill}</span>
        </div>
      </div>
    </motion.div>
  );
}
