import { motion } from 'motion/react';
import { Building2, Calendar, Code2, FileText } from 'lucide-react';

interface ExperienceCardProps {
  period: string;
  company: string;
  position: string;
  project: string;
  techStack: string;
  description: string;
  responsibilities: string[];
}

export default function ExperienceCard({
  period,
  company,
  position,
  project,
  techStack,
  description,
  responsibilities
}: ExperienceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      whileHover={{ scale: 1.01 }}
      className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 hover:border-purple-400/50 transition-all"
    >
      {/* Header */}
      <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b border-white/20">
        <div className="flex items-center gap-2 text-cyan-300">
          <Calendar className="w-5 h-5" />
          <span>{period}</span>
        </div>
        <div className="flex items-center gap-2 text-white">
          <Building2 className="w-5 h-5" />
          <span>{company}</span>
        </div>
      </div>

      {/* Project Info */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-white text-xl">{project}</h3>
          <span className="px-3 py-1 bg-purple-500/30 text-purple-200 rounded-full text-sm">
            {position}
          </span>
        </div>
        
        <div className="flex items-start gap-2 text-white/70 mb-4">
          <Code2 className="w-5 h-5 mt-1 flex-shrink-0" />
          <p className="text-sm">{techStack}</p>
        </div>

        <div className="flex items-start gap-2 text-white/80 mb-4">
          <FileText className="w-5 h-5 mt-1 flex-shrink-0" />
          <p className="text-sm leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Responsibilities */}
      <div>
        <h4 className="text-white mb-3">项目职责：</h4>
        <ul className="space-y-2">
          {responsibilities.map((resp, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-2 text-white/80 text-sm"
            >
              <span className="text-cyan-400 mt-1">•</span>
              <span>{resp}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
