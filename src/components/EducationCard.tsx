import { motion } from 'motion/react';
import { Calendar, School, BookOpen } from 'lucide-react';

interface EducationCardProps {
  period: string;
  school: string;
  major: string;
  courses: string[];
}

export default function EducationCard({ period, school, major, courses }: EducationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      whileHover={{ scale: 1.01 }}
      className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 hover:border-pink-400/50 transition-all"
    >
      <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b border-white/20">
        <div className="flex items-center gap-2 text-cyan-300">
          <Calendar className="w-5 h-5" />
          <span>{period}</span>
        </div>
        <div className="flex items-center gap-2 text-white">
          <School className="w-5 h-5" />
          <span>{school}</span>
        </div>
        <div className="px-3 py-1 bg-pink-500/30 text-pink-200 rounded-full text-sm">
          {major}
        </div>
      </div>

      <div className="flex items-start gap-2 mb-3">
        <BookOpen className="w-5 h-5 text-white mt-1" />
        <h4 className="text-white">主修课程：</h4>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {courses.map((course, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 text-white/80 text-sm bg-white/5 px-3 py-2 rounded-lg"
          >
            <span className="text-pink-400">▸</span>
            <span>{course}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
